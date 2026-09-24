/**
 * assets/js/escaparate.js
 * Controlador interactivo de "El Escaparate" para Live Bands Music.
 * Consumo estricto de catalog.public.json (cero fuga de costes internos).
 * Conexión con el puente de datos (lead-bridge.js) hacia el Cockpit de Santiago Cholbi.
 * Versión v.25: Añadidos campos email y horario del evento, botón mailto: seguro (resumen corto
 * con límite de 1.800 caracteres), telemetria.events incluida en payload del backend.
 */

import { generateLeadRef, encodeLeadState, saveLead } from './services/lead-bridge.js';

// ============================================================================
// 1. ESTADO REACTIVO DEL LEAD Y FUNNEL
// ============================================================================

export const state = {
  currentStep: 1, // 1: Datos, 2: Momentos, 3: Resumen
  catalog: null,
  activeMomentTab: 'ceremonia',
  activeStyleFilter: 'todos',
  lead: {
    ref: '',
    pareja: '',
    date_mode: 'flexible', // 'flexible' | 'exact'
    temporada: 'Verano 2027 (Junio - Septiembre)',
    fecha: '',
    finca: '',
    pax_rango: '100_160',
    pax_label: '100 – 160 invitados',
    pax_warning: false,
    email: '',
    horario: '',
    notas: '',
    momentos: {
      ceremonia: null,
      aperitivo: null,
      fiesta_pre_dj: null
    },
    extras: {
      dinnerSpeech: false,
      djParty: false
    },
    rgpd_consent: false,
    telemetria: {
      created_at: new Date().toISOString(),
      events: []
    }
  }
};

// ============================================================================
// 2. TELEMETRÍA MÍNIMA DE FUNNEL
// ============================================================================

export function trackFunnel(eventName, meta = {}) {
  const eventRecord = {
    event: eventName,
    timestamp: new Date().toISOString(),
    ...meta
  };
  state.lead.telemetria.events.push(eventRecord);
  try {
    const rawHistory = localStorage.getItem('lbm_escaparate_events');
    const history = rawHistory ? JSON.parse(rawHistory) : [];
    history.push(eventRecord);
    localStorage.setItem('lbm_escaparate_events', JSON.stringify(history.slice(-50)));
  } catch (e) {
    // Silencioso ante bloqueo de storage
  }
}

// ============================================================================
// 3. CARGA DE CATÁLOGO PÚBLICO Y FALLBACK DE RED
// ============================================================================

export async function initEscaparate() {
  trackFunnel('escaparate_loaded');
  setupDatalistFincas();
  setupEventListeners();

  try {
    const response = await fetch('./assets/data/catalog.public.json');
    if (!response.ok) {
      throw new Error(`Error HTTP ${response.status} al cargar el catálogo.`);
    }
    const data = await response.json();

    // Verificación estricta de seguridad en cliente
    if (data.musicos_roles || JSON.stringify(data).includes('cache_individual_eur')) {
      console.error('ALERTA DE SEGURIDAD: Fuga de costes detectada en catálogo.');
      throw new Error('Integridad de catálogo no autorizada.');
    }

    state.catalog = data;
    renderEstilosFilter();
    renderBandsCards();
    updateStickyBar();

    // Ocultar loader y mostrar interfaz principal
    document.getElementById('catalog-loading')?.classList.add('hidden');
    document.getElementById('catalog-content')?.classList.remove('hidden');

  } catch (error) {
    console.warn('Degradando a pantalla de cortesía por fallo de red:', error);
    renderNetworkFallback();
  }
}

function renderNetworkFallback() {
  const loadingEl = document.getElementById('catalog-loading');
  const fallbackEl = document.getElementById('network-fallback');
  if (loadingEl) loadingEl.classList.add('hidden');
  if (fallbackEl) fallbackEl.classList.remove('hidden');
  trackFunnel('network_fallback_rendered');
}

// ============================================================================
// 4. STEPPER Y NAVEGACIÓN ENTRE PASOS
// ============================================================================

export function setStep(stepNumber) {
  state.currentStep = stepNumber;

  [1, 2, 3].forEach(num => {
    const stepEl = document.getElementById(`step-indicator-${num}`);
    const sectionEl = document.getElementById(`step-section-${num}`);
    if (!stepEl || !sectionEl) return;

    if (num === stepNumber) {
      stepEl.className = "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm";
      sectionEl.classList.remove('hidden');
    } else if (num < stepNumber) {
      stepEl.className = "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30";
      sectionEl.classList.add('hidden');
    } else {
      stepEl.className = "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium text-stone-500 border border-stone-800";
      sectionEl.classList.add('hidden');
    }
  });

  window.scrollTo({ top: 120, behavior: 'smooth' });

  if (stepNumber === 1) {
    trackFunnel('funnel_step_1_viewed');
  } else if (stepNumber === 2) {
    trackFunnel('funnel_step_2_viewed');
  } else if (stepNumber === 3) {
    trackFunnel('funnel_step_3_viewed');
    renderSummaryReview();
  }

  updateStickyBar();
}

