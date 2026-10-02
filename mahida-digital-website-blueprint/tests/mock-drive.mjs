// Test-only preload for the application process. Never imported by app code.
// No request-controlled flags, credentials, or production override paths.
if (new URL(process.env.DATABASE_URL || 'postgres://invalid/').pathname !== '/mahida_ci')
  throw Error('Mock Drive requires disposable mahida_ci');
const original = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = new URL(
    typeof input === 'string' ? input : input instanceof URL ? input.href : input.url,
  );
  if (
    url.hostname === 'www.googleapis.com' &&
    url.pathname.startsWith('/drive/v3/files/')
  ) {
    const id = url.pathname.split('/').at(-1);
    return id.startsWith('denied')
      ? Response.json({ error: 'test denied' }, { status: 404 })
      : Response.json({
          id,
          mimeType: id.startsWith('notimage') ? 'application/pdf' : 'image/jpeg',
          trashed: id.startsWith('trashed'),
        });
  }
  return original(input, init);
};
