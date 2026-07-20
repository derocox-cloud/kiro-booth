/**
 * app.js — Kiro Booth Landing Page
 *
 * Carga event-config.json y renderiza el contenido dinámico en el DOM.
 * Si la carga falla, usa DEFAULT_CONFIG para evitar una página en blanco.
 *
 * Compatible con file:// y HTTP/S.
 */

/* ============================================================
   Tipos (JSDoc)
   ============================================================ */

/**
 * @typedef {Object} EventConfig
 * @property {string} eventName - Nombre del evento a mostrar en el hero
 * @property {Challenge} challenge - Datos del reto del evento
 * @property {Resource[]} communityResources - Lista de recursos de la comunidad
 */

/**
 * @typedef {Object} Challenge
 * @property {string} title - Título del reto
 * @property {string} description - Descripción del reto
 * @property {string[]} steps - Pasos a seguir
 * @property {string[]} successCriteria - Criterios de éxito
 */

/**
 * @typedef {Object} Resource
 * @property {string} name - Nombre del recurso
 * @property {string} description - Descripción breve
 * @property {string} url - URL del recurso
 * @property {string} type - Tipo: "docs" | "github" | "community" | "social"
 */

/* ============================================================
   Configuración por defecto
   Se usa cuando event-config.json no puede cargarse.
   ============================================================ */

/** @type {EventConfig} */
export const DEFAULT_CONFIG = {
  eventName: 'Kiro Booth Latam 2026',
  challenge: {
    title: 'Construye algo con Kiro',
    description:
      'Usa Kiro para crear un proyecto desde cero: genera el spec, diseña la solución e implementa con IA.',
    steps: [
      'Descarga e instala Kiro',
      'Abre un nuevo proyecto en Kiro',
      'Pídele a Kiro que genere el spec de tu idea',
      'Revisa y aprueba el diseño generado',
      'Ejecuta las tareas de implementación con Kiro',
    ],
    successCriteria: [
      'El spec fue generado y aprobado',
      'Al menos un componente funciona correctamente',
      'El código fue generado usando Kiro',
    ],
  },
  communityResources: [
    {
      name: 'Documentación oficial de Kiro',
      description: 'Guías, tutoriales y referencia de API de Kiro.',
      url: 'https://kiro.dev/docs',
      type: 'docs',
    },
    {
      name: 'GitHub de Kiro',
      description: 'Repositorio oficial, ejemplos y reportes de bugs.',
      url: 'https://github.com/aws/kiro',
      type: 'github',
    },
    {
      name: 'Comunidad de Kiro en Discord',
      description: 'Únete a la conversación con otros usuarios de Kiro.',
      url: 'https://discord.gg/kiro',
      type: 'community',
    },
    {
      name: 'Kiro en X (Twitter)',
      description: 'Noticias, actualizaciones y anuncios oficiales.',
      url: 'https://x.com/kirodotdev',
      type: 'social',
    },
  ],
};

/* ============================================================
   Helpers
   ============================================================ */

/** Placeholder para campos faltantes o vacíos */
const PLACEHOLDER = '[Pendiente de configuración]';

/**
 * Retorna el valor si es un string no vacío; de lo contrario retorna el placeholder.
 * @param {unknown} value
 * @returns {string}
 */
export function safeString(value) {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }
  return PLACEHOLDER;
}

/**
 * Escapa texto para inserción segura como textContent (no innerHTML).
 * Actualmente no es necesario con textContent, pero se exporta para tests.
 * @param {string} text
 * @returns {string}
 */
export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/* ============================================================
   Carga de configuración
   ============================================================ */

/**
 * Carga event-config.json de forma asíncrona.
 * Si la carga o el parseo fallan, retorna DEFAULT_CONFIG.
 *
 * @returns {Promise<EventConfig>}
 */
export async function loadConfig() {
  try {
    const response = await fetch('event-config.json');
    if (!response.ok) {
      console.warn(`[Kiro] No se pudo cargar event-config.json (${response.status}). Usando configuración por defecto.`);
      return DEFAULT_CONFIG;
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.warn('[Kiro] Error al cargar event-config.json. Usando configuración por defecto.', error);
    return DEFAULT_CONFIG;
  }
}

/* ============================================================
   Funciones de renderizado
   ============================================================ */

/**
 * Inyecta el nombre del evento en el elemento #hero [data-dynamic="eventName"].
 * @param {string} name
 */
export function renderEventName(name) {
  const el = document.querySelector('[data-dynamic="eventName"]');
  if (el) {
    el.textContent = safeString(name);
  }
}

/**
 * Renderiza la sección #challenge con título, descripción, pasos y criterios.
 * @param {Challenge} challenge
 */
export function renderChallenge(challenge) {
  if (!challenge || typeof challenge !== 'object') {
    renderChallengeEmpty();
    return;
  }

  // Título
  const titleEl = document.getElementById('challenge-title');
  if (titleEl) {
    titleEl.textContent = safeString(challenge.title);
  }

  // Descripción
  const descEl = document.getElementById('challenge-description');
  if (descEl) {
    descEl.textContent = safeString(challenge.description);
  }

  // Pasos
  const stepsEl = document.getElementById('challenge-steps');
  if (stepsEl) {
    const steps = Array.isArray(challenge.steps) ? challenge.steps : [];
    if (steps.length === 0) {
      stepsEl.innerHTML = '<li>No hay pasos definidos para este evento</li>';
    } else {
      stepsEl.innerHTML = steps
        .map((step) => `<li>${escapeHtml(typeof step === 'string' ? step : PLACEHOLDER)}</li>`)
        .join('');
    }
  }

  // Criterios de éxito
  const criteriaEl = document.getElementById('challenge-criteria');
  if (criteriaEl) {
    const criteria = Array.isArray(challenge.successCriteria) ? challenge.successCriteria : [];
    if (criteria.length === 0) {
      criteriaEl.innerHTML = '<li>No hay criterios definidos para este evento</li>';
    } else {
      criteriaEl.innerHTML = criteria
        .map((c) => `<li>${escapeHtml(typeof c === 'string' ? c : PLACEHOLDER)}</li>`)
        .join('');
    }
  }
}

/**
 * Muestra placeholders en toda la sección del reto cuando el objeto challenge es inválido.
 */
function renderChallengeEmpty() {
  const ids = ['challenge-title', 'challenge-description'];
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = PLACEHOLDER;
  });
  const stepsEl = document.getElementById('challenge-steps');
  if (stepsEl) stepsEl.innerHTML = `<li>${PLACEHOLDER}</li>`;
  const criteriaEl = document.getElementById('challenge-criteria');
  if (criteriaEl) criteriaEl.innerHTML = `<li>${PLACEHOLDER}</li>`;
}

