import fs from "fs/promises";
import path from "path";
import { Command } from "commander";
import { cellsToMarkdown, parseNotebook } from "../markdown";

export const exportCommand = new Command()
  .command("export [filename]")
  .description("Convert a notebook to a markdown file (default: notebook.js)")
  .option(
    "-o, --out <file>",
    "file to write the markdown to (default: the notebook name with .md)"
  )
  .action(async (filename = "notebook.js", options: { out?: string }) => {
    const inputPath = path.resolve(process.cwd(), filename);
    const outFile =
      options.out ?? filename.replace(/\.[^./\\]*$/, "") + ".md";
    const outPath = path.resolve(process.cwd(), outFile);

    if (outPath === inputPath) {
      console.error(
        `The output file would overwrite the notebook itself (${filename}). Pick a different -o path.`
      );
      process.exit(1);
    }

    let raw: string;
    try {
      raw = await fs.readFile(inputPath, "utf-8");
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === "ENOENT") {
        console.error(
          `No notebook found at ${filename}. Run "my-scrapbook serve ${filename}" to create one.`
        );
      } else {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`Could not read ${filename}: ${message}`);
      }
      process.exit(1);
    }

    try {
      const cells = parseNotebook(raw);
      await fs.writeFile(outPath, cellsToMarkdown(cells), "utf-8");
      console.log(`Exported ${filename} to ${outFile}.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Could not export ${filename}: ${message}`);
      process.exit(1);
    }
  });
