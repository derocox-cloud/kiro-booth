// Feature: kiro-booth-landing, Property 7
//
// Property 7: Lista de pasos de descarga es una lista ordenada
//   Para cualquier renderizado de la sección `#download`, los pasos de
//   instalación deben estar contenidos en un elemento `<ol>` con al menos
//   un elemento `<li>`.
//   Valida: Requisito 2.1
//
// Feature: kiro-booth-landing, Property 8
//
// Property 8: Cada versión de Kiro tiene un enlace al sitio oficial
//   Para cada versión de Kiro listada en la sección `#download`
//   (IDE, CLI, Mobile, Web, Crew), debe existir al menos un elemento
//   `<a>` visible con un `href` no vacío que apunte a kiro.dev.
//   Valida: Requisito 2.3

import { describe, it, beforeAll } from 'vitest';
import { expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { JSDOM } from 'jsdom';

// ─── Setup: parse index.html once ────────────────────────────────────────────

let document;

beforeAll(() => {
  const html = readFileSync(
    resolve(process.cwd(), 'index.html'),
    'utf-8',
  );
  const dom = new JSDOM(html);
  document = dom.window.document;
});

// ─── Property 7: Lista de pasos es un <ol> con al menos un <li> ──────────────

describe('Property 7 — Lista de pasos de instalación es una lista ordenada', () => {
  /**
   * Validates: Requirement 2.1
   *
   * La sección #download debe contener un elemento <ol> con al menos un <li>
   * que describa los pasos de instalación de Kiro.
   */
  it(
    'Valida: Requirement 2.1 — la sección #download contiene un <ol> con al menos un <li>',
    () => {
      const section = document.querySelector('#download');
      expect(section, 'La sección #download debe existir en el HTML').toBeTruthy();

      const ol = section.querySelector('ol');
      expect(ol, 'Debe existir un elemento <ol> dentro de #download').toBeTruthy();

      const items = ol.querySelectorAll('li');
      expect(items.length, 'El <ol> debe tener al menos un elemento <li>').toBeGreaterThanOrEqual(1);
    },
  );
});

// ─── Property 8: Cada versión de Kiro tiene al menos un enlace oficial ───────

describe('Property 8 — Cada versión de Kiro tiene un enlace al sitio oficial', () => {
  /**
   * Validates: Requirement 2.3
   *
   * Para cada versión de Kiro listada en la sección #download
   * (IDE, CLI, Mobile, Web, Crew), debe existir al menos un <a> con un
   * href no vacío que apunte a su página en kiro.dev.
   */

  const versions = [
    { key: 'ide', label: 'Kiro IDE' },
    { key: 'cli', label: 'Kiro CLI' },
    { key: 'mobile', label: 'Kiro Mobile' },
    { key: 'web', label: 'Kiro Web' },
    { key: 'crew', label: 'Kiro Crew' },
  ];

  for (const { key, label } of versions) {
    it(
      `Valida: Requirement 2.3 — ${label} tiene al menos un enlace a kiro.dev con href no vacío`,
      () => {
        const section = document.querySelector('#download');
        expect(section, 'La sección #download debe existir').toBeTruthy();

        // Buscar por data-kiro="<key>" o por href que apunte a kiro.dev/<key>/
        let link = section.querySelector(`[data-kiro="${key}"] a[href]`);
        if (!link) {
          link = section.querySelector(`a[href*="kiro.dev/${key}"]`);
        }

        expect(
          link,
          `${label} debe tener al menos un <a href> dentro de #download`,
        ).toBeTruthy();

        const href = link.getAttribute('href').trim();
        expect(href.length, `El href de ${label} no debe estar vacío`).toBeGreaterThan(0);
        expect(
          href.includes('kiro.dev'),
          `El href de ${label} debe apuntar al sitio oficial kiro.dev`,
        ).toBe(true);
      },
    );
  }
});
