/**
 * app.js
 * Controlador principal de la aplicación Live Bands Music (v.07).
 * Orquesta la interfaz, navegación modular, cálculo en tiempo real,
 * estación de calibración de descuentos de Santiago Cholbi,
 * generador de borrador de email e historial persistente de cotizaciones.
 */

import { COMPANY_CONFIG } from "./config/company.js";
import { APP_CONFIG } from "./config/app-config.js";
import { CATALOG } from "./data/catalog.js";
import { RulesEngine } from "./engine/rules.js";
import { PricingEngine } from "./engine/pricing.js";
import { store } from "./store.js";
import { logQuoteTelemetry, debouncedLogQuote } from "./services/telemetry.js";

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}

function initApp() {
  // Inicialización de tema Claro / Oscuro desde localStorage
  initTheme();

  // Inicialización de iconos de Lucide
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Suscripción reactiva del almacén
  store.subscribe(state => {
    renderPricingSummary(state);
    checkAcousticRules(state);
    checkTravelPolicy(state);
    updatePrintSheet(state);
    updateExperienceModeUI(state.mode);
    updateDateModeUI(state.event.dateMode);
    updateLogisticsButtonsUI(state.logistics);
    updateOperatorUI(state.operator);
    updateHistoryBadges();
  });

  // Render inicial
  setupNavigation();
  renderCockpitBands();
  renderFormStep1(store.getState());
  renderMomentsConfig(store.getState());
  renderTechOptions(store.getState());
  renderPricingSummary(store.getState());
  checkAcousticRules(store.getState());
  checkTravelPolicy(store.getState());
  updatePrintSheet(store.getState());
  initYear();
  updateGatingUI(store.getState());
  updateExperienceModeUI(store.getState().mode);
  updateDateModeUI(store.getState().event.dateMode);
  updateLogisticsButtonsUI(store.getState().logistics);
  updateOperatorUI(store.getState().operator);
  updateHistoryBadges();

  // Asegurar renderizado del paso activo (por defecto Paso 0 Cockpit)
  const currentStep = store.getState().ui?.currentStep !== undefined ? store.getState().ui.currentStep : 0;
  setStep(currentStep);

  const toggleDinnerSpeech = () => toggleMoment("dinner");
  const togglePartyDj = () => toggleMoment("party");

  // Exponer funciones globales necesarias para eventos inline en HTML
  window.app = {
    setOperator,
    setStep,
    startRoute,
    renderCockpitBands,
    openBandAssignmentModal,
    closeBandAssignmentModal,
    applyBandAssignment,
    setExperienceMode,
    setDateMode,
    setLogisticsOption,
    changeStaffMeals,
    onStaffMealsInput,
    toggleTheme,
    toggleCardHelp,
    toggleFieldHelp,
    toggleMoment,
    setMomentDuration,
    changeExtraSongs,
    onDiscountConfigChange,
    saveCurrentQuoteToHistory,
    openHistoryModal,
    closeHistoryModal,
    loadQuoteFromHistory,
    deleteQuoteFromHistory,
    clearHistoryQuotes,
    exportHistoryJSON,
    copyEmailDraftText,
    onEventInput,
    selectFormation,
    selectCuratedBand,
    toggleDinnerSpeech,
    togglePartyDj,
    togglePartyPerimeter,
    selectTechMode,
    selectTechPack,
    selectIndividualSound,
    selectIndividualLight,
    onCustomerInput,
    setLocationQuick,
    openSantiagoWhatsApp,
    openPrintModal,
    closePrintModal,
    copyWhatsAppText,
    copyEmailText,
    sendQuoteEmail,
    loadPreset,
    toggleMobileDrawer,
    resetToInitial,
    selectValidationOption,
    copyValidationAnswers,
    downloadValidationReport
  };
}

// ==========================================================================
// Control de Tema (Luxury Organic Dark Workstation)
// ==========================================================================
function initTheme() {
  document.body.classList.remove("theme-light");
}

function toggleTheme() {
  // En v.10 la estación queda blindada en Luxury Organic Dark
  showToast("Estación bloqueada en Modo Dark Oficial");
}

// ==========================================================================
// Control de Ayuda Interactiva (?) en Tarjetas y Campos
// ==========================================================================
function toggleCardHelp(helpId) {
  const drawer = document.getElementById(helpId);
  if (!drawer) return;
  drawer.classList.toggle("hidden");
  if (window.lucide) window.lucide.createIcons();
}

function toggleFieldHelp(helpId) {
  const el = document.getElementById(helpId);
  if (!el) return;
  el.classList.toggle("hidden");
  if (window.lucide) window.lucide.createIcons();
}

// ==========================================================================
// Control de Operador Activo (👤 Santiago Cholbi vs 👤 Juan Pablo)
// ==========================================================================
function setOperator(operatorName) {
  const op = operatorName || "Santiago Cholbi";
  store.update(s => ({
    ...s,
    operator: op
  }));
  try { localStorage.setItem("lbm_operator", op); } catch (e) {}
  updateOperatorUI(op);
  showToast(`Operador activo: ${op}`);
}

function updateOperatorUI(operator) {
  const select = document.getElementById("select-operator");
  if (select && operator) {
    select.value = operator;
  }
}

// ==========================================================================
// Control de Modo Dual (🎉 Particular vs 📋 Event Partner / Empresa B2B)
// ==========================================================================
function setExperienceMode(mode) {
  store.update(s => ({
    ...s,
    mode
  }));
  updateExperienceModeUI(mode);
  showToast(`Modo cambiado: ${mode === "novios" ? "Cliente Particular / Mi Evento 🎉" : "Event Partner / Empresa B2B 📋"}`);
}

function updateExperienceModeUI(mode) {
  const btnNovios = document.getElementById("btn-mode-novios");
  const btnPlanner = document.getElementById("btn-mode-planner");
  const badgeInfo = document.getElementById("mode-badge-info");

  if (btnNovios && btnPlanner) {
    if (mode === "planner") {
      btnNovios.className = "px-3 py-1 rounded-lg font-bold text-xs transition flex items-center gap-1.5 text-gray-400 hover:text-white cursor-pointer";
      btnPlanner.className = "px-3 py-1 rounded-lg font-bold text-xs transition flex items-center gap-1.5 bg-slate-200 text-black shadow-sm cursor-pointer";
      if (badgeInfo) {
        badgeInfo.innerHTML = `<i data-lucide="file-spreadsheet" class="w-3.5 h-3.5 text-blue-400"></i><span>Modo Profesional / B2B: Especificaciones técnicas Yamaha DXR12, Soundcraft 24ch y comisiones de Event Partner</span>`;
      }
    } else {
      btnNovios.className = "px-3 py-1 rounded-lg font-bold text-xs transition flex items-center gap-1.5 bg-slate-200 text-black shadow-sm cursor-pointer";
      btnPlanner.className = "px-3 py-1 rounded-lg font-bold text-xs transition flex items-center gap-1.5 text-gray-400 hover:text-white cursor-pointer";
      if (badgeInfo) {
        badgeInfo.innerHTML = `<i data-lucide="shield-check" class="w-3.5 h-3.5 text-emerald-400"></i><span>Catálogo y tarifas oficiales 2027 • Bodas, Corporativos y Fiestas Privadas</span>`;
      }
    }
  }
  if (window.lucide) window.lucide.createIcons();
}

// ==========================================================================
// Control de Modo de Fecha (🗓️ Flexible vs 📅 Exacta)
// ==========================================================================
function setDateMode(dateMode) {
  store.update(s => ({
    ...s,
    event: { ...s.event, dateMode }
  }));
  updateDateModeUI(dateMode);
}

function updateDateModeUI(dateMode) {
  const containerFlex = document.getElementById("container-date-flexible");
  const containerExact = document.getElementById("container-date-exact");
  const btnFlex = document.getElementById("btn-date-flexible");
  const btnExact = document.getElementById("btn-date-exact");

  if (dateMode === "exact") {
    if (containerFlex) containerFlex.classList.add("hidden");
    if (containerExact) containerExact.classList.remove("hidden");
    if (btnFlex) btnFlex.className = "px-2.5 py-1 rounded-md text-gray-400 hover:text-white cursor-pointer";
    if (btnExact) btnExact.className = "px-2.5 py-1 rounded-md font-bold text-slate-100 bg-slate-200/20 cursor-pointer";
  } else {
    if (containerFlex) containerFlex.classList.remove("hidden");
    if (containerExact) containerExact.classList.add("hidden");
    if (btnFlex) btnFlex.className = "px-2.5 py-1 rounded-md font-bold text-slate-100 bg-slate-200/20 cursor-pointer";
    if (btnExact) btnExact.className = "px-2.5 py-1 rounded-md text-gray-400 hover:text-white cursor-pointer";
  }
}

// ==========================================================================
// Control de Checklist Logístico & Dietas de Staff (Paso 4)
// ==========================================================================
function setLogisticsOption(field, value) {
  store.update(s => ({
    ...s,
    logistics: {
      ...s.logistics,
      [field]: value
    }
  }));
  updateLogisticsButtonsUI(store.getState().logistics);
}

function changeStaffMeals(delta) {
  const current = store.getState().logistics?.staffMealsCount ?? 3;
  const next = Math.max(0, Math.min(20, current + delta));
  store.update(s => ({
    ...s,
    logistics: {
      ...s.logistics,
      staffMealsCount: next,
      staffMeal: next > 0 ? "confirmed" : s.logistics.staffMeal
    }
  }));
  updateLogisticsButtonsUI(store.getState().logistics);
}

function onStaffMealsInput() {
  const input = document.getElementById("input-staff-meals-count");
  if (!input) return;
  const val = parseInt(input.value, 10);
  const safeVal = isNaN(val) ? 0 : Math.max(0, Math.min(20, val));
  store.update(s => ({
    ...s,
    logistics: {
      ...s.logistics,
      staffMealsCount: safeVal,
      staffMeal: safeVal > 0 ? "confirmed" : s.logistics.staffMeal
    }
  }));
}

function updateLogisticsButtonsUI(logistics) {
  if (!logistics) return;

  // Actualizar input numérico de menús de staff
  const staffMealsInput = document.getElementById("input-staff-meals-count");
  if (staffMealsInput && logistics.staffMealsCount !== undefined) {
    staffMealsInput.value = logistics.staffMealsCount.toString();
  }

  // Acceso
  ["direct", "distance", "stairs"].forEach(val => {
    const btn = document.getElementById(`btn-log-access-${val}`);
    if (btn) {
      if (logistics.access === val) {
        btn.className = "p-2 rounded-lg border border-emerald-500 bg-emerald-500/15 text-emerald-300 font-bold text-center transition cursor-pointer";
      } else {
        btn.className = "p-2 rounded-lg border border-gray-800 bg-gray-950 text-gray-400 font-medium text-center transition cursor-pointer";
      }
    }
  });

  // Hora fin
  ["02:00", "03:00", "late"].forEach(val => {
    const key = val.replace(":", "");
    const btn = document.getElementById(`btn-log-partyEnd-${key}`);
    if (btn) {
      if (logistics.partyEnd === val) {
        btn.className = "p-2 rounded-lg border border-emerald-500 bg-emerald-500/15 text-emerald-300 font-bold text-center transition cursor-pointer";
      } else {
        btn.className = "p-2 rounded-lg border border-gray-800 bg-gray-950 text-gray-400 font-medium text-center transition cursor-pointer";
      }
    }
  });

  // Menú staff
  ["confirmed", "pending"].forEach(val => {
    const btn = document.getElementById(`btn-log-staffMeal-${val}`);
    if (btn) {
      if (logistics.staffMeal === val) {
        btn.className = "p-2 rounded-lg border border-emerald-500 bg-emerald-500/15 text-emerald-300 font-bold text-center transition cursor-pointer";
      } else {
        btn.className = "p-2 rounded-lg border border-gray-800 bg-gray-950 text-gray-400 font-medium text-center transition cursor-pointer";
      }
    }
  });

  // Plan B
  ["covered", "pending"].forEach(val => {
    const btn = document.getElementById(`btn-log-planB-${val}`);
    if (btn) {
      if (logistics.planB === val) {
        btn.className = "p-2 rounded-lg border border-emerald-500 bg-emerald-500/15 text-emerald-300 font-bold text-center transition cursor-pointer";
      } else {
        btn.className = "p-2 rounded-lg border border-gray-800 bg-gray-950 text-gray-400 font-medium text-center transition cursor-pointer";
      }
    }
  });
}

// ==========================================================================
// Cockpit de Entrada & Catálogo de Bandas (Paso 0)
// ==========================================================================
let activeAssignBandId = null;

