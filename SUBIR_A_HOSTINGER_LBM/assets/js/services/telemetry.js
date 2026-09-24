/**
 * telemetry.js
 * Servicio de telemetría y registro en base de datos Supabase para Live Bands Music 2027.
 * Captura en segundo plano y de forma silenciosa cada cotización, prueba,
 * variación de descuento y motivo escrito por Santiago Cholbi.
 */

import { calculateQuotePricing } from "../engine/pricing.js";
import { COMPANY_CONFIG } from "../config/company.js";

const SUPABASE_URL = "https://srocgiknbgkyngmlqniy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyb2NnaWtuYmdreW5nbWxxbml5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyNTA2ODgsImV4cCI6MjEwMDgyNjY4OH0.mXIvtwclJAreQZ89VQL-s9yMuxKED8Cc_1Gr9BTtzOg";

let debounceTimer = null;

/**
 * Registra una cotización en Supabase y dispara notificación silenciosa.
 * @param {Object} state Estado completo del store
 * @param {string} actionType 'quote_saved' | 'email_prepared' | 'whatsapp_copied' | 'pdf_viewed' | 'discount_toggled'
 */
export async function logQuoteTelemetry(state, actionType = "quote_saved") {
  if (!state || !state.moments) return;

  const pricing = calculateQuotePricing(state);
  const hasActiveMoments = Object.values(state.moments).some(m => m.enabled) || (state.tech && state.tech.mode !== "none");
  
  if (!hasActiveMoments && pricing.grandTotal === 0 && actionType === "discount_toggled") {
    return;
  }

  const synergyDisc = pricing.discounts.find(d => d.id === "multimoment-synergy")?.amount || 0;
  const ownSoundDisc = pricing.discounts.find(d => d.id === "own-band-sound")?.amount || 0;
  const eventPartnerDisc = pricing.discounts.find(d => d.id === "planner-commission")?.amount || 0;
  const santiagoDisc = pricing.discounts.find(d => d.id === "santiago-custom-discount")?.amount || 0;

  const payload = {
    source_role: state.operator || "Santiago Cholbi",
    event_title: state.event.title || "Sin título (Borrador)",
    event_type: state.event.type || "boda",
    event_date_season: state.event.dateMode === "exact" ? (state.event.date || "Fecha exacta") : (state.event.dateSeason || "Temporada 2027"),
    event_location: state.event.location || "Girona / Sin especificar",
    guests_pax: parseInt(state.event.guests, 10) || null,
    gross_total: pricing.grossSubtotal || 0,
    net_subtotal: pricing.netSubtotal || 0,
    vat_amount: pricing.vatAmount || 0,
    grand_total: pricing.grandTotal || 0,
    total_savings: pricing.totalSavings || 0,
    synergy_discount: synergyDisc,
    own_sound_discount: ownSoundDisc,
    event_partner_commission: eventPartnerDisc,
    santiago_discount_value: state.discountsConfig?.custom?.value || 0,
    santiago_discount_type: state.discountsConfig?.custom?.type || "amount",
    santiago_discount_reason: state.discountsConfig?.custom?.reason || "",
    cost_per_pax: pricing.costPerGuest || null,
    moments_detail: {
      ceremony: state.moments.ceremony,
      appetizer: state.moments.appetizer,
      dinner: state.moments.dinner,
      party: state.moments.party,
      extraSongs: state.extraSongs?.count || 0
    },
    tech_detail: state.tech || {},
    customer_name: state.customer?.name || "",
    customer_email: state.customer?.email || "",
    customer_phone: state.customer?.phone || "",
    action_type: actionType
  };

  try {
    // 1. Inserción directa en Supabase REST API
    fetch(`${SUPABASE_URL}/rest/v1/lbm_quote_logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "Prefer": "return=minimal"
      },
      body: JSON.stringify(payload)
    }).catch(err => {
      console.warn("Telemetría Supabase (silencioso):", err);
    });

    // 2. Disparo de notificación silenciosa por email
    if (actionType !== "discount_toggled" || santiagoDisc > 0) {
      fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          recipient: "webmaster.socve@gmail.com",
          version: COMPANY_CONFIG.version
        })
      }).catch(() => {});
    }
  } catch (e) {
    console.warn("Error en telemetría:", e);
  }
}

export function debouncedLogQuote(state, actionType = "discount_toggled", delayMs = 1500) {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    logQuoteTelemetry(state, actionType);
  }, delayMs);
}
