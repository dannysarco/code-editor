import fs from "fs/promises";
import path from "path";
import { Command } from "commander";
import { markdownToCells } from "../markdown";
import { fetchGistFiles, gistToCells, parseGistUrl } from "../gist";

// Never silently replace a notebook: they are user data.
const refuseExisting = async (outPath: string, outFile: string) => {
  let exists = true;
  try {
    await fs.access(outPath);
  } catch {
    exists = false;
  }
  if (exists) {
    console.error(
      `${outFile} already exists. Pass -f to overwrite it, or -o to pick a different name.`
    );
    process.exit(1);
  }
};

const writeNotebook = async (
  outPath: string,
  outFile: string,
  source: string,
  cells: ReturnType<typeof markdownToCells>
) => {
  await fs.writeFile(outPath, JSON.stringify(cells), "utf-8");
  const codeCount = cells.filter((cell) => cell.type === "code").length;
  console.log(
    `Imported ${source} to ${outFile} (${codeCount} code, ${
      cells.length - codeCount
    } text cells). Run "my-scrapbook serve ${outFile}" to open it.`
  );
};

export const importCommand = new Command()
  .command("import [source]")
  .description(
    "Create a notebook from a markdown file or GitHub gist URL (default: notebook.md)"
  )
  .option(
    "-o, --out <file>",
    "notebook file to write (default: the source name with .js)"
  )
  .option("-f, --force", "overwrite the output notebook if it already exists")
  .option(
    "--file <name>",
    "which file of a gist to import, when it has several"
  )
  .action(
    async (
      source = "notebook.md",
      options: { out?: string; force?: boolean; file?: string }
    ) => {
      const gistId = parseGistUrl(source);

      if (gistId) {
        try {
          const files = await fetchGistFiles(gistId);
          const { filename, cells } = gistToCells(files, options.file);
          const outFile =
            options.out ?? filename.replace(/\.[^./\\]*$/, "") + ".js";
          const outPath = path.resolve(process.cwd(), outFile);
          if (!options.force) {
            await refuseExisting(outPath, outFile);
          }
          await writeNotebook(outPath, outFile, `gist (${filename})`, cells);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          console.error(`Could not import the gist: ${message}`);
          process.exit(1);
        }
        return;
      }

      if (options.file) {
        console.error(`--file only applies to gist imports.`);
        process.exit(1);
      }

      const inputPath = path.resolve(process.cwd(), source);
      const outFile = options.out ?? source.replace(/\.[^./\\]*$/, "") + ".js";
      const outPath = path.resolve(process.cwd(), outFile);

      if (outPath === inputPath) {
        console.error(
          `The output file would overwrite the markdown file itself (${source}). Pick a different -o path.`
        );
        process.exit(1);
      }

      let raw: string;
      try {
        raw = await fs.readFile(inputPath, "utf-8");
      } catch (err) {
        const code = (err as NodeJS.ErrnoException).code;
        if (code === "ENOENT") {
          console.error(`No markdown file found at ${source}.`);
        } else {
          const message = err instanceof Error ? err.message : String(err);
          console.error(`Could not read ${source}: ${message}`);
        }
        process.exit(1);
      }

      if (!options.force) {
        await refuseExisting(outPath, outFile);
      }

      try {
        await writeNotebook(outPath, outFile, source, markdownToCells(raw));
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`Could not import ${source}: ${message}`);
        process.exit(1);
      }
    }
  );