// ============================================================================
// 5. GESTIÓN DEL PASO 1: DETALLES DE LA BODA (FECHA, PAX, FINCA Y NOTAS)
// ============================================================================

export function setDateMode(mode) {
  state.lead.date_mode = mode;
  const btnFlexible = document.getElementById('btn-date-flexible');
  const btnExact = document.getElementById('btn-date-exact');
  const containerFlexible = document.getElementById('container-date-flexible');
  const containerExact = document.getElementById('container-date-exact');

  if (mode === 'flexible') {
    if (btnFlexible) btnFlexible.className = "px-3 py-1 rounded-md font-bold text-xs bg-amber-500 text-stone-950 transition";
    if (btnExact) btnExact.className = "px-3 py-1 rounded-md font-medium text-xs text-stone-400 hover:text-white transition";
    if (containerFlexible) containerFlexible.classList.remove('hidden');
    if (containerExact) containerExact.classList.add('hidden');
  } else {
    if (btnFlexible) btnFlexible.className = "px-3 py-1 rounded-md font-medium text-xs text-stone-400 hover:text-white transition";
    if (btnExact) btnExact.className = "px-3 py-1 rounded-md font-bold text-xs bg-amber-500 text-stone-950 transition";
    if (containerFlexible) containerFlexible.classList.add('hidden');
    if (containerExact) containerExact.classList.remove('hidden');
  }

  trackFunnel('date_mode_changed', { mode });
}

export function setPax(rangoId, label) {
  state.lead.pax_rango = rangoId;
  state.lead.pax_label = label;
  state.lead.pax_warning = (rangoId === 'mas_200');

  document.querySelectorAll('.pax-option-btn').forEach(btn => {
    const btnRango = btn.getAttribute('data-rango');
    if (btnRango === rangoId) {
      btn.className = "pax-option-btn py-2.5 px-3 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 border-amber-500 bg-amber-500/15 text-amber-200 shadow-sm";
    } else {
      btn.className = "pax-option-btn py-2.5 px-3 rounded-xl border text-xs font-medium transition flex flex-col items-center justify-center gap-1 border-stone-800 bg-stone-900/60 text-stone-300 hover:border-stone-700 hover:bg-stone-800/40";
    }
  });

  const warningEl = document.getElementById('pax-acoustics-warning');
  if (warningEl) {
    if (rangoId === 'mas_200') {
      warningEl.classList.remove('hidden');
    } else {
      warningEl.classList.add('hidden');
    }
  }

  updateStickyBar();
}

export function setLocationQuick(locName) {
  const fincaInput = document.getElementById('input-finca');
  if (fincaInput) {
    fincaInput.value = locName;
    state.lead.finca = locName;
  }
}

export function handleStep1Next() {
  const parejaInput = document.getElementById('input-pareja');
  const fincaInput = document.getElementById('input-finca');
  const notasInput = document.getElementById('input-notas');
  const emailInput = document.getElementById('input-email');
  const horarioSelect = document.getElementById('select-horario');

  state.lead.pareja = parejaInput?.value.trim() || 'Pareja';
  state.lead.finca = fincaInput?.value.trim() || 'Finca en Cataluña';
  state.lead.notas = notasInput?.value.trim() || '';
  state.lead.email = emailInput?.value.trim() || '';
  state.lead.horario = horarioSelect?.value || '';

  if (state.lead.date_mode === 'flexible') {
    const seasonSelect = document.getElementById('select-event-season');
    state.lead.temporada = seasonSelect?.value || 'Temporada 2027 (A convenir)';
    state.lead.fecha = state.lead.temporada;
  } else {
    const dateInput = document.getElementById('input-fecha');
    state.lead.fecha = dateInput?.value || '';
  }

  trackFunnel('funnel_step_1_completed', {
    pareja: state.lead.pareja,
    date_mode: state.lead.date_mode,
    fecha: state.lead.fecha,
    finca: state.lead.finca,
    pax: state.lead.pax_label
  });

  setStep(2);
}

// ============================================================================
// 6. GESTIÓN DEL PASO 2: MOMENTOS Y BANDAS
// ============================================================================

export function switchMomentTab(momentId) {
  state.activeMomentTab = momentId;
  state.activeStyleFilter = 'todos';

  ['ceremonia', 'aperitivo', 'fiesta_pre_dj'].forEach(mId => {
    const tabBtn = document.getElementById(`tab-moment-${mId}`);
    if (!tabBtn) return;
    if (mId === momentId) {
      tabBtn.className = "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border transition bg-amber-500/15 text-amber-300 border-amber-500/50 shadow-sm flex items-center gap-2";
    } else {
      tabBtn.className = "px-4 py-2 rounded-xl text-xs sm:text-sm font-medium border border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700 transition flex items-center gap-2";
    }
  });

  renderEstilosFilter();
  renderBandsCards();
}

export function setStyleFilter(styleId) {
  state.activeStyleFilter = styleId;
  renderEstilosFilter();
  renderBandsCards();
}

