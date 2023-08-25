import path from "path";
import { Command } from "commander";
import { serve } from "local-api";

interface LocalApiError {
  code: string;
}

const isLocalApiError = (err: any): err is LocalApiError => {
  return typeof err.code === "string";
};

export const serveCommand = new Command()
  .command("serve [filename]")
  .description("Open a file for editing")
  .option("-p, --port <number>", "port to run server on", "4005")
  .action(async (filename = "notebook.js", options: { port: string }) => {
    try {
      const dir = path.join(process.cwd(), path.dirname(filename));
      await serve(parseInt(options.port), path.basename(filename), dir);
      console.log(
        `Opened ${filename}. Navigate to http://localhost:${options.port} to edit the file.`
      );
    } catch (err: any) {
      // <-- Provided a type for the error argument.
      if (isLocalApiError(err)) {
        if (err.code === "EADDRINUSE") {
          // <-- Fixed the extra parenthesis.
          console.error("Port is in use. Try running on a different port.");
        }
      } else if (err instanceof Error) {
        console.log("Heres the problem", err.message);
      }
      process.exit(1);
    }
  });
