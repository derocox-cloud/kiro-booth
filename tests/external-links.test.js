// Feature: kiro-booth-landing, Property 2
//
// Property 2: Todos los enlaces externos abren en nueva pestaña
//   Para cualquier enlace (<a>) en la página cuya URL comience con
//   http:// o https://, el atributo target debe ser _blank y el atributo
//   rel debe contener noopener.
//   Valida: Requisitos 2.4, 4.3

import { describe, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';

const __dirname = dirname(fileURLToPath(import.meta.url));
const htmlPath = resolve(__dirname, '../index.html');
const html = readFileSync(htmlPath, 'utf-8');

describe('Property 2 — Todos los enlaces externos abren en nueva pestaña', () => {
  /**
   * Validates: Requirements 2.4, 4.3
   *
   * Todo <a href="http://..."> o <a href="https://..."> en index.html debe tener:
   *   - target="_blank"
   *   - rel que contenga "noopener"
   */
  it('Valida: Requirements 2.4, 4.3 — cada enlace externo tiene target="_blank" y rel con "noopener"', () => {
    const dom = new JSDOM(html);
    const document = dom.window.document;

    const allLinks = Array.from(document.querySelectorAll('a'));
    const externalLinks = allLinks.filter((a) => {
      const href = a.getAttribute('href') || '';
      return href.startsWith('http://') || href.startsWith('https://');
    });

    const nonCompliant = externalLinks.filter((a) => {
      const target = a.getAttribute('target');
      const rel = a.getAttribute('rel') || '';
      return target !== '_blank' || !rel.split(/\s+/).includes('noopener');
    });

    if (nonCompliant.length > 0) {
      const details = nonCompliant
        .map((a) => {
          const href = a.getAttribute('href');
          const target = a.getAttribute('target');
          const rel = a.getAttribute('rel');
          return `  href="${href}" — target="${target}" rel="${rel}"`;
        })
        .join('\n');
      throw new Error(
        `${nonCompliant.length} enlace(s) externo(s) no cumplen con target="_blank" y rel con "noopener":\n${details}`,
      );
    }
  });
});
