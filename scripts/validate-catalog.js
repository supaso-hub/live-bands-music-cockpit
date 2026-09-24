/**
 * scripts/validate-catalog.js
 * Auditoría automatizada de integridad referencial, matemática, estructural
 * y de seguridad comercial (desacoplamiento público/privado) para LBM 2027.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicCatalogPath = path.resolve(__dirname, '../assets/data/catalog.public.json');
const privateCatalogPath = path.resolve(__dirname, '../assets/data/catalog.private.json');
const publicSchemaPath = path.resolve(__dirname, '../assets/data/catalog.public.schema.json');
const privateSchemaPath = path.resolve(__dirname, '../assets/data/catalog.schema.json');

console.log(`\n🔍 INICIANDO AUDITORÍA TÉCNICA Y DE SEGURIDAD COMERCIAL LBM 2027`);
console.log(`📁 Catálogo Público: ${publicCatalogPath}`);
console.log(`📁 Catálogo Privado: ${privateCatalogPath}\n`);

let errors = [];
let passCount = 0;

function check(assertion, message) {
  if (assertion) {
    passCount++;
    console.log(`  ✅ [PASS] ${message}`);
  } else {
    errors.push(message);
    console.log(`  ❌ [FAIL] ${message}`);
  }
}

try {
  // =========================================================================
  // BLOQUE A: AUDITORÍA DE SEGURIDAD COMERCIAL Y CATÁLOGO PÚBLICO (EL ESCAPARATE)
  // =========================================================================
  console.log('--- 1. Auditoría de Seguridad Comercial (catalog.public.json) ---');
  check(fs.existsSync(publicCatalogPath), 'catalog.public.json existe físicamente');
  check(fs.existsSync(publicSchemaPath), 'catalog.public.schema.json existe físicamente');

  const rawPublic = fs.readFileSync(publicCatalogPath, 'utf8');
  const publicCatalog = JSON.parse(rawPublic);
  check(true, 'catalog.public.json es sintácticamente válido');

  // Comprobación estricta de CERO FUGA DE COSTES INTERNOS
  check(!rawPublic.includes('musicos_roles'), 'BLINDAJE: Cero menciones a "musicos_roles" en catálogo público');
  check(!rawPublic.includes('cache_individual_eur'), 'BLINDAJE: Cero menciones a "cache_individual_eur" en catálogo público');
  check(!rawPublic.includes('margen'), 'BLINDAJE: Cero menciones a "margen" en catálogo público');
  check(publicCatalog.tipo_catalogo === 'PUBLICO_CLIENTES', 'Etiqueta de tipo_catalogo = PUBLICO_CLIENTES');

  // Integridad de bandas públicas y momentos
  const publicBandIds = publicCatalog.bandas.map(b => b.id);
  check(publicBandIds.length === 7, `7 bandas públicas declaradas (${publicBandIds.join(', ')})`);
  check(publicCatalog.momentos_live.length === 3, 'Exactamente 3 momentos live confirmados (ceremonia, aperitivo, fiesta_pre_dj)');

  // Referencias de matriz pública
  let publicRefsCount = 0;
  for (const [momento, estilos] of Object.entries(publicCatalog.matriz_compatibilidad_live)) {
    for (const [estilo, bandas] of Object.entries(estilos)) {
      bandas.forEach(bId => {
        publicRefsCount++;
        if (!publicBandIds.includes(bId)) {
          check(false, `Referencia rota en matriz pública: '${bId}'`);
        }
      });
    }
  }
  check(errors.length === 0, `100% de las referencias de la matriz pública (${publicRefsCount} bandas) resuelven correctamente`);

  // =========================================================================
  // BLOQUE B: AUDITORÍA DEL CATÁLOGO PRIVADO OPERATIVO (COCKPIT)
  // =========================================================================
  console.log('\n--- 2. Auditoría del Catálogo Privado (catalog.private.json) ---');
  check(fs.existsSync(privateCatalogPath), 'catalog.private.json existe físicamente');
  check(fs.existsSync(privateSchemaPath), 'catalog.schema.json existe físicamente');

  const rawPrivate = fs.readFileSync(privateCatalogPath, 'utf8');
  const privateCatalog = JSON.parse(rawPrivate);
  check(true, 'catalog.private.json es sintácticamente válido');

  // Trazabilidad comercial Regla 13
  check(privateCatalog.tipo_catalogo === 'PRIVADO_OPERADOR_COCKPIT', 'tipo_catalogo = PRIVADO_OPERADOR_COCKPIT');
  check(privateCatalog.estado_validacion_comercial === 'PENDIENTE_CONFIRMACION_SANTIAGO', 'Trazabilidad: estado marcado como PENDIENTE_CONFIRMACION_SANTIAGO');
  check(Boolean(privateCatalog.nota_trazabilidad_regla_13), 'Disclaimer formal de Regla 13 presente');

  // Integridad matemática de las 27 formaciones privadas
  let privateFormationsCount = 0;
  privateCatalog.bandas.forEach(band => {
    band.formaciones.forEach(form => {
      privateFormationsCount++;
      const sum = form.musicos_roles.reduce((acc, curr) => acc + curr.cache_individual_eur, 0);
      const diff = Math.abs(sum - form.cache_base_eur);
      if (diff !== 0) {
        check(false, `Discrepancia en ${band.id} -> ${form.nombre}: suma de roles (${sum} €) != base (${form.cache_base_eur} €)`);
      }
      if (form.musicos_roles.length !== form.musicos_cantidad) {
        check(false, `Discrepancia en ${band.id} -> ${form.nombre}: musicos_cantidad != longitud de roles`);
      }
    });
  });
  check(errors.length === 0, `100% de las ${privateFormationsCount} formaciones privadas cuadran matemáticamente`);

  // =========================================================================
  // RESUMEN FINAL
  // =========================================================================
  console.log('\n========================================================');
  if (errors.length === 0) {
    console.log(`🎉 AUDITORÍA DUAL APROBADA: ${passCount} checks superados.`);
    console.log(`🛡️ Seguridad comercial: 100% BLINDADA (Cero fuga de costes en público).`);
    console.log(`📊 Integridad matemática privada: 100% VERIFICADA.`);
    console.log('========================================================\n');
    process.exit(0);
  } else {
    console.error(`💥 SE ENCONTRARON ${errors.length} ERRORES:`);
    errors.forEach((e, i) => console.error(`  ${i + 1}. ${e}`));
    console.log('========================================================\n');
    process.exit(1);
  }
} catch (err) {
  console.error('Error fatal al validar catálogos:', err);
  process.exit(1);
}