function renderEstilosFilter() {
  const container = document.getElementById('filter-estilos-container');
  if (!container || !state.catalog) return;

  const currentMoment = state.activeMomentTab;
  const compatibilityMap = state.catalog.matriz_compatibilidad_live[currentMoment] || {};
  const availableStyles = Object.keys(compatibilityMap);

  let html = `
    <button onclick="window.escaparate.setStyleFilter('todos')" 
      class="px-3 py-1 rounded-full text-xs font-semibold transition border ${state.activeStyleFilter === 'todos' ? 'bg-amber-500 text-stone-950 border-amber-400 font-bold' : 'bg-stone-900/80 text-stone-400 border-stone-800 hover:border-stone-700 hover:text-stone-200'}">
      Todos los estilos (${availableStyles.length})
    </button>
  `;

  state.catalog.estilos.forEach(st => {
    if (!availableStyles.includes(st.id)) return;
    const isSelected = state.activeStyleFilter === st.id;
    html += `
      <button onclick="window.escaparate.setStyleFilter('${st.id}')"
        class="px-3 py-1 rounded-full text-xs font-semibold transition border ${isSelected ? 'bg-amber-500 text-stone-950 border-amber-400 font-bold' : 'bg-stone-900/80 text-stone-400 border-stone-800 hover:border-stone-700 hover:text-stone-200'}">
        ${st.nombre}
      </button>
    `;
  });

  container.innerHTML = html;
}

