import path from "path";
import { Command } from "commander";
import { serve } from "@my-scrapbook/local-api";

const isProduction = process.env.NODE_ENV === "production";

export const serveCommand = new Command()
  .command("serve [filename]")
  .description("Open a file for editing")
  .option("-p, --port <number>", "port to run server on", "4005")
  .action(async (filename = "notebook.js", options: { port: string }) => {
    try {
      const dir = path.join(process.cwd(), path.dirname(filename));
      await serve(
        parseInt(options.port),
        path.basename(filename),
        dir,
        !isProduction
      );
      console.log(
        `Opened ${filename}. Navigate to http://localhost:${options.port} to edit the file.`
      );
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === "EADDRINUSE") {
        console.error(
          `Port ${options.port} is already in use. Pick another with: my-scrapbook serve ${filename} -p <port>`
        );
      } else {
        const message = err instanceof Error ? err.message : String(err);
        console.error(
          `Failed to open ${filename} on port ${options.port}: ${message}`
        );
      }
      process.exit(1);
    }
  });
