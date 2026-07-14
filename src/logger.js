export function log(message, data) {
  const payload = data ? ` ${JSON.stringify(data)}` : "";
  console.log(`[${new Date().toISOString()}] ${message}${payload}`);
}

export function error(message, err) {
  const payload =
    err instanceof Error
      ? { message: err.message, stack: err.stack }
      : err?.err instanceof Error
        ? {
            ...err,
            err: {
              message: err.err.message,
              stack: err.err.stack
            }
          }
        : err;

  console.error(
    `[${new Date().toISOString()}] ${message}`,
    payload
  );
}
