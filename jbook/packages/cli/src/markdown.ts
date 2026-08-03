import { randomUUID } from "crypto";
import { Cell } from "@my-scrapbook/types";

// Parses the raw contents of a notebook file, throwing a descriptive error if
// the file isn't a My Scrapbook notebook. Kept intentionally lenient: extra
// fields are ignored so future notebook versions still export.
export const parseNotebook = (raw: string): Cell[] => {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("the file is not valid JSON");
  }

  if (!Array.isArray(data)) {
    throw new Error("expected a JSON array of cells");
  }

  data.forEach((cell, i) => {
    const ok =
      cell !== null &&
      typeof cell === "object" &&
      (cell.type === "code" || cell.type === "text") &&
      typeof cell.content === "string";
    if (!ok) {
      throw new Error(`cell ${i + 1} is not a code or text cell`);
    }
  });

  return data as Cell[];
};

// A code cell may itself contain backtick runs (template literals, markdown
// examples); the fence must be longer than any run inside it.
const fenceFor = (content: string): string => {
  const longestRun = (content.match(/`+/g) ?? []).reduce(
    (max, run) => Math.max(max, run.length),
    0
  );
  return "`".repeat(Math.max(3, longestRun + 1));
};

// Languages whose fenced blocks become code cells on import. Anything else
// (python, bash, no language) stays inside the surrounding text cell, where
// the app renders it as a plain markdown code block.
const CODE_CELL_LANGS = new Set([
  "js",
  "jsx",
  "ts",
  "tsx",
  "javascript",
  "typescript",
]);

// A backtick fence opener at the start of a line; CommonMark forbids
// backticks in the info string of a backtick fence, so [^`]* is exact.
const FENCE_OPEN = /^(`{3,})([^`]*)$/;

const stripBlankEdges = (lines: string[]): string => {
  let start = 0;
  let end = lines.length;
  while (start < end && lines[start].trim() === "") start++;
  while (end > start && lines[end - 1].trim() === "") end--;
  return lines.slice(start, end).join("\n").trimEnd();
};

// Turns a markdown document into notebook cells — the inverse of
// cellsToMarkdown. JS/TS fenced blocks become code cells; everything between
// them becomes text cells.
export const markdownToCells = (markdown: string): Cell[] => {
  const lines = markdown.split(/\r\n|\r|\n/);
  const cells: Cell[] = [];
  let textRun: string[] = [];

  const flushText = () => {
    const content = stripBlankEdges(textRun);
    textRun = [];
    if (content !== "") {
      cells.push({ id: randomUUID(), type: "text", content });
    }
  };

  // Reads a fenced block's body starting at lines[i], up to a closing fence
  // (at least as long as the opener with nothing else on the line — the
  // CommonMark rule) or end of input, per CommonMark's unclosed-block rule.
  const readFence = (i: number, fence: string) => {
    const body: string[] = [];
    while (i < lines.length) {
      const close = lines[i].match(/^(`{3,})\s*$/);
      if (close && close[1].length >= fence.length) {
        return { body, closeLine: lines[i], next: i + 1 };
      }
      body.push(lines[i]);
      i++;
    }
    return { body, closeLine: null, next: i };
  };

  let i = 0;
  while (i < lines.length) {
    const open = lines[i].match(FENCE_OPEN);
    if (!open) {
      textRun.push(lines[i]);
      i++;
      continue;
    }

    const [, fence, info] = open;
    const lang = info.trim().split(/\s+/)[0].toLowerCase();
    const block = readFence(i + 1, fence);
    if (CODE_CELL_LANGS.has(lang)) {
      flushText();
      cells.push({
        id: randomUUID(),
        type: "code",
        content: block.body.join("\n").trimEnd(),
      });
    } else {
      // A non-code fence is consumed whole into the text run, so a JS/TS
      // opener appearing inside it can't be mistaken for a code cell.
      textRun.push(lines[i], ...block.body);
      if (block.closeLine !== null) {
        textRun.push(block.closeLine);
      }
    }
    i = block.next;
  }
  flushText();

  return cells;
};

export const cellsToMarkdown = (cells: Cell[]): string => {
  const blocks = cells.map((cell) => {
    const content = cell.content.trimEnd();
    if (cell.type === "text") {
      return content;
    }
    const fence = fenceFor(content);
    return `${fence}jsx\n${content}\n${fence}`;
  });

  return blocks.join("\n\n") + "\n";
};
