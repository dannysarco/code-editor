import express from "express";
import fs from "fs/promises";
import path from "path";
import JSON5 from "json5";
import { z } from "zod";
import { Cell, SaveCellsRequest, SaveCellsResponse } from "@my-scrapbook/types";

// Schemas are annotated with the shared wire types so they cannot drift from
// the contract in @my-scrapbook/types.
const cellSchema: z.ZodType<Cell> = z.object({
  id: z.string().min(1),
  type: z.enum(["code", "text"]),
  content: z.string(),
});

const saveCellsRequestSchema: z.ZodType<SaveCellsRequest> = z.object({
  cells: z.array(cellSchema),
});

const notebookSchema: z.ZodType<Cell[]> = z.array(cellSchema);

// Notebooks written by pre-3.x versions of the app are JS object-literal
// syntax (unquoted keys, trailing commas, trailing semicolon) rather than
// strict JSON, which is what the save path writes today. JSON5 covers the
// object-literal relaxations; the trailing semicolon has to be stripped
// separately since even JSON5 rejects it.
const parseNotebookFile = (raw: string): Cell[] => {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    try {
      data = JSON5.parse(raw.replace(/;\s*$/, ""));
    } catch {
      throw new Error("the file is not a valid notebook (unparseable)");
    }
  }

  const parsed = notebookSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(
      "the file parsed but does not contain a list of notebook cells"
    );
  }
  return parsed.data;
};

// Explicit body size limit; the express default (100kb) is small enough that
// a large notebook could fail to save.
const MAX_NOTEBOOK_BODY_SIZE = "5mb";

export const createCellsRouter = (filename: string, dir: string) => {
  const router = express.Router();
  router.use(express.json({ limit: MAX_NOTEBOOK_BODY_SIZE }));

  const fullPath = path.join(dir, filename);

  router.get("/cells", async (req, res) => {
    try {
      // Read the file
      const result = await fs.readFile(fullPath, { encoding: "utf-8" });

      res.send(parseNotebookFile(result));
    } catch (err: any) {
      if (err.code === "ENOENT") {
        await fs.writeFile(fullPath, "[]", "utf-8");
        res.send([]);
      } else {
        // Answer with a JSON 500 rather than rethrowing (e.g. on a notebook
        // file with invalid JSON) — express 5 would catch the rejection, but
        // its default error page is HTML, not the {error} shape clients expect.
        res.status(500).send({
          error: `Could not read ${filename}: ${err.message}`,
        });
      }
    }
  });

  router.post("/cells", async (req, res) => {
    const parsed = saveCellsRequestSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).send({
        error: "Invalid cells payload",
        issues: parsed.error.issues,
      });
      return;
    }

    // Write the cells into the file
    await fs.writeFile(fullPath, JSON.stringify(parsed.data.cells), "utf-8");

    const response: SaveCellsResponse = { status: "ok" };
    res.send(response);
  });

  return router;
};
