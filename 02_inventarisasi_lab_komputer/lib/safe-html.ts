// lib/safe-html.ts
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Initialize JSDOM globally once for DOMPurify
const { window } = new JSDOM('');
const purify = DOMPurify(window as any);

export function sanitizeHtml(dirtyHtml: string): string {
  // Configure DOMPurify to allow certain tags if needed.
  // For now, we'll use default safe settings.
  return purify.sanitize(dirtyHtml);
}
