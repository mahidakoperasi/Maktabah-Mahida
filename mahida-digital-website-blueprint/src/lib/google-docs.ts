import "server-only";
import jwt from "jsonwebtoken";
import { readFile } from "node:fs/promises";
import { parseDocs, type DocsDocument } from "./kitab-content";
let token: { value: string; expires: number } | undefined;
export class DocsError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function docsConfigured() {
  return Boolean(
    process.env.GOOGLE_DOCS_CREDENTIALS_FILE ||
    process.env.GOOGLE_DOCS_SERVICE_ACCOUNT_JSON ||
    (process.env.GOOGLE_DOCS_CLIENT_EMAIL &&
      process.env.GOOGLE_DOCS_PRIVATE_KEY),
  );
}
async function accessToken() {
  if (token && token.expires > Date.now() + 60000) return token.value;
  let credentials: { client_email?: string; private_key?: string };
  try {
    credentials = process.env.GOOGLE_DOCS_CREDENTIALS_FILE
      ? JSON.parse(
          await readFile(process.env.GOOGLE_DOCS_CREDENTIALS_FILE, "utf8"),
        )
      : process.env.GOOGLE_DOCS_SERVICE_ACCOUNT_JSON
        ? JSON.parse(process.env.GOOGLE_DOCS_SERVICE_ACCOUNT_JSON)
        : {
            client_email: process.env.GOOGLE_DOCS_CLIENT_EMAIL,
            private_key: process.env.GOOGLE_DOCS_PRIVATE_KEY?.replace(
              /\\n/g,
              "\n",
            ),
          };
  } catch {
    throw new DocsError(
      503,
      "Konfigurasi identitas server Google Docs tidak dapat dibaca.",
    );
  }
  if (!credentials.client_email || !credentials.private_key)
    throw new DocsError(
      503,
      "Identitas server Google Docs belum dikonfigurasi.",
    );
  let assertion: string;
  try {
    assertion = jwt.sign(
      { scope: "https://www.googleapis.com/auth/documents.readonly" },
      credentials.private_key,
      {
        algorithm: "RS256",
        issuer: credentials.client_email,
        audience: "https://oauth2.googleapis.com/token",
        expiresIn: 3600,
      },
    );
  } catch {
    throw new DocsError(503, "Kunci identitas server Google Docs tidak valid.");
  }
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    signal: AbortSignal.timeout(15000),
    cache: "no-store",
  });
  if (!response.ok)
    throw new DocsError(
      503,
      "Otorisasi Google Docs gagal. Periksa identitas server dan pengaktifan API.",
    );
  const data = await response.json();
  if (typeof data.access_token !== "string")
    throw new DocsError(503, "Google tidak mengembalikan token akses.");
  token = {
    value: data.access_token,
    expires: Date.now() + Number(data.expires_in ?? 3600) * 1000,
  };
  return token.value;
}
export async function fetchDocs(id: string) {
  if (!/^[\w-]{10,}$/.test(id))
    throw new DocsError(400, "ID Google Docs tidak valid.");
  const response = await fetch(
    `https://docs.googleapis.com/v1/documents/${id}?includeTabsContent=true`,
    {
      headers: { Authorization: `Bearer ${await accessToken()}` },
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    },
  );
  if (!response.ok) {
    if (response.status === 401) token = undefined;
    throw new DocsError(
      response.status,
      [403, 404].includes(response.status)
        ? "Dokumen tidak dapat diakses atau telah dihapus. Periksa pembagian akses kepada identitas server."
        : "Google Docs sedang gagal diakses. Coba sinkronkan kembali.",
    );
  }
  const raw = await response.text();
  if (raw.length > 20_000_000)
    throw new DocsError(
      413,
      "Dokumen terlalu besar. Pisahkan menjadi dokumen siap tayang yang lebih kecil.",
    );
  const doc = JSON.parse(raw) as DocsDocument;
  return { ...parseDocs(doc), title: doc.title ?? "" };
}