function renderBandsCards() {
  const container = document.getElementById('bands-cards-container');
  if (!container || !state.catalog) return;

  const currentMoment = state.activeMomentTab;
  const compatibilityMap = state.catalog.matriz_compatibilidad_live[currentMoment] || {};

  let compatibleBandIds = [];
  if (state.activeStyleFilter === 'todos') {
    Object.values(compatibilityMap).forEach(arr => compatibleBandIds.push(...arr));
    compatibleBandIds = [...new Set(compatibleBandIds)];
  } else {
    compatibleBandIds = compatibilityMap[state.activeStyleFilter] || [];
  }

  const bands = state.catalog.bandas.filter(b => compatibleBandIds.includes(b.id));

  if (bands.length === 0) {
    container.innerHTML = `
      <div class="p-8 text-center rounded-2xl border border-stone-800 bg-stone-950/60 col-span-full">
        <p class="text-sm text-stone-400">No hay bandas disponibles para este filtro específico en este momento.</p>
        <button onclick="window.escaparate.setStyleFilter('todos')" class="mt-3 text-xs text-amber-400 underline font-semibold">
          Ver todas las opciones compatibles
        </button>
      </div>
    `;
    return;
  }

  const selectedForThisMoment = state.lead.momentos[currentMoment];

  let html = '';
  bands.forEach(band => {
    const isBandActive = selectedForThisMoment?.banda_id === band.id;

    html += `
      <div class="rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between ${isBandActive ? 'border-amber-500 bg-amber-950/15 shadow-lg shadow-amber-950/30' : 'border-stone-800/80 bg-stone-950/70 hover:border-stone-700'}">
        <div>
          <!-- Imagen de la banda con badge -->
          <div class="relative h-44 w-full overflow-hidden bg-stone-900">
            <img src="${band.foto || band.imagen || ''}" alt="${band.nombre}" class="w-full h-full object-cover transition-transform duration-500 hover:scale-105" loading="lazy" />
            <div class="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent"></div>
            <div class="absolute top-3 left-3">
              <span class="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase bg-stone-900/90 text-amber-300 border border-amber-500/30 backdrop-blur-md">
                ${band.genero}
              </span>
            </div>
            ${isBandActive ? `
              <div class="absolute top-3 right-3">
                <span class="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500 text-stone-950 shadow-md flex items-center gap-1">
                  ✓ Seleccionada
                </span>
              </div>
            ` : ''}
          </div>

          <!-- Contenido textual -->
          <div class="p-5">
            <div class="flex items-start justify-between gap-2">
              <div>
                <h3 class="text-lg font-bold text-stone-100 font-serif-title">${band.nombre}</h3>
                <p class="text-xs text-amber-200/90 font-medium mt-0.5">${band.tagline}</p>
              </div>
            </div>

            <p class="text-xs text-stone-400 leading-relaxed mt-2.5 line-clamp-3">${band.descripcion}</p>

            <!-- Enlace oficial de audio y repertorio en directo -->
            ${band.web ? `
              <div class="mt-3">
                <a href="${band.web}" target="_blank" rel="noopener noreferrer"
                   class="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 hover:underline transition">
                  <span>🎵 Escuchar muestras y ver repertorio en vivo</span>
                  <i data-lucide="external-link" class="w-3 h-3"></i>
                </a>
              </div>
            ` : ''}

            <!-- Selector de formaciones disponibles -->
            <div class="mt-4 pt-4 border-t border-stone-800/80">
              <label class="block text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-2">
                Formatos recomendados:
              </label>
              <div class="space-y-2">
                ${band.formaciones.map(form => {
                  const isFormatSelected = isBandActive && selectedForThisMoment?.formato_id === form.id;
                  const price = form.precio_orientativo_eur || form.precio_base_eur || 0;
                  const cancionesInfo = form.canciones_a_la_carta ? `✨ Incluye ${form.canciones_a_la_carta} canciones a la carta` : '';

                  return `
                    <div class="p-2.5 rounded-xl border text-xs cursor-pointer transition ${isFormatSelected ? 'border-amber-400 bg-amber-500/20 text-white font-bold' : 'border-stone-800/60 bg-stone-900/40 text-stone-300 hover:border-stone-700 hover:bg-stone-800/50'}"
                         onclick="window.escaparate.selectBandFormat('${currentMoment}', '${band.id}', '${band.nombre}', '${form.id}', '${form.nombre}', ${price})">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                          <span class="w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${isFormatSelected ? 'border-amber-400 bg-amber-500 text-stone-950 font-black' : 'border-stone-600'}">
                            ${isFormatSelected ? '✓' : ''}
                          </span>
                          <span>${form.nombre}</span>
                        </div>
                        <span class="font-extrabold text-amber-300">${price} €</span>
                      </div>
                      ${cancionesInfo && currentMoment === 'ceremonia' ? `
                        <div class="mt-1 pl-6 text-[10px] text-emerald-300 font-medium">
                          ${cancionesInfo}
                        </div>
                      ` : ''}
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>
        </div>

        <div class="p-5 pt-0">
          ${isBandActive ? `
            <button onclick="window.escaparate.clearMoment('${currentMoment}')" class="w-full py-2 px-3 rounded-xl border border-red-500/40 bg-red-950/20 text-red-300 hover:bg-red-900/30 text-xs font-semibold transition">
              Quitar de ${getMomentLabel(currentMoment)}
            </button>
          ` : `
            <div class="text-[11px] text-stone-500 text-center py-1">
              Haz clic en cualquier formato arriba para elegir esta banda
            </div>
          `}
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
  if (window.lucide) window.lucide.createIcons();
}

export function selectBandFormat(momentId, bandId, bandName, formatId, formatName, priceEur) {
  state.lead.momentos[momentId] = {
    banda_id: bandId,
    banda_nombre: bandName,
    formato_id: formatId,
    formato_nombre: formatName,
    precio_base_eur: priceEur
  };

  trackFunnel('moment_band_selected', {
    momento: momentId,
    banda: bandName,
    formato: formatName,
    precio: priceEur
  });

  renderBandsCards();
  updateStickyBar();
}

export function clearMoment(momentId) {
  state.lead.momentos[momentId] = null;
  trackFunnel('moment_cleared', { momento: momentId });
  renderBandsCards();
  updateStickyBar();
}

export function toggleExtra(extraKey) {
  state.lead.extras[extraKey] = !state.lead.extras[extraKey];
  trackFunnel('extra_toggled', { extra: extraKey, active: state.lead.extras[extraKey] });
  updateStickyBar();
}

// ============================================================================
// 7. CÁLCULO DE TOTALES Y STICKY BAR
// ============================================================================

export function calculateBaseTotal() {
  let total = 0;
  Object.values(state.lead.momentos).forEach(m => {
    if (m && m.precio_base_eur) total += m.precio_base_eur;
  });

  if (state.lead.extras.dinnerSpeech) total += 150;
  if (state.lead.extras.djParty) total += 500;

  return total;
}

export function updateStickyBar() {
  const countEl = document.getElementById('sticky-momentos-count');
  const totalEl = document.getElementById('sticky-total-estimate');
  const stickyBar = document.getElementById('sticky-cart-bar');
  if (!countEl || !totalEl || !stickyBar) return;

  const activeMoments = Object.values(state.lead.momentos).filter(Boolean);
  const baseTotal = calculateBaseTotal();
  const totalIva = Math.round(baseTotal * 1.21);

  countEl.textContent = `${activeMoments.length} momento${activeMoments.length === 1 ? '' : 's'} seleccionado${activeMoments.length === 1 ? '' : 's'}`;
  totalEl.textContent = `${baseTotal} € base (${totalIva} € con IVA)*`;

  if (activeMoments.length > 0 || state.currentStep === 2) {
    stickyBar.classList.remove('translate-y-full');
  } else {
    stickyBar.classList.add('translate-y-full');
  }
}

// ============================================================================
// 8. GESTIÓN DEL PASO 3: RESUMEN, IVA, CONDICIONES Y ENVÍO POR WHATSAPP
// ============================================================================

function renderSummaryReview() {
  const container = document.getElementById('summary-details-box');
  const baseTotalEl = document.getElementById('summary-base-total');
  const ivaTotalEl = document.getElementById('summary-iva-total');
  const finalTotalEl = document.getElementById('summary-final-total');
  const reserva15El = document.getElementById('summary-reserva-15');
  const pago85El = document.getElementById('summary-pago-85');
  const paxNoticeEl = document.getElementById('summary-pax-notice');
  const dateNoticeEl = document.getElementById('summary-date-notice');
  if (!container || !baseTotalEl) return;

  const baseTotal = calculateBaseTotal();
  const ivaEur = Math.round(baseTotal * 0.21);
  const finalTotal = baseTotal + ivaEur;
  const reserva15 = Math.round(finalTotal * 0.15);
  const pago85 = finalTotal - reserva15;

  baseTotalEl.textContent = `${baseTotal} €`;
  if (ivaTotalEl) ivaTotalEl.textContent = `${ivaEur} €`;
  if (finalTotalEl) finalTotalEl.textContent = `${finalTotal} €`;
  if (reserva15El) reserva15El.textContent = `${reserva15} €`;
  if (pago85El) pago85El.textContent = `${pago85} €`;

  if (paxNoticeEl) {
    if (state.lead.pax_rango === 'mas_200') {
      paxNoticeEl.innerHTML = `
        <strong>Aforo >200 PAX:</strong> Para eventos de más de 200 asistentes se requerirá Sonorización Completa (900 €) con refuerzo de subwoofers y microfonía auxiliar. Santiago confirmará la acústica exacta de la finca.
      `;
    } else {
      paxNoticeEl.innerHTML = `
        Presupuesto orientativo para aforo de <strong>~${state.lead.pax_label}</strong>. El presupuesto final lo confirma Santiago Cholbi según los requerimientos acústicos y logística de la finca.
      `;
    }
  }

  if (dateNoticeEl) {
    const fechaTexto = state.lead.date_mode === 'flexible' 
      ? `Fecha aproximada: <strong>${state.lead.temporada}</strong> (24h de asesoramiento sin compromiso)`
      : `Fecha fijada: <strong>${state.lead.fecha || 'A confirmar'}</strong>`;
    dateNoticeEl.innerHTML = fechaTexto;
  }

  const moments = state.lead.momentos;
  let itemsHtml = '';

  ['ceremonia', 'aperitivo', 'fiesta_pre_dj'].forEach(mId => {
    const sel = moments[mId];
    if (sel) {
      itemsHtml += `
        <div class="flex items-start justify-between py-3 border-b border-stone-800">
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-amber-400 block">${getMomentLabel(mId)}</span>
            <span class="text-sm font-semibold text-stone-100">${sel.banda_nombre}</span>
            <span class="text-xs text-stone-400 block">${sel.formato_nombre} (90 min de actuación en vivo)</span>
          </div>
          <span class="text-sm font-bold text-stone-200">${sel.precio_base_eur} € base</span>
        </div>
      `;
    }
  });

  if (state.lead.extras.dinnerSpeech) {
    itemsHtml += `
      <div class="flex items-start justify-between py-3 border-b border-stone-800">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-amber-400 block">Banquete / Cena</span>
          <span class="text-sm font-semibold text-stone-100">Soporte Técnico de Cena y Discursos</span>
          <span class="text-xs text-stone-400 block">2 micrófonos inalámbricos y técnico para momentos clave</span>
        </div>
        <span class="text-sm font-bold text-stone-200">150 € base</span>
      </div>
    `;
  }

  if (state.lead.extras.djParty) {
    itemsHtml += `
      <div class="flex items-start justify-between py-3 border-b border-stone-800">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-amber-400 block">Fin de Fiesta</span>
          <span class="text-sm font-semibold text-stone-100">Sesión DJ Profesional</span>
          <span class="text-xs text-stone-400 block">Cabina, controladora y barra libre</span>
        </div>
        <span class="text-sm font-bold text-stone-200">500 € base</span>
      </div>
    `;
  }

  if (state.lead.notas) {
    itemsHtml += `
      <div class="py-3 border-b border-stone-800 text-xs">
        <span class="font-bold text-stone-400 block uppercase tracking-wider mb-1">Notas sobre tu boda o finca:</span>
        <p class="text-stone-300 italic bg-stone-900/60 p-2.5 rounded-lg border border-stone-800">"${state.lead.notas}"</p>
      </div>
    `;
  }

  if (!itemsHtml) {
    itemsHtml = `
      <div class="py-4 text-center text-stone-500 text-xs italic">
        No has seleccionado ninguna banda todavía. Puedes volver al Paso 2 para elegir tu música.
      </div>
    `;
  }

  container.innerHTML = itemsHtml;
}

export function handleRgpdChange(checkbox) {
  state.lead.rgpd_consent = checkbox.checked;
  ['btn-submit-whatsapp', 'btn-submit-email'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.disabled = !checkbox.checked;
      if (checkbox.checked) {
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
      } else {
        btn.classList.add('opacity-50', 'cursor-not-allowed');
      }
    }
  });
}

