export function notFound(req, res) {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found.' });
  }
  return res.status(404).json({ error: 'Route not found.' });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  const status = error.status || (error.type === 'entity.too.large' ? 413 : 500);
  const message = status === 413
    ? 'Request body is too large.'
    : status === 400
      ? 'Request body must be valid JSON.'
      : error.message || 'Unexpected server error.';
  if (status >= 500) console.error('[api-error]', error?.message || error);
  return res.status(status).json({ error: message });
}
