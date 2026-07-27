import express from "express";
import fs from "fs/promises";
import path from "path";
import { Cell, SaveCellsRequest, SaveCellsResponse } from "@my-scrapbook/types";

export const createCellsRouter = (filename: string, dir: string) => {
  const router = express.Router();
  router.use(express.json());

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
        throw err;
      }
    }
  });

  router.post("/cells", async (req, res) => {
    // Take the list of cells from the request obj
    // serialize them
    const { cells }: { cells: Cell[] } = req.body as SaveCellsRequest;

    // Write the cells into the file
    await fs.writeFile(fullPath, JSON.stringify(cells), "utf-8");

    const response: SaveCellsResponse = { status: "ok" };
    res.send(response);
  });

  return router;
};
