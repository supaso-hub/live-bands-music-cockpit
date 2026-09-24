/**
 * app-config.js
 * Parámetros globales de la aplicación y reglas generales.
 */
export const APP_CONFIG = {
  vatRate: 0.21,              // IVA 21% general en España para servicios artísticos y técnicos
  soundRequiredThresholdPax: 200, // Aforo a partir del cual el sonido es indispensable
  defaultPerformanceDurationMin: 90, // Duración habitual de actuación musical
  eventPartnerCommissionRate: 0.15,   // 15% de comisión Event Partner / B2B opcional
  currencySymbol: "€",
  locale: "es-ES"
};
