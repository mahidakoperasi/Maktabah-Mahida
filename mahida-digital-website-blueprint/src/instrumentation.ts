export async function register() {
  if (
    process.env.NEXT_RUNTIME !== "nodejs" ||
    process.env.MAKTABAH_SYNC_ENABLED === "false"
  )
    return;
  const { docsConfigured } = await import("./lib/google-docs");
  if (!docsConfigured()) return;
  const { syncLibrary } = await import("./lib/maktabah-store");
  const timer = setInterval(() => {
    void syncLibrary().catch(() =>
      console.error("Pemeriksaan sinkronisasi Maktabah gagal."),
    );
  }, 120000);
  timer.unref();
}
