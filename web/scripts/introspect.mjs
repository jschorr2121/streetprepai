// Custom DB introspection → Drizzle schema generator.
//
// We use this instead of `drizzle-kit pull` because drizzle-kit's introspection
// reliably hangs against this project's Supabase pooler (its internal parallel
// catalog queries appear to deadlock through Supavisor), whereas a plain
// postgres.js connection queries the same catalogs in ~1s. This generator is
// deterministic: re-running it against an unchanged DB produces an identical
// `lib/db/schema/` (no diff), satisfying the Unit 3 reproducibility requirement.
//
// Captures: columns, Postgres types (incl. arrays + pgvector dimensions),
// nullability, primary keys, and the common gen_random_uuid()/now() defaults.
// FK constraints and index definitions are intentionally not emitted — they
// exist in the live DB and aren't needed for typed querying; add them in a
// later unit if Drizzle-managed migrations need them.

import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

const OUT_DIR = path.join(process.cwd(), "lib/db/schema");

const conn = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!conn) {
  console.error("DIRECT_URL or DATABASE_URL must be set (see .env.example).");
  process.exit(1);
}
const sql = postgres(conn, { prepare: false, connect_timeout: 15, max: 1, idle_timeout: 2 });

const snakeToCamel = (s) => s.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
const snakeToKebab = (s) => s.replace(/_/g, "-");

