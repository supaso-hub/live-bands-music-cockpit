/**
 * assets/js/services/lead-bridge.js
 * Motor del Puente de Datos con Token Corto (Escaparate ➔ Cockpit).
 * 
 * Funcionalidades:
 * 1. Generación de identificadores cortos no secuenciales (ej. LBM-409).
 * 2. Serialización y compresión compacta para fallback en URL (sin rotura en WhatsApp).
 * 3. Almacenamiento distribuido (API Serverless / Upstash Redis + LocalStorage de respaldo).
 * 4. Hidratación reactiva del estado del presupuesto en el Cockpit de Santiago Cholbi.
 */

// Generador de tokens cortos no secuenciales tipo LBM-XXX
export function generateLeadRef() {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // Alfabeto Crockford sin vocales confusas (0, O, 1, I)
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `LBM-${code}`;
}

// Codificador ultra-compacto Base64 seguro para URL
export function encodeLeadState(leadData) {
  try {
    const jsonStr = JSON.stringify(leadData);
    // Base64 seguro para URLs (reemplaza + por -, / por _, y quita padding =)
    const base64 = btoa(encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (match, p1) => {
      return String.fromCharCode('0x' + p1);
    }));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (e) {
    console.error("Error al codificar lead state:", e);
    return "";
  }
}

// Decodificador seguro para URL
export function decodeLeadState(encodedStr) {
  try {
    // Restaurar Base64 estándar
    let base64 = encodedStr.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const decoded = decodeURIComponent(Array.prototype.map.call(atob(base64), (c) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(decoded);
  } catch (e) {
    console.warn("No se pudo decodificar el payload inline del lead:", e);
    return null;
  }
}

/**
 * Guarda el lead en el almacén serverless y genera el enlace limpio para WhatsApp / Email.
 * v.25: Incluye email, horario y telemetria.events en el payload del backend.
 * @param {Object} leadData Objeto con datos de la pareja, fecha, finca y momentos
 * @returns {Promise<{ ref: string, urlLimpia: string, urlFallback: string, payload: Object }>}
 */
export async function saveLead(leadData) {
  const ref = leadData.ref || generateLeadRef();
  const fullPayload = {
    ...leadData,
    ref,
    created_at: new Date().toISOString(),
    // Asegurar que telemetria.events viaja al backend (Punto 3 mejoras v.25)
    telemetria: {
      ...(leadData.telemetria || {}),
      events: leadData.telemetria?.events || []
    }
  };

  // 1. Respaldo local inmediato en navegador
  try {
    localStorage.setItem(`lbm_lead_${ref}`, JSON.stringify(fullPayload));
  } catch (e) {
    console.warn("LocalStorage no disponible para lead:", e);
  }

  // 2. Intento de persistencia serverless vía endpoint /api/lead
  let savedServerless = false;
  try {
    const res = await fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fullPayload)
    });
    if (res.ok) {
      savedServerless = true;
    }
  } catch (e) {
    console.log("Modo offline o backend serverless no disponible, usando fallback híbrido.");
  }

  // 3. URLs generadas
  const baseUrl = (typeof window !== "undefined")
    ? `${window.location.origin}${window.location.pathname.replace(/[^/]*$/, '')}`
    : "https://live-bands-music-cockpit-v002.vercel.app/";

  const cockpitUrl = `${baseUrl}simulador.html`;
  const urlLimpia = `${cockpitUrl}?ref=${ref}`;
  const inlineHash = encodeLeadState(fullPayload);
  const urlFallback = `${cockpitUrl}?ref=${ref}&d=${inlineHash}`;

  return {
    ref,
    savedServerless,
    urlLimpia,
    urlFallback,
    urlOptima: savedServerless ? urlLimpia : urlFallback,
    payload: fullPayload
  };
}

/**
 * Recupera el lead mediante su referencia o payload inline
 * @param {string} ref Código tipo LBM-409
 * @param {string} [inlineData] Hash opcional de fallback en querystring (&d=...)
 * @returns {Promise<Object|null>}
 */
