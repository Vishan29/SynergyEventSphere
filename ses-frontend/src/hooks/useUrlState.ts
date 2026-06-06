import { useSearchParams } from 'react-router-dom';
import { useCallback, useMemo } from 'react';

// Sync a typed dictionary of filter/page/sort state to the URL via
// useSearchParams so views are shareable and bookmarkable.
export function useUrlState<T extends Record<string, string | undefined>>(
  defaults: T,
): [T, (next: Partial<T>) => void] {
  const [params, setParams] = useSearchParams();

  const value = useMemo(() => {
    const out = { ...defaults };
    for (const key of Object.keys(defaults) as (keyof T)[]) {
      const v = params.get(key as string);
      if (v != null) (out as Record<string, string | undefined>)[key as string] = v;
    }
    return out;
  }, [params, defaults]);

  const setValue = useCallback(
    (next: Partial<T>) => {
      setParams(
        (prev) => {
          const out = new URLSearchParams(prev);
          for (const [k, v] of Object.entries(next)) {
            if (v === undefined || v === null || v === '') {
              out.delete(k);
            } else {
              out.set(k, v as string);
            }
          }
          return out;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  return [value, setValue];
}