function renderCockpitBands() {
  const container = document.getElementById("cockpit-bands-showcase");
  if (!container) return;

  container.innerHTML = CATALOG.curatedBands.map(b => {
    const stylesBadges = (b.styles || [b.genre]).slice(0, 3).map(s => 
      `<span class="text-[10px] px-2 py-0.5 rounded-md bg-gray-800/90 text-gray-200 border border-gray-700/60 font-medium">${s}</span>`
    ).join("");

    const formatsBadges = (b.formats || []).map(f =>
      `<span class="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-200/10 text-slate-300 border border-slate-300/20">${f}</span>`
    ).join(" ");

    return `
      <div class="glass-card rounded-2xl overflow-hidden border border-gray-800 hover:border-purple-500/50 transition-all duration-300 flex flex-col justify-between group shadow-xl hover:-translate-y-1">
        <div>
          <!-- Imagen oficial de la banda con overlay gradiente -->
          <div class="relative w-full h-44 overflow-hidden bg-gray-950">
            <img src="${b.image}" alt="${b.name}" class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500" loading="lazy" />
            <div class="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/30 to-transparent"></div>
            <div class="absolute top-2.5 right-2.5">
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/70 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
                ${b.genre.split(',')[0]}
              </span>
            </div>
            <div class="absolute bottom-2.5 left-3 right-3">
              <h4 class="text-base font-extrabold text-white drop-shadow-md">${b.name}</h4>
            </div>
          </div>

          <!-- Contenido descriptivo -->
          <div class="p-4 space-y-3">
            <p class="text-xs text-slate-200 font-medium italic leading-snug">
              "${b.tagline || b.description}"
            </p>
            <p class="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
              ${b.description}
            </p>

            <!-- Badges de Estilos -->
            <div class="flex flex-wrap gap-1 pt-1">
              ${stylesBadges}
            </div>

            <!-- Formaciones Disponibles -->
            <div class="pt-2 border-t border-gray-800/80 flex items-center justify-between text-[11px]">
              <span class="text-gray-400">Formatos:</span>
              <div class="flex flex-wrap gap-1 justify-end">${formatsBadges}</div>
            </div>
          </div>
        </div>

        <!-- Acciones de Tarjeta -->
        <div class="p-4 pt-0">
          <div class="pt-3 border-t border-gray-800/80 flex items-center justify-between gap-2">
            ${b.link ? `<a href="${b.link}" target="_blank" rel="noopener noreferrer" class="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition" title="Ver ficha en la web oficial">Web <i data-lucide="external-link" class="w-3 h-3"></i></a>` : '<span></span>'}
            <button type="button" onclick="window.app.openBandAssignmentModal('${b.id}')" class="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow cursor-pointer">
              <span>Elegir Banda</span>
              <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join("");

  if (window.lucide) window.lucide.createIcons();
}

function startRoute(routeName) {
  switch (routeName) {
    case "style": {
      setStep(0);
      const section = document.getElementById("cockpit-bands-section");
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
      }
      showToast("Explora las 7 bandas exclusivas con fotos y audios oficiales");
      break;
    }
    case "date": {
      setStep(1);
      setTimeout(() => {
        const inputLocation = document.getElementById("input-event-location");
        if (inputLocation) {
          inputLocation.scrollIntoView({ behavior: "smooth", block: "center" });
          inputLocation.focus();
        }
      }, 150);
      showToast("Comprueba disponibilidad y cobertura en Girona (0 € desplazamiento)");
      break;
    }
    case "moments": {
      setStep(1);
      setTimeout(() => {
        const momentsSection = document.getElementById("cb-moment-ceremony")?.closest("section") || document.getElementById("input-event-location");
        if (momentsSection) {
          momentsSection.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 150);
      showToast("Selecciona los momentos del evento que deseas cotizar");
      break;
    }
    case "planner": {
      setExperienceMode("planner");
      setStep(1);
      showToast("Modo Event Partner / B2B activado (15% comisión y riders Yamaha)");
      break;
    }
    default:
      setStep(1);
      break;
  }
}

function openBandAssignmentModal(bandId) {
  const band = CATALOG.curatedBands.find(b => b.id === bandId);
  if (!band) return;
  activeAssignBandId = bandId;

  const modal = document.getElementById("bandAssignmentModal");
  const title = document.getElementById("modal-band-title");
  const genre = document.getElementById("modal-band-genre");
  const img = document.getElementById("modal-band-img");
  const tagline = document.getElementById("modal-band-tagline");
  const momentsList = document.getElementById("modal-moments-list");

  if (title) title.textContent = `Asignar ${band.name}`;
  if (genre) genre.textContent = band.genre;
  if (img) {
    img.src = band.image;
    img.alt = band.name;
  }
  if (tagline) tagline.textContent = `"${band.tagline || band.description}"`;

  const currentState = store.getState();
  const idealMoments = band.idealFor || ["appetizer"];

  const momentLabels = {
    ceremony: { name: "Ceremonia", desc: "Rito civil o religioso con repertorio a medida (hasta 6 canciones a la carta)", defaultForm: "DUO" },
    appetizer: { name: "Aperitivo / Cóctel", desc: "Pase musical en directo para ambientar la llegada de invitados (90 min)", defaultForm: "TRIO" },
    party: { name: "Fiesta con Banda", desc: "Show bailable de gran energía y repertorio festivo", defaultForm: "QUARTET" }
  };

  let html = "";
  idealMoments.forEach((mKey, idx) => {
    const info = momentLabels[mKey];
    if (!info) return;

    // Obtener formaciones con soporte para este momento
    const availableFormations = (band.formatDetails || []).filter(fd => !fd.idealFor || fd.idealFor.includes(mKey));
    const formsToUse = availableFormations.length > 0 
      ? availableFormations 
      : CATALOG.formations.filter(f => band.formats.includes(f.id));

    const isAlreadyEnabled = currentState.moments[mKey]?.enabled && currentState.moments[mKey]?.bandId === band.id;
    // Si ninguna está activa, pre-seleccionamos la primera ideal como recomendación amigable
    const shouldCheck = isAlreadyEnabled || idx === 0;

    html += `
      <div class="p-3.5 rounded-xl border border-gray-800 bg-gray-900/60 hover:border-gray-700 transition space-y-2">
        <div class="flex items-start justify-between gap-2">
          <label class="flex items-start gap-2.5 cursor-pointer">
            <input type="checkbox" id="modal-cb-moment-${mKey}" class="mt-0.5 w-4 h-4 rounded text-purple-600 bg-gray-950 border-gray-700 cursor-pointer" ${shouldCheck ? "checked" : ""} />
            <div>
              <span class="text-xs font-bold text-white block">${info.name}</span>
              <p class="text-[11px] text-gray-400 mt-0.5">${info.desc}</p>
            </div>
          </label>
        </div>
        
        <div class="pl-6 pt-1 flex items-center gap-2 text-xs">
          <span class="text-[11px] text-gray-400">Formación:</span>
          <select id="modal-select-formation-${mKey}" class="bg-gray-950 border border-gray-700 text-white rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-purple-500">
            ${formsToUse.map(f => `
              <option value="${f.id}" ${f.id === (currentState.moments[mKey]?.formationId || info.defaultForm) ? "selected" : ""}>
                ${f.name} — ${f.price} € (${f.instruments})
              </option>
            `).join("")}
          </select>
        </div>
      </div>
    `;
  });

  if (momentsList) momentsList.innerHTML = html;
  if (modal) {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }
  if (window.lucide) window.lucide.createIcons();
}

function closeBandAssignmentModal() {
  const modal = document.getElementById("bandAssignmentModal");
  if (modal) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }
  activeAssignBandId = null;
}

function applyBandAssignment() {
  if (!activeAssignBandId) return;
  const band = CATALOG.curatedBands.find(b => b.id === activeAssignBandId);
  if (!band) return;

  const idealMoments = band.idealFor || ["appetizer"];
  let anySelected = false;

  store.update(s => {
    const moments = { ...s.moments };
    idealMoments.forEach(mKey => {
      const cb = document.getElementById(`modal-cb-moment-${mKey}`);
      const selectForm = document.getElementById(`modal-select-formation-${mKey}`);
      if (cb && cb.checked) {
        anySelected = true;
        moments[mKey] = {
          ...moments[mKey],
          enabled: true,
          bandId: band.id,
          formationId: selectForm ? selectForm.value : (moments[mKey]?.formationId || "TRIO")
        };
      }
    });
    return { ...s, moments };
  });

  closeBandAssignmentModal();

  if (anySelected) {
    showToast(`Banda ${band.name} aplicada a tu presupuesto`);
    renderMomentsConfig(store.getState());
    updateMomentCheckboxesUI(store.getState());
    setStep(2);
  } else {
    showToast(`Selecciona al menos un momento para asignar ${band.name}`);
  }
}

// ==========================================================================
// Navegación y Control de Pasos
// ==========================================================================
function setStep(stepNumber) {
  const state = store.getState();
  const maxStep = 5;
  if (stepNumber < 0 || stepNumber > maxStep) return;

  // Actualizar UI de paneles
  document.querySelectorAll(".wizard-step-panel").forEach(panel => {
    panel.classList.add("hidden");
  });
  const currentPanel = document.getElementById(`step-panel-${stepNumber}`);
  if (currentPanel) {
    currentPanel.classList.remove("hidden");
  }

  // Actualizar stepper superior (0 a 5)
  document.querySelectorAll(".stepper-nav-item, .stepper-item").forEach((item, index) => {
    item.classList.remove("active", "completed");
    if (index === stepNumber) {
      item.classList.add("active");
    } else if (index < stepNumber) {
      item.classList.add("completed");
    }
  });

  store.update(s => ({
    ...s,
    ui: { ...s.ui, currentStep: stepNumber }
  }));

  if (stepNumber === 0) {
    renderCockpitBands();
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
  if (window.lucide) window.lucide.createIcons();
}

function getMinEventDateStr() {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// ==========================================================================
// Paso 1: Tu Evento y Momentos
// ==========================================================================
function renderFormStep1(state) {
  const eventTitleInput = document.getElementById("input-event-title");
  const eventDateInput = document.getElementById("input-event-date");
  const eventSeasonSelect = document.getElementById("select-event-season");
  const eventLocationInput = document.getElementById("input-event-location");
  const eventGuestsInput = document.getElementById("input-event-guests");
  const eventTypeSelect = document.getElementById("select-event-type");

  if (eventTitleInput) eventTitleInput.value = state.event.title || "";
  
  if (eventDateInput) {
    const minDate = getMinEventDateStr();
    eventDateInput.min = minDate;
    if (state.event.date) {
      eventDateInput.value = state.event.date;
    } else {
      eventDateInput.value = "";
    }
    if (state.event.dateMode === "exact" && state.event.date) {
      updateDateValidationUI(state.event.date);
    }
  }

  if (eventSeasonSelect && state.event.dateSeason) {
    eventSeasonSelect.value = state.event.dateSeason;
  }

  if (eventLocationInput) eventLocationInput.value = state.event.location || "";
  if (eventGuestsInput) eventGuestsInput.value = state.event.guests !== undefined && state.event.guests !== null ? state.event.guests : "";
  if (eventTypeSelect) eventTypeSelect.value = state.event.type || "boda";

  updateDateModeUI(state.event.dateMode || "flexible");
  updateMomentCheckboxesUI(state);
}

function updateDateValidationUI(dateStr) {
  const hint = document.getElementById("date-validation-hint");
  if (!hint) return;

  if (!dateStr) {
    hint.textContent = "Antelación mínima requerida: 48 horas (2 días).";
    hint.className = "text-[11px] text-gray-400 mt-1 block";
    return;
  }

  const evaluation = RulesEngine.evaluateEventDate(dateStr);
  if (!evaluation.isValid) {
    hint.textContent = `⚠ ${evaluation.message}`;
    hint.className = "text-[11px] text-rose-400 font-semibold mt-1 block";
  } else {
    hint.textContent = "✓ Fecha válida (mínimo 48h de antelación para logística técnica)";
    hint.className = "text-[11px] text-emerald-400 font-semibold mt-1 block";
  }
}

function updateMomentCheckboxesUI(state) {
  ["ceremony", "appetizer", "dinner", "party"].forEach(mKey => {
    const cb = document.getElementById(`cb-moment-${mKey}`);
    const card = document.getElementById(`card-moment-${mKey}`);
    const isEnabled = state.moments[mKey] && state.moments[mKey].enabled;
    if (cb) cb.checked = !!isEnabled;
    if (card) {
      if (isEnabled) {
        card.classList.add("active");
      } else {
        card.classList.remove("active");
      }
    }
  });
}

function onEventInput() {
  const title = document.getElementById("input-event-title")?.value || "";
  let date = document.getElementById("input-event-date")?.value || "";
  const dateSeason = document.getElementById("select-event-season")?.value || "Verano 2027 (Junio - Septiembre)";
  const location = document.getElementById("input-event-location")?.value || "";
  const guests = parseInt(document.getElementById("input-event-guests")?.value, 10) || 0;
  const type = document.getElementById("select-event-type")?.value || "boda";

  if (store.getState().event.dateMode === "exact" && date) {
    updateDateValidationUI(date);
  }

  store.update(s => ({
    ...s,
    event: {
      ...s.event,
      type,
      title,
      date,
      dateSeason,
      location,
      guests
    }
  }));
}

function toggleMoment(mKey) {
  store.update(s => {
    const moments = { ...s.moments };
    if (!moments[mKey]) {
      moments[mKey] = { enabled: true };
    } else {
      moments[mKey] = {
        ...moments[mKey],
        enabled: !moments[mKey].enabled
      };
    }
    return { ...s, moments };
  });

  updateMomentCheckboxesUI(store.getState());
  renderMomentsConfig(store.getState());
}

function setMomentDuration(momentKey, duration) {
  store.update(s => {
    const moments = { ...s.moments };
    if (moments[momentKey]) {
      moments[momentKey] = {
        ...moments[momentKey],
        duration: parseInt(duration, 10)
      };
    }
    return { ...s, moments };
  });
  renderMomentsConfig(store.getState());
}

function changeExtraSongs(delta) {
  store.update(s => {
    const current = s.extraSongs?.count || 0;
    const next = Math.max(0, Math.min(20, current + delta));
    return {
      ...s,
      extraSongs: { count: next }
    };
  });
  renderMomentsConfig(store.getState());
}

// ==========================================================================
// Paso 2: Configuración de los Momentos Seleccionados
// ==========================================================================
function renderMomentsConfig(state) {
  const container = document.getElementById("moments-config-container");
  if (!container) return;

  let html = "";
  const { ceremony, appetizer, dinner, party } = state.moments;

  const anyActive = (ceremony && ceremony.enabled) || (appetizer && appetizer.enabled) || (dinner && dinner.enabled) || (party && party.enabled);

  if (!anyActive) {
    container.innerHTML = `
      <div class="p-8 rounded-2xl bg-gray-900/40 border border-gray-800 text-center space-y-3">
        <div class="p-3 rounded-full bg-slate-200/10 text-slate-300 w-12 h-12 mx-auto flex items-center justify-center">
          <i data-lucide="music" class="w-6 h-6"></i>
        </div>
        <h4 class="text-sm font-bold text-white">No has seleccionado momentos musicales todavía</h4>
        <p class="text-xs text-gray-400 max-w-md mx-auto">Regresa al Paso 1 para marcar la Ceremonia, el Aperitivo, la Cena o la Fiesta, o carga un caso de ejemplo arriba.</p>
        <button onclick="window.app.setStep(1)" class="px-4 py-2 rounded-xl bg-slate-200 text-black font-bold text-xs cursor-pointer">
          Ir al Paso 1 (Tu Evento)
        </button>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  // 1. Bloque Ceremonia
  if (ceremony && ceremony.enabled) {
    html += `
      <section class="glass-panel rounded-2xl p-6 shadow-xl space-y-4 border-l-4 border-l-amber-500">
        <div class="flex items-center justify-between pb-3 border-b border-gray-800">
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <i data-lucide="church" class="w-5 h-5"></i>
            </div>
            <div>
              <h3 class="text-base font-bold text-white">1. Música para la Ceremonia</h3>
              <p class="text-xs text-gray-400">Entrada, votos matrimoniales, momentos solemnes y salida</p>
            </div>
          </div>
          <span class="text-xs px-2.5 py-1 rounded-full bg-amber-400/10 text-amber-300 font-semibold border border-amber-400/20">Fase Activa</span>
        </div>

        <div class="space-y-2">
          <div class="flex items-center">
            <label class="block text-xs font-semibold text-gray-300 uppercase tracking-wider">Elige el Formato Musical</label>
            <button type="button" onclick="window.app.toggleFieldHelp('help-ceremony-formation')" class="btn-field-help" title="Ayuda sobre formato">?</button>
          </div>
          <div id="help-ceremony-formation" class="field-help-hint hidden">
            <span>Número de músicos en escena durante el rito. Dúo o Trío ofrecen el balance ideal entre solemnidad y versatilidad acústica.</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            ${renderFormationCards("ceremony", ceremony.formationId, ["SOLO", "DUO", "TRIO", "QUARTET"])}
          </div>
        </div>

        <div class="space-y-2 pt-2">
          <div class="flex items-center">
            <label class="block text-xs font-semibold text-gray-300 uppercase tracking-wider">Estilo o Banda Sugerida</label>
            <button type="button" onclick="window.app.toggleFieldHelp('help-ceremony-band')" class="btn-field-help" title="Ayuda sobre estilo">?</button>
          </div>
          <div id="help-ceremony-band" class="field-help-hint hidden">
            <span>Grupos exclusivos de Live Bands Music para ceremonia: clásico/cuerdas Vienna Brava, góspel Gospel On, boleros Latin Birds o jazz elegante Jazz de Copes Dúo.</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            ${renderCuratedBandChips("ceremony", ceremony.bandId, ["vienna-brava", "gospel-on", "latin-birds", "jazz-de-copes"])}
          </div>
        </div>

        <!-- Selector de Duración -->
        <div class="space-y-2 pt-2 border-t border-gray-800/80">
          <div class="flex items-center justify-between text-xs">
            <div class="flex items-center">
              <span class="text-gray-400 font-medium">Duración de la música en rito:</span>
              <button type="button" onclick="window.app.toggleFieldHelp('help-ceremony-duration')" class="btn-field-help" title="Ayuda sobre duración">?</button>
            </div>
            <div class="inline-flex rounded-lg p-0.5 bg-gray-950 border border-gray-800 text-[11px]">
              <button type="button" onclick="window.app.setMomentDuration('ceremony', 60)" class="px-2.5 py-1 rounded-md transition cursor-pointer ${(!ceremony.duration || ceremony.duration === 60) ? 'font-bold text-slate-100 bg-slate-200/20' : 'text-gray-400 hover:text-white'}">
                60 min (Estándar)
              </button>
              <button type="button" onclick="window.app.setMomentDuration('ceremony', 90)" class="px-2.5 py-1 rounded-md transition cursor-pointer ${(ceremony.duration === 90) ? 'font-bold text-slate-100 bg-slate-200/20' : 'text-gray-400 hover:text-white'}">
                90 min (Extensa)
              </button>
            </div>
          </div>
          <div id="help-ceremony-duration" class="field-help-hint hidden">
            <span>60 min cubre perfectamente la llegada de invitados, rito y firmas. 90 min si la ceremonia incluye aperitivo previo de bienvenida o fotos extendidas.</span>
          </div>
        </div>
      </section>
    `;
  }

  // 2. Bloque Aperitivo / Cóctel
  if (appetizer && appetizer.enabled) {
    html += `
      <section class="glass-panel rounded-2xl p-6 shadow-xl space-y-4 border-l-4 border-l-emerald-500">
        <div class="flex items-center justify-between pb-3 border-b border-gray-800">
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <i data-lucide="wine" class="w-5 h-5"></i>
            </div>
            <div>
              <h3 class="text-base font-bold text-white">2. Banda en Vivo para Cóctel / Aperitivo</h3>
              <p class="text-xs text-gray-400">Pase musical dinámico con descansos amenizados</p>
            </div>
          </div>
          <span class="text-xs px-2.5 py-1 rounded-full bg-emerald-400/10 text-emerald-300 font-semibold border border-emerald-400/20">Fase Activa</span>
        </div>

        <div class="space-y-2">
          <div class="flex items-center">
            <label class="block text-xs font-semibold text-gray-300 uppercase tracking-wider">Elige la Formación de la Banda</label>
            <button type="button" onclick="window.app.toggleFieldHelp('help-appetizer-formation')" class="btn-field-help" title="Ayuda sobre formación">?</button>
          </div>
          <div id="help-appetizer-formation" class="field-help-hint hidden">
            <span>Trío, Cuarteto o Quinteto son las formaciones más demandadas para ambientar cócteles de 80 a 250 invitados con presencia y ritmo envolvente.</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            ${renderFormationCards("appetizer", appetizer.formationId, ["DUO", "TRIO", "QUARTET", "QUINTET", "SEXTET", "OCTET"])}
          </div>
        </div>

        <div class="space-y-2 pt-2">
          <div class="flex items-center">
            <label class="block text-xs font-semibold text-gray-300 uppercase tracking-wider">Estilo o Banda Representativa</label>
            <button type="button" onclick="window.app.toggleFieldHelp('help-appetizer-band')" class="btn-field-help" title="Ayuda sobre banda">?</button>
          </div>
          <div id="help-appetizer-band" class="field-help-hint hidden">
            <span>Elige la sonoridad para tus invitados: Pop bailable (Sweet Planet), Rumba catalana / Pop festivo (The Guitar Kings), Gypsy Jazz / Swing (Jazz de Copes) o Pop-Rock (Rever Queen).</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            ${renderCuratedBandChips("appetizer", appetizer.bandId, ["the-guitar-kings", "jazz-de-copes", "sweet-planet", "rever-queen"])}
          </div>
        </div>

        <!-- Selector de Duración -->
        <div class="space-y-2 pt-2 border-t border-gray-800/80">
          <div class="flex items-center justify-between text-xs">
            <div class="flex items-center">
              <span class="text-gray-400 font-medium">Duración del pase en directo:</span>
              <button type="button" onclick="window.app.toggleFieldHelp('help-appetizer-duration')" class="btn-field-help" title="Ayuda sobre duración">?</button>
            </div>
            <div class="inline-flex rounded-lg p-0.5 bg-gray-950 border border-gray-800 text-[11px]">
              <button type="button" onclick="window.app.setMomentDuration('appetizer', 90)" class="px-2.5 py-1 rounded-md transition cursor-pointer ${(!appetizer.duration || appetizer.duration === 90) ? 'font-bold text-slate-100 bg-slate-200/20' : 'text-gray-400 hover:text-white'}">
                90 min (Estándar)
              </button>
              <button type="button" onclick="window.app.setMomentDuration('appetizer', 60)" class="px-2.5 py-1 rounded-md transition cursor-pointer ${(appetizer.duration === 60) ? 'font-bold text-slate-100 bg-slate-200/20' : 'text-gray-400 hover:text-white'}">
                60 min (Corto)
              </button>
            </div>
          </div>
          <div id="help-appetizer-duration" class="field-help-hint hidden">
            <span>90 min es el estándar para cubrir todo el aperitivo con micro-pausas dinámicas. 60 min para eventos corporativos o cócteles rápidos.</span>
          </div>
        </div>
      </section>
    `;
  }

  // 3. Bloque Cena (Soporte Técnico para Discursos y Momentos Clave)
  const isDinnerEnabled = !!dinner?.enabled;
  const extraDinner = CATALOG.extras.dinnerSpeech;
  html += `
    <section class="glass-panel rounded-2xl p-6 shadow-xl space-y-4 border-l-4 ${isDinnerEnabled ? 'border-l-purple-500 bg-purple-950/10' : 'border-l-gray-700 opacity-90'} transition-all">
      <div class="flex items-center justify-between pb-3 border-b border-gray-800">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-xl ${isDinnerEnabled ? 'bg-purple-500/10 text-purple-400' : 'bg-gray-800 text-gray-400'}">
            <i data-lucide="utensils" class="w-5 h-5"></i>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-base font-bold text-white">3. Cena / Banquete (Soporte Técnico)</h3>
              <button type="button" onclick="window.app.toggleFieldHelp('help-step2-dinner')" class="btn-field-help" title="Ayuda sobre cena">?</button>
              <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700">Servicio Opcional</span>
            </div>
            <p class="text-xs text-gray-400">Micrófonos para parlamentos, discursos emotivos y música de momentos clave</p>
          </div>
        </div>
        <div class="text-right">
          <span class="text-xs px-2.5 py-1 rounded-full ${isDinnerEnabled ? 'bg-purple-400/10 text-purple-300 border-purple-400/20' : 'bg-gray-800 text-gray-400 border-gray-700'} font-semibold border">
            ${extraDinner.price} €
          </span>
        </div>
      </div>

      <div id="help-step2-dinner" class="field-help-hint hidden">
        <span>Sonorización ambiental de fondo y 2 micrófonos inalámbricos profesionales para discursos de invitados, brindis y momentos emotivos (150 €).</span>
      </div>

      <div class="bg-gray-900/60 p-4 rounded-xl border border-gray-800 text-xs text-gray-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-start gap-3">
          <i data-lucide="mic" class="w-5 h-5 text-purple-400 mt-0.5 shrink-0"></i>
          <div>
            <span class="font-bold text-white text-sm block">${extraDinner.name}</span>
            <p class="text-gray-400 mt-1">${extraDinner.description}</p>
          </div>
        </div>
        <div class="flex items-center gap-3 self-end sm:self-center shrink-0">
          <button type="button" onclick="window.app.toggleDinnerSpeech()" class="px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${isDinnerEnabled ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30' : 'bg-[#e2e8f0] text-black hover:bg-[#cbd5e1]'}">
            <i data-lucide="${isDinnerEnabled ? 'minus-circle' : 'plus-circle'}" class="w-4 h-4"></i>
            <span>${isDinnerEnabled ? 'Quitar de mi presupuesto' : 'Añadir soporte de Cena (+150 €)'}</span>
          </button>
        </div>
      </div>
    </section>
  `;

  // 4. Bloque Fiesta & DJ (Sesión DJ Profesional + Extras Opcionales)
  const isPartyEnabled = !!party?.enabled;
  const djExtra = CATALOG.extras.djParty;
  const perimExtra = CATALOG.extras.perimeterLight;
  html += `
    <section class="glass-panel rounded-2xl p-6 shadow-xl space-y-4 border-l-4 ${isPartyEnabled ? 'border-l-pink-500 bg-pink-950/10' : 'border-l-gray-700 opacity-90'} transition-all">
      <div class="flex items-center justify-between pb-3 border-b border-gray-800">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-xl ${isPartyEnabled ? 'bg-pink-500/10 text-pink-400' : 'bg-gray-800 text-gray-400'}">
            <i data-lucide="disc" class="w-5 h-5"></i>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-base font-bold text-white">4. Fiesta, DJ & Barra Libre</h3>
              <button type="button" onclick="window.app.toggleFieldHelp('help-step2-party')" class="btn-field-help" title="Ayuda sobre fiesta">?</button>
              <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700">Servicio Opcional</span>
            </div>
            <p class="text-xs text-gray-400">Sesión DJ profesional para el baile y extras de iluminación</p>
          </div>
        </div>
        <div class="text-right">
          <span class="text-xs px-2.5 py-1 rounded-full ${isPartyEnabled ? 'bg-pink-400/10 text-pink-300 border-pink-400/20' : 'bg-gray-800 text-gray-400 border-gray-700'} font-semibold border">
            ${djExtra.price} €
          </span>
        </div>
      </div>

      <div id="help-step2-party" class="field-help-hint hidden">
        <span>3,5 horas de sesión DJ profesional con cabina, control directo de pista y animación musical completa (500 €).</span>
      </div>

      <div class="bg-gray-900/60 p-4 rounded-xl border border-gray-800 text-xs text-gray-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-start gap-3">
          <i data-lucide="headphones" class="w-5 h-5 text-pink-400 mt-0.5 shrink-0"></i>
          <div>
            <span class="font-bold text-white text-sm block">${djExtra.name}</span>
            <p class="text-gray-400 mt-1">${djExtra.description}</p>
          </div>
        </div>
        <div class="flex items-center gap-3 self-end sm:self-center shrink-0">
          <button type="button" onclick="window.app.togglePartyDj()" class="px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${isPartyEnabled ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30' : 'bg-[#e2e8f0] text-black hover:bg-[#cbd5e1]'}">
            <i data-lucide="${isPartyEnabled ? 'minus-circle' : 'plus-circle'}" class="w-4 h-4"></i>
            <span>${isPartyEnabled ? 'Quitar DJ de mi presupuesto' : 'Añadir sesión DJ para fiesta (+500 €)'}</span>
          </button>
        </div>
      </div>

      <!-- Extra opcional iluminación perimetral -->
      <div class="p-4 rounded-xl border ${party?.perimeterLight ? 'border-[#e2e8f0]/50 bg-cyan-500/10' : 'border-gray-800 bg-gray-900/40'} transition flex items-center justify-between">
        <div class="flex items-center gap-3">
          <input type="checkbox" id="cb-party-perimeter" ${party?.perimeterLight ? 'checked' : ''} onchange="window.app.togglePartyPerimeter()" class="w-4 h-4 rounded text-[#e2e8f0] bg-gray-950 border-gray-700 cursor-pointer">
          <div>
            <div class="flex items-center">
              <label for="cb-party-perimeter" class="text-xs font-bold text-white cursor-pointer block">${perimExtra.name}</label>
              <button type="button" onclick="window.app.toggleFieldHelp('help-step2-perim')" class="btn-field-help" title="Ayuda sobre iluminación perimetral">?</button>
            </div>
            <p class="text-[11px] text-gray-400">${perimExtra.description}</p>
          </div>
        </div>
        <span class="text-xs font-mono font-bold text-slate-100">+${perimExtra.price} €</span>
      </div>
      <div id="help-step2-perim" class="field-help-hint hidden">
        <span>Focos LED inalámbricos RGB para bañar las paredes de la sala y crear una atmósfera inmersiva durante el baile (+180 €).</span>
      </div>
    </section>
  `;

  // 5. Bloque Repertorio Extra a la Carta (30 € / tema)
  const extraCount = state.extraSongs?.count || 0;
  html += `
    <section class="glass-panel rounded-2xl p-6 shadow-xl space-y-3 border-l-4 border-l-cyan-500">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-800">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
            <i data-lucide="music-2" class="w-5 h-5"></i>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-base font-bold text-white">5. Canciones Extra Fuera de Repertorio</h3>
              <button type="button" onclick="window.app.toggleFieldHelp('help-step2-extras')" class="btn-field-help" title="Ayuda sobre canciones extra">?</button>
              <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">30 € / tema</span>
            </div>
            <p class="text-xs text-gray-400">Ceremonia incluye hasta 6 temas y Aperitivo 3 temas. Añade canciones especiales si deseas arreglo exclusivo.</p>
          </div>
        </div>
        <div class="flex items-center gap-2.5 self-end sm:self-center">
          <button type="button" onclick="window.app.changeExtraSongs(-1)" class="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-bold text-base flex items-center justify-center transition cursor-pointer">−</button>
          <span class="font-mono font-bold text-base text-cyan-300 w-8 text-center">${extraCount}</span>
          <button type="button" onclick="window.app.changeExtraSongs(1)" class="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-bold text-base flex items-center justify-center transition cursor-pointer">+</button>
        </div>
      </div>
      <div id="help-step2-extras" class="field-help-hint hidden">
        <span>Canciones a la carta que los músicos arreglan y ensayan especialmente para tu evento si no figuran en su repertorio oficial habitual (30 € / tema).</span>
      </div>
    </section>
  `;

  container.innerHTML = html;
  if (window.lucide) window.lucide.createIcons();
}

function renderFormationCards(momentKey, selectedFormationId, allowedIds) {
  const formations = CATALOG.formations.filter(f => allowedIds.includes(f.id));
  return formations.map(f => {
    const isSelected = selectedFormationId === f.id;
    const recommendation = f.paxRecommendation || f.description || "";
    return `
      <div onclick="window.app.selectFormation('${momentKey}', '${f.id}')" class="selectable-card glass-card rounded-xl p-3.5 border ${isSelected ? 'active' : 'border-gray-800'} flex flex-col justify-between cursor-pointer">
        <div>
          <div class="flex items-center justify-between mb-1">
            <span class="font-bold text-white text-xs">${f.name}</span>
            <span class="text-[10px] font-mono font-bold text-slate-100">${f.price} €</span>
          </div>
          <p class="text-[11px] text-gray-300 font-medium">${f.instruments}</p>
          <p class="text-[10px] text-gray-400 mt-1">${recommendation}</p>
        </div>
        <div class="mt-3 pt-2 border-t border-gray-800 flex justify-end">
          <span class="w-3.5 h-3.5 rounded-full border border-gray-600 flex items-center justify-center card-radio-indicator">
            ${isSelected ? '<span class="w-1.5 h-1.5 rounded-full bg-gray-950"></span>' : ''}
          </span>
        </div>
      </div>
    `;
  }).join("");
}

function renderCuratedBandChips(momentKey, selectedBandId, allowedIds) {
  const bands = CATALOG.curatedBands.filter(b => allowedIds.includes(b.id));
  return bands.map(b => {
    const isSelected = selectedBandId === b.id;
    const stylesBadges = (b.styles || [b.genre]).slice(0, 2).map(s => 
      `<span class="text-[9px] px-1.5 py-0.5 rounded bg-gray-800/80 text-gray-300 border border-gray-700/60 font-medium">${s}</span>`
    ).join("");

    const imgHtml = b.image ? `
      <div class="relative w-full h-24 rounded-lg overflow-hidden mb-2 bg-gray-950 border border-gray-800/80">
        <img src="${b.image}" alt="${b.name}" class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300" loading="lazy" />
        <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent"></div>
        <div class="absolute bottom-1.5 left-2 right-2 flex items-center justify-between">
          <span class="text-[11px] font-bold text-white drop-shadow">${b.name}</span>
          <span class="text-[9px] font-semibold text-emerald-300 bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-sm">${b.genre.split(',')[0]}</span>
        </div>
      </div>
    ` : `
      <div class="flex items-center justify-between mb-1">
        <strong class="text-xs text-white">${b.name}</strong>
        <span class="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-300">${b.genre}</span>
      </div>
    `;

    return `
      <div onclick="window.app.selectCuratedBand('${momentKey}', '${b.id}')" class="selectable-card glass-card rounded-xl p-2.5 border group transition ${isSelected ? 'active border-emerald-500/80 bg-emerald-950/25 ring-1 ring-emerald-500' : 'border-gray-800 hover:border-gray-700'} cursor-pointer flex flex-col justify-between">
        <div>
          ${imgHtml}
          <p class="text-[10px] text-gray-400 line-clamp-2 leading-relaxed">${b.tagline || b.description}</p>
        </div>
        <div class="mt-2.5 pt-2 border-t border-gray-800/80 flex flex-wrap gap-1 items-center justify-between">
          <div class="flex flex-wrap gap-1">${stylesBadges}</div>
          ${b.link ? `<a href="${b.link}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()" class="text-[9px] text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5 font-semibold" title="Web oficial">Web <i data-lucide="external-link" class="w-2.5 h-2.5"></i></a>` : ''}
        </div>
      </div>
    `;
  }).join("");
}

function selectFormation(momentKey, formationId) {
  store.update(s => {
    const moments = { ...s.moments };
    if (moments[momentKey]) {
      moments[momentKey] = {
        ...moments[momentKey],
        formationId
      };
    }
    return { ...s, moments };
  });
  renderMomentsConfig(store.getState());
}

function selectCuratedBand(momentKey, bandId) {
  store.update(s => {
    const moments = { ...s.moments };
    if (moments[momentKey]) {
      moments[momentKey] = {
        ...moments[momentKey],
        bandId
      };
    }
    return { ...s, moments };
  });
  renderMomentsConfig(store.getState());
}

function togglePartyPerimeter() {
  store.update(s => {
    const party = s.moments.party ? { ...s.moments.party } : { enabled: true };
    party.perimeterLight = !party.perimeterLight;
    return {
      ...s,
      moments: { ...s.moments, party }
    };
  });
  renderMomentsConfig(store.getState());
}

// ==========================================================================
// Paso 3: Infraestructura Técnica y Tech Packs
// ==========================================================================
function renderTechOptions(state) {
  const container = document.getElementById("tech-options-container");
  if (!container) return;

  const { tech } = state;
  const isPackMode = tech.mode === "pack";

  let html = `
    <!-- Selector de Modalidad Técnica -->
    <div class="flex flex-col items-center max-w-lg mx-auto mb-5 space-y-2">
      <div class="flex items-center justify-center p-1.5 bg-gray-900/90 rounded-2xl border border-gray-800 w-full">
        <button onclick="window.app.selectTechMode('pack')" class="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${isPackMode ? 'bg-[#e2e8f0] text-black shadow-md' : 'text-gray-400 hover:text-white'}">
          <i data-lucide="sparkles" class="w-4 h-4 text-emerald-600"></i>
          <span>Packs Sonido + Iluminación (Ahorro)</span>
        </button>
        <button onclick="window.app.selectTechMode('individual')" class="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${!isPackMode ? 'bg-[#e2e8f0] text-black shadow-md' : 'text-gray-400 hover:text-white'}">
          <i data-lucide="sliders" class="w-4 h-4"></i>
          <span>Sonido y Luces por Separado</span>
        </button>
        <button type="button" onclick="window.app.toggleFieldHelp('help-tech-mode-info')" class="btn-field-help" title="Ayuda sobre modalidad técnica">?</button>
      </div>
      <div id="help-tech-mode-info" class="field-help-hint w-full hidden">
        <span><strong>Packs Combinados:</strong> Al contratar sonido e iluminación juntos, viajan en el mismo transporte y se instalan en un solo montaje técnico, bonificando entre 305 € y 425 € de descuento directo. <strong>Individual:</strong> Para eventos que ya cuentan con iluminación propia o precisan equipamiento a medida.</span>
      </div>
    </div>
  `;

  if (isPackMode) {
    // Modo Tech Packs Oficiales
    html += `
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        ${CATALOG.techPacks.map(pack => {
          const isSelected = tech.selectedPackId === pack.id;
          const helpHintText = pack.id === 'pack-basic'
            ? '2x Yamaha DXR12 + mesa + puente LED. Ideal para eventos hasta 120-150 personas.'
            : pack.id === 'pack-complete'
            ? 'Incluye refuerzo de subwoofers y microfonía para directos con batería o más de 150-200 asistentes.'
            : 'Infraestructura de gran formato con iluminación robotizada DMX y microfonía completa para eventos de alta exigencia.';
          return `
            <div onclick="window.app.selectTechPack('${pack.id}')" class="selectable-card glass-panel rounded-2xl p-5 border ${isSelected ? 'active' : 'border-gray-800'} flex flex-col justify-between space-y-4 cursor-pointer">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center">
                    <span class="text-xs font-bold text-[#e2e8f0]">${pack.name}</span>
                    <button type="button" onclick="event.stopPropagation(); window.app.toggleFieldHelp('help-pack-${pack.id}')" class="btn-field-help" title="Ayuda sobre ${pack.name}">?</button>
                  </div>
                  <span class="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Ahorras ${pack.savings} € (${pack.percentSavings || '25%'})
                  </span>
                </div>
                <div id="help-pack-${pack.id}" class="field-help-hint hidden mb-2">
                  <span>${helpHintText}</span>
                </div>
                <div class="flex items-baseline gap-2 mb-2">
                  <span class="text-2xl font-black font-mono text-white">${pack.price} €</span>
                  <span class="text-xs text-gray-500 line-through font-mono">${pack.separatePrice} € por separado</span>
                </div>
                <p class="text-xs text-emerald-200/90 font-medium mb-3">${pack.description}</p>
                
                <div class="space-y-1.5 text-[11px] border-t border-gray-800/80 pt-2.5">
                  <div class="text-gray-300">
                    <strong class="text-white">🔊 Sonido:</strong> ${pack.soundSummary || 'Altavoces Yamaha y microfonía'}
                  </div>
                  <div class="text-gray-300">
                    <strong class="text-white">💡 Iluminación:</strong> ${pack.lightSummary || 'Torres LED y cabezas móviles'}
                  </div>
                  <div class="text-gray-400 text-[10px] pt-1">
                    ✓ Incluye técnico dedicado de sonido y montaje
                  </div>
                </div>
              </div>

              <div class="pt-3 border-t border-gray-800 flex items-center justify-between text-xs">
                <span class="text-[10px] text-emerald-400 font-semibold">${isSelected ? '✓ Pack Seleccionado' : 'Hacer clic para elegir'}</span>
                <span class="w-4 h-4 rounded-full border border-gray-600 flex items-center justify-center card-radio-indicator">
                  ${isSelected ? '<span class="w-2 h-2 rounded-full bg-gray-950"></span>' : ''}
                </span>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  } else {
    // Modo Individual
    html += `
      <div class="space-y-6">
        <!-- Sonido -->
        <div class="space-y-3">
          <div class="flex items-center">
            <label class="block text-xs font-semibold text-gray-300 uppercase tracking-wider">Equipamiento de Sonorización</label>
            <button type="button" onclick="window.app.toggleFieldHelp('help-tech-indiv-sound')" class="btn-field-help" title="Ayuda sobre sonorización">?</button>
          </div>
          <div id="help-tech-indiv-sound" class="field-help-hint hidden">
            <span><strong>Sonorización bonificada:</strong> Al contratar grupo oficial LBM, la sonorización básica se bonifica al 50% (200 € en vez de 400 €). Para más de 200 PAX se recomienda Sonorización Completa (900 €) con refuerzo de subwoofers.</span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            ${CATALOG.soundSystems.map(sound => {
              const isSelected = tech.soundId === sound.id;
              return `
                <div onclick="window.app.selectIndividualSound('${sound.id}')" class="selectable-card glass-panel rounded-2xl p-4 border ${isSelected ? 'active' : 'border-gray-800'} flex flex-col justify-between cursor-pointer">
                  <div>
                    <div class="flex items-center justify-between mb-1">
                      <span class="font-bold text-white text-sm">${sound.name}</span>
                      <span class="font-mono font-bold text-[#e2e8f0] text-sm">${sound.price} €</span>
                    </div>
                    <p class="text-xs text-gray-300 mt-1">${sound.description}</p>
                    <p class="text-[11px] text-gray-500 mt-2">${sound.specs}</p>
                  </div>
                  <div class="mt-4 pt-2 border-t border-gray-800 flex justify-end">
                    <span class="w-4 h-4 rounded-full border border-gray-600 flex items-center justify-center card-radio-indicator">
                      ${isSelected ? '<span class="w-2 h-2 rounded-full bg-gray-950"></span>' : ''}
                    </span>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        </div>

        <!-- Iluminación -->
        <div class="space-y-3">
          <div class="flex items-center">
            <label class="block text-xs font-semibold text-gray-300 uppercase tracking-wider">Equipamiento de Iluminación</label>
            <button type="button" onclick="window.app.toggleFieldHelp('help-tech-indiv-light')" class="btn-field-help" title="Ayuda sobre iluminación">?</button>
          </div>
          <div id="help-tech-indiv-light" class="field-help-hint hidden">
            <span>Torres LED y puentes motorizados DMX para ambientar la zona de cóctel, cena o pista de baile según las dimensiones del espacio.</span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            ${CATALOG.lightSystems.map(light => {
              const isSelected = tech.lightId === light.id;
              return `
                <div onclick="window.app.selectIndividualLight('${light.id}')" class="selectable-card glass-panel rounded-2xl p-4 border ${isSelected ? 'active' : 'border-gray-800'} flex flex-col justify-between cursor-pointer">
                  <div>
                    <div class="flex items-center justify-between mb-1">
                      <span class="font-bold text-white text-sm">${light.name}</span>
                      <span class="font-mono font-bold text-[#e2e8f0] text-sm">${light.price} €</span>
                    </div>
                    <p class="text-xs text-gray-300 mt-1">${light.description}</p>
                    <p class="text-[11px] text-gray-500 mt-2">${light.specs}</p>
                  </div>
                  <div class="mt-4 pt-2 border-t border-gray-800 flex justify-end">
                    <span class="w-4 h-4 rounded-full border border-gray-600 flex items-center justify-center card-radio-indicator">
                      ${isSelected ? '<span class="w-2 h-2 rounded-full bg-gray-950"></span>' : ''}
                    </span>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        </div>
      </div>
    `;
  }

  container.innerHTML = html;
  if (window.lucide) window.lucide.createIcons();
}

function selectTechMode(mode) {
  store.update(s => {
    const tech = { ...s.tech, mode };
    if (mode === "pack") {
      tech.selectedPackId = tech.selectedPackId || "pack-basic";
    } else {
      tech.selectedPackId = null;
    }
    return { ...s, tech };
  });
  renderTechOptions(store.getState());
}

function selectTechPack(packId) {
  store.update(s => ({
    ...s,
    tech: {
      ...s.tech,
      mode: "pack",
      selectedPackId: packId
    }
  }));
  renderTechOptions(store.getState());
}

function selectIndividualSound(soundId) {
  store.update(s => ({
    ...s,
    tech: {
      ...s.tech,
      mode: "individual",
      selectedPackId: null,
      soundId
    }
  }));
  renderTechOptions(store.getState());
}

function selectIndividualLight(lightId) {
  store.update(s => ({
    ...s,
    tech: {
      ...s.tech,
      mode: "individual",
      selectedPackId: null,
      lightId
    }
  }));
  renderTechOptions(store.getState());
}

// ==========================================================================
// Reglas Acústicas y Políticas de Ubicación
// ==========================================================================
function checkAcousticRules(state) {
  const soundEvaluation = RulesEngine.evaluateSoundRequirement(state);
  const banner = document.getElementById("acoustic-warning-banner");
  const textElem = document.getElementById("acoustic-warning-text");

  if (banner && textElem) {
    if (soundEvaluation.isRequired) {
      banner.classList.remove("hidden");
      textElem.textContent = soundEvaluation.warningMessage;
      if (state.tech.mode === "individual" && state.tech.soundId === "none") {
        store.update(s => ({
          ...s,
          tech: { ...s.tech, soundId: "basic" }
        }));
      }
    } else {
      banner.classList.add("hidden");
    }
  }
}

function checkTravelPolicy(state) {
  const locEvaluation = RulesEngine.evaluateLocation(state.event.location);
  const badge = document.getElementById("location-policy-badge");
  if (badge) {
    badge.textContent = locEvaluation.message;
    if (locEvaluation.isGirona) {
      badge.className = "text-xs px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 block text-center";
    } else {
      badge.className = "text-xs px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20 block text-center";
    }
  }
}

// ==========================================================================
// Estación de Calibración de Descuentos (Control de Santiago)
// ==========================================================================
function onDiscountConfigChange() {
  const cbMulti = document.getElementById("cb-disc-multimoment");
  const cbOwnSound = document.getElementById("cb-disc-ownsound");
  const cbPlanner = document.getElementById("cb-disc-planner");
  const inputPlannerPct = document.getElementById("input-disc-planner-pct");
  const cbCustom = document.getElementById("cb-disc-custom");
  const selectCustomType = document.getElementById("select-disc-custom-type");
  const inputCustomVal = document.getElementById("input-disc-custom-val");
  const inputCustomReason = document.getElementById("input-disc-custom-reason");

  const multiMomentEnabled = cbMulti ? cbMulti.checked : true;
  const ownBandSoundEnabled = cbOwnSound ? cbOwnSound.checked : true;
  const plannerEnabled = cbPlanner ? cbPlanner.checked : false;
  const plannerPct = inputPlannerPct ? Math.max(0, parseFloat(inputPlannerPct.value) || 15) : 15;
  const customEnabled = cbCustom ? cbCustom.checked : false;
  const customType = selectCustomType ? selectCustomType.value : "amount";
  const customVal = inputCustomVal ? Math.max(0, parseFloat(inputCustomVal.value) || 0) : 0;
  const customReason = inputCustomReason ? inputCustomReason.value.trim() : "";

  store.update(s => ({
    ...s,
    discountsConfig: {
      multiMoment: { enabled: multiMomentEnabled },
      ownBandSound: { enabled: ownBandSoundEnabled },
      planner: { enabled: plannerEnabled, percent: plannerPct },
      custom: { enabled: customEnabled, type: customType, value: customVal, reason: customReason }
    }
  }));

  debouncedLogQuote(store.getState(), "discount_changed");
}

function updateDiscountsWorkstationUI(state) {
  const dCfg = state.discountsConfig || {};
  
  const cbMulti = document.getElementById("cb-disc-multimoment");
  const cbOwnSound = document.getElementById("cb-disc-ownsound");
  const cbPlanner = document.getElementById("cb-disc-planner");
  const inputPlannerPct = document.getElementById("input-disc-planner-pct");
  const cbCustom = document.getElementById("cb-disc-custom");
  const selectCustomType = document.getElementById("select-disc-custom-type");
  const inputCustomVal = document.getElementById("input-disc-custom-val");
  const inputCustomReason = document.getElementById("input-disc-custom-reason");

  if (cbMulti) cbMulti.checked = dCfg.multiMoment !== undefined ? dCfg.multiMoment.enabled : true;
  if (cbOwnSound) cbOwnSound.checked = dCfg.ownBandSound !== undefined ? dCfg.ownBandSound.enabled : true;
  if (cbPlanner) cbPlanner.checked = !!dCfg.planner?.enabled;
  if (inputPlannerPct && dCfg.planner?.percent !== undefined) inputPlannerPct.value = dCfg.planner.percent;
  if (cbCustom) cbCustom.checked = !!dCfg.custom?.enabled;
  if (selectCustomType && dCfg.custom?.type) selectCustomType.value = dCfg.custom.type;
  if (inputCustomVal && dCfg.custom?.value !== undefined) inputCustomVal.value = dCfg.custom.value;
  if (inputCustomReason && dCfg.custom?.reason !== undefined) inputCustomReason.value = dCfg.custom.reason;
}

// ==========================================================================
// Cálculo y Render de Resumen Financiero en Tiempo Real
// ==========================================================================
function renderPricingSummary(state) {
  const quote = PricingEngine.calculate(state);

  // Elementos de resumen Desktop
  const subtotalElem = document.getElementById("sum-subtotal");
  const discountsBox = document.getElementById("sum-discounts-box");
  const discountsCount = document.getElementById("sum-discounts-count-badge");
  const discountsItems = document.getElementById("sum-discounts-items");
  const discountsSubtotal = document.getElementById("sum-discounts-subtotal");
  const vatElem = document.getElementById("sum-vat");
  const totalElem = document.getElementById("sum-grand-total");
  const depositElem = document.getElementById("sum-deposit");
  const linesContainer = document.getElementById("summary-lines-list");
  const costPill = document.getElementById("sum-cost-per-guest-pill");

  // Móvil
  const mobileTotal = document.getElementById("mobile-bar-total");
  const mobileSubtotal = document.getElementById("mobile-bar-subtotal");
  const mobileDiscountsBox = document.getElementById("mobile-discounts-container");
  const mobileDiscountsList = document.getElementById("mobile-discounts-list");

  if (subtotalElem) subtotalElem.textContent = formatMoney(quote.subtotal);
  if (vatElem) vatElem.textContent = formatMoney(quote.vatAmount);
  if (totalElem) totalElem.textContent = formatMoney(quote.grandTotal);
  if (depositElem) depositElem.textContent = formatMoney(quote.bookingDepositAmount);

  if (costPill) {
    costPill.textContent = `${quote.costPerGuest > 0 ? quote.costPerGuest.toFixed(2) : "0,00"} € / pers.`;
  }

  // Renderizado discriminado de descuentos en Sidebar
  if (discountsBox) {
    if (quote.discounts && quote.discounts.length > 0) {
      discountsBox.classList.remove("hidden");
      if (discountsCount) discountsCount.textContent = `${quote.discounts.length}`;
      if (discountsSubtotal) discountsSubtotal.textContent = `-${formatMoney(quote.totalSavings)}`;
      if (discountsItems) {
        discountsItems.innerHTML = quote.discounts.map(d => `
          <div class="flex justify-between items-start py-0.5 border-b border-emerald-900/30 gap-2">
            <div class="flex-1 min-w-0">
              <span class="text-emerald-300 font-medium block truncate text-[11px]">${d.name || d.concept}</span>
            </div>
            <span class="font-mono font-bold text-emerald-400 text-[11px] shrink-0">-${formatMoney(d.amount)}</span>
          </div>
        `).join("");
      }
    } else {
      discountsBox.classList.add("hidden");
    }
  }

  // Drawer Móvil
  if (mobileDiscountsBox && mobileDiscountsList) {
    if (quote.discounts && quote.discounts.length > 0) {
      mobileDiscountsBox.classList.remove("hidden");
      mobileDiscountsList.innerHTML = quote.discounts.map(d => `
        <div class="flex justify-between items-center py-0.5 border-b border-emerald-900/30">
          <span class="text-emerald-300 text-xs">${d.name || d.concept}</span>
          <span class="font-mono font-bold text-emerald-400 text-xs">-${formatMoney(d.amount)}</span>
        </div>
      `).join("") + `
        <div class="flex justify-between items-center pt-1 font-bold text-emerald-300 text-xs">
          <span>Subtotal Descuentos:</span>
          <span class="font-mono text-emerald-400">-${formatMoney(quote.totalSavings)}</span>
        </div>
      `;
    } else {
      mobileDiscountsBox.classList.add("hidden");
    }
  }

  if (mobileTotal) mobileTotal.textContent = formatMoney(quote.grandTotal);
  if (mobileSubtotal) mobileSubtotal.textContent = `Base: ${formatMoney(quote.subtotal)}`;

  // Desglose línea a línea en sidebar
  if (linesContainer) {
    if (quote.lines.length === 0) {
      linesContainer.innerHTML = `<p class="text-xs text-gray-500 text-center py-3">Presupuesto inicial en blanco (0 €). Selecciona momentos para comenzar.</p>`;
    } else {
      linesContainer.innerHTML = quote.lines.map(line => `
        <div class="flex justify-between items-center text-xs text-gray-300 py-2 border-b border-gray-800/60 gap-2">
          <div class="flex-1 min-w-0 pr-1">
            <span class="font-semibold text-white block truncate leading-tight">${line.concept}</span>
            <span class="text-[10px] text-gray-400 block">${line.moment}</span>
          </div>
          <span class="font-mono font-bold text-[#e2e8f0] price-tag-untruncated">${formatMoney(line.price)}</span>
        </div>
      `).join("");
    }
  }

  // Paso 4: Render de tabla de resumen final
  renderStep4Table(quote, state);

  // Actualizar estación de trabajo y borrador de email
  updateDiscountsWorkstationUI(state);
  const emailPreview = document.getElementById("email-draft-preview");
  if (emailPreview) {
    emailPreview.value = generatePlainTextProposal(state);
  }
}

function renderStep4Table(quote, state) {
  const tbody = document.getElementById("step4-lines-tbody");
  const costGuestElem = document.getElementById("step4-cost-per-guest");
  const discountsContainer = document.getElementById("step4-discounts-container");
  const discountsList = document.getElementById("step4-discounts-list");

  if (costGuestElem) {
    costGuestElem.textContent = `${quote.costPerGuest > 0 ? quote.costPerGuest.toFixed(2) : "0,00"} € / comensal`;
  }

  if (discountsContainer && discountsList) {
    if (quote.discounts && quote.discounts.length > 0) {
      discountsContainer.classList.remove("hidden");
      discountsList.innerHTML = quote.discounts.map(d => `
        <div class="flex justify-between items-center py-1.5 border-b border-emerald-900/30">
          <div>
            <strong class="text-emerald-300 block text-xs">${d.name || d.concept}</strong>
            <span class="text-[11px] text-gray-400 block">${d.detail}</span>
          </div>
          <span class="font-mono font-bold text-emerald-400 shrink-0 pl-3 text-xs">-${formatMoney(d.amount)}</span>
        </div>
      `).join("") + `
        <div class="flex justify-between items-center pt-2.5 font-bold text-emerald-300 text-xs border-t border-emerald-800/50">
          <span>Subtotal Descuentos Aplicados:</span>
          <span class="font-mono text-emerald-400 text-sm">-${formatMoney(quote.totalSavings)}</span>
        </div>
      `;
    } else {
      discountsContainer.classList.add("hidden");
    }
  }

  if (tbody) {
    if (quote.lines.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-gray-500">No hay partidas en el presupuesto. Selecciona opciones en los pasos anteriores.</td></tr>`;
    } else {
      tbody.innerHTML = quote.lines.map(line => `
        <tr class="border-b border-gray-800">
          <td class="p-3">
            <span class="font-bold text-white text-xs block">${line.concept}</span>
            <span class="text-[11px] text-gray-400 block">${line.detail}</span>
          </td>
          <td class="p-3 text-xs text-gray-300">${line.moment}</td>
          <td class="p-3">
            <span class="text-[10px] font-mono px-2 py-0.5 rounded ${line.status === 'CONFIRMADO' ? 'badge-confirmed' : 'badge-pending'}">
              ${line.status}
            </span>
          </td>
          <td class="p-3 text-right font-mono font-bold text-[#e2e8f0] price-tag-untruncated text-xs">${formatMoney(line.price)}</td>
        </tr>
      `).join("");
    }
  }

  const st4Gross = document.getElementById("step4-gross-subtotal");
  const st4Savings = document.getElementById("step4-total-savings");
  const st4Subtotal = document.getElementById("step4-subtotal");
  const st4Vat = document.getElementById("step4-vat");
  const st4Total = document.getElementById("step4-total");
  const st4Deposit = document.getElementById("step4-deposit");

  if (st4Gross) st4Gross.textContent = formatMoney(quote.grossSubtotal);
  if (st4Savings) st4Savings.textContent = `-${formatMoney(quote.totalSavings)}`;
  if (st4Subtotal) st4Subtotal.textContent = formatMoney(quote.subtotal);
  if (st4Vat) st4Vat.textContent = formatMoney(quote.vatAmount);
  if (st4Total) st4Total.textContent = formatMoney(quote.grandTotal);
  if (st4Deposit) st4Deposit.textContent = formatMoney(quote.bookingDepositAmount);
}

// ==========================================================================
// Validación y Gating de Salidas (Nombre, Email y Teléfono 9 dígitos)
// ==========================================================================
function validateCustomerData(customer) {
  const name = (customer?.name || "").trim();
  const email = (customer?.email || "").trim();
  const phone = (customer?.phone || "").replace(/\D/g, "");

  const isNameValid = name.length >= 2;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPhoneValid = phone.length === 9; // Exactamente 9 dígitos para España (+34)

  return {
    isValid: isNameValid && isEmailValid && isPhoneValid,
    isNameValid,
    isEmailValid,
    isPhoneValid,
    phoneDigitsCount: phone.length
  };
}

function updateGatingUI(state) {
  const validation = validateCustomerData(state.customer);
  const warningBanner = document.getElementById("gating-warning-banner");
  const successBadge = document.getElementById("gating-success-badge");
  const phoneHint = document.getElementById("phone-validation-hint");
  
  const actionButtons = [
    document.getElementById("btn-action-wa-direct"),
    document.getElementById("btn-action-wa-copy"),
    document.getElementById("btn-action-email"),
    document.getElementById("btn-action-print")
  ].filter(Boolean);

  // Teléfono microtexto
  if (phoneHint) {
    if (validation.phoneDigitsCount === 0) {
      phoneHint.textContent = "Introduce los 9 dígitos de tu móvil";
      phoneHint.className = "text-[11px] text-gray-500 mt-1 block";
    } else if (validation.phoneDigitsCount === 9) {
      phoneHint.textContent = "✓ Teléfono móvil verificado (9 dígitos)";
      phoneHint.className = "text-[11px] text-emerald-400 font-semibold mt-1 block";
    } else {
      phoneHint.textContent = `Faltan dígitos: ${validation.phoneDigitsCount}/9 dígitos introducidos`;
      phoneHint.className = "text-[11px] text-cyan-400 font-semibold mt-1 block";
    }
  }

  if (validation.isValid) {
    // Desbloquear botones
    actionButtons.forEach(btn => {
      btn.classList.remove("btn-gated-disabled");
      btn.classList.add("btn-gated-active");
      btn.removeAttribute("disabled");
    });
    if (warningBanner) warningBanner.classList.add("hidden");
    if (successBadge) successBadge.classList.remove("hidden");
  } else {
    // Bloquear botones
    actionButtons.forEach(btn => {
      btn.classList.add("btn-gated-disabled");
      btn.classList.remove("btn-gated-active");
      btn.setAttribute("disabled", "true");
    });
    if (warningBanner) warningBanner.classList.remove("hidden");
    if (successBadge) successBadge.classList.add("hidden");
  }
}

function onCustomerInput() {
  const name = document.getElementById("cust-name")?.value || "";
  const email = document.getElementById("cust-email")?.value || "";
  let rawPhone = document.getElementById("cust-phone")?.value || "";
  
  const cleanDigits = rawPhone.replace(/\D/g, "").slice(0, 9);
  if (document.getElementById("cust-phone") && rawPhone !== cleanDigits) {
    document.getElementById("cust-phone").value = cleanDigits;
  }
  
  const notes = document.getElementById("cust-notes")?.value || "";

  store.update(s => ({
    ...s,
    customer: { name, email, phone: cleanDigits, notes }
  }));

  updateGatingUI(store.getState());
}

function setLocationQuick(locName) {
  const fullLoc = `${locName} (Girona)`;
  const input = document.getElementById("input-event-location");
  if (input) {
    input.value = fullLoc;
  }
  store.update(s => ({
    ...s,
    event: { ...s.event, location: fullLoc }
  }));
  showToast(`Localización seleccionada: ${locName}`);
}

// ==========================================================================
// Generación de Ficha PDF / Vista de Impresión Formal
// ==========================================================================
function updatePrintSheet(state) {
  const quote = PricingEngine.calculate(state);

  // Encabezado de la Ficha
  const pdfTitle = document.getElementById("pdf-event-title");
  const pdfDate = document.getElementById("pdf-event-date");
  const pdfLocation = document.getElementById("pdf-event-location");
  const pdfPax = document.getElementById("pdf-event-pax");
  const pdfEmitDate = document.getElementById("pdf-emit-date");
  const pdfCustomer = document.getElementById("pdf-customer-name");

  if (pdfTitle) pdfTitle.textContent = state.event.title || "Presupuesto Live Bands Music";
  
  const formattedDate = state.event.dateMode === "exact" && state.event.date 
    ? state.event.date 
    : (state.event.dateSeason || "Temporada 2027");
  if (pdfDate) pdfDate.textContent = formattedDate;

  if (pdfLocation) pdfLocation.textContent = state.event.location || "Girona";
  if (pdfPax) pdfPax.textContent = `${state.event.guests || 100} asistentes (${quote.costPerGuest > 0 ? quote.costPerGuest.toFixed(2) : "0,00"} €/pax)`;
  
  if (pdfEmitDate) {
    const today = new Date();
    pdfEmitDate.textContent = `Fecha de emisión: ${today.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}`;
  }
  if (pdfCustomer) {
    pdfCustomer.textContent = state.customer.name ? `Cliente: ${state.customer.name}` : "Cliente: Destinatario";
  }

  // Tabla de servicios
  const tbody = document.getElementById("pdf-services-tbody");
  if (tbody) {
    if (quote.lines.length === 0) {
      tbody.innerHTML = `<tr><td colspan="3" class="py-4 text-center text-gray-500">Sin servicios seleccionados</td></tr>`;
    } else {
      tbody.innerHTML = quote.lines.map(l => `
        <tr class="border-b border-gray-200">
          <td class="py-2.5">
            <strong class="text-gray-900 text-xs block">${l.concept}</strong>
            <span class="text-[10px] text-gray-600 block">${l.detail}</span>
          </td>
          <td class="py-2.5 text-gray-600 text-xs">${l.moment}</td>
          <td class="py-2.5 text-right font-mono font-bold text-gray-900 text-xs">${formatMoney(l.price)}</td>
        </tr>
      `).join("");
    }
  }

  // Descuentos en PDF
  const pdfDiscountsContainer = document.getElementById("pdf-discounts-container");
  const pdfDiscountsList = document.getElementById("pdf-discounts-list");
  const pdfDiscountsSubtotal = document.getElementById("pdf-discounts-subtotal");

  if (pdfDiscountsContainer && pdfDiscountsList) {
    if (quote.discounts && quote.discounts.length > 0) {
      pdfDiscountsContainer.classList.remove("hidden");
      pdfDiscountsList.innerHTML = quote.discounts.map(d => `
        <div class="flex justify-between items-center py-0.5">
          <span>• ${d.name || d.concept} (${d.detail})</span>
          <span class="font-mono font-bold">-${formatMoney(d.amount)}</span>
        </div>
      `).join("");
      if (pdfDiscountsSubtotal) {
        pdfDiscountsSubtotal.textContent = `-${formatMoney(quote.totalSavings)}`;
      }
    } else {
      pdfDiscountsContainer.classList.add("hidden");
    }
  }

  // Totales
  const pdfSubtotal = document.getElementById("pdf-subtotal");
  const pdfVat = document.getElementById("pdf-vat");
  const pdfTotal = document.getElementById("pdf-total");
  const pdfDeposit = document.getElementById("pdf-deposit");

  if (pdfSubtotal) pdfSubtotal.textContent = formatMoney(quote.subtotal);
  if (pdfVat) pdfVat.textContent = formatMoney(quote.vatAmount);
  if (pdfTotal) pdfTotal.textContent = formatMoney(quote.grandTotal);
  if (pdfDeposit) pdfDeposit.textContent = formatMoney(quote.bookingDepositAmount);

  const pdfStaffClause = document.getElementById("pdf-staff-clause");
  if (pdfStaffClause) {
    const meals = state.logistics?.staffMealsCount !== undefined ? state.logistics.staffMealsCount : 3;
    pdfStaffClause.textContent = `• Se contempla menú de staff (${meals} menús) para el equipo técnico y artístico.`;
  }
}

function openPrintModal() {
  const state = store.getState();
  const validation = validateCustomerData(state.customer);
  if (!validation.isValid) {
    showToast("Completa tu nombre, email y teléfono para desbloquear la vista previa.");
    document.getElementById("cust-name")?.focus();
    return;
  }
  updatePrintSheet(state);
  logQuoteTelemetry(state, "pdf_viewed");
  const modal = document.getElementById("printModal");
  if (modal) {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }
}

function closePrintModal() {
  const modal = document.getElementById("printModal");
  if (modal) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }
}

// ==========================================================================
// Exportación Limpia a WhatsApp y Email (Payload Inspection Compliance)
// Prohibición absoluta de identificadores internos tipo STR-, OBJ-, QA-
// ==========================================================================
function generatePlainTextProposal(state) {
  const quote = PricingEngine.calculate(state);
  const event = state.event;
  const customer = state.customer;
  const logistics = state.logistics;

  const dateStr = event.dateMode === "exact" && event.date ? event.date : (event.dateSeason || "Temporada 2027");

  let text = `PRESUPUESTO ESTIMADO — ${COMPANY_CONFIG.brandName.toUpperCase()}\n\n`;
  if (customer.name) text += `Hola Santiago,\nMi nombre es ${customer.name} y hemos configurado la siguiente propuesta para nuestro evento (${event.title}):\n\n`;
  
  text += `Fecha / Temporada: ${dateStr}\n`;
  text += `Lugar: ${event.location || 'Girona'}\n`;
  text += `Aforo previsto: ${event.guests} asistentes\n`;
  text += `Coste por comensal: ${quote.costPerGuest > 0 ? quote.costPerGuest.toFixed(2) : "0,00"} € / invitado\n\n`;
  
  text += `SERVICIOS SELECCIONADOS:\n`;

  if (quote.lines.length === 0) {
    text += `(Sin partidas seleccionadas)\n`;
  } else {
    quote.lines.forEach((l, idx) => {
      text += `${idx + 1}. ${l.concept} (${l.moment})\n   ${l.detail} — ${formatMoney(l.price)}\n`;
    });
  }

  if (quote.discounts && quote.discounts.length > 0) {
    text += `\nBONIFICACIONES & DESCUENTOS APLICADOS:\n`;
    quote.discounts.forEach(d => {
      text += `• ${d.name || d.concept}: -${formatMoney(d.amount)}\n`;
    });
    text += `Subtotal Descuentos: -${formatMoney(quote.totalSavings)}\n`;
  }

  text += `\n--------------------------------\n`;
  text += `Subtotal Bruto: ${formatMoney(quote.grossSubtotal)}\n`;
  text += `Total Ahorro: -${formatMoney(quote.totalSavings)}\n`;
  text += `Base Imponible Neta: ${formatMoney(quote.subtotal)}\n`;
  text += `IVA (${quote.vatPercentFormatted}): ${formatMoney(quote.vatAmount)}\n`;
  text += `TOTAL PRESUPUESTADO: ${formatMoney(quote.grandTotal)}\n`;
  text += `--------------------------------\n\n`;

  // Checklist logístico y dietas
  const staffMealsTxt = logistics.staffMeal === 'confirmed'
    ? `${logistics.staffMealsCount !== undefined ? logistics.staffMealsCount : 3} menús confirmados con el catering`
    : 'A consultar / pendiente de confirmar con catering';

  text += `DETALLES LOGÍSTICOS & PRODUCCIÓN:\n`;
  text += `• Acceso montaje: ${logistics.access === 'direct' ? 'Furgoneta directa' : logistics.access === 'distance' ? 'Distancia con carretilla' : 'Escaleras'}\n`;
  text += `• Hora fin fiesta: ${logistics.partyEnd}\n`;
  text += `• Menú de Staff / Dietas del Equipo: ${staffMealsTxt}\n`;
  text += `• Suministro y plan B: ${logistics.planB === 'covered' ? 'Espacio cubierto y tomas OK' : 'A revisar con finca'}\n\n`;

  if (customer.notes) {
    text += `NOTAS / PETICIONES: "${customer.notes}"\n\n`;
  }

  text += `FORMA DE PAGO:\n`;
  text += `• 15% de reserva previa con factura oficial: ${formatMoney(quote.bookingDepositAmount)}\n`;
  text += `• 85% restante el mismo día del evento: ${formatMoney(quote.eventDayBalanceAmount)}\n\n`;
  
  text += `CONDICIONES:\n`;
  text += `• ${COMPANY_CONFIG.travelPolicy.includedText}\n`;
  text += `• Actuaciones musicales de 90 minutos de duración (Ceremonia 60 min).\n\n`;
  text += `Contacto: ${COMPANY_CONFIG.phone} • ${COMPANY_CONFIG.email}\n`;
  text += `${COMPANY_CONFIG.web}`;

  return text;
}

function openSantiagoWhatsApp() {
  const state = store.getState();
  const validation = validateCustomerData(state.customer);
  if (!validation.isValid) {
    showToast("Por favor completa tus datos de contacto para enviar por WhatsApp.");
    document.getElementById("cust-name")?.focus();
    return;
  }
  const text = generatePlainTextProposal(state);
  const phoneSantiago = "34627370334";
  const url = `https://wa.me/${phoneSantiago}?text=${encodeURIComponent(text)}`;
  
  const newWin = window.open(url, "_blank", "noopener,noreferrer");
  if (!newWin || newWin.closed || typeof newWin.closed === "undefined") {
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  showToast("Conectando con WhatsApp de Santiago Cholbi...");
}

function copyWhatsAppText() {
  const state = store.getState();
  const validation = validateCustomerData(state.customer);
  if (!validation.isValid) {
    showToast("Completa tu nombre, email y teléfono para desbloquear el presupuesto.");
    document.getElementById("cust-name")?.focus();
    return;
  }
  const text = generatePlainTextProposal(state);
  navigator.clipboard.writeText(text).then(() => {
    showToast("Presupuesto para WhatsApp copiado al portapapeles.");
    logQuoteTelemetry(state, "whatsapp_copied");
  }).catch(() => {
    showToast("No se pudo copiar. Selecciona el texto manualmente.");
  });
}

function copyEmailDraftText() {
  const state = store.getState();
  const text = generatePlainTextProposal(state);
  navigator.clipboard.writeText(text).then(() => {
    showToast("Borrador de email copiado al portapapeles.");
    logQuoteTelemetry(state, "email_draft_copied");
  }).catch(() => {
    showToast("No se pudo copiar. Selecciona el texto manualmente.");
  });
}

function sendQuoteEmail() {
  const state = store.getState();
  const validation = validateCustomerData(state.customer);
  if (!validation.isValid) {
    showToast("Completa tu nombre, email y teléfono para enviar el presupuesto.");
    document.getElementById("cust-name")?.focus();
    return;
  }
  
  const text = generatePlainTextProposal(state);
  const subject = encodeURIComponent(`Presupuesto Oficial — ${COMPANY_CONFIG.brandName} (${state.event.title || 'Propuesta'})`);
  const body = encodeURIComponent(text);
  const clientEmail = state.customer.email.trim();
  const santiagoOfficial = COMPANY_CONFIG.officialEmail || "livebandsmusic@gmail.com";
  const webmasterEmail = COMPANY_CONFIG.email || "webmaster.socve@gmail.com";
  
  const ccEmails = encodeURIComponent(`${webmasterEmail}${clientEmail ? ',' + clientEmail : ''}`);
  const mailtoUrl = `mailto:${encodeURIComponent(santiagoOfficial)}?cc=${ccEmails}&subject=${subject}&body=${body}`;
  
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(() => {});
  }
  
  const link = document.createElement("a");
  link.href = mailtoUrl;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  logQuoteTelemetry(state, "email_sent");
  showToast(`Correo preparado hacia ${santiagoOfficial} con copia a ${webmasterEmail}`);
}

function copyEmailText() {
  sendQuoteEmail();
}

// ==========================================================================
// Gestión del Historial de Presupuestos (Santiago)
// ==========================================================================
function updateHistoryBadges() {
  const count = store.getHistory().length;
  const headerBadge = document.getElementById("header-history-badge");
  if (headerBadge) {
    headerBadge.textContent = count.toString();
  }
}

function saveCurrentQuoteToHistory() {
  const quote = PricingEngine.calculate(store.getState());
  const entry = store.saveToHistory(quote);
  if (entry) {
    showToast(`Presupuesto guardado en historial: ${entry.eventTitle} (${formatMoney(entry.total)})`);
    updateHistoryBadges();
    logQuoteTelemetry(store.getState(), "quote_saved");
  } else {
    showToast("No se pudo guardar el presupuesto.");
  }
}

function openHistoryModal() {
  renderHistoryModal();
  const modal = document.getElementById("historyModal");
  if (modal) {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }
}

function closeHistoryModal() {
  const modal = document.getElementById("historyModal");
  if (modal) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }
}

function renderHistoryModal() {
  const container = document.getElementById("history-items-container");
  if (!container) return;

  const history = store.getHistory();
  if (history.length === 0) {
    container.innerHTML = `
      <div class="p-8 rounded-xl bg-gray-900/50 border border-gray-800 text-center space-y-2">
        <i data-lucide="inbox" class="w-8 h-8 text-gray-500 mx-auto"></i>
        <p class="text-xs text-gray-400">No hay presupuestos guardados en el historial todavía.</p>
        <p class="text-[11px] text-gray-500">Configura un presupuesto y pulsa "Guardar en Historial" para registrarlo.</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  container.innerHTML = history.map(item => `
    <div class="p-4 rounded-xl bg-gray-900/80 border border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-gray-700 transition">
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <strong class="text-white text-xs">${item.eventTitle}</strong>
          <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">${item.dateDisplay}</span>
        </div>
        <p class="text-[11px] text-gray-400">
          Cliente: <span class="text-gray-200 font-medium">${item.clientName || 'Sin Nombre'}</span> • 
          Total: <strong class="text-emerald-400 font-mono">${formatMoney(item.total)}</strong>
        </p>
      </div>
      <div class="flex items-center gap-2 self-end sm:self-center">
        <button onclick="window.app.loadQuoteFromHistory('${item.id}')" class="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition flex items-center gap-1 cursor-pointer">
          <i data-lucide="upload" class="w-3 h-3"></i>
          <span>Cargar</span>
        </button>
        <button onclick="window.app.deleteQuoteFromHistory('${item.id}')" class="p-1.5 rounded-lg bg-gray-800 hover:bg-rose-950/60 text-gray-400 hover:text-rose-300 transition cursor-pointer" title="Eliminar este presupuesto">
          <i data-lucide="trash" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    </div>
  `).join("");

  if (window.lucide) window.lucide.createIcons();
}

function loadQuoteFromHistory(id) {
  if (store.loadFromHistory(id)) {
    renderFormStep1(store.getState());
    renderMomentsConfig(store.getState());
    renderTechOptions(store.getState());
    renderPricingSummary(store.getState());
    
    const currentCust = store.getState().customer;
    const nameInput = document.getElementById("cust-name");
    const emailInput = document.getElementById("cust-email");
    const phoneInput = document.getElementById("cust-phone");
    const notesInput = document.getElementById("cust-notes");
    if (nameInput) nameInput.value = currentCust.name || "";
    if (emailInput) emailInput.value = currentCust.email || "";
    if (phoneInput) phoneInput.value = currentCust.phone || "";
    if (notesInput) notesInput.value = currentCust.notes || "";
    updateGatingUI(store.getState());

    closeHistoryModal();
    setStep(4);
    showToast(`Presupuesto "${store.getState().event.title}" cargado con éxito.`);
  }
}

function deleteQuoteFromHistory(id) {
  store.deleteFromHistory(id);
  renderHistoryModal();
  updateHistoryBadges();
  showToast("Presupuesto eliminado del historial.");
}

function clearHistoryQuotes() {
  if (confirm("¿Estás seguro de que deseas vaciar todo el historial de presupuestos?")) {
    store.clearHistory();
    renderHistoryModal();
    updateHistoryBadges();
    showToast("Historial vaciado.");
  }
}

function exportHistoryJSON() {
  const data = store.exportHistoryJSON();
  const blob = new Blob([data], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `historial-presupuestos-livebands-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("Historial exportado en archivo JSON.");
}

// ==========================================================================
// Presets de Ejemplo y Utilidades
// ==========================================================================
function loadPreset(presetName) {
  if (presetName === "peralada") {
    store.setState({
      mode: "novios",
      event: {
        type: "boda",
        title: "Boda de Hayati & Guillaume",
        dateMode: "exact",
        date: "2027-08-26",
        dateSeason: "Verano 2027 (Junio - Septiembre)",
        location: "St. Martí d'Empúries (Girona)",
        guests: 85
      },
      moments: {
        ceremony: { enabled: true, formationId: "TRIO", bandId: "gospel-on", duration: 60 },
        appetizer: { enabled: true, formationId: "TRIO", bandId: "the-guitar-kings", duration: 90 },
        dinner: { enabled: true },
        party: { enabled: true, perimeterLight: false }
      },
      tech: {
        mode: "pack",
        selectedPackId: "pack-basic",
        soundId: "basic",
        lightId: "basic"
      },
      extraSongs: { count: 0 },
      discountsConfig: {
        multiMoment: { enabled: true },
        ownBandSound: { enabled: true },
        planner: { enabled: false, percent: 15 },
        custom: { enabled: false, type: "amount", value: 0, reason: "" }
      },
      logistics: {
        access: "direct",
        partyEnd: "03:00",
        staffMeal: "confirmed",
        planB: "covered"
      },
      customer: {
        name: "Phédile",
        email: "phedile@example.com",
        phone: "600000000",
        notes: "Interesados en música sacra para rito y rumba para el cóctel."
      }
    });
  } else if (presetName === "begur" || presetName === "tossa") {
    store.setState({
      mode: "novios",
      event: {
        type: "boda",
        title: "Boda de Olaf & Silvio",
        dateMode: "exact",
        date: "2027-06-19",
        dateSeason: "Verano 2027 (Junio - Septiembre)",
        location: "Tossa de Mar (Girona)",
        guests: 45
      },
      moments: {
        ceremony: { enabled: true, formationId: "DUO", bandId: "jazz-de-copes", duration: 60 },
        appetizer: { enabled: true, formationId: "QUARTET", bandId: "jazz-de-copes", duration: 90 },
        dinner: { enabled: true },
        party: { enabled: true, perimeterLight: true }
      },
      tech: {
        mode: "pack",
        selectedPackId: "pack-basic",
        soundId: "basic",
        lightId: "basic"
      },
      extraSongs: { count: 2 },
      discountsConfig: {
        multiMoment: { enabled: true },
        ownBandSound: { enabled: true },
        planner: { enabled: false, percent: 15 },
        custom: { enabled: false, type: "amount", value: 0, reason: "" }
      },
      logistics: {
        access: "distance",
        partyEnd: "03:00",
        staffMeal: "confirmed",
        planB: "covered"
      },
      customer: {
        name: "Silvio & Olaf",
        email: "silvio@example.com",
        phone: "611111111",
        notes: "Casa particular en Tossa de Mar con 18 focos LED perimetrales."
      }
    });
  } else if (presetName === "piscina5") {
    store.setState({
      mode: "planner",
      event: {
        type: "boda",
        title: "Boda 5 Momentos (Mirador & Piscina)",
        dateMode: "exact",
        date: "2027-09-16",
        dateSeason: "Septiembre 2027",
        location: "Girona",
        guests: 80
      },
      moments: {
        ceremony: { enabled: true, formationId: "DUO", bandId: "jazz-de-copes", duration: 60 },
        appetizer: { enabled: true, formationId: "QUARTET", bandId: "jazz-de-copes", duration: 90 },
        dinner: { enabled: true },
        party: { enabled: true, perimeterLight: false }
      },
      tech: {
        mode: "pack",
        selectedPackId: "pack-medium",
        soundId: "complete",
        lightId: "basic"
      },
      extraSongs: { count: 0 },
      discountsConfig: {
        multiMoment: { enabled: true },
        ownBandSound: { enabled: true },
        planner: { enabled: true, percent: 15 },
        custom: { enabled: false, type: "amount", value: 0, reason: "" }
      },
      logistics: {
        access: "direct",
        partyEnd: "03:00",
        staffMeal: "confirmed",
        planB: "covered"
      },
      customer: {
        name: "Novios 2027",
        email: "contacto@example.com",
        phone: "627370334",
        notes: "Jornada completa con 3 pases de Jazz de Copes Quartet hasta las 03:00."
      }
    });
  }

  // Refrescar formularios y resumen
  renderFormStep1(store.getState());
  renderMomentsConfig(store.getState());
  renderTechOptions(store.getState());
  renderPricingSummary(store.getState());

  // Refrescar campos de cliente en paso 4
  const currentCust = store.getState().customer;
  const nameInput = document.getElementById("cust-name");
  const emailInput = document.getElementById("cust-email");
  const phoneInput = document.getElementById("cust-phone");
  const notesInput = document.getElementById("cust-notes");
  if (nameInput) nameInput.value = currentCust.name || "";
  if (emailInput) emailInput.value = currentCust.email || "";
  if (phoneInput) phoneInput.value = currentCust.phone || "";
  if (notesInput) notesInput.value = currentCust.notes || "";
  updateGatingUI(store.getState());

  showToast(`Ejemplo cargado: ${store.getState().event.title}`);
}

function resetToInitial() {
  store.reset();
  renderFormStep1(store.getState());
  renderMomentsConfig(store.getState());
  renderTechOptions(store.getState());
  renderPricingSummary(store.getState());

  const nameInput = document.getElementById("cust-name");
  const emailInput = document.getElementById("cust-email");
  const phoneInput = document.getElementById("cust-phone");
  const notesInput = document.getElementById("cust-notes");
  if (nameInput) nameInput.value = "";
  if (emailInput) emailInput.value = "";
  if (phoneInput) phoneInput.value = "";
  if (notesInput) notesInput.value = "";
  updateGatingUI(store.getState());

  showToast("Configurador reiniciado a 0 €.");
}

function toggleMobileDrawer() {
  const drawer = document.getElementById("mobile-summary-drawer");
  if (drawer) {
    drawer.classList.toggle("hidden");
  }
}

function formatMoney(amount) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

function showToast(message) {
  const toast = document.getElementById("toast");
  const msgElem = document.getElementById("toast-message");
  if (toast && msgElem) {
    msgElem.textContent = message;
    toast.classList.remove("translate-y-20", "opacity-0");
    setTimeout(() => {
      toast.classList.add("translate-y-20", "opacity-0");
    }, 3200);
  }
}

function setupNavigation() {
  // Atajos si se requieren
}

function initYear() {
  const yearElem = document.getElementById("currentYear");
  if (yearElem) {
    yearElem.textContent = new Date().getFullYear().toString();
  }
}

// ==========================================================================
// CUESTIONARIO DE VALIDACIÓN DE REGLAS (CLIENTE - 11 PREGUNTAS)
// ==========================================================================
const validationAnswers = {
  q1: null,
  q2: null,
  q3: null,
  q4: null,
  q5: null,
  q6: null,
  q7: null,
  q8: null,
  q9: null,
  q10: null,
  q11: null
};

function selectValidationOption(qId, val, element) {
  validationAnswers[qId] = val;
  const parent = element.parentElement;
  if (parent) {
    parent.querySelectorAll(".val-opt-card").forEach(c => {
      c.classList.remove("border-emerald-500", "bg-emerald-500/10", "border-rose-500/80", "bg-rose-950/20");
      c.classList.add("border-gray-800", "bg-gray-900/40");
    });
  }
  element.classList.remove("border-gray-800", "bg-gray-900/40");
  if (val.startsWith("SÍ") || val.startsWith("SI")) {
    element.classList.add("border-emerald-500", "bg-emerald-500/10");
  } else {
    element.classList.add("border-rose-500/80", "bg-rose-950/20");
  }

  const answered = Object.values(validationAnswers).filter(v => v !== null).length;
  const pText = document.getElementById("val-progress-text");
  const pBar = document.getElementById("val-progress-bar");
  if (pText) pText.textContent = `${answered} de 11 validadas`;
  if (pBar) pBar.style.width = `${Math.round((answered / 11) * 100)}%`;
}

function buildValidationReportText() {
  const qTitles = {
    q1: "1. Descuento en Ceremonia al contratar Aperitivo (Dúo a 400 €)",
    q2: "2. Descuento en Banda de Aperitivo (15-20% dto. en Cuarteto)",
    q3: "3. Sonorización Básica bonificada al 50% con bandas LBM (200 €)",
    q4: "4. Reutilización de sonido en Cena en mismo espacio (0 € equipo / 50-100 € técnico)",
    q5: "5. Iluminación de Fiesta con DJ/Banda (rebajada a 150-250 €)",
    q6: "6. Comisión para Event Partners y Agencias B2B (15%)",
    q7: "7. Día de la Semana y Temporada (Lunes a Jueves / Temporada Baja)",
    q8: "8. Umbral de Invitados (PAX >150-200) y salto a Sonorización Completa",
    q9: "9. Repertorio a la Carta (6 canciones incluidas vs. temas extra)",
    q10: "10. Misma Banda en Dos Momentos (Aperitivo + Fiesta reducida)",
    q11: "11. Menú y Dietas de Staff (cláusula informativa en presupuesto)"
  };

  let text = `=========================================================\n`;
  text += `INFORME DE VALIDACIÓN DE REGLAS — LIVE BANDS MUSIC 2027\n`;
  text += `Fecha: ${new Date().toLocaleDateString("es-ES")} ${new Date().toLocaleTimeString("es-ES")}\n`;
  text += `=========================================================\n\n`;

  for (let i = 1; i <= 11; i++) {
    const qKey = `q${i}`;
    const sel = validationAnswers[qKey] || "No seleccionada";
    const noteEl = document.getElementById(`val-note-${qKey}`);
    const note = noteEl ? noteEl.value.trim() : "";

    text += `${qTitles[qKey]}:\n`;
    text += `  • Validación: [${sel}]\n`;
    if (note) {
      text += `  • Matiz / Alternativa del cliente: "${note}"\n`;
    }
    text += `\n`;
  }

  // Bloque cualitativo
  const qualNoteEl = document.getElementById("val-note-qualitative");
  const qualNote = qualNoteEl ? qualNoteEl.value.trim() : "";
  if (qualNote) {
    text += `---------------------------------------------------------\n`;
    text += `FACTORES CUALITATIVOS Y CRITERIOS NO MATEMÁTICOS:\n`;
    text += `"${qualNote}"\n\n`;
  }

  text += `=========================================================\n`;
  text += `SOLICITUD: Enviar de 3 a 5 presupuestos especiales/con descuentos para afinar el motor.\n`;
  text += `=========================================================\n`;
  return text;
}

function copyValidationAnswers() {
  const txt = buildValidationReportText();
  navigator.clipboard.writeText(txt).then(() => {
    showToast("¡Respuestas copiadas al portapapeles con éxito!");
  }).catch(() => {
    showToast("Error al copiar. Usa el botón de descarga.");
  });
}

function downloadValidationReport() {
  const txt = buildValidationReportText();
  const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `validacion-reglas-livebands-${new Date().toISOString().slice(0, 10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
