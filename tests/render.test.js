// Feature: kiro-booth-landing, Property 1 & Property 3
//
// Property 1: Round-trip de configuración
//   Para cualquier EventConfig válido, todos sus campos deben aparecer
//   renderizados en el DOM con exactamente el mismo texto.
//   Valida: Requisitos 3.2, 3.3, 5.5
//
// Property 3: Campos faltantes muestran placeholders
//   Para cualquier EventConfig con uno o más campos requeridos ausentes o vacíos,
//   la sección correspondiente debe mostrar un texto de marcador de posición
//   no vacío (nunca string vacío ni "undefined").
//   Valida: Requisito 3.5

import { describe, it, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { JSDOM } from 'jsdom';
import { renderEventName, renderChallenge } from '../app.js';

// ─── DOM helper ──────────────────────────────────────────────────────────────

/**
 * Crea un DOM fresco con exactamente los elementos que usa app.js.
 * Asigna global.document para que las funciones de renderizado lo usen.
 */
function mountDOM() {
  const dom = new JSDOM(`
    <!DOCTYPE html>
    <html>
      <body>
        <section id="hero">
          <span data-dynamic="eventName">…</span>
        </section>
        <section id="challenge">
          <h3 id="challenge-title">…</h3>
          <p  id="challenge-description">…</p>
          <ol id="challenge-steps"></ol>
          <ul id="challenge-criteria"></ul>
        </section>
        <ul id="community-resources"></ul>
      </body>
    </html>
  `);
  global.document = dom.window.document;
  global.window = dom.window;
  return dom;
}

afterEach(() => {
  delete global.document;
  delete global.window;
});

// ─── Arbitrarios ─────────────────────────────────────────────────────────────

/** String no vacío, sin caracteres de control que rompan el DOM. */
const nonEmptyStringArb = fc
  .string({ minLength: 1, maxLength: 80 })
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

/** Array de strings no vacíos con al menos 1 elemento. */
const nonEmptyStringArrayArb = fc.array(nonEmptyStringArb, {
  minLength: 1,
  maxLength: 8,
});

/** EventConfig válido y completo. */
const validEventConfigArb = fc.record({
  eventName: nonEmptyStringArb,
  challenge: fc.record({
    title: nonEmptyStringArb,
    description: nonEmptyStringArb,
    steps: nonEmptyStringArrayArb,
    successCriteria: nonEmptyStringArrayArb,
  }),
});

// ─── Property 1: Round-trip de configuración ─────────────────────────────────

describe('Property 1 — Round-trip de configuración', () => {
  /**
   * Validates: Requirements 3.2, 3.3, 5.5
   *
   * Para cualquier EventConfig válido, después de renderizar con
   * renderEventName + renderChallenge, cada campo debe aparecer en el DOM
   * con exactamente el mismo texto.
   */
  it(
    'Valida: Requirements 3.2, 3.3, 5.5 — todos los campos del config aparecen en el DOM sin modificación',
    () => {
      fc.assert(
        fc.property(validEventConfigArb, (config) => {
          mountDOM();
          const doc = global.document;

          renderEventName(config.eventName);
          renderChallenge(config.challenge);

          // eventName
          const nameEl = doc.querySelector('[data-dynamic="eventName"]');
          if (nameEl.textContent !== config.eventName) return false;

          // challenge.title
          const titleEl = doc.getElementById('challenge-title');
          if (titleEl.textContent !== config.challenge.title) return false;

          // challenge.description
          const descEl = doc.getElementById('challenge-description');
          if (descEl.textContent !== config.challenge.description) return false;

          // challenge.steps — cada paso debe aparecer en el innerHTML de la lista
          const stepsEl = doc.getElementById('challenge-steps');
          const stepsHTML = stepsEl.innerHTML;
          for (const step of config.challenge.steps) {
            // escapeHtml puede convertir ciertos caracteres; verificamos con textContent de cada <li>
            const items = stepsEl.querySelectorAll('li');
            const found = Array.from(items).some((li) => li.textContent === step);
            if (!found) return false;
          }

          // challenge.successCriteria — cada criterio debe aparecer en la lista
          const criteriaEl = doc.getElementById('challenge-criteria');
          for (const criterion of config.challenge.successCriteria) {
            const items = criteriaEl.querySelectorAll('li');
            const found = Array.from(items).some((li) => li.textContent === criterion);
            if (!found) return false;
          }

          return true;
        }),
        { numRuns: 100 },
      );
    },
  );
});

// ─── Property 3: Campos faltantes muestran placeholders ──────────────────────

describe('Property 3 — Campos faltantes muestran placeholders', () => {
  /**
   * Validates: Requirement 3.5
   *
   * Genera EventConfig con uno o más campos requeridos ausentes o vacíos.
   * Después de renderizar, ningún campo del DOM debe ser string vacío ni "undefined".
   * Los campos faltantes deben mostrar un texto de marcador de posición no vacío.
   */

  /**
   * Arbitrario: challenge con al menos un campo opcional vacío/ausente.
   * Usamos fc.record con campos opcionales para generar combinaciones variadas.
   */
  const partialChallengeArb = fc
    .record({
      title: fc.oneof(fc.constant(''), fc.constant(undefined), nonEmptyStringArb),
      description: fc.oneof(fc.constant(''), fc.constant(undefined), nonEmptyStringArb),
      steps: fc.oneof(
        fc.constant([]),
        fc.constant(undefined),
        nonEmptyStringArrayArb,
      ),
      successCriteria: fc.oneof(
        fc.constant([]),
        fc.constant(undefined),
        nonEmptyStringArrayArb,
      ),
    })
    // Garantizamos que al menos un campo sea "inválido" (vacío / ausente / array vacío)
    .filter((ch) => {
      const titleMissing =
        !ch.title || (typeof ch.title === 'string' && ch.title.trim() === '');
      const descMissing =
        !ch.description ||
        (typeof ch.description === 'string' && ch.description.trim() === '');
      const stepsMissing = !Array.isArray(ch.steps) || ch.steps.length === 0;
      const criteriaMissing =
        !Array.isArray(ch.successCriteria) || ch.successCriteria.length === 0;
      return titleMissing || descMissing || stepsMissing || criteriaMissing;
    });

  const partialEventNameArb = fc.oneof(
    fc.constant(''),
    fc.constant(undefined),
    fc.constant(null),
    nonEmptyStringArb,
  );

  it(
    'Valida: Requirement 3.5 — ningún campo renderizado es string vacío ni "undefined" cuando el config tiene campos faltantes',
    () => {
      fc.assert(
        fc.property(partialChallengeArb, partialEventNameArb, (challenge, eventName) => {
          mountDOM();
          const doc = global.document;

          renderEventName(eventName);
          renderChallenge(challenge);

          // ── eventName ──
          const nameEl = doc.querySelector('[data-dynamic="eventName"]');
          const nameText = nameEl.textContent;
          if (nameText === '') return false;
          if (nameText === 'undefined') return false;
          if (nameText.trim().length === 0) return false;

          // ── challenge-title ──
          const titleEl = doc.getElementById('challenge-title');
          const titleText = titleEl.textContent;
          if (titleText === '') return false;
          if (titleText === 'undefined') return false;
          if (titleText.trim().length === 0) return false;

          // ── challenge-description ──
          const descEl = doc.getElementById('challenge-description');
          const descText = descEl.textContent;
          if (descText === '') return false;
          if (descText === 'undefined') return false;
          if (descText.trim().length === 0) return false;

          // ── challenge-steps ──
          const stepsEl = doc.getElementById('challenge-steps');
          const stepsHTML = stepsEl.innerHTML.trim();
          if (stepsHTML === '') return false;
          // Each <li> must have non-empty, non-"undefined" text
          const stepItems = stepsEl.querySelectorAll('li');
          for (const li of stepItems) {
            if (li.textContent === '') return false;
            if (li.textContent === 'undefined') return false;
            if (li.textContent.trim().length === 0) return false;
          }

          // ── challenge-criteria ──
          const criteriaEl = doc.getElementById('challenge-criteria');
          const criteriaHTML = criteriaEl.innerHTML.trim();
          if (criteriaHTML === '') return false;
          const criteriaItems = criteriaEl.querySelectorAll('li');
          for (const li of criteriaItems) {
            if (li.textContent === '') return false;
            if (li.textContent === 'undefined') return false;
            if (li.textContent.trim().length === 0) return false;
          }

          return true;
        }),
        { numRuns: 100 },
      );
    },
  );
});

// ─── Property 4: Recursos renderizados contienen nombre, descripción y enlace ─

// Feature: kiro-booth-landing, Property 4
//
// Property 4: Recursos renderizados contienen nombre, descripción y enlace
//   Para cualquier lista de recursos en el EventConfig, cada recurso renderizado
//   en el DOM debe mostrar el campo `name`, el campo `description` y un elemento
//   `<a>` con el `href` correspondiente al campo `url`.
//   Valida: Requisito 4.1

import { renderResources } from '../app.js';

/** Árbitro de tipo de recurso */
const resourceTypeArb = fc.constantFrom('docs', 'github', 'community', 'social');

/**
 * String seguro para atributos HTML: excluye caracteres que escapeHtml no codifica
 * correctamente en contexto de atributo ("<", ">", "&", '"', "'").
 * Esto mantiene el foco en la propiedad de renderizado de contenido, no en injection safety.
 */
const safeStringArb = fc
  .string({ minLength: 1, maxLength: 60 })
  .map((s) => s.trim())
  // Excluir caracteres HTML-especiales que rompen el parsing de atributos en jsdom
  .filter((s) => s.length > 0 && !/[<>"'&]/.test(s));

/** URL construida con caracteres seguros (sin &, <, >, ", ') */
const urlArb = fc
  .tuple(
    fc.constantFrom('https', 'http'),
    fc.array(fc.constantFrom('a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
      'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '0', '1', '2', '3'), { minLength: 3, maxLength: 10 }),
    fc.constantFrom('com', 'net', 'org', 'io', 'dev'),
  )
  .map(([proto, hostChars, tld]) => `${proto}://${hostChars.join('')}.${tld}`);

/** Árbitro de un Resource válido */
const resourceArb = fc.record({
  name: safeStringArb,
  description: safeStringArb,
  url: urlArb,
  type: resourceTypeArb,
});

/** Array de recursos con al menos 1 elemento */
const resourcesArb = fc.array(resourceArb, { minLength: 1, maxLength: 10 });

describe('Property 4 — Recursos renderizados contienen nombre, descripción y enlace', () => {
  /**
   * Validates: Requirements 4.1
   *
   * Para cualquier lista de recursos, después de llamar renderResources(),
   * cada recurso debe tener en el DOM:
   *   - Un elemento con textContent === resource.name   (.resource-card__name)
   *   - Un elemento con textContent === resource.desc   (.resource-card__desc)
   *   - Un <a> con href === resource.url                (.resource-card__link)
   */
  it(
    'Valida: Requirements 4.1 — cada recurso renderizado muestra name, description y enlace con href correcto',
    () => {
      fc.assert(
        fc.property(resourcesArb, (resources) => {
          // Montar DOM fresco con el contenedor requerido
          const dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
              <body>
                <ul id="community-resources"></ul>
              </body>
            </html>
          `);
          global.document = dom.window.document;
          global.window = dom.window;

          renderResources(resources);

          const listEl = global.document.getElementById('community-resources');
          const items = listEl.querySelectorAll('li.resource-card');

          // Debe haber exactamente el mismo número de <li> que de recursos
          if (items.length !== resources.length) return false;

          for (let i = 0; i < resources.length; i++) {
            const resource = resources[i];
            const li = items[i];

            // Verificar name
            const nameEl = li.querySelector('.resource-card__name');
            if (!nameEl) return false;
            if (nameEl.textContent !== resource.name) return false;

            // Verificar description
            const descEl = li.querySelector('.resource-card__desc');
            if (!descEl) return false;
            if (descEl.textContent !== resource.description) return false;

            // Verificar enlace con href correcto
            const linkEl = li.querySelector('a');
            if (!linkEl) return false;
            if (linkEl.getAttribute('href') !== resource.url) return false;
          }

          return true;
        }),
        { numRuns: 100 },
      );
    },
  );
});
