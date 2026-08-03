import fs from "fs/promises";
import path from "path";
import { Command } from "commander";
import { markdownToCells } from "../markdown";

export const importCommand = new Command()
  .command("import [filename]")
  .description(
    "Create a notebook from a markdown file (default: notebook.md)"
  )
  .option(
    "-o, --out <file>",
    "notebook file to write (default: the markdown name with .js)"
  )
  .option("-f, --force", "overwrite the output notebook if it already exists")
  .action(
    async (
      filename = "notebook.md",
      options: { out?: string; force?: boolean }
    ) => {
      const inputPath = path.resolve(process.cwd(), filename);
      const outFile = options.out ?? filename.replace(/\.[^./\\]*$/, "") + ".js";
      const outPath = path.resolve(process.cwd(), outFile);

      if (outPath === inputPath) {
        console.error(
          `The output file would overwrite the markdown file itself (${filename}). Pick a different -o path.`
        );
        process.exit(1);
      }

      let raw: string;
      try {
        raw = await fs.readFile(inputPath, "utf-8");
      } catch (err) {
        const code = (err as NodeJS.ErrnoException).code;
        if (code === "ENOENT") {
          console.error(`No markdown file found at ${filename}.`);
        } else {
          const message = err instanceof Error ? err.message : String(err);
          console.error(`Could not read ${filename}: ${message}`);
        }
        process.exit(1);
      }

      // Notebooks are user data: never silently replace one.
      if (!options.force) {
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
      }

      try {
        const cells = markdownToCells(raw);
        await fs.writeFile(outPath, JSON.stringify(cells), "utf-8");
        const codeCount = cells.filter((cell) => cell.type === "code").length;
        console.log(
          `Imported ${filename} to ${outFile} (${codeCount} code, ${
            cells.length - codeCount
          } text cells). Run "my-scrapbook serve ${outFile}" to open it.`
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`Could not import ${filename}: ${message}`);
        process.exit(1);
      }
    }
  );
