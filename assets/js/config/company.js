/**
 * company.js
 * Configuración de empresa, términos de contratación y datos legales.
 * Aislado para permitir modificaciones sin tocar la lógica de la aplicación.
 */
export const COMPANY_CONFIG = {
  brandName: "Live Bands Music",
  tagline: "Música en Vivo, Sonorización e Iluminación Profesional",
  manager: "Santiago Cholbi Yuste",
  cif: "38101927N",
  address: "C/ Germans Serra i Bonal 8A, 17491 Peralada (Girona)",
  phone: "+34 627 37 03 34",
  phoneClean: "+34627370334",
  email: "webmaster.socve@gmail.com",
  officialEmail: "livebandsmusic@gmail.com",
  web: "https://www.livebandsmusic.com",
  catalogYear: 2027,
  version: "v.17",
  
  // Políticas comerciales
  paymentPolicy: {
    bookingDepositPercent: 15,
    eventDayPercent: 85,
    description: "15% + IVA de reserva previa con factura oficial; 85% restante el mismo día del evento."
  },
  
  travelPolicy: {
    includedProvince: "Girona",
    includedText: "Desplazamiento incluido en toda la provincia de Girona.",
    outsideText: "Desplazamiento fuera de Girona sujeto a cotización de kilometraje y dietas según localización."
  },
  
  staffMealsPolicy: "Se contempla la provisión de cena/menú de staff para el equipo técnico y artístico presente en el evento.",
  
  rgpdText: "En cumplimiento del RGPD (UE) 2016/679, responsable del tratamiento: Santiago Cholbi Yuste (CIF: 38101927N). Finalidad: Gestión y emisión de presupuestos comerciales. No se cederán datos a terceros salvo obligación legal."
};
