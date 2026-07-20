// Feature: kiro-booth-landing, Property 5
// Validates: Requirements 3.1, 6.1, 6.4
//
// Property 5: El Config_File por defecto tiene estructura JSON válida con todos los campos requeridos.
// Para cualquier versión del DEFAULT_CONFIG en app.js y del event-config.json de ejemplo,
// JSON.parse no debe lanzar error y el objeto resultante debe contener los campos
// eventName, challenge (con title, description, steps, successCriteria) y communityResources.

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { DEFAULT_CONFIG } from '../app.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/* ============================================================
   Helper: valida la estructura requerida de un EventConfig
   ============================================================ */

/**
 * Verifica que un objeto cumple con la estructura completa requerida de EventConfig.
 * @param {unknown} config
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateEventConfig(config) {
  const errors = [];

  if (typeof config !== 'object' || config === null) {
    errors.push('config debe ser un objeto no nulo');
    return { valid: false, errors };
  }

  // eventName
  if (typeof config.eventName !== 'string' || config.eventName.trim().length === 0) {
    errors.push('eventName debe ser un string no vacío');
  }

  // challenge
  if (typeof config.challenge !== 'object' || config.challenge === null) {
    errors.push('challenge debe ser un objeto no nulo');
  } else {
    if (typeof config.challenge.title !== 'string' || config.challenge.title.trim().length === 0) {
      errors.push('challenge.title debe ser un string no vacío');
    }
    if (typeof config.challenge.description !== 'string' || config.challenge.description.trim().length === 0) {
      errors.push('challenge.description debe ser un string no vacío');
    }
    if (
      !Array.isArray(config.challenge.steps) ||
      config.challenge.steps.length === 0 ||
      !config.challenge.steps.every((s) => typeof s === 'string')
    ) {
      errors.push('challenge.steps debe ser un array con al menos 1 string');
    }
    if (
      !Array.isArray(config.challenge.successCriteria) ||
      config.challenge.successCriteria.length === 0 ||
      !config.challenge.successCriteria.every((s) => typeof s === 'string')
    ) {
      errors.push('challenge.successCriteria debe ser un array con al menos 1 string');
    }
  }

  // communityResources
  if (!Array.isArray(config.communityResources) || config.communityResources.length === 0) {
    errors.push('communityResources debe ser un array con al menos 1 elemento');
  } else {
    config.communityResources.forEach((resource, i) => {
      if (typeof resource !== 'object' || resource === null) {
        errors.push(`communityResources[${i}] debe ser un objeto`);
      } else {
        if (typeof resource.name !== 'string' || resource.name.trim().length === 0) {
          errors.push(`communityResources[${i}].name debe ser un string no vacío`);
        }
        if (typeof resource.description !== 'string' || resource.description.trim().length === 0) {
          errors.push(`communityResources[${i}].description debe ser un string no vacío`);
        }
        if (typeof resource.url !== 'string' || resource.url.trim().length === 0) {
          errors.push(`communityResources[${i}].url debe ser un string no vacío`);
        }
        if (typeof resource.type !== 'string' || resource.type.trim().length === 0) {
          errors.push(`communityResources[${i}].type debe ser un string no vacío`);
        }
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

/* ============================================================
   Pruebas unitarias concretas
   ============================================================ */

