import slugify from "slugify";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";

export function generateSlug(text: string): string {
  return slugify(text, {
    lower: true,
    strict: true,
    locale: "id",
  });
}

export function generateUUID(): string {
  return uuidv4();
}

export function hashOTP(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function getReadingTime(content: string): number {
  // Approximate reading time based on 200 words per minute
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / 200) * 60; // return in seconds
}

export function truncateText(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.substring(0, length) + "...";
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export async function sanitizeHTML(html: string): Promise<string> {
  // Basic HTML sanitization - in production use DOMPurify or similar
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/on\w+\s*=\s*[^\s>]*/gi, "");
}

export function extractText(html: string): string {
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

export function hashIP(ip: string): string {
  return crypto.createHash("sha256").update(ip).digest("hex");
}
