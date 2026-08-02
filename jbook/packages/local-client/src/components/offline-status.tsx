import './offline-status.css';
import { useEffect, useState } from 'react';
import { clearModuleCache } from '../bundler/module-cache';
import { clearBundleCache } from '../bundler/bundle-cache';

// Everything the app needs at runtime is served locally or cached: the
// editor and bundler are part of the build, and npm modules fetched from
// unpkg are cached in IndexedDB. Offline, only imports of packages never
// fetched before will fail — this badge tells the user which world they
// are in, and the button empties the module cache so the next bundle picks
// up fresh package versions.
const OfflineStatus: React.FC = () => {
  const [online, setOnline] = useState(() => navigator.onLine);
  const [clearedCount, setClearedCount] = useState<number | null>(null);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  useEffect(() => {
    if (clearedCount === null) {
      return;
    }
    const timer = setTimeout(() => setClearedCount(null), 3000);
    return () => clearTimeout(timer);
  }, [clearedCount]);

  const onClearCache = async () => {
    // Cached bundle outputs bake in the pinned module versions, so they must
    // go whenever the module cache does — otherwise unchanged cells would
    // keep serving bundles built against the old versions.
    await clearBundleCache();
    const count = await clearModuleCache();
    setClearedCount(count);
  };

  return (
    <div className="offline-status">
      {!online && (
        <span
          className="tag tag-accent"
          title="No network connection. Previously used npm packages are cached and keep working; imports of new packages will fail until you are back online."
        >
          Offline — cached packages still work
        </span>
      )}
      {clearedCount !== null && (
        <span className="tag tag-neutral">
          Cleared {clearedCount} cached module{clearedCount === 1 ? '' : 's'}
        </span>
      )}
      <button
        className="btn btn-secondary"
        title="Empty the npm module cache; the next run refetches packages from unpkg and picks up new versions"
        onClick={onClearCache}
      >
        Clear cache
      </button>
    </div>
  );
};

export default OfflineStatus;
