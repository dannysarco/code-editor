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
