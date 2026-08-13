const REGISTRY_LATEST = 'https://registry.npmjs.org/my-scrapbook/latest';
const TIMEOUT_MS = 2000;

// Plain x.y.z comparison — that's all this package ever publishes. Anything
// non-numeric compares NaN, every branch is false, and no notice prints.
const isNewer = (latest: string, current: string): boolean => {
  const a = latest.split('.').map(Number);
  const b = current.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((a[i] || 0) > (b[i] || 0)) return true;
    if ((a[i] || 0) < (b[i] || 0)) return false;
  }
  return false;
};

// Prints a one-line notice when a newer version is on npm. Fire-and-forget:
// offline, slow, or broken registries must never break or delay serving a
// notebook, so every failure path is silent.
export const notifyIfOutdated = async (current: string): Promise<void> => {
  try {
    const res = await fetch(REGISTRY_LATEST, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return;
    const { version: latest } = (await res.json()) as { version?: string };
    if (latest && isNewer(latest, current)) {
      console.log(
        `A newer my-scrapbook is available: ${latest} (you have ${current}). Update: npm i -g my-scrapbook@latest`
      );
    }
  } catch {
    // silent by design
  }
};
