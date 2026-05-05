import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { Guide, GuideCategory, Difficulty, Section } from "@/lib/types";

const GUIDES_DIR = path.join(process.cwd(), "content", "guides");

let _guidesCache: Guide[] | null = null;

export function getAllGuides(): Guide[] {
  if (_guidesCache) return _guidesCache;
  if (!fs.existsSync(GUIDES_DIR)) return [];
  const files = fs.readdirSync(GUIDES_DIR).filter((f) => f.endsWith(".md"));
  _guidesCache = files
    .map((file) => {
      const raw = fs.readFileSync(path.join(GUIDES_DIR, file), "utf8");
      const { data, content } = matter(raw);
      return {
        slug: data.slug as string,
        title: data.title as string,
        description: data.description as string,
        category: data.category as GuideCategory,
        difficulty: data.difficulty as Difficulty,
        readingMinutes: data.readingMinutes as number,
        tags: (data.tags as string[]) ?? [],
        content,
      } satisfies Guide;
    })
    .sort((a, b) => a.title.localeCompare(b.title));
  return _guidesCache;
}

export function getGuideBySlug(slug: string): Guide | null {
  const guides = getAllGuides();
  return guides.find((g) => g.slug === slug) ?? null;
}

export function parseSections(content: string): Section[] {
  const lines = content.split("\n");
  const sections: Section[] = [];
  let current: Section | null = null;
  let preamble: string[] = [];

  for (const line of lines) {
    const h2 = line.match(/^## (.+)$/);
    const h3 = line.match(/^### (.+)$/);
    if (h2 || h3) {
      if (current) {
        current.content = current.content.trim();
        sections.push(current);
      } else if (preamble.length > 0) {
        sections.push({
          id: "preamble",
          heading: "Overview",
          level: 2,
          content: preamble.join("\n").trim(),
        });
        preamble = [];
      }
      const heading = (h2 ? h2[1]! : h3![1]!).trim();
      current = {
        id: slugify(heading),
        heading,
        level: h2 ? 2 : 3,
        content: "",
      };
    } else {
      if (current) {
        current.content += line + "\n";
      } else {
        preamble.push(line);
      }
    }
  }
  if (current) {
    current.content = current.content.trim();
    sections.push(current);
  }
  return sections;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const categoryLabels: Record<GuideCategory, string> = {
  technicals: "Technicals",
  behavioral: "Behavioral & Fit",
  "firm-guides": "Firm Guides",
  networking: "Networking",
  resume: "Resume & Cover Letter",
  modeling: "Modeling Tests",
  superday: "Superday & Logistics",
  "market-news": "Market & Deal News",
};
