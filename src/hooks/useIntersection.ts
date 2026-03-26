import { useState, useEffect, useMemo, RefObject } from 'react';

export function useIntersection(ref: RefObject<HTMLElement>, options?: IntersectionObserverInit) {
  const [isIntersecting, setIsIntersecting] = useState(false);

  // Stabilize options object to prevent re-creating the observer on every render.
  // Without this, any parent re-render would recreate the observer even if
  // option *values* haven't changed.
  const stableOptions = useMemo(
    () => options,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [options?.root, options?.rootMargin, options?.threshold],
  );

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, stableOptions);

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [ref, stableOptions]);

  return isIntersecting;
}
