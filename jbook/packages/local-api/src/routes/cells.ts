import express from "express";
import fs from "fs/promises";
import path from "path";
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

export const createCellsRouter = (filename: string, dir: string) => {
  const router = express.Router();
  // Explicit body size limit; the express default (100kb) is small enough
  // that a large notebook could fail to save.
  router.use(express.json({ limit: "5mb" }));

  const fullPath = path.join(dir, filename);

  router.get("/cells", async (req, res) => {
    try {
      // Read the file
      const result = await fs.readFile(fullPath, { encoding: "utf-8" });

      res.send(JSON.parse(result));
    } catch (err: any) {
      if (err.code === "ENOENT") {
        await fs.writeFile(fullPath, "[]", "utf-8");
        res.send([]);
      } else {
        // Rethrowing from an async express 4 handler is an unhandled
        // rejection and would take down the server (e.g. on a notebook file
        // with invalid JSON); answer with a 500 instead.
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