export async function submitLeadWhatsApp() {
  if (!state.lead.rgpd_consent) {
    alert('Por favor, acepta la política de privacidad para preparar tu presupuesto.');
    return;
  }

  const btn = document.getElementById('btn-submit-whatsapp');
  const originalHtml = btn?.innerHTML || '';
  if (btn) {
    btn.innerHTML = `<span class="animate-pulse">Preparando anteproyecto y WhatsApp...</span>`;
    btn.disabled = true;
  }

  try {
    if (!state.lead.ref) {
      state.lead.ref = generateLeadRef();
    }

    await saveLead(state.lead);

    const compactEncoded = encodeLeadState(state.lead);
    const cockpitUrl = `https://live-bands-music-cockpit-v002.vercel.app/simulador.html?ref=${state.lead.ref}&d=${compactEncoded}`;

    trackFunnel('funnel_token_generated', { ref: state.lead.ref });
    trackFunnel('funnel_cta_clicked', { channel: 'whatsapp', ref: state.lead.ref });

    const baseTotal = calculateBaseTotal();
    const ivaEur = Math.round(baseTotal * 0.21);
    const finalTotal = baseTotal + ivaEur;
    const reserva15 = Math.round(finalTotal * 0.15);
    const pago85 = finalTotal - reserva15;

    const momentsList = [];
    if (state.lead.momentos.ceremonia) {
      momentsList.push(`• Ceremonia: ${state.lead.momentos.ceremonia.banda_nombre} (${state.lead.momentos.ceremonia.formato_nombre}) — ${state.lead.momentos.ceremonia.precio_base_eur} € base`);
    }
    if (state.lead.momentos.aperitivo) {
      momentsList.push(`• Aperitivo: ${state.lead.momentos.aperitivo.banda_nombre} (${state.lead.momentos.aperitivo.formato_nombre}) — ${state.lead.momentos.aperitivo.precio_base_eur} € base`);
    }
    if (state.lead.momentos.fiesta_pre_dj) {
      momentsList.push(`• Fiesta pre-DJ: ${state.lead.momentos.fiesta_pre_dj.banda_nombre} (${state.lead.momentos.fiesta_pre_dj.formato_nombre}) — ${state.lead.momentos.fiesta_pre_dj.precio_base_eur} € base`);
    }
    if (state.lead.extras.dinnerSpeech) {
      momentsList.push(`• Soporte técnico cena: 150 € base`);
    }
    if (state.lead.extras.djParty) {
      momentsList.push(`• Sesión DJ fin de fiesta: 500 € base`);
    }

    const fechaDisplay = state.lead.date_mode === 'flexible'
      ? `${state.lead.temporada} (Fecha flexible por confirmar)`
      : `${state.lead.fecha || 'A definir'}`;

    const messageLines = [
      `Hola Santiago, completamos nuestra propuesta musical para nuestra boda:`,
      ``,
      `👰🤵 Pareja: ${state.lead.pareja || 'No especificado'}`,
      `📅 Fecha / Temporada: ${fechaDisplay}`,
      `📍 Finca / Población: ${state.lead.finca || 'Cataluña'}`,
      `👥 Aforo aprox.: ${state.lead.pax_label}`,
      state.lead.pax_rango === 'mas_200' ? `⚠️ Aforo >200 PAX (Requiere Sonorización Completa)` : ``,
      state.lead.notas ? `📝 Notas: "${state.lead.notas}"` : ``,
      ``,
      `🎶 Selección musical:`,
      momentsList.length > 0 ? momentsList.join('\n') : `(A consultar con Santiago)`,
      ``,
      `💰 Subtotal base: ${baseTotal} €`,
      `💼 IVA 21%: ${ivaEur} €`,
      `✨ Total estimado con IVA: ${finalTotal} €`,
      ``,
      `Condiciones oficiales LBM:`,
      `• 15% de reserva formal (${reserva15} €) para bloquear la fecha.`,
      `• 85% restante (${pago85} €) el día del evento.`,
      `*Presupuesto orientativo sujeto a confirmación según logística del recinto.`,
      ``,
      `Podés abrir y revisar nuestro anteproyecto en tu Cockpit aquí:`,
      cockpitUrl,
      ``,
      `¡Muchas gracias!`
    ].filter(Boolean);

    const waText = encodeURIComponent(messageLines.join('\n'));
    const phoneSantiago = '34627370334';
    const waUrl = `https://api.whatsapp.com/send?phone=${phoneSantiago}&text=${waText}`;

    const feedbackBox = document.getElementById('lead-completed-feedback');
    if (feedbackBox) {
      feedbackBox.classList.remove('hidden');
      const linkEl = document.getElementById('generated-cockpit-link');
      if (linkEl) linkEl.value = cockpitUrl;
    }

    if (btn) {
      btn.innerHTML = originalHtml;
      btn.disabled = false;
    }

    window.open(waUrl, '_blank');

  } catch (err) {
    console.error('Error al enviar por WhatsApp:', err);
    if (btn) {
      btn.innerHTML = originalHtml;
      btn.disabled = false;
    }
    alert('Ocurrió un error al preparar el enlace. Podés copiar los datos directamente.');
  }
}

