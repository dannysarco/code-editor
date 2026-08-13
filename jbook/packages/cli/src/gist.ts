import { randomUUID } from "crypto";
import { Cell } from "@my-scrapbook/types";
import { markdownToCells, parseNotebook } from "./markdown";

// Gist URLs as users copy them: gist.github.com/<id> or
// gist.github.com/<user>/<id>, with an optional #file-… fragment or trailing
// path. Returns the gist id, or null when the input isn't a gist URL (the
// import command then treats it as a local file path).
export const parseGistUrl = (input: string): string | null => {
  const match = input.match(
    /^https?:\/\/gist\.github\.com\/(?:[\w-]+\/)?([0-9a-f]+)(?:[/#?].*)?$/i
  );
  return match ? match[1] : null;
};

export interface GistFile {
  filename: string;
  content: string;
}

interface GistApiFile {
  filename: string;
  content: string;
  truncated: boolean;
  raw_url: string;
}

export const fetchGistFiles = async (id: string): Promise<GistFile[]> => {
  const res = await fetch(`https://api.github.com/gists/${id}`, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (res.status === 404) {
    throw new Error("GitHub has no such gist — is it secret or deleted?");
  }
  if (!res.ok) {
    throw new Error(`GitHub answered ${res.status}`);
  }
  const gist = (await res.json()) as {
    files?: Record<string, GistApiFile>;
  };
  const files = Object.values(gist.files ?? {});
  return Promise.all(
    files.map(async (file) => ({
      filename: file.filename,
      // The API truncates contents around 1 MB; the raw URL has it whole.
      content: file.truncated
        ? await (await fetch(file.raw_url)).text()
        : file.content,
    }))
  );
};

const MARKDOWN_EXT = /\.(md|markdown)$/i;
const CODE_EXT = /\.(js|jsx|ts|tsx)$/i;

const textCell = (content: string): Cell => ({
  id: randomUUID(),
  type: "text",
  content,
});
const codeCell = (content: string): Cell => ({
  id: randomUUID(),
  type: "code",
  content: content.trimEnd(),
});

// An exported notebook.js is a JSON cell array; anything else is not.
const asNotebook = (file: GistFile): Cell[] | null => {
  try {
    return parseNotebook(file.content);
  } catch {
    return null;
  }
};

const cellsForFile = (file: GistFile): Cell[] => {
  if (MARKDOWN_EXT.test(file.filename)) return markdownToCells(file.content);
  return asNotebook(file) ?? [codeCell(file.content)];
};

// Picks what to import from a gist. Precedence without --file: an exported
// notebook (round-trips exactly), then a lone markdown file, then JS/TS
// sources as code cells (with a filename header cell when there are several).
export const gistToCells = (
  files: GistFile[],
  only?: string
): { filename: string; cells: Cell[] } => {
  const names = files.map((file) => file.filename).join(", ");

  if (only) {
    const file = files.find((file) => file.filename === only);
    if (!file) {
      throw new Error(`the gist has no file named ${only} (it has: ${names})`);
    }
    return { filename: file.filename, cells: cellsForFile(file) };
  }

  for (const file of files) {
    const notebook = asNotebook(file);
    if (notebook) return { filename: file.filename, cells: notebook };
  }

  const markdowns = files.filter((file) => MARKDOWN_EXT.test(file.filename));
  if (markdowns.length === 1) {
    return {
      filename: markdowns[0].filename,
      cells: markdownToCells(markdowns[0].content),
    };
  }
  if (markdowns.length > 1) {
    throw new Error(
      `the gist has several markdown files — pick one with --file (it has: ${names})`
    );
  }

  const sources = files.filter((file) => CODE_EXT.test(file.filename));
  if (sources.length > 0) {
    return {
      filename: sources[0].filename,
      cells: sources.flatMap((file) =>
        sources.length > 1
          ? [textCell(`**${file.filename}**`), codeCell(file.content)]
          : [codeCell(file.content)]
      ),
    };
  }

  throw new Error(
    `nothing importable — no notebook, markdown, or JS/TS file (it has: ${
      names || "no files"
    })`
  );
};
