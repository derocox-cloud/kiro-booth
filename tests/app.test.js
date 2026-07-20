// Feature: kiro-booth-landing, Property 6
//
// Propiedad 6: Contenido por defecto cuando el config no puede cargarse
//
// Para cualquier escenario en que fetch('event-config.json') rechaza o devuelve
// un error HTTP, la página debe renderizar contenido por defecto no vacío en las
// secciones dinámicas (#hero, #challenge, #community).
//
// Valida: Requisitos 5.5 (parcial), 6.5

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { JSDOM } from 'jsdom';
import {
  loadConfig,
  DEFAULT_CONFIG,
  renderEventName,
  renderChallenge,
  renderResources,
} from '../app.js';

// ─── helpers ──────────────────────────────────────────────────────────────────

/**
 * Monta un DOM mínimo con los elementos dinámicos que usa app.js.
 * Devuelve el JSDOM para que el test pueda inspeccionar el documento.
 */
function mountDOM() {
  const dom = new JSDOM(`
    <!DOCTYPE html>
    <html>
      <body>
        <!-- #hero -->
        <section id="hero">
          <h1><span data-dynamic="eventName">…</span></h1>
        </section>

        <!-- #challenge -->
        <section id="challenge">
          <h2 id="challenge-title">…</h2>
          <p  id="challenge-description">…</p>
          <ol id="challenge-steps"></ol>
          <ul id="challenge-criteria"></ul>
        </section>

        <!-- #community -->
        <section id="community">
          <ul id="community-resources"></ul>
        </section>
      </body>
    </html>
  `);

  // Exponer los globales DOM que usa app.js (document, window)
  global.document = dom.window.document;
  global.window   = dom.window;

  return dom;
}

// ─── arbitrarios fast-check ────────────────────────────────────────────────

/**
 * Genera diferentes escenarios de error para fetch:
 *   - 'reject':  fetch rechaza (error de red)
 *   - 404, 403, 500, 503: respuestas HTTP de error
 */
const errorScenarioArb = fc.oneof(
  fc.constant('reject'),
  fc.constantFrom(404, 403, 500, 503, 400, 401, 429),
);

// ─── Property 6 ───────────────────────────────────────────────────────────────

describe('Property 6 — fallback cuando config falla', () => {
  beforeEach(() => {
    // Guardar la implementación real de fetch antes de mockearla
    vi.stubGlobal('fetch', undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Limpiar globals del DOM
    delete global.document;
    delete global.window;
  });

  it(
    'Valida: Requirements 5.5 (parcial), 6.5 — para cualquier error de fetch, loadConfig() devuelve DEFAULT_CONFIG',
    async () => {
      await fc.assert(
        fc.asyncProperty(errorScenarioArb, async (scenario) => {
          // Mockear fetch según el escenario generado
          if (scenario === 'reject') {
            vi.stubGlobal(
              'fetch',
              vi.fn().mockRejectedValue(new TypeError('Network error')),
            );
          } else {
            vi.stubGlobal(
              'fetch',
              vi.fn().mockResolvedValue({
                ok: false,
                status: scenario,
                json: () => Promise.reject(new Error('not ok')),
              }),
            );
          }

          const config = await loadConfig();

          // El resultado debe ser exactamente DEFAULT_CONFIG
          expect(config).toEqual(DEFAULT_CONFIG);
          expect(config.eventName).toBeTruthy();
          expect(config.challenge).toBeTruthy();
          expect(config.communityResources).toBeInstanceOf(Array);
        }),
        { numRuns: 100 },
      );
    },
  );

  it(
    'Valida: Requirements 5.5 (parcial), 6.5 — tras error de fetch, las secciones dinámicas tienen contenido no vacío',
    async () => {
      await fc.assert(
        fc.asyncProperty(errorScenarioArb, async (scenario) => {
          // Preparar DOM fresco en cada iteración
          mountDOM();

          // Mockear fetch según el escenario generado
          if (scenario === 'reject') {
            vi.stubGlobal(
              'fetch',
              vi.fn().mockRejectedValue(new TypeError('Network error')),
            );
          } else {
            vi.stubGlobal(
              'fetch',
              vi.fn().mockResolvedValue({
                ok: false,
                status: scenario,
                json: () => Promise.reject(new Error('not ok')),
              }),
            );
          }

          // Obtener config con fallback y renderizar
          const config = await loadConfig();
          renderEventName(config.eventName);
          renderChallenge(config.challenge);
          renderResources(config.communityResources);

          const doc = global.document;

          // #hero — el span data-dynamic="eventName" debe tener contenido no vacío
          const heroEl = doc.querySelector('[data-dynamic="eventName"]');
          expect(heroEl).not.toBeNull();
          expect(heroEl.textContent.trim().length).toBeGreaterThan(0);

          // #challenge — título, descripción, pasos y criterios no vacíos
          const challengeTitle = doc.getElementById('challenge-title');
          const challengeDesc  = doc.getElementById('challenge-description');
          const challengeSteps = doc.getElementById('challenge-steps');
          const challengeCrit  = doc.getElementById('challenge-criteria');

          expect(challengeTitle.textContent.trim().length).toBeGreaterThan(0);
          expect(challengeDesc.textContent.trim().length).toBeGreaterThan(0);
          expect(challengeSteps.innerHTML.trim().length).toBeGreaterThan(0);
          expect(challengeCrit.innerHTML.trim().length).toBeGreaterThan(0);

          // #community — la lista de recursos debe tener al menos un elemento
          const communityList = doc.getElementById('community-resources');
          expect(communityList.innerHTML.trim().length).toBeGreaterThan(0);
          expect(communityList.querySelectorAll('li').length).toBeGreaterThan(0);
        }),
        { numRuns: 100 },
      );
    },
  );
});
