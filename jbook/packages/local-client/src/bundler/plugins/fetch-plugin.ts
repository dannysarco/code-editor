import * as esbuild from 'esbuild-wasm';
import axios from 'axios';
import { moduleCache as fileCache } from '../module-cache';

// A failed unpkg fetch surfaces from axios as a bare "Network Error" (unpkg's
// 404s can be CORS-blocked, so there is often no response object) — useless
// in the preview pane. Rethrow with the import specifier and a likely cause;
// esbuild shows the message at the failing import.
const fetchModule = async (url: string) => {
  try {
    return await axios.get(url);
  } catch (err) {
    const specifier = url.replace('https://unpkg.com/', '');
    const status =
      axios.isAxiosError(err) && err.response
        ? err.response.status
        : undefined;
    if (status === 404 || (status === undefined && navigator.onLine)) {
      throw new Error(
        `Could not fetch '${specifier}' from unpkg — check the package name and version`
      );
    }
    if (status === undefined) {
      throw new Error(
        `Could not fetch '${specifier}' — you're offline and it isn't in the module cache yet`
      );
    }
    throw new Error(`Could not fetch '${specifier}' — unpkg answered ${status}`);
  }
};

export const fetchPlugin = (inputCode: string) => {
  return {
    name: 'fetch-plugin',
    setup(build: esbuild.PluginBuild) {
      build.onLoad({ filter: /(^index\.js$)/ }, () => {
        return {
          // tsx rather than jsx: cell code may use TypeScript syntax, which
          // esbuild strips (no type checking). Plain JS/JSX parses the same.
          loader: 'tsx',
          contents: inputCode,
        };
      });

      build.onLoad({ filter: /.*/ }, async (args: any) => {
        const cachedResult = await fileCache.getItem<esbuild.OnLoadResult>(
          args.path
        );

        if (cachedResult) {
          return cachedResult;
        }
      });

      build.onLoad({ filter: /.css$/ }, async (args: any) => {
        const { data, request } = await fetchModule(args.path);
        const escaped = data
          .replace(/\n/g, '')
          .replace(/"/g, '\\"')
          .replace(/'/g, "\\'");
        const contents = `
          const style = document.createElement('style');
          style.innerText = '${escaped}';
          document.head.appendChild(style);
        `;

        const result: esbuild.OnLoadResult = {
          loader: 'jsx',
          contents,
          resolveDir: new URL('./', request.responseURL).pathname,
        };
        await fileCache.setItem(args.path, result);

        return result;
      });

      build.onLoad({ filter: /.*/ }, async (args: any) => {
        const { data, request } = await fetchModule(args.path);

        const result: esbuild.OnLoadResult = {
          loader: 'jsx',
          contents: data,
          resolveDir: new URL('./', request.responseURL).pathname,
        };
        await fileCache.setItem(args.path, result);

        return result;
      });
    },
  };
};
