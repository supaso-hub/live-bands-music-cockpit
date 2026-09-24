/**
 * rules.js
 * Motor de reglas de compatibilidad técnica, cobertura acústica y políticas de Live Bands Music.
 */

import { APP_CONFIG } from "../config/app-config.js";
import { COMPANY_CONFIG } from "../config/company.js";
import { CATALOG } from "../data/catalog.js";

export const RulesEngine = {
  /**
   * Evalúa si la configuración actual requiere obligatoriamente sonorización.
   * Regla oficial: Formaciones con voz y eventos de más de 200 oyentes aprox. requieren sonorización.
   */
  evaluateSoundRequirement(state) {
    const reasons = [];
    let isRequired = false;

    // 1. Regla de aforo (PAX)
    const guests = parseInt(state.event.guests, 10) || 0;
    if (guests > APP_CONFIG.soundRequiredThresholdPax) {
      isRequired = true;
      reasons.push(`El aforo previsto (${guests} asistentes) supera los ${APP_CONFIG.soundRequiredThresholdPax} invitados y exige refuerzo acústico profesional.`);
    }

    // 2. Regla de formaciones con voz en momentos activos
    const momentsToCheck = ["ceremony", "appetizer"];
    for (const momentKey of momentsToCheck) {
      const moment = state.moments[momentKey];
      if (moment && moment.enabled && moment.formationId) {
        const formation = CATALOG.formations.find(f => f.id === moment.formationId);
        if (formation && formation.hasVocals) {
          isRequired = true;
          reasons.push(`La formación de ${formation.name} elegida para ${momentKey === "ceremony" ? "la ceremonia" : "el aperitivo"} incluye voz y requiere microfonía profesional.`);
        }
      }
    }

    return {
      isRequired,
      reasons,
      recommendedSoundId: "basic",
      warningMessage: reasons.length > 0 
        ? `Recomendación técnica: ${reasons.join(" ")}` 
        : null
    };
  },

  /**
   * Detecta si la combinación actual de sonido y luz califica para un Tech Pack oficial.
   */
  detectTechPackOpportunity(soundId, lightId) {
    if (!soundId || !lightId || soundId === "none" || lightId === "none") {
      return null;
    }

    const matchingPack = CATALOG.techPacks.find(
      pack => pack.soundEquivalent === soundId && pack.lightEquivalent === lightId
    );

    if (matchingPack) {
      return {
        pack: matchingPack,
        savings: matchingPack.savings,
        separateTotal: matchingPack.separatePrice,
        packPrice: matchingPack.price,
        message: `¡Oportunidad de ahorro! Puedes unificar sonido y luz con el ${matchingPack.name} por ${matchingPack.price} € en lugar de ${matchingPack.separatePrice} € (Ahorras ${matchingPack.savings} €).`
      };
    }

    return null;
  },

  /**
   * Verifica la cobertura geográfica de desplazamiento (Provincia de Girona).
   */
  evaluateLocation(locationStr) {
    if (!locationStr || typeof locationStr !== "string") {
      return {
        isGirona: true,
        message: COMPANY_CONFIG.travelPolicy.includedText
      };
    }

    const gironaKeywords = [
      "girona", "gerona", "peralada", "figueres", "figueras", "roses", "rosas", 
      "cadaqués", "cadaques", "begur", "palafrugell", "platja d'aro", "playa de aro", 
      "sant feliu", "blanes", "lloret", "tossa", "banyoles", "bañolas", "olot", 
      "ripoll", "emporda", "empordà", "costa brava", "escala", "l'escala"
    ];

    const normalized = locationStr.toLowerCase().trim();
    const isGirona = gironaKeywords.some(keyword => normalized.includes(keyword)) || normalized.length < 3;

    return {
      isGirona,
      message: isGirona 
        ? COMPANY_CONFIG.travelPolicy.includedText 
        : COMPANY_CONFIG.travelPolicy.outsideText
    };
  },

  /**
   * Valida que la fecha del evento tenga una antelación mínima de 2 días (48h).
   */
  evaluateEventDate(dateString) {
    if (!dateString) {
      return { isValid: false, message: "Indica la fecha prevista de tu evento." };
    }
    const d = new Date();
    d.setDate(d.getDate() + 2);
    d.setHours(0, 0, 0, 0);

    const parts = dateString.split("-").map(Number);
    if (parts.length !== 3) {
      return { isValid: false, message: "Formato de fecha inválido." };
    }
    const selected = new Date(parts[0], parts[1] - 1, parts[2]);

    if (selected < d) {
      return {
        isValid: false,
        message: "La fecha debe tener al menos 2 días de antelación para garantizar disponibilidad técnica y logística."
      };
    }
    return { isValid: true };
  }
};
