import { useState, useCallback, useEffect, useRef } from "react";

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useAsync<T>(
  fn: () => Promise<T>,
  deps: unknown[] = [],
  options: { immediate?: boolean } = { immediate: true }
) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null, loading: options.immediate !== false, error: null,
  });
  const mountedRef = useRef(true);

  const execute = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fn();
      if (mountedRef.current) setState({ data, loading: false, error: null });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      if (mountedRef.current) setState({ data: null, loading: false, error: msg });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    mountedRef.current = true;
    if (options.immediate !== false) execute();
    return () => { mountedRef.current = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [execute]);

  return { ...state, refetch: execute };
}

export function useAsyncAction<T, Args extends unknown[]>(
  fn: (...args: Args) => Promise<T>
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = async (...args: Args): Promise<T | undefined> => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn(...args);
      return result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { execute, loading, error, clearError: () => setError(null) };
}
