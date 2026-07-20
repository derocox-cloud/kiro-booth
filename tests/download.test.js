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
// Property 8: Cada SO soportado tiene un enlace de descarga
//   Para cada sistema operativo listado en la sección `#download`
//   (macOS, Windows, Linux), debe existir al menos un elemento `<a>`
//   visible con un `href` no vacío.
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

// ─── Property 8: Cada SO tiene al menos un enlace de descarga ────────────────

describe('Property 8 — Cada sistema operativo tiene un enlace de descarga', () => {
  /**
   * Validates: Requirement 2.3
   *
   * Para cada uno de los tres SO soportados (macOS, Windows, Linux),
   * debe existir al menos un <a> con un href no vacío dentro de su contenedor.
   */

  it(
    'Valida: Requirement 2.3 — macOS tiene al menos un enlace de descarga con href no vacío',
    () => {
      const section = document.querySelector('#download');
      expect(section, 'La sección #download debe existir').toBeTruthy();

      // Buscar por data-os="macos" o por href que contenga "darwin"
      let link = section.querySelector('[data-os="macos"] a[href]');
      if (!link) {
        link = section.querySelector('a[href*="darwin"]');
      }

      expect(link, 'macOS debe tener al menos un <a href> dentro de #download').toBeTruthy();
      expect(
        link.getAttribute('href').trim().length,
        'El href de macOS no debe estar vacío',
      ).toBeGreaterThan(0);
    },
  );

  it(
    'Valida: Requirement 2.3 — Windows tiene al menos un enlace de descarga con href no vacío',
    () => {
      const section = document.querySelector('#download');
      expect(section, 'La sección #download debe existir').toBeTruthy();

      // Buscar por data-os="windows" o por href que contenga "win32"
      let link = section.querySelector('[data-os="windows"] a[href]');
      if (!link) {
        link = section.querySelector('a[href*="win32"]');
      }

      expect(link, 'Windows debe tener al menos un <a href> dentro de #download').toBeTruthy();
      expect(
        link.getAttribute('href').trim().length,
        'El href de Windows no debe estar vacío',
      ).toBeGreaterThan(0);
    },
  );

  it(
    'Valida: Requirement 2.3 — Linux tiene al menos un enlace de descarga con href no vacío',
    () => {
      const section = document.querySelector('#download');
      expect(section, 'La sección #download debe existir').toBeTruthy();

      // Buscar por data-os="linux" o por href que contenga "linux"
      let link = section.querySelector('[data-os="linux"] a[href]');
      if (!link) {
        link = section.querySelector('a[href*="linux"]');
      }

      expect(link, 'Linux debe tener al menos un <a href> dentro de #download').toBeTruthy();
      expect(
        link.getAttribute('href').trim().length,
        'El href de Linux no debe estar vacío',
      ).toBeGreaterThan(0);
    },
  );
});
