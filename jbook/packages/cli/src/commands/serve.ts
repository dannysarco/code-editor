import path from "path";
import { Command } from "commander";
import { serve } from "@my-scrapbook/local-api";
import { openBrowser } from "../open-browser";

const isProduction = process.env.NODE_ENV === "production";

export const serveCommand = new Command()
  .command("serve [filename]")
  .description("Open a notebook for editing (default: notebook.js)")
  .option("-p, --port <number>", "port to run server on", "4005")
  .option("--no-open", "don't open the browser automatically")
  .action(
    async (
      filename = "notebook.js",
      options: { port: string; open: boolean }
    ) => {
      try {
        const dir = path.join(process.cwd(), path.dirname(filename));
        await serve(
          parseInt(options.port),
          path.basename(filename),
          dir,
          !isProduction
        );
        const url = `http://localhost:${options.port}`;
        console.log(`Opened ${filename}. Edit it at ${url}`);
        if (options.open) {
          openBrowser(url);
        }
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
    }
  );
