// Builds supabase/migrations/0007_qbank_seed.sql from the AI-authored question
// JSON in lib/curriculum/seed/questions/*.json. Validates each question against
// the manifest (chapter/section slugs must exist), dedupes by id, and emits
// idempotent INSERTs (ON CONFLICT DO NOTHING) into qbank_questions +
// qbank_followups. Re-run whenever the seed JSON changes:
//   node scripts/build-qbank-seed.mjs
//
// The generated SQL is applied via the normal migration path (service role),
// so RLS on the shared content tables is bypassed for the seed only.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const SEED_DIR = path.join(ROOT, "lib/curriculum/seed/questions");
const OUT = path.join(ROOT, "supabase/migrations/0007_qbank_seed.sql");
const MANIFEST = path.join(ROOT, "lib/curriculum/chapters.ts");

const VALID_TOPICS = new Set([
  "recruiting", "networking", "resume", "behavioral", "accounting",
  "ev-equity-value", "valuation", "dcf", "ma", "lbo", "mental-math", "interviewing",
]);
const VALID_DIFFICULTY = new Set(["easy", "medium", "hard"]);
const VALID_TYPE = new Set(["conceptual", "single-step", "multi-step", "calculation", "verbal", "curveball"]);

// Pull the set of valid chapter/section slugs straight from the manifest source.
const manifestSrc = fs.readFileSync(MANIFEST, "utf8");
const chapterSlugs = new Set([...manifestSrc.matchAll(/slug:\s*"([a-z0-9-]+)"/g)].map((m) => m[1]));

function q(s) {
  return "'" + String(s).replace(/'/g, "''") + "'";
}

function jsonLit(obj) {
  return q(JSON.stringify(obj)) + "::jsonb";
}

if (!fs.existsSync(SEED_DIR)) {
  console.error(`Seed dir not found: ${SEED_DIR}`);
  process.exit(1);
}

const files = fs.readdirSync(SEED_DIR).filter((f) => f.endsWith(".json"));
if (files.length === 0) {
  console.error("No seed JSON files found — has the generation workflow finished?");
  process.exit(1);
}

const seenIds = new Set();
const questionRows = [];
const followupRows = [];
let skipped = 0;
const problems = [];

for (const file of files) {
  let arr;
  try {
    arr = JSON.parse(fs.readFileSync(path.join(SEED_DIR, file), "utf8"));
  } catch (e) {
    problems.push(`${file}: invalid JSON (${e.message})`);
    continue;
  }
  if (!Array.isArray(arr)) {
    problems.push(`${file}: not a JSON array`);
    continue;
  }
  for (const item of arr) {
    const id = item?.id;
    if (!id || typeof id !== "string") { skipped++; continue; }
    if (seenIds.has(id)) { skipped++; continue; }
    if (!VALID_TOPICS.has(item.topic)) { problems.push(`${id}: bad topic ${item.topic}`); skipped++; continue; }
    if (!VALID_DIFFICULTY.has(item.difficulty)) { problems.push(`${id}: bad difficulty`); skipped++; continue; }
    if (!VALID_TYPE.has(item.questionType)) { problems.push(`${id}: bad questionType ${item.questionType}`); skipped++; continue; }
    if (!item.prompt || !item.modelAnswer) { problems.push(`${id}: missing prompt/modelAnswer`); skipped++; continue; }
    if (item.chapterSlug && !chapterSlugs.has(item.chapterSlug)) {
      problems.push(`${id}: unknown chapterSlug ${item.chapterSlug}`);
      // keep it but null the chapter link so it still serves in topic mode
      item.chapterSlug = null;
      item.sectionSlug = null;
    }
    seenIds.add(id);

    const keyPoints = Array.isArray(item.keyPoints) ? item.keyPoints : [];
    const misconceptions = Array.isArray(item.misconceptions) ? item.misconceptions : [];
    const advanced = item.advanced === true;

    questionRows.push(
      `(${q(id)}, ${q(item.topic)}, ${q(item.difficulty)}, ${q(item.questionType)}, ${q(item.prompt)}, ` +
      `${jsonLit(keyPoints)}, ${jsonLit(misconceptions)}, ${q(item.modelAnswer)}, ` +
      `${item.chapterSlug ? q(item.chapterSlug) : "null"}, ${item.sectionSlug ? q(item.sectionSlug) : "null"}, ` +
      `${advanced}, 'curated', true)`,
    );

    const followups = Array.isArray(item.followups) ? item.followups : [];
    followups.forEach((f, i) => {
      if (!f?.prompt || !f?.modelAnswer) return;
      const fid = `${id}-f${i + 1}`;
      followupRows.push(`(${q(fid)}, ${q(id)}, ${i + 1}, ${q(f.prompt)}, ${q(f.modelAnswer)})`);
    });
  }
}

if (problems.length > 0) {
  console.warn(`\n⚠️  ${problems.length} issue(s):`);
  for (const p of problems.slice(0, 40)) console.warn(`   - ${p}`);
  if (problems.length > 40) console.warn(`   … and ${problems.length - 40} more`);
}

const CHUNK = 200;
function chunkedInserts(header, cols, rows) {
  const out = [];
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK);
    out.push(
      `insert into ${header} (${cols}) values\n${slice.join(",\n")}\non conflict (id) do nothing;`,
    );
  }
  return out.join("\n\n");
}

const sql = `-- ──────────────────────────────────────────────────────────────────────────────
-- GENERATED FILE — do not edit by hand.
-- Source: lib/curriculum/seed/questions/*.json
-- Regenerate: node scripts/build-qbank-seed.mjs
-- ${questionRows.length} questions, ${followupRows.length} follow-ups.
-- ──────────────────────────────────────────────────────────────────────────────

${chunkedInserts(
  "public.qbank_questions",
  "id, topic, difficulty, question_type, prompt, key_points, misconceptions, model_answer, chapter_slug, section_slug, advanced, source, active",
  questionRows,
)}

${chunkedInserts("public.qbank_followups", "id, question_id, ordinal, prompt, model_answer", followupRows)}
`;

fs.writeFileSync(OUT, sql);
console.log(
  `\n✅ Wrote ${OUT}\n   ${questionRows.length} questions, ${followupRows.length} follow-ups (${skipped} skipped).`,
);
