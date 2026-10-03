// Test-only preload for the application process. Never imported by app code.
// No request-controlled flags, credentials, or production override paths.
import { generateKeyPairSync } from "node:crypto";
import { readFileSync } from "node:fs";
import { kitabDocument } from "./maktabah-fixture.mjs";
if (
  new URL(process.env.DATABASE_URL || "postgres://invalid/").pathname !==
  "/mahida_ci"
)
  throw Error("Mock Drive requires disposable mahida_ci");
const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
process.env.GOOGLE_DOCS_CLIENT_EMAIL = "maktabah-fixture@example.invalid";
process.env.GOOGLE_DOCS_PRIVATE_KEY = privateKey
  .export({ type: "pkcs8", format: "pem" })
  .toString();
process.env.MAKTABAH_SYNC_ENABLED = "false";
process.env.MAKTABAH_SYNC_SECRET = "maktabah-fixture-only";
const original = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = new URL(
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url,
  );
  if (url.hostname === "oauth2.googleapis.com")
    return Response.json({
      access_token: "fixture-only-token",
      expires_in: 3600,
    });
  if (url.hostname === "docs.googleapis.com") {
    const id = url.pathname.split("/").at(-1);
    let state = {};
    try {
      state = JSON.parse(
        readFileSync("/tmp/mahida-maktabah-fixture.json", "utf8"),
      );
    } catch {}
    const current = state[id] ?? {};
    if (id.startsWith("denied") || current.denied)
      return Response.json({ error: "fixture denied" }, { status: 403 });
    if (id.startsWith("empty"))
      return Response.json({ title: "Kosong", body: { content: [] } });
    if (!id.startsWith("maktabah"))
      return Response.json({ error: "Unknown test document" }, { status: 404 });
    return Response.json(kitabDocument(current.version ?? "awal"));
  }
  if (
    url.hostname === "www.googleapis.com" &&
    url.pathname.startsWith("/drive/v3/files/")
  ) {
    const id = url.pathname.split("/").at(-1);
    return id.startsWith("denied")
      ? Response.json({ error: "test denied" }, { status: 404 })
      : Response.json({
          id,
          mimeType: id.startsWith("notimage")
            ? "application/pdf"
            : "image/jpeg",
          trashed: id.startsWith("trashed"),
          size: "512000",
          parents: id.startsWith("removed") ? [] : ["folder12345678"],
        });
  }
  return original(input, init);
};
