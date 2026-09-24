/**
 * pricing.js
 * Motor matemático de cálculo de presupuesto para Live Bands Music.
 * Desglosa partidas oficiales, sinergias logísticas, descuentos explícitos,
 * base imponible neta, IVA, cuotas de pago y coste por comensal.
 */

import { APP_CONFIG } from "../config/app-config.js";
import { COMPANY_CONFIG } from "../config/company.js";
import { CATALOG } from "../data/catalog.js";
function formatMoney(amount) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

export const PricingEngine = {
  /**
   * Calcula el desglose completo del presupuesto a partir del estado.
   */
  calculate(state) {
    const lines = [];
    const discounts = [];
    let grossSubtotal = 0;
    let totalSavings = 0;

    // 1. Momento: Ceremonia
    const hasCeremony = state.moments?.ceremony && state.moments.ceremony.enabled;
    let ceremonyBandId = null;
    let ceremonyPrice = 0;
    if (hasCeremony) {
      const formation = CATALOG.formations.find(f => f.id === state.moments.ceremony.formationId);
      if (formation) {
        const band = CATALOG.curatedBands.find(b => b.id === state.moments.ceremony.bandId);
        ceremonyBandId = state.moments.ceremony.bandId;
        const duration = state.moments.ceremony.duration || 60;
        ceremonyPrice = formation.price;
        lines.push({
          id: "ceremony",
          category: "Música en Directo",
          moment: "Ceremonia",
          concept: `Música para Ceremonia — ${formation.name} (${duration} min)`,
          detail: `${band ? band.name + " (" + band.genre + ")" : "Estilo a medida"} • ${formation.instruments} • Incluye hasta 6 temas a la carta`,
          price: ceremonyPrice,
          duration: duration,
          status: formation.status,
          source: formation.source
        });
        grossSubtotal += ceremonyPrice;
      }
    }

    // 2. Momento: Aperitivo / Cóctel
    const hasAppetizer = state.moments?.appetizer && state.moments.appetizer.enabled;
    let appetizerBandId = null;
    let appetizerPrice = 0;
    if (hasAppetizer) {
      const formation = CATALOG.formations.find(f => f.id === state.moments.appetizer.formationId);
      if (formation) {
        const band = CATALOG.curatedBands.find(b => b.id === state.moments.appetizer.bandId);
        appetizerBandId = state.moments.appetizer.bandId;
        const duration = state.moments.appetizer.duration || 90;
        appetizerPrice = formation.price;
        lines.push({
          id: "appetizer",
          category: "Música en Directo",
          moment: "Aperitivo / Cóctel",
          concept: `Banda en Vivo para Aperitivo — ${formation.name} (${duration} min)`,
          detail: `${band ? band.name + " (" + band.genre + ")" : "Estilo a medida"} • ${formation.instruments} • Incluye hasta 3 temas a la carta`,
          price: appetizerPrice,
          duration: duration,
          status: formation.status,
          source: formation.source
        });
        grossSubtotal += appetizerPrice;
      }
    }

    // 3. Momento: Cena / Banquete
    const hasDinner = state.moments?.dinner && state.moments.dinner.enabled;
    if (hasDinner) {
      const extra = CATALOG.extras.dinnerSpeech;
      lines.push({
        id: "dinner",
        category: "Soporte Técnico",
        moment: "Cena / Banquete",
        concept: extra.name,
        detail: extra.description,
        price: extra.price,
        status: extra.status,
        statusLabel: extra.statusLabel,
        source: extra.source
      });
      grossSubtotal += extra.price;
    }

    // 4. Momento: Fiesta & DJ
    const hasParty = state.moments?.party && state.moments.party.enabled;
    const hasPerimeter = hasParty && state.moments.party.perimeterLight;
    if (hasParty) {
      const extraDj = CATALOG.extras.djParty;
      lines.push({
        id: "party",
        category: "Fiesta",
        moment: "Fiesta & Barra Libre",
        concept: extraDj.name,
        detail: extraDj.description,
        price: extraDj.price,
        status: extraDj.status,
        statusLabel: extraDj.statusLabel,
        source: extraDj.source
      });
      grossSubtotal += extraDj.price;

      // Iluminación perimetral opcional en fiesta
      if (hasPerimeter) {
        const extraPerim = CATALOG.extras.perimeterLight;
        lines.push({
          id: "party-perimeter",
          category: "Iluminación Extra",
          moment: "Fiesta / Exteriores",
          concept: extraPerim.name,
          detail: extraPerim.description,
          price: extraPerim.price,
          status: extraPerim.status,
          statusLabel: extraPerim.statusLabel,
          source: extraPerim.source
        });
        grossSubtotal += extraPerim.price;
      }
    }

    // 5. Infraestructura Técnica: Sonorización, Iluminación o Tech Pack
    let hasSoundBasicIndividual = false;
    if (state.tech && state.tech.selectedPackId) {
      // Caso A: Tech Pack oficial
      const pack = CATALOG.techPacks.find(p => p.id === state.tech.selectedPackId);
      if (pack) {
        lines.push({
          id: "tech-pack",
          category: "Packs Sonido + Iluminación",
          moment: "Producción Técnica",
          concept: pack.name,
          detail: `${pack.includes} (Ahorro de ${pack.savings} € frente a contratación individual)`,
          price: pack.price,
          savings: pack.savings,
          status: pack.status,
          source: pack.source
        });
        grossSubtotal += pack.price;

        if (pack.savings > 0) {
          discounts.push({
            id: "tech-pack-saving",
            name: `${pack.name} (${pack.percentSavings || '25%'})`,
            concept: `Ahorro Pack Conjunto (${pack.name})`,
            percent: pack.percentSavings || "25%",
            detail: `Bonificación oficial al unificar sonido e iluminación en un solo montaje técnico`,
            amount: pack.savings
          });
          totalSavings += pack.savings;
        }
      }
    } else if (state.tech) {
      // Caso B: Selección individual de sonido y luz
      if (state.tech.soundId && state.tech.soundId !== "none") {
        const sound = CATALOG.soundSystems.find(s => s.id === state.tech.soundId);
        if (sound) {
          if (sound.id === "basic") hasSoundBasicIndividual = true;
          lines.push({
            id: "sound-individual",
            category: "Sonorización",
            moment: "Producción Técnica",
            concept: sound.name,
            detail: sound.specs,
            price: sound.price,
            status: sound.status,
            source: sound.source
          });
          grossSubtotal += sound.price;
        }
      }

      if (state.tech.lightId && state.tech.lightId !== "none") {
        const light = CATALOG.lightSystems.find(l => l.id === state.tech.lightId);
        if (light) {
          lines.push({
            id: "light-individual",
            category: "Iluminación",
            moment: "Producción Técnica",
            concept: light.name,
            detail: light.specs,
            price: light.price,
            status: light.status,
            source: light.source
          });
          grossSubtotal += light.price;
        }
      }
    }

    // 6. Extras: Canciones adicionales fuera de repertorio (30 € / tema)
    const extraSongsCount = parseInt(state.extraSongs?.count, 10) || 0;
    if (extraSongsCount > 0) {
      const extraSongsPrice = extraSongsCount * 30;
      lines.push({
        id: "extra-songs",
        category: "Repertorio Especial",
        moment: "Personalización Musical",
        concept: `${extraSongsCount} Canción(es) Extra fuera de repertorio`,
        detail: `Preparación y arreglos exclusivos a 30 € / tema adicional`,
        price: extraSongsPrice,
        status: "CONFIRMADO",
        source: "Regla Santiago"
      });
      grossSubtotal += extraSongsPrice;
    }

    // =========================================================================
    // DESCUENTOS Y SINERGIAS DISCRIMINADAS (Reglas Validadas de Santiago)
    // =========================================================================

    const discCfg = state.discountsConfig || {};

    // 1. Regla Ceremonia + Aperitivo (Validada por Santiago)
    // - Mismo grupo: 15% dto en Aperitivo + 30% dto en Ceremonia
    // - Grupos distintos: 15% dto en Aperitivo + 15% dto en Ceremonia
    const multiMomentEnabled = discCfg.multiMoment !== undefined ? discCfg.multiMoment.enabled : true;
    if (hasCeremony && hasAppetizer && multiMomentEnabled) {
      const isSameBand = ceremonyBandId && appetizerBandId && ceremonyBandId === appetizerBandId;
      
      if (isSameBand) {
        const discAperitivo = Math.round(appetizerPrice * 0.15 * 100) / 100;
        const discCeremonia = Math.round(ceremonyPrice * 0.30 * 100) / 100;
        const totalMultiDisc = discAperitivo + discCeremonia;

        discounts.push({
          id: "multi-moment-same-band",
          name: `Mismo Grupo en Ceremonia (30%) + Aperitivo (15%)`,
          concept: `Sinergia Mismo Grupo — Ceremonia (30%) + Aperitivo (15%)`,
          percent: "30% / 15%",
          detail: `30% dto. en Ceremonia (-${formatMoney(discCeremonia)}) y 15% dto. en Aperitivo (-${formatMoney(discAperitivo)}) por mismo proyecto de artistas`,
          amount: totalMultiDisc
        });
        totalSavings += totalMultiDisc;
      } else {
        const discAperitivo = Math.round(appetizerPrice * 0.15 * 100) / 100;
        const discCeremonia = Math.round(ceremonyPrice * 0.15 * 100) / 100;
        const totalMultiDisc = discAperitivo + discCeremonia;

        discounts.push({
          id: "multi-moment-diff-bands",
          name: `Contratación Doble Servicio: Ceremonia + Aperitivo (15%)`,
          concept: `Sinergia Doble Servicio — Ceremonia (15%) + Aperitivo (15%)`,
          percent: "15%",
          detail: `15% de bonificación en cada pase (-${formatMoney(discCeremonia)} en ceremonia y -${formatMoney(discAperitivo)} en aperitivo)`,
          amount: totalMultiDisc
        });
        totalSavings += totalMultiDisc;
      }
    }

    // 2. Bonificación del 50% en Sonorización Básica con grupos propios (200 € por punto)
    const ownSoundEnabled = discCfg.ownBandSound !== undefined ? discCfg.ownBandSound.enabled : true;
    if (hasSoundBasicIndividual && (hasCeremony || hasAppetizer) && ownSoundEnabled) {
      const soundSaving = 200;
      discounts.push({
        id: "own-band-sound-discount",
        name: "Sonorización Básica Bonificada con Grupo Propio (-200 €)",
        concept: "Sonorización Básica Bonificada (Grupos LBM)",
        percent: "50%",
        detail: "Tarifa reducida oficial de 200 € por punto (en lugar de 400 €) al contratar bandas de Live Bands Music",
        amount: soundSaving
      });
      totalSavings += soundSaving;
    }

    // 3. Sinergia Fiesta DJ + Iluminación Perimetral
    if (hasParty && hasPerimeter) {
      const partySynergyAmount = 50;
      discounts.push({
        id: "party-dj-light-synergy",
        name: "Sinergia Fiesta DJ + Iluminación (15%)",
        concept: "Sinergia Fiesta DJ + Iluminación (15%)",
        percent: "15%",
        detail: "Bonificación técnica al coordinar la iluminación perimetral LED con la cabina del DJ",
        amount: partySynergyAmount
      });
      totalSavings += partySynergyAmount;
    }

    // 4. Comisión Event Partner / Profesional B2B (15% estándar)
    if (discCfg.planner && discCfg.planner.enabled) {
      const plannerPct = discCfg.planner.percent || 15;
      const plannerAmount = Math.round(grossSubtotal * (plannerPct / 100) * 100) / 100;
      discounts.push({
        id: "planner-commission",
        name: `Comisión Event Partner (${plannerPct}%)`,
        concept: `Comisión Event Partner (${plannerPct}%)`,
        percent: `${plannerPct}%`,
        detail: `Honorarios profesionales concertados para Event Partners y agencias de eventos`,
        amount: plannerAmount
      });
      totalSavings += plannerAmount;
    }

    // 5. Descuento Exclusivo Santiago / Cortesía / Negociación Manual (Lo que pidió Santiago)
    if (discCfg.custom && discCfg.custom.enabled && discCfg.custom.value > 0) {
      let customAmount = 0;
      const isPercent = discCfg.custom.type === "percent";
      if (isPercent) {
        customAmount = Math.round(grossSubtotal * (discCfg.custom.value / 100) * 100) / 100;
      } else {
        customAmount = Math.round(discCfg.custom.value * 100) / 100;
      }
      
      const reason = discCfg.custom.reason || "Cortesía Dirección Santiago Cholbi";
      discounts.push({
        id: "custom-santiago-discount",
        name: `Descuento Exclusivo: ${reason}`,
        concept: `Descuento Exclusivo Dirección — ${reason}`,
        percent: isPercent ? `${discCfg.custom.value}%` : "Importe Fijo",
        detail: `Ajuste manual aplicado por Santiago Cholbi (${isPercent ? discCfg.custom.value + '%' : formatMoney(customAmount)})`,
        amount: customAmount
      });
      totalSavings += customAmount;
    }

    // Cálculos impositivos y totales
    const subtotal = Math.max(0, Math.round((grossSubtotal - totalSavings) * 100) / 100);
    const vatRate = APP_CONFIG.vatRate;
    const vatAmount = Math.round(subtotal * vatRate * 100) / 100;
    const grandTotal = Math.round((subtotal + vatAmount) * 100) / 100;

    // Coste por comensal
    const guests = state.event?.guests || 100;
    const costPerGuest = guests > 0 && grandTotal > 0 ? Math.round((grandTotal / guests) * 100) / 100 : 0;

    // Desglose de pagos (15% reserva + 85% día del evento)
    const depositPercent = COMPANY_CONFIG.paymentPolicy.bookingDepositPercent / 100;
    const bookingDepositAmount = Math.round(grandTotal * depositPercent * 100) / 100;
    const eventDayBalanceAmount = Math.round((grandTotal - bookingDepositAmount) * 100) / 100;

    return {
      lines,
      discounts,
      grossSubtotal,
      subtotal,
      totalSavings,
      vatRate,
      vatPercentFormatted: `${Math.round(vatRate * 100)}%`,
      vatAmount,
      grandTotal,
      costPerGuest,
      guestsCount: guests,
      bookingDepositAmount,
      eventDayBalanceAmount,
      hasPendingItems: lines.some(l => l.status === "PENDIENTE")
    };
  }
};

export function calculateQuotePricing(state) {
  return PricingEngine.calculate(state);
}