/**
 * submitLeadEmail — Genera un mailto: con resumen corto del anteproyecto.
 * Límite seguro: ~1.800 caracteres. Si el cuerpo lo supera, usa resumen mínimo + enlace.
 * Canal: info@livebandsmusic.com con CC a la pareja si proporcionó email.
 */
export async function submitLeadEmail() {
  if (!state.lead.rgpd_consent) {
    alert('Por favor, acepta la política de privacidad para enviar el anteproyecto.');
    return;
  }

  const btn = document.getElementById('btn-submit-email');
  const originalHtml = btn?.innerHTML || '';
  if (btn) {
    btn.innerHTML = `<span class="animate-pulse">Preparando email…</span>`;
    btn.disabled = true;
  }

  try {
    if (!state.lead.ref) {
      state.lead.ref = generateLeadRef();
    }

    await saveLead(state.lead);

    const compactEncoded = encodeLeadState(state.lead);
    const cockpitUrl = `https://live-bands-music-cockpit-v002.vercel.app/simulador.html?ref=${state.lead.ref}&d=${compactEncoded}`;

    trackFunnel('funnel_token_generated', { ref: state.lead.ref });
    trackFunnel('funnel_cta_clicked', { channel: 'email', ref: state.lead.ref });

    const baseTotal = calculateBaseTotal();
    const ivaEur = Math.round(baseTotal * 0.21);
    const finalTotal = baseTotal + ivaEur;
    const reserva15 = Math.round(finalTotal * 0.15);

    const fechaDisplay = state.lead.date_mode === 'flexible'
      ? `${state.lead.temporada} (Fecha flexible)`
      : `${state.lead.fecha || 'A definir'}`;

    const momentosLines = [];
    if (state.lead.momentos.ceremonia) {
      momentosLines.push(`Ceremonia: ${state.lead.momentos.ceremonia.banda_nombre} (${state.lead.momentos.ceremonia.formato_nombre})`);
    }
    if (state.lead.momentos.aperitivo) {
      momentosLines.push(`Aperitivo: ${state.lead.momentos.aperitivo.banda_nombre} (${state.lead.momentos.aperitivo.formato_nombre})`);
    }
    if (state.lead.momentos.fiesta_pre_dj) {
      momentosLines.push(`Fiesta pre-DJ: ${state.lead.momentos.fiesta_pre_dj.banda_nombre} (${state.lead.momentos.fiesta_pre_dj.formato_nombre})`);
    }

    const asunto = `Anteproyecto musical LBM — ${state.lead.pareja} — ${state.lead.ref}`;

    // Cuerpo corto (prioridad)
    const cuerpoPrincipal = [
      `Hola Santiago,`,
      ``,
      `Completamos nuestra propuesta musical desde el Escaparate de LBM.`,
      ``,
      `Pareja: ${state.lead.pareja}`,
      `Fecha / Temporada: ${fechaDisplay}`,
      state.lead.horario ? `Horario: ${state.lead.horario}` : '',
      `Finca / Población: ${state.lead.finca}`,
      `Aforo aprox.: ${state.lead.pax_label}`,
      ``,
      `Música seleccionada:`,
      momentosLines.length > 0 ? momentosLines.join('\n') : '(A consultar)',
      ``,
      `Total estimado con IVA: ${finalTotal} € (Reserva 15%: ${reserva15} €)`,
      ``,
      `Ver anteproyecto completo en tu Cockpit:`,
      cockpitUrl,
      ``,
      `¡Muchas gracias!`,
      state.lead.pareja
    ].filter(Boolean).join('\n');

    // Fallback mínimo si supera 1.800 caracteres
    const LIMIT = 1800;
    const cuerpoFinal = cuerpoPrincipal.length <= LIMIT
      ? cuerpoPrincipal
      : `Hola Santiago,\n\nAnteproyecto de ${state.lead.pareja} (Ref: ${state.lead.ref}).\n\nAbrir aquí: ${cockpitUrl}\n\n¡Gracias!`;

    const emailSantiago = 'info@livebandsmusic.com';
    let mailtoUrl = `mailto:${emailSantiago}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpoFinal)}`;

    // CC a la pareja si proporcionó email
    if (state.lead.email) {
      mailtoUrl += `&cc=${encodeURIComponent(state.lead.email)}`;
    }

    // Mostrar feedback y enlace cockpit
    const feedbackBox = document.getElementById('lead-completed-feedback');
    if (feedbackBox) {
      feedbackBox.classList.remove('hidden');
      const linkEl = document.getElementById('generated-cockpit-link');
      if (linkEl) linkEl.value = cockpitUrl;
    }

    if (btn) {
      btn.innerHTML = originalHtml;
      btn.disabled = false;
    }

    window.location.href = mailtoUrl;

  } catch (err) {
    console.error('Error al preparar email:', err);
    if (btn) {
      btn.innerHTML = originalHtml;
      btn.disabled = false;
    }
    alert('Ocurrió un error al preparar el email. Podés copiar el enlace y enviarlo manualmente.');
  }
}

