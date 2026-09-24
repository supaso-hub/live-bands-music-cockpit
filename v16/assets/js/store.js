/**
 * store.js
 * Almacén reactivo del estado del presupuesto de Live Bands Music (v.16).
 * Gestiona persistencia de sesión, configuración de descuentos asistidos/manuales,
 * operador activo (Santiago Cholbi / Juan Pablo), extras y el historial de cotizaciones.
 */

const STORAGE_KEY = "LBM_QUOTE_SESSION_V16";
const HISTORY_KEY = "LBM_QUOTES_HISTORY_V16";

function detectOperator() {
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const op = params.get("operator") || params.get("user");
    if (op) {
      const decoded = decodeURIComponent(op);
      try { localStorage.setItem("lbm_operator", decoded); } catch (e) {}
      return decoded;
    }
    try {
      const saved = localStorage.getItem("lbm_operator");
      if (saved) return saved;
    } catch (e) {}
  }
  return "Santiago Cholbi";
}

const INITIAL_STATE = {
  // Operador activo: 'Santiago Cholbi' | 'Juan Pablo'
  operator: detectOperator(),

  // Modo de experiencia: 'novios' (emocional/cercano) | 'planner' (técnico/profesional Event Partner B2B)
  mode: "novios",

  // Datos del Evento (Paso 1) — 100% limpios sin datos pre-rellenados
  event: {
    type: "boda",
    title: "",
    dateMode: "flexible", // 'exact' | 'flexible'
    date: "",
    dateSeason: "Verano 2027 (Junio - Septiembre)",
    location: "",
    guests: ""
  },

  // Activación modular de momentos (inicialmente en blanco 0 €)
  moments: {
    ceremony: {
      enabled: false,
      formationId: "DUO",
      bandId: "vienna-brava",
      duration: 60
    },
    appetizer: {
      enabled: false,
      formationId: "TRIO",
      bandId: "the-guitar-kings",
      duration: 90
    },
    dinner: {
      enabled: false
    },
    party: {
      enabled: false,
      perimeterLight: false
    }
  },

  // Infraestructura técnica (inicialmente sin pack para iniciar en 0 €)
  tech: {
    mode: "none", // 'pack' | 'individual' | 'none'
    selectedPackId: null,
    soundId: "none",
    lightId: "none"
  },

  // Extras musicales fuera de catálogo
  extraSongs: {
    count: 0 // Canciones extra a 30 € / tema
  },

  // Tabla y Motor de Descuentos Asistidos & Manuales para Santiago Cholbi
  discountsConfig: {
    // Sinergia Ceremonia + Aperitivo (15% Aperitivo + 30% Ceremonia si es mismo grupo; 15%+15% si son distintos)
    multiMoment: {
      enabled: true
    },
    // Bonificación 50% en Sonorización Básica con grupos propios (-200 €)
    ownBandSound: {
      enabled: true
    },
    // Comisión B2B Event Partner / Agencia (15% por defecto)
    planner: {
      enabled: false,
      percent: 15
    },
    // Descuento Exclusivo / Cortesía Dirección Santiago Cholbi
    custom: {
      enabled: false,
      type: "amount", // 'amount' (€) | 'percent' (%)
      value: 0,
      reason: ""
    }
  },

  // Mini-Checklist Logístico (Paso 4, 4 preguntas rápidas)
  logistics: {
    access: "direct", // 'direct' | 'distance' | 'stairs'
    partyEnd: "02:00", // '02:00' | '03:00' | 'late'
    staffMeal: "confirmed", // 'confirmed' | 'pending'
    staffMealsCount: 0,
    planB: "covered" // 'covered' | 'pending' | 'limited'
  },

  // Datos de contacto del cliente (Paso 4)
  customer: {
    name: "",
    email: "",
    phone: "",
    notes: ""
  },

  // Control de interfaz
  ui: {
    currentStep: 1,
    mobileSummaryOpen: false
  }
};

class QuoteStore {
  constructor() {
    this.listeners = [];
    this.state = this.loadFromStorage();
  }

  loadFromStorage() {
    // Siempre inicia 100% limpio por defecto al abrir o recargar
    try {
      if (typeof window !== "undefined" && typeof sessionStorage !== "undefined") {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.warn("Storage reset:", e);
    }
    return JSON.parse(JSON.stringify(INITIAL_STATE));
  }

  saveToStorage() {
    try {
      if (typeof window !== "undefined" && typeof sessionStorage !== "undefined") {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      }
    } catch (e) {
      console.warn("Error guardando sesión:", e);
    }
  }

  getState() {
    return this.state;
  }

  setState(partialState) {
    this.state = {
      ...this.state,
      ...partialState
    };
    this.saveToStorage();
    this.notify();
  }

  update(updater) {
    const nextState = updater(this.state);
    if (nextState) {
      this.state = nextState;
      this.saveToStorage();
      this.notify();
    }
  }

  reset() {
    this.state = JSON.parse(JSON.stringify(INITIAL_STATE));
    this.saveToStorage();
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  // =========================================================================
  // GESTIÓN DEL HISTORIAL DE PRESUPUESTOS DE SANTIAGO (Persistencia Local)
  // =========================================================================

  getHistory() {
    try {
      if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
        const data = localStorage.getItem(HISTORY_KEY);
        return data ? JSON.parse(data) : [];
      }
    } catch (e) {
      console.warn("Error al leer historial:", e);
    }
    return [];
  }

  saveToHistory(calculatedQuote) {
    try {
      const history = this.getHistory();
      const clientName = this.state.customer?.name || "Sin Nombre";
      const eventTitle = this.state.event?.title || "Boda / Evento";
      const totalFormatted = calculatedQuote ? calculatedQuote.grandTotal : 0;
      
      const newEntry = {
        id: `quote-${Date.now()}`,
        timestamp: new Date().toISOString(),
        dateDisplay: new Date().toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        }),
        clientName,
        eventTitle,
        total: totalFormatted,
        stateSnapshot: JSON.parse(JSON.stringify(this.state))
      };

      // Guardar más reciente primero (máximo 50 presupuestos)
      history.unshift(newEntry);
      const trimmed = history.slice(0, 50);
      
      if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
      }
      return newEntry;
    } catch (e) {
      console.warn("Error al guardar presupuesto en historial:", e);
      return null;
    }
  }

  loadFromHistory(id) {
    const history = this.getHistory();
    const entry = history.find(h => h.id === id);
    if (entry && entry.stateSnapshot) {
      this.setState(entry.stateSnapshot);
      return true;
    }
    return false;
  }

  deleteFromHistory(id) {
    try {
      const history = this.getHistory().filter(h => h.id !== id);
      if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
      }
      return true;
    } catch (e) {
      console.warn("Error al eliminar presupuesto del historial:", e);
      return false;
    }
  }

  clearHistory() {
    try {
      if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
        localStorage.removeItem(HISTORY_KEY);
      }
    } catch (e) {
      console.warn("Error al vaciar historial:", e);
    }
  }

  exportHistoryJSON() {
    const history = this.getHistory();
    return JSON.stringify(history, null, 2);
  }
}

export const store = new QuoteStore();