export async function fetchLead(ref, inlineData) {
  // Prioridad 1: Decodificación instantánea si viene el payload inline de respaldo
  if (inlineData) {
    const parsed = decodeLeadState(inlineData);
    if (parsed) {
      return parsed;
    }
  }

  if (!ref) return null;

  // Prioridad 2: Consulta a la API Serverless /api/lead?ref=LBM-XXX
  try {
    const res = await fetch(`/api/lead?ref=${encodeURIComponent(ref)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.lead) {
        return data.lead;
      }
    }
  } catch (e) {
    console.warn("Error consultando API serverless de leads:", e);
  }

  // Prioridad 3: Consulta a LocalStorage del dispositivo
  try {
    const local = localStorage.getItem(`lbm_lead_${ref}`);
    if (local) {
      return JSON.parse(local);
    }
  } catch (e) {}

  return null;
}

/**
 * Mapea el anteproyecto del lead y lo inyecta en el QuoteStore del Cockpit
 * @param {Object} lead Objeto del lead decodificado
 * @param {Object} store Instancia de QuoteStore
 * @returns {boolean} True si se hidrató correctamente
 */
export function hydrateCockpitFromLead(lead, store) {
  if (!lead || !store) return false;

  try {
    const currentState = store.getState();
    const nextState = JSON.parse(JSON.stringify(currentState));

    // Datos del Evento (Paso 1)
    if (lead.finca || lead.location) {
      nextState.event.location = lead.finca || lead.location;
    }
    if (lead.date_mode === "flexible") {
      nextState.event.dateMode = "flexible";
      nextState.event.season = lead.temporada || lead.fecha || "Temporada 2027 (A convenir)";
    } else if (lead.fecha || lead.date) {
      nextState.event.date = lead.fecha || lead.date;
      nextState.event.dateMode = "exact";
    }

    if (lead.pax_rango) {
      const paxMap = { menos_50: 45, '50_100': 85, '100_160': 130, '160_200': 180, mas_200: 250 };
      nextState.event.guests = paxMap[lead.pax_rango] || 120;
    } else if (lead.guests || lead.invitados) {
      nextState.event.guests = lead.guests || lead.invitados;
    }

    // Datos de Contacto y Notas (v.25: incluye email y horario)
    if (lead.pareja) {
      nextState.customer.name = lead.pareja;
    } else if (lead.contacto) {
      nextState.customer.name = lead.contacto.nombre || "";
      nextState.customer.email = lead.contacto.email || "";
      nextState.customer.phone = lead.contacto.telefono || "";
    }
    // Mapeo directo de email y horario (nuevos campos v.25)
    if (lead.email) {
      nextState.customer.email = lead.email;
    }
    if (lead.horario) {
      nextState.event.horario = lead.horario;
    }
    if (lead.notas || lead.contacto?.notes || lead.contacto?.notas) {
      nextState.customer.notes = lead.notas || lead.contacto?.notes || lead.contacto?.notas || "";
    }

    // Momentos musicales
    if (lead.momentos) {
      // Ceremonia
      if (lead.momentos.ceremonia) {
        nextState.moments.ceremony.enabled = true;
        const bId = lead.momentos.ceremonia.banda_id || lead.momentos.ceremonia.bandaId;
        const fId = lead.momentos.ceremonia.formato_id || lead.momentos.ceremonia.formationId;
        if (bId) nextState.moments.ceremony.bandId = bId;
        if (fId) nextState.moments.ceremony.formationId = fId;
      }

      // Aperitivo
      if (lead.momentos.aperitivo) {
        nextState.moments.appetizer.enabled = true;
        const bId = lead.momentos.aperitivo.banda_id || lead.momentos.aperitivo.bandaId;
        const fId = lead.momentos.aperitivo.formato_id || lead.momentos.aperitivo.formationId;
        if (bId) nextState.moments.appetizer.bandId = bId;
        if (fId) nextState.moments.appetizer.formationId = fId;
      }

      // Banquete / Cena (Extra técnico)
      if (lead.extras?.dinnerSpeech || lead.servicios_extra?.banquete || lead.momentos.banquete) {
        nextState.moments.dinner.enabled = true;
      }

      // Fiesta (pre-DJ / DJ)
      if (lead.momentos.fiesta_pre_dj || lead.momentos.fiesta) {
        nextState.moments.party.enabled = true;
        const fiestaObj = lead.momentos.fiesta_pre_dj || lead.momentos.fiesta;
        const bId = fiestaObj.banda_id || fiestaObj.bandaId;
        const fId = fiestaObj.formato_id || fiestaObj.formationId;
        if (bId) nextState.moments.party.bandId = bId;
        if (fId) nextState.moments.party.formationId = fId;
        if (lead.extras?.djParty) {
          nextState.moments.party.extraDj = true;
        }
        if (lead.servicios_extra?.iluminacion_perimetral) {
          nextState.moments.party.perimeterLight = true;
        }
      }
    }

    // Marca de origen para feedback visual
    nextState.leadBridge = {
      active: true,
      ref: lead.ref || "LBM-LEAD",
      importedAt: new Date().toISOString(),
      leadData: lead
    };

    store.setState(nextState);
    return true;
  } catch (e) {
    console.error("Error al hidratar Cockpit desde lead:", e);
    return false;
  }
}
