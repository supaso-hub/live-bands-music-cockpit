/**
 * scripts/test-lead-bridge.js
 * Test automatizado de ciclo completo del puente de datos Escaparate -> Cockpit:
 * 1. Generación de Ref LBM-XXX.
 * 2. Serialización y compresión Base64URL.
 * 3. Deserialización e integridad de payload.
 * 4. Hidratación simulada en el store.
 */

import { generateLeadRef, encodeLeadState, decodeLeadState, hydrateCockpitFromLead } from '../assets/js/services/lead-bridge.js';

console.log('\n🧪 INICIANDO TEST DEL PUENTE DE DATOS ESCAPARATE ➔ COCKPIT (FASE 2)\n');

let passCount = 0;
let errors = [];

function check(assertion, msg) {
  if (assertion) {
    passCount++;
    console.log(`  ✅ [PASS] ${msg}`);
  } else {
    errors.push(msg);
    console.log(`  ❌ [FAIL] ${msg}`);
  }
}

// 1. Generador de referencias
const ref1 = generateLeadRef();
const ref2 = generateLeadRef();
check(Boolean(ref1.match(/^LBM-[2-9A-HJ-NP-Z]{4}$/)), `Formato de token corto correcto (${ref1})`);
check(ref1 !== ref2, `Tokens no secuenciales y pseudo-aleatorios (${ref1} !== ${ref2})`);

// 2. Payload simulado de una pareja en El Escaparate
const sampleLead = {
  ref: ref1,
  fecha: "2027-07-15",
  finca: "Castell d'Empordà",
  contacto: {
    nombre: "Laura & Marc",
    telefono: "+34 600 11 22 33",
    email: "laura.marc@example.com"
  },
  momentos: {
    ceremonia: {
      bandaId: "vienna-brava",
      formationId: "DUO"
    },
    aperitivo: {
      bandaId: "jazz-de-copes",
      formationId: "TRIO"
    },
    fiesta_pre_dj: {
      bandaId: "sweet-planet",
      formationId: "QUARTET"
    }
  },
  servicios_extra: {
    banquete: true,
    fiesta_dj: true
  }
};

// 3. Serialización / Compresión segura para URL
const encoded = encodeLeadState(sampleLead);
check(Boolean(encoded && encoded.length > 20), `Codificación compacta generada (${encoded.length} caracteres)`);
check(!encoded.includes('+') && !encoded.includes('/') && !encoded.includes('='), `String URL-safe (sin '+', '/', ni '=')`);

// 4. Deserialización
const decoded = decodeLeadState(encoded);
check(decoded !== null, 'Decodificación exitosa');
check(decoded.ref === sampleLead.ref, `Referencia coincide: ${decoded.ref}`);
check(decoded.finca === sampleLead.finca, `Finca coincide: ${decoded.finca}`);
check(decoded.momentos.ceremonia.bandaId === "vienna-brava", 'Banda de ceremonia conservada intacta');
check(decoded.momentos.aperitivo.bandaId === "jazz-de-copes", 'Banda de aperitivo conservada intacta');
check(decoded.momentos.fiesta_pre_dj.bandaId === "sweet-planet", 'Banda de fiesta conservada intacta');

// 5. Simulación de hidratación en QuoteStore
const mockStore = {
  state: {
    event: { location: "", date: "" },
    customer: { name: "", phone: "" },
    moments: {
      ceremony: { enabled: false, bandId: "", formationId: "" },
      appetizer: { enabled: false, bandId: "", formationId: "" },
      dinner: { enabled: false },
      party: { enabled: false }
    }
  },
  getState() {
    return this.state;
  },
  setState(next) {
    this.state = next;
  }
};

const hydrated = hydrateCockpitFromLead(decoded, mockStore);
check(hydrated === true, 'Función hydrateCockpitFromLead ejecutada con éxito');
check(mockStore.state.event.location === "Castell d'Empordà", `Ubicación hidratada en store: ${mockStore.state.event.location}`);
check(mockStore.state.event.date === "2027-07-15", `Fecha hidratada en store: ${mockStore.state.event.date}`);
check(mockStore.state.customer.name === "Laura & Marc", `Nombre de pareja hidratado: ${mockStore.state.customer.name}`);
check(mockStore.state.moments.ceremony.enabled === true, 'Momento ceremonia activado automáticamente');
check(mockStore.state.moments.ceremony.bandId === "vienna-brava", 'Banda vienna-brava seleccionada en ceremonia');
check(mockStore.state.moments.appetizer.enabled === true, 'Momento aperitivo activado automáticamente');
check(mockStore.state.moments.appetizer.bandId === "jazz-de-copes", 'Banda jazz-de-copes seleccionada en aperitivo');
check(mockStore.state.moments.dinner.enabled === true, 'Banquete activado automáticamente');
check(mockStore.state.moments.party.enabled === true, 'Fiesta activada automáticamente');
check(mockStore.state.leadBridge?.active === true, 'Marca de leadBridge activa en el estado');

console.log('\n========================================================');
if (errors.length === 0) {
  console.log(`🎉 TEST DEL PUENTE DE DATOS APROBADO: ${passCount} verificaciones correctas.`);
  console.log('========================================================\n');
  process.exit(0);
} else {
  console.error(`💥 ERRORES EN EL TEST: ${errors.length}`);
  process.exit(1);
}
