import { afterEach, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import express from "express";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { createCellsRouter } from "./cells";

const FILENAME = "notebook.js";

describe("cells router", () => {
  let dir: string;
  let app: express.Express;

  const notebookPath = () => path.join(dir, FILENAME);

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), "scrapbook-test-"));
    app = express();
    app.use(createCellsRouter(FILENAME, dir));
  });

  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  describe("GET /cells", () => {
    it("creates an empty notebook when the file is missing", async () => {
      const res = await request(app).get("/cells");

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
      await expect(fs.readFile(notebookPath(), "utf-8")).resolves.toBe("[]");
    });

    it("returns saved cells", async () => {
      const cells = [{ id: "a", type: "code", content: "show(1);" }];
      await fs.writeFile(notebookPath(), JSON.stringify(cells), "utf-8");

      const res = await request(app).get("/cells");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(cells);
    });

    it("reads legacy notebooks written in relaxed JS object-literal syntax", async () => {
      // Format written by pre-3.x versions of the app: unquoted keys,
      // trailing commas, and a trailing semicolon.
      const legacy = `[
  {
    content: "**Hello** markdown cell",
    type: "text",
    id: "qw4rr",
  },
  {
    content: "show(1);\\r\\n",
    type: "code",
    id: "ldq45",
  },
];
`;
      await fs.writeFile(notebookPath(), legacy, "utf-8");

      const res = await request(app).get("/cells");

      expect(res.status).toBe(200);
      expect(res.body).toEqual([
        { content: "**Hello** markdown cell", type: "text", id: "qw4rr" },
        { content: "show(1);\r\n", type: "code", id: "ldq45" },
      ]);
    });

    it("answers 500 when the file parses but is not a cell list", async () => {
      await fs.writeFile(notebookPath(), '{"not": "cells"}', "utf-8");

      const res = await request(app).get("/cells");
      expect(res.status).toBe(500);
      expect(res.body.error).toContain(FILENAME);
    });

    it("answers 500 for a corrupted notebook instead of crashing", async () => {
      await fs.writeFile(notebookPath(), "not json{{{", "utf-8");

      const res = await request(app).get("/cells");
      expect(res.status).toBe(500);
      expect(res.body.error).toContain(FILENAME);

      // the server keeps handling requests
      await fs.writeFile(notebookPath(), "[]", "utf-8");
      await request(app).get("/cells").expect(200);
    });
  });

  describe("POST /cells", () => {
    it("writes valid cells and responds with status ok", async () => {
      const cells = [
        { id: "a", type: "code", content: "show(1);" },
        { id: "b", type: "text", content: "# hi" },
      ];

      const res = await request(app).post("/cells").send({ cells });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: "ok" });
      expect(JSON.parse(await fs.readFile(notebookPath(), "utf-8"))).toEqual(
        cells
      );
    });

    it("rejects an unknown cell type with 400 and issue details", async () => {
      const res = await request(app)
        .post("/cells")
        .send({ cells: [{ id: "a", type: "markdown", content: "x" }] });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Invalid cells payload");
      expect(res.body.issues[0].path).toEqual(["cells", 0, "type"]);
    });

    it("rejects cells with missing fields", async () => {
      await request(app)
        .post("/cells")
        .send({ cells: [{ id: "a", type: "code" }] })
        .expect(400);
    });

    it("rejects a non-array cells value", async () => {
      await request(app).post("/cells").send({ cells: "nope" }).expect(400);
    });

    it("strips unknown keys before writing to disk", async () => {
      await request(app)
        .post("/cells")
        .send({
          cells: [{ id: "a", type: "code", content: "x", evil: "payload" }],
        })
        .expect(200);

      const saved = JSON.parse(await fs.readFile(notebookPath(), "utf-8"));
      expect(saved).toEqual([{ id: "a", type: "code", content: "x" }]);
    });

    it("does not touch the file on invalid input", async () => {
      const cells = [{ id: "keep", type: "text", content: "original" }];
      await fs.writeFile(notebookPath(), JSON.stringify(cells), "utf-8");

      await request(app).post("/cells").send({ cells: "garbage" }).expect(400);

      expect(JSON.parse(await fs.readFile(notebookPath(), "utf-8"))).toEqual(
        cells
      );
    });

    it("rejects oversized bodies with 413", async () => {
      const res = await request(app)
        .post("/cells")
        .send({
          cells: [{ id: "big", type: "code", content: "x".repeat(6_000_000) }],
        });

      expect(res.status).toBe(413);
    });
  });
});