describe('Property 5 — JSON válido con campos requeridos', () => {

  describe('DEFAULT_CONFIG en app.js', () => {
    it('DEFAULT_CONFIG tiene todos los campos requeridos de nivel superior', () => {
      expect(DEFAULT_CONFIG).toBeDefined();
      expect(typeof DEFAULT_CONFIG).toBe('object');
      expect(DEFAULT_CONFIG).not.toBeNull();
      expect('eventName' in DEFAULT_CONFIG).toBe(true);
      expect('challenge' in DEFAULT_CONFIG).toBe(true);
      expect('communityResources' in DEFAULT_CONFIG).toBe(true);
    });

    it('DEFAULT_CONFIG.eventName es un string no vacío', () => {
      expect(typeof DEFAULT_CONFIG.eventName).toBe('string');
      expect(DEFAULT_CONFIG.eventName.trim().length).toBeGreaterThan(0);
    });

    it('DEFAULT_CONFIG.challenge.title es un string no vacío', () => {
      expect(typeof DEFAULT_CONFIG.challenge?.title).toBe('string');
      expect(DEFAULT_CONFIG.challenge.title.trim().length).toBeGreaterThan(0);
    });

    it('DEFAULT_CONFIG.challenge.description es un string no vacío', () => {
      expect(typeof DEFAULT_CONFIG.challenge?.description).toBe('string');
      expect(DEFAULT_CONFIG.challenge.description.trim().length).toBeGreaterThan(0);
    });

    it('DEFAULT_CONFIG.challenge.steps es un array con al menos 1 string', () => {
      expect(Array.isArray(DEFAULT_CONFIG.challenge?.steps)).toBe(true);
      expect(DEFAULT_CONFIG.challenge.steps.length).toBeGreaterThan(0);
      DEFAULT_CONFIG.challenge.steps.forEach((step) => {
        expect(typeof step).toBe('string');
      });
    });

    it('DEFAULT_CONFIG.challenge.successCriteria es un array con al menos 1 string', () => {
      expect(Array.isArray(DEFAULT_CONFIG.challenge?.successCriteria)).toBe(true);
      expect(DEFAULT_CONFIG.challenge.successCriteria.length).toBeGreaterThan(0);
      DEFAULT_CONFIG.challenge.successCriteria.forEach((c) => {
        expect(typeof c).toBe('string');
      });
    });

    it('DEFAULT_CONFIG.communityResources es un array con al menos 1 recurso con name, description, url, type', () => {
      expect(Array.isArray(DEFAULT_CONFIG.communityResources)).toBe(true);
      expect(DEFAULT_CONFIG.communityResources.length).toBeGreaterThan(0);
      DEFAULT_CONFIG.communityResources.forEach((resource) => {
        expect(typeof resource.name).toBe('string');
        expect(resource.name.trim().length).toBeGreaterThan(0);
        expect(typeof resource.description).toBe('string');
        expect(resource.description.trim().length).toBeGreaterThan(0);
        expect(typeof resource.url).toBe('string');
        expect(resource.url.trim().length).toBeGreaterThan(0);
        expect(typeof resource.type).toBe('string');
        expect(resource.type.trim().length).toBeGreaterThan(0);
      });
    });

    it('DEFAULT_CONFIG pasa la validación completa de EventConfig', () => {
      const { valid, errors } = validateEventConfig(DEFAULT_CONFIG);
      expect(errors).toEqual([]);
      expect(valid).toBe(true);
    });
  });

  describe('event-config.json de ejemplo', () => {
    const configPath = resolve(__dirname, '..', 'event-config.json');
    let rawJson;
    let parsed;

    it('event-config.json puede leerse como string sin error', () => {
      expect(() => {
        rawJson = readFileSync(configPath, 'utf-8');
      }).not.toThrow();
      expect(typeof rawJson).toBe('string');
      expect(rawJson.trim().length).toBeGreaterThan(0);
    });

    it('JSON.parse de event-config.json no lanza error', () => {
      rawJson = readFileSync(configPath, 'utf-8');
      expect(() => {
        parsed = JSON.parse(rawJson);
      }).not.toThrow();
    });

    it('event-config.json parseado contiene eventName, challenge y communityResources', () => {
      rawJson = readFileSync(configPath, 'utf-8');
      parsed = JSON.parse(rawJson);
      expect('eventName' in parsed).toBe(true);
      expect('challenge' in parsed).toBe(true);
      expect('communityResources' in parsed).toBe(true);
    });

    it('event-config.json.eventName es un string no vacío', () => {
      rawJson = readFileSync(configPath, 'utf-8');
      parsed = JSON.parse(rawJson);
      expect(typeof parsed.eventName).toBe('string');
      expect(parsed.eventName.trim().length).toBeGreaterThan(0);
    });

    it('event-config.json.challenge.title, description, steps, successCriteria son válidos', () => {
      rawJson = readFileSync(configPath, 'utf-8');
      parsed = JSON.parse(rawJson);
      expect(typeof parsed.challenge?.title).toBe('string');
      expect(parsed.challenge.title.trim().length).toBeGreaterThan(0);
      expect(typeof parsed.challenge?.description).toBe('string');
      expect(parsed.challenge.description.trim().length).toBeGreaterThan(0);
      expect(Array.isArray(parsed.challenge?.steps)).toBe(true);
      expect(parsed.challenge.steps.length).toBeGreaterThan(0);
      expect(Array.isArray(parsed.challenge?.successCriteria)).toBe(true);
      expect(parsed.challenge.successCriteria.length).toBeGreaterThan(0);
    });

    it('event-config.json.communityResources tiene al menos 1 objeto con name, description, url, type', () => {
      rawJson = readFileSync(configPath, 'utf-8');
      parsed = JSON.parse(rawJson);
      expect(Array.isArray(parsed.communityResources)).toBe(true);
      expect(parsed.communityResources.length).toBeGreaterThan(0);
      parsed.communityResources.forEach((resource) => {
        expect(typeof resource.name).toBe('string');
        expect(resource.name.trim().length).toBeGreaterThan(0);
        expect(typeof resource.description).toBe('string');
        expect(resource.description.trim().length).toBeGreaterThan(0);
        expect(typeof resource.url).toBe('string');
        expect(resource.url.trim().length).toBeGreaterThan(0);
        expect(typeof resource.type).toBe('string');
        expect(resource.type.trim().length).toBeGreaterThan(0);
      });
    });

    it('event-config.json pasa la validación completa de EventConfig', () => {
      rawJson = readFileSync(configPath, 'utf-8');
      parsed = JSON.parse(rawJson);
      const { valid, errors } = validateEventConfig(parsed);
      expect(errors).toEqual([]);
      expect(valid).toBe(true);
    });
  });

  /* ============================================================
     Prueba de propiedad con fast-check
     Genera objetos EventConfig-like aleatorios y verifica que
     validateEventConfig distingue correctamente válidos de inválidos.
     ============================================================ */

  describe('Propiedad 5 — fast-check: validateEventConfig distingue configs válidos de inválidos', () => {

    // Generador de un Resource válido
    const validResourceArb = fc.record({
      name:        fc.string({ minLength: 1, maxLength: 50 }).map((s) => s.trim()).filter((s) => s.length > 0),
      description: fc.string({ minLength: 1, maxLength: 100 }).map((s) => s.trim()).filter((s) => s.length > 0),
      url:         fc.webUrl(),
      type:        fc.constantFrom('docs', 'github', 'community', 'social'),
    });

    // Generador de un EventConfig válido completo
    const validConfigArb = fc.record({
      eventName: fc.string({ minLength: 1, maxLength: 80 }).map((s) => s.trim()).filter((s) => s.length > 0),
      challenge: fc.record({
        title:           fc.string({ minLength: 1, maxLength: 80 }).map((s) => s.trim()).filter((s) => s.length > 0),
        description:     fc.string({ minLength: 1, maxLength: 200 }).map((s) => s.trim()).filter((s) => s.length > 0),
        steps:           fc.array(
          fc.string({ minLength: 1, maxLength: 80 }).map((s) => s.trim()).filter((s) => s.length > 0),
          { minLength: 1, maxLength: 10 }
        ),
        successCriteria: fc.array(
          fc.string({ minLength: 1, maxLength: 80 }).map((s) => s.trim()).filter((s) => s.length > 0),
          { minLength: 1, maxLength: 10 }
        ),
      }),
      communityResources: fc.array(validResourceArb, { minLength: 1, maxLength: 5 }),
    });

    it('todo EventConfig generado aleatoriamente que cumple los requisitos pasa la validación', () => {
      // **Validates: Requirements 3.1, 6.1, 6.4**
      fc.assert(
        fc.property(validConfigArb, (config) => {
          const { valid, errors } = validateEventConfig(config);
          return valid === true && errors.length === 0;
        }),
        { numRuns: 100 }
      );
    });

    it('un config sin eventName falla la validación', () => {
      fc.assert(
        fc.property(validConfigArb, (config) => {
          const invalidConfig = { ...config, eventName: '' };
          const { valid } = validateEventConfig(invalidConfig);
          return valid === false;
        }),
        { numRuns: 100 }
      );
    });

    it('un config sin challenge.steps falla la validación', () => {
      fc.assert(
        fc.property(validConfigArb, (config) => {
          const invalidConfig = {
            ...config,
            challenge: { ...config.challenge, steps: [] },
          };
          const { valid } = validateEventConfig(invalidConfig);
          return valid === false;
        }),
        { numRuns: 100 }
      );
    });

    it('un config con communityResources vacío falla la validación', () => {
      fc.assert(
        fc.property(validConfigArb, (config) => {
          const invalidConfig = { ...config, communityResources: [] };
          const { valid } = validateEventConfig(invalidConfig);
          return valid === false;
        }),
        { numRuns: 100 }
      );
    });

    it('un config con challenge.successCriteria vacío falla la validación', () => {
      fc.assert(
        fc.property(validConfigArb, (config) => {
          const invalidConfig = {
            ...config,
            challenge: { ...config.challenge, successCriteria: [] },
          };
          const { valid } = validateEventConfig(invalidConfig);
          return valid === false;
        }),
        { numRuns: 100 }
      );
    });
  });
});