/**
 * Renderiza la lista de recursos en #community-resources.
 * @param {Resource[]} resources
 */
export function renderResources(resources) {
  const listEl = document.getElementById('community-resources');
  if (!listEl) return;

  if (!Array.isArray(resources) || resources.length === 0) {
    listEl.innerHTML = '<li class="resource-card resource-card--placeholder">No hay recursos disponibles para este evento</li>';
    return;
  }

  /** Mapa de iconos y nombres por tipo */
  const typeConfig = {
    builder:   { icon: '🏗️', label: 'Builder Center' },
    youtube:   { icon: '▶️', label: 'YouTube' },
    projects:  { icon: '🚀', label: 'Proyectos / Repositorios' },
    other:     { icon: '🔗', label: 'Otros' },
    docs:      { icon: '📄', label: 'Documentación' },
    github:    { icon: '🐙', label: 'GitHub' },
    community: { icon: '💬', label: 'Comunidad' },
    social:    { icon: '🐦', label: 'Social' },
  };

  /** Orden de los grupos */
  const groupOrder = ['builder', 'youtube', 'projects', 'docs', 'github', 'community', 'social', 'other'];

  /** Agrupar recursos por tipo */
  const groups = {};
  resources.forEach((resource) => {
    const type = resource.type || 'other';
    if (!groups[type]) groups[type] = [];
    groups[type].push(resource);
  });

  listEl.innerHTML = groupOrder
    .filter((type) => groups[type] && groups[type].length > 0)
    .map((type) => {
      const config = typeConfig[type] || typeConfig.other;
      const cards = groups[type]
        .map((resource) => {
          const name = safeString(resource.name);
          const desc = safeString(resource.description);
          const url  = typeof resource.url === 'string' && resource.url.trim().length > 0
            ? resource.url.trim()
            : '#';

          return `
      <li class="resource-card">
        <h3 class="resource-card__name">${escapeHtml(name)}</h3>
        <p class="resource-card__desc">${escapeHtml(desc)}</p>
        <a
          href="${escapeHtml(url)}"
          class="resource-card__link"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Visitar ${escapeHtml(name)}"
        >
          Visitar recurso →
        </a>
      </li>`;
        })
        .join('');

      return `
      <li class="resource-group">
        <h3 class="resource-group__title">${config.icon} ${escapeHtml(config.label)}</h3>
        <ul class="resources-list resources-list--nested" role="list">${cards}
        </ul>
      </li>`;
    })
    .join('');
}

/* ============================================================
   Navegación: scroll suave + sección activa
   ============================================================ */

/**
 * Inicializa la barra de navegación:
 * - Menú hamburguesa en móvil
 * - Highlight de sección activa al hacer scroll
 */
export function initNavigation() {
  // Hamburguesa
  const hamburger = document.querySelector('.navbar__hamburger');
  const menu = document.getElementById('nav-menu');

  if (hamburger && menu) {
    hamburger.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('is-open');
      hamburger.setAttribute('aria-expanded', String(isOpen));
    });

    // Cerrar menú al hacer clic en un enlace (mobile)
    menu.querySelectorAll('.navbar__link').forEach((link) => {
      link.addEventListener('click', () => {
        menu.classList.remove('is-open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Highlight de sección activa con IntersectionObserver
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.navbar__link');

  if (sections.length === 0 || navLinks.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach((link) => {
            const href = link.getAttribute('href');
            if (href === `#${id}`) {
              link.classList.add('is-active');
            } else {
              link.classList.remove('is-active');
            }
          });
        }
      });
    },
    {
      rootMargin: `-${getComputedStyle(document.documentElement).getPropertyValue('--navbar-height') || '64px'} 0px -60% 0px`,
      threshold: 0,
    }
  );

  sections.forEach((section) => observer.observe(section));
}

/* ============================================================
   Punto de entrada
   ============================================================ */

/**
 * Inicializa la aplicación cuando el DOM está listo.
 * Exportado para que los tests puedan invocarlo directamente.
 */
export async function init() {
  const config = await loadConfig();
  renderEventName(config.eventName);
  renderChallenge(config.challenge);
  renderResources(config.communityResources);
  initNavigation();
}

// Auto-ejecutar sólo en el navegador (no en entorno de test)
if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}
