export function debounce<TArgs extends unknown[]>(fn: (...args: TArgs) => void, waitMs: number) {
  let timer: number | null = null;
  return (...args: TArgs) => {
    if (timer !== null) {
      window.clearTimeout(timer);
    }
    timer = window.setTimeout(() => {
      fn(...args);
    }, waitMs);
  };
}

export function throttle<TArgs extends unknown[]>(fn: (...args: TArgs) => void, waitMs: number) {
  let waiting = false;
  let pendingArgs: TArgs | null = null;

  const run = (args: TArgs) => {
    fn(...args);
    waiting = true;
    window.setTimeout(() => {
      waiting = false;
      if (pendingArgs) {
        const next = pendingArgs;
        pendingArgs = null;
        run(next);
      }
    }, waitMs);
  };

  return (...args: TArgs) => {
    if (!waiting) {
      run(args);
      return;
    }
    pendingArgs = args;
  };
}

