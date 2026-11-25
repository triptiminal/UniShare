import { useEffect, useState } from 'react';

/** Runs an async function and tracks {data, error, loading}. Call reload() to run it again. */
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const [n, setN] = useState(0);
  useEffect(() => {
    let off = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    Promise.resolve()
      .then(fn)
      .then((data) => !off && setState({ data, error: null, loading: false }))
      .catch((error) => !off && setState({ data: null, error, loading: false }));
    return () => { off = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, n]);
  return { ...state, reload: () => setN((x) => x + 1) };
}
