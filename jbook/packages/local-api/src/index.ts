import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import path from "path";
import { createCellsRouter } from "./routes/cells";

export const serve = (
  port: number,
  filename: string,
  dir: string,
  useProxy: boolean
) => {
  const app = express();

  app.use(createCellsRouter(filename, dir));

  if (useProxy) {
    app.use(
      createProxyMiddleware({
        target: "http://localhost:3000",
        ws: true,
        // http-proxy-middleware 3.x replaced logLevel with an optional
        // logger; omitting it keeps the proxy silent.
      })
    );
  } else {
    const packagePath = require.resolve(
      "@my-scrapbook/local-client/build/index.html"
    );
    app.use(express.static(path.dirname(packagePath)));
  }

  return new Promise<void>((resolve, reject) => {
    // express 5 reports listen failures through the callback; keep the
    // "error" listener too for failures the callback doesn't cover.
    app
      .listen(port, (err?: Error) => (err ? reject(err) : resolve()))
      .on("error", reject);
  });
};
