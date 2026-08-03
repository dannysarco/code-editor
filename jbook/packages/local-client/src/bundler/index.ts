import * as esbuild from "esbuild-wasm";
// Bundle the wasm binary from the installed package rather than fetching it
// from unpkg: the app works offline and the binary always matches the JS API
// version.
import wasmURL from "esbuild-wasm/esbuild.wasm?url";
import type { BundleResult } from "@my-scrapbook/types";
import { unpkgPathPlugin } from "./plugins/unpkg-path-plugin";
import { fetchPlugin } from "./plugins/fetch-plugin";

// If the local binary can't be loaded (e.g. a corrupted install), fall back
// to unpkg, pinned to the installed package's version so the binary still
// matches the JS API.
const fallbackWasmURL = `https://unpkg.com/esbuild-wasm@${esbuild.version}/esbuild.wasm`;

let initPromise: Promise<void> | null = null;

const ensureInitialized = () => {
  if (!initPromise) {
    initPromise = esbuild
      .initialize({ wasmURL, worker: true })
      .catch(() => esbuild.initialize({ wasmURL: fallbackWasmURL, worker: true }))
      .catch((err) => {
        // Allow a later bundle() call to retry initialization.
        initPromise = null;
        throw err;
      });
  }
  return initPromise;
};

const bundle = async (rawCode: string): Promise<BundleResult> => {
  try {
    await ensureInitialized();

    const result = await esbuild.build({
      entryPoints: ["index.js"],
      bundle: true,
      write: false,
      plugins: [unpkgPathPlugin(), fetchPlugin(rawCode)],
      define: {
        "process.env.NODE_ENV": '"production"',
        global: "window",
      },
      jsxFactory: "_React.createElement",
      jsxFragment: "_React.Fragment",
    });

    return {
      code: result.outputFiles[0].text,
      err: "",
    };
  } catch (err) {
    return {
      code: "",
      err: err instanceof Error ? err.message : String(err),
    };
  }
};

export default bundle;
