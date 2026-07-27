import * as esbuild from "esbuild-wasm";
// Bundle the wasm binary from the installed package rather than fetching it
// from unpkg: the app works offline and the binary always matches the JS API
// version.
import wasmURL from "esbuild-wasm/esbuild.wasm?url";
import { unpkgPathPlugin } from "./plugins/unpkg-path-plugin";
import { fetchPlugin } from "./plugins/fetch-plugin";

let initPromise: Promise<void> | null = null;

const ensureInitialized = () => {
  if (!initPromise) {
    initPromise = esbuild
      .initialize({ wasmURL, worker: true })
      .catch((err) => {
        // Allow a later bundle() call to retry initialization.
        initPromise = null;
        throw err;
      });
  }
  return initPromise;
};

const bundle = async (rawCode: string) => {
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