// Map a Postgres `format_type` string to a Drizzle pg-core builder call.
// Returns { builder: "text(...)", imports: Set<string> }.
function mapType(fullType, colName) {
  const arg = JSON.stringify(colName);
  const arrayMatch = fullType.endsWith("[]");
  const base = arrayMatch ? fullType.slice(0, -2) : fullType;

  let builder;
  let imp;
  if (base === "text" || base === "character varying" || /^character varying\(/.test(base) || /^varchar/.test(base)) {
    builder = `text(${arg})`; imp = "text";
  } else if (base === "uuid") {
    builder = `uuid(${arg})`; imp = "uuid";
  } else if (base === "timestamp with time zone") {
    builder = `timestamp(${arg}, { withTimezone: true, mode: "string" })`; imp = "timestamp";
  } else if (base === "timestamp without time zone") {
    builder = `timestamp(${arg}, { mode: "string" })`; imp = "timestamp";
  } else if (base === "date") {
    builder = `date(${arg})`; imp = "date";
  } else if (base === "jsonb") {
    builder = `jsonb(${arg})`; imp = "jsonb";
  } else if (base === "json") {
    builder = `json(${arg})`; imp = "json";
  } else if (base === "integer") {
    builder = `integer(${arg})`; imp = "integer";
  } else if (base === "bigint") {
    builder = `bigint(${arg}, { mode: "number" })`; imp = "bigint";
  } else if (base === "smallint") {
    builder = `smallint(${arg})`; imp = "smallint";
  } else if (base === "boolean") {
    builder = `boolean(${arg})`; imp = "boolean";
  } else if (base === "numeric" || /^numeric\(/.test(base)) {
    const m = base.match(/^numeric\((\d+),\s*(\d+)\)/);
    builder = m ? `numeric(${arg}, { precision: ${m[1]}, scale: ${m[2]} })` : `numeric(${arg})`;
    imp = "numeric";
  } else if (/^vector\((\d+)\)/.test(base)) {
    const dims = base.match(/^vector\((\d+)\)/)[1];
    builder = `vector(${arg}, { dimensions: ${dims} })`; imp = "vector";
  } else if (base === "vector") {
    builder = `vector(${arg})`; imp = "vector";
  } else {
    console.warn(`  ! Unmapped type "${fullType}" on column ${colName} — emitting as text()`);
    builder = `text(${arg})`; imp = "text";
  }

  const imports = new Set([imp]);
  if (arrayMatch) builder += ".array()";
  return { builder, imports };
}

// Returns { call, needsSql }. `.defaultRandom()` is only valid on uuid columns;
// a text column defaulting to gen_random_uuid() needs `.default(sql`...`)`.
function defaultCall(expr, baseType) {
  if (!expr) return { call: "", needsSql: false };
  const e = expr.toLowerCase();
  if (e.includes("gen_random_uuid()") || e.includes("uuid_generate_v4()")) {
    return baseType === "uuid"
      ? { call: ".defaultRandom()", needsSql: false }
      : { call: ".default(sql`gen_random_uuid()`)", needsSql: true };
  }
  if (e.includes("now()") || e.includes("current_timestamp")) {
    return { call: ".defaultNow()", needsSql: false };
  }
  if (baseType === "boolean") {
    if (e.startsWith("true")) return { call: ".default(true)", needsSql: false };
    if (e.startsWith("false")) return { call: ".default(false)", needsSql: false };
  }
  return { call: "", needsSql: false }; // skip complex/sequence defaults — don't affect query typing
}

const columns = await sql`
  select c.relname            as table_name,
         a.attnum             as ordinal,
         a.attname            as column_name,
         format_type(a.atttypid, a.atttypmod) as full_type,
         a.attnotnull         as not_null,
         pg_get_expr(d.adbin, d.adrelid)      as default_expr
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'public'
  join pg_attribute a on a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
  left join pg_attrdef d on d.adrelid = c.oid and d.adnum = a.attnum
  where c.relkind = 'r'
  order by c.relname, a.attnum`;

const pks = await sql`
  select c.relname as table_name, a.attname as column_name
  from pg_constraint con
  join pg_class c on c.oid = con.conrelid
  join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'public'
  join pg_attribute a on a.attrelid = c.oid and a.attnum = any(con.conkey)
  where con.contype = 'p'`;

await sql.end({ timeout: 2 });

// Group
const tables = new Map();
for (const col of columns) {
  if (!tables.has(col.table_name)) tables.set(col.table_name, []);
  tables.get(col.table_name).push(col);
}
const pkMap = new Map(); // table -> Set(column)
for (const pk of pks) {
  if (!pkMap.has(pk.table_name)) pkMap.set(pk.table_name, new Set());
  pkMap.get(pk.table_name).add(pk.column_name);
}

// Regenerate cleanly so removals show up as diffs too.
await rm(OUT_DIR, { recursive: true, force: true });
await mkdir(OUT_DIR, { recursive: true });

const tableNames = [...tables.keys()].sort();
const barrelLines = [];

for (const table of tableNames) {
  const cols = tables.get(table);
  const tablePks = pkMap.get(table) ?? new Set();
  const usedImports = new Set(["pgTable"]);
  const isComposite = tablePks.size > 1;
  let needsSqlImport = false;

  const lines = cols.map((col) => {
    const { builder, imports } = mapType(col.full_type, col.column_name);
    imports.forEach((i) => usedImports.add(i));
    let chain = builder;
    if (col.not_null) chain += ".notNull()";
    if (!isComposite && tablePks.has(col.column_name)) chain += ".primaryKey()";
    const { call, needsSql } = defaultCall(col.default_expr, col.full_type.replace(/\[\]$/, ""));
    chain += call;
    if (needsSql) needsSqlImport = true;
    return `  ${snakeToCamel(col.column_name)}: ${chain},`;
  });

  let tableExtra = "";
  if (isComposite) {
    usedImports.add("primaryKey");
    const pkCols = cols
      .filter((c) => tablePks.has(c.column_name))
      .map((c) => `table.${snakeToCamel(c.column_name)}`)
      .join(", ");
    tableExtra = `, (table) => [primaryKey({ columns: [${pkCols}] })]`;
  }

  const importList = [...usedImports].sort().join(", ");
  const varName = snakeToCamel(table);
  const sqlImport = needsSqlImport ? `import { sql } from "drizzle-orm";\n` : "";
  const body =
    `import { ${importList} } from "drizzle-orm/pg-core";\n` +
    sqlImport +
    `\n` +
    `export const ${varName} = pgTable(${JSON.stringify(table)}, {\n` +
    `${lines.join("\n")}\n}${tableExtra});\n`;

  const file = `${snakeToKebab(table)}.ts`;
  await writeFile(path.join(OUT_DIR, file), body, "utf8");
  barrelLines.push(`export * from "./${snakeToKebab(table)}";`);
}

await writeFile(path.join(OUT_DIR, "index.ts"), barrelLines.join("\n") + "\n", "utf8");

console.log(`Generated ${tableNames.length} tables into lib/db/schema/:`);
console.log("  " + tableNames.join(", "));