export function copyGeneratedLink() {
  const linkInput = document.getElementById('generated-cockpit-link');
  if (!linkInput) return;
  linkInput.select();
  navigator.clipboard.writeText(linkInput.value);
  trackFunnel('funnel_cta_clicked', { channel: 'copy_link', ref: state.lead.ref });

  const copyStatus = document.getElementById('copy-status-indicator');
  if (copyStatus) {
    copyStatus.textContent = '¡Enlace copiado al portapapeles!';
    setTimeout(() => { copyStatus.textContent = ''; }, 3000);
  }
}

export function downloadLeadSummary() {
  const baseTotal = calculateBaseTotal();
  const ivaEur = Math.round(baseTotal * 0.21);
  const finalTotal = baseTotal + ivaEur;
  const reserva15 = Math.round(finalTotal * 0.15);
  const pago85 = finalTotal - reserva15;
  trackFunnel('funnel_cta_clicked', { channel: 'download_text', ref: state.lead.ref });

  const fechaDisplay = state.lead.date_mode === 'flexible'
    ? `${state.lead.temporada} (Fecha aproximada)`
    : `${state.lead.fecha || 'A definir'}`;

  const textContent = `
LIVE BANDS MUSIC — ANTEPROYECTO MUSICAL DE BODA
Ref: ${state.lead.ref || 'LBM-TEMP'}
Fecha de solicitud: ${new Date().toLocaleDateString('es-ES')}

PAREJA: ${state.lead.pareja}
FECHA / TEMPORADA: ${fechaDisplay}
FINCA: ${state.lead.finca}
AFORO APROX.: ${state.lead.pax_label}
${state.lead.pax_rango === 'mas_200' ? 'ADVERTENCIA: Aforo >200 PAX (Indispensable Sonorización Completa con subwoofers)' : ''}
${state.lead.notas ? `NOTAS DEL CLIENTE: "${state.lead.notas}"` : ''}

SELECCIÓN MUSICAL:
- Ceremonia: ${state.lead.momentos.ceremonia ? `${state.lead.momentos.ceremonia.banda_nombre} (${state.lead.momentos.ceremonia.formato_nombre}) - ${state.lead.momentos.ceremonia.precio_base_eur} € base` : 'No seleccionado'}
- Aperitivo: ${state.lead.momentos.aperitivo ? `${state.lead.momentos.aperitivo.banda_nombre} (${state.lead.momentos.aperitivo.formato_nombre}) - ${state.lead.momentos.aperitivo.precio_base_eur} € base` : 'No seleccionado'}
- Fiesta pre-DJ: ${state.lead.momentos.fiesta_pre_dj ? `${state.lead.momentos.fiesta_pre_dj.banda_nombre} (${state.lead.momentos.fiesta_pre_dj.formato_nombre}) - ${state.lead.momentos.fiesta_pre_dj.precio_base_eur} € base` : 'No seleccionado'}
- Soporte Cena / Discursos: ${state.lead.extras.dinnerSpeech ? 'Sí (150 € base)' : 'No'}
- DJ Fin de Fiesta: ${state.lead.extras.djParty ? 'Sí (500 € base)' : 'No'}

DESGLOSE ECONÓMICO:
- Subtotal base: ${baseTotal} €
- IVA (21%): ${ivaEur} €
- TOTAL ESTIMADO CON IVA: ${finalTotal} €

CONDICIONES COMERCIALES OFICIALES (LBM):
- Reserva formal del 15% (${reserva15} €): Para bloquear la fecha en la agenda de los músicos.
- 85% restante (${pago85} €): Se abona el mismo día del evento tras la actuación.
- Desplazamiento 100% incluido en toda la provincia de Girona (Costa Brava / Empordà).

CONTACTO OFICIAL:
Santiago Cholbi — Live Bands Music
Teléfono / WhatsApp: +34 627 37 03 34
Web: https://livebandsmusic.com
Peralada, Girona (Catalunya)
  `.trim();

  const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Anteproyecto-LBM-${state.lead.pareja.replace(/\s+/g, '_') || 'Boda'}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ============================================================================
// 9. HELPERS Y UTILIDADES
// ============================================================================

function getMomentLabel(mId) {
  const map = {
    ceremonia: 'Ceremonia',
    aperitivo: 'Aperitivo / Cóctel',
    fiesta_pre_dj: 'Fiesta en directo'
  };
  return map[mId] || mId;
}

function setupDatalistFincas() {
  const datalist = document.getElementById('fincas-datalist');
  if (!datalist) return;
  const fincas = [
    "Castell d'Empordà (La Bisbal d'Empordà)",
    "Castell de Peralada (Alt Empordà)",
    "Mas Solers (Sant Pere de Ribes)",
    "Bell Recó (Argentona)",
    "Mas de Sant Lleí (Vilanova del Vallès)",
    "Hacienda San José (Girona)",
    "La Baronia (Sant Feliu de Codines)",
    "Mas Can Ferrer (Arbúcies)",
    "Cortal Gran (Sant Pere Pescador)",
    "Santa Florentina (Canet de Mar)"
  ];
  datalist.innerHTML = fincas.map(f => `<option value="${f}"></option>`).join('');
}

function setupEventListeners() {
  window.escaparate = {
    setStep,
    setDateMode,
    setPax,
    setLocationQuick,
    handleStep1Next,
    switchMomentTab,
    setStyleFilter,
    selectBandFormat,
    clearMoment,
    toggleExtra,
    handleRgpdChange,
    submitLeadWhatsApp,
    submitLeadEmail,
    copyGeneratedLink,
    downloadLeadSummary
  };
}

// Inicializar al cargar el DOM
window.addEventListener('DOMContentLoaded', () => {
  initEscaparate();
  const yearEl = document.getElementById('currentYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear().toString();
});
