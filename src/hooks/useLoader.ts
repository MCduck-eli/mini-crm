import { useCallback, useEffect, useRef, useState } from 'react';

export interface Loader<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  reload: () => void;
}

export function useLoader<T>(loader: () => Promise<T>, deps: unknown[]): Loader<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    loaderRef
      .current()
      .then((value) => {
        if (!active) return;
        setData(value);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Не удалось загрузить данные');
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [...deps, nonce]);

  const reload = useCallback(() => setNonce((value) => value + 1), []);

  return { data, error, loading, reload };
}
