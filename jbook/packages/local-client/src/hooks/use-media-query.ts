import { useCallback, useSyncExternalStore } from 'react';
import { MOBILE_BREAKPOINT_PX } from '../constants';

const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT_PX}px)`;

const useMediaQuery = (query: string): boolean => {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      // Some embedded/emulated viewports resize without firing MQL change
      // events; re-reading on window resize covers them (React bails out
      // when the snapshot is unchanged).
      window.addEventListener('resize', onChange);
      return () => {
        mql.removeEventListener('change', onChange);
        window.removeEventListener('resize', onChange);
      };
    },
    [query]
  );

  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches);
};

// True on viewports where the code cell should stack editor over preview.
export const useIsMobile = () => useMediaQuery(MOBILE_QUERY);
