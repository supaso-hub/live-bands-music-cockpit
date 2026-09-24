/**
 * scripts/sync-hostinger.js
 * Script de sincronización atómica automatizada del catálogo canónico
 * y componentes base hacia la réplica de Hostinger y el workspace paralelo.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('\n🚀 EJECUTANDO PIPELINE AUTOMATIZADO DE SINCRONIZACIÓN LBM');

// 1. Ejecutar validaciones previas
console.log('1️⃣ Validando catálogo e integridad del puente de datos...');
try {
  execSync('node scripts/validate-catalog.js', { stdio: 'inherit', cwd: rootDir });
  execSync('node scripts/test-lead-bridge.js', { stdio: 'inherit', cwd: rootDir });
} catch (e) {
  console.error('❌ Abortando sincronización: falló la auditoría previa.');
  process.exit(1);
}

// 2. Destinos de sincronización
const targets = [
  path.resolve(rootDir, 'SUBIR_A_HOSTINGER_LBM'),
  path.resolve('d:/2026-agente-live-bands-music-2026-09-20')
];

// Archivos y carpetas críticas a sincronizar
const itemsToSync = [
  { src: 'assets/data/catalog.json', destSubpath: 'assets/data/catalog.json' },
  { src: 'assets/data/catalog.public.json', destSubpath: 'assets/data/catalog.public.json' },
  { src: 'assets/data/catalog.private.json', destSubpath: 'assets/data/catalog.private.json' },
  { src: 'assets/data/catalog.public.schema.json', destSubpath: 'assets/data/catalog.public.schema.json' },
  { src: 'assets/data/catalog.schema.json', destSubpath: 'assets/data/catalog.schema.json' },
  { src: 'assets/js/data/catalog.js', destSubpath: 'assets/js/data/catalog.js' },
  { src: 'assets/js/services/lead-bridge.js', destSubpath: 'assets/js/services/lead-bridge.js' },
  { src: 'assets/js/app.js', destSubpath: 'assets/js/app.js' },
  { src: 'api/lead.js', destSubpath: 'api/lead.js' },
  { src: 'test-lead-bridge.html', destSubpath: 'test-lead-bridge.html' },
  { src: 'escaparate.html', destSubpath: 'escaparate.html' },
  { src: 'assets/js/escaparate.js', destSubpath: 'assets/js/escaparate.js' },
  { src: 'demo.html', destSubpath: 'demo.html' },
  { src: 'portal.html', destSubpath: 'portal.html' }
];

targets.forEach(targetDir => {
  if (!fs.existsSync(targetDir)) {
    console.log(`⚠️ Destino no encontrado (omitiendo): ${targetDir}`);
    return;
  }

  console.log(`\n2️⃣ Sincronizando hacia: ${targetDir}`);
  itemsToSync.forEach(item => {
    // Blindaje de seguridad comercial: nunca copiar costes privados a Hostinger
    if (targetDir.includes('SUBIR_A_HOSTINGER_LBM') && item.src.includes('catalog.private.json')) {
      const privateDest = path.resolve(targetDir, item.destSubpath);
      if (fs.existsSync(privateDest)) fs.unlinkSync(privateDest);
      return;
    }

    const fullSrc = path.resolve(rootDir, item.src);
    const fullDest = path.resolve(targetDir, item.destSubpath);

    if (fs.existsSync(fullSrc)) {
      const parentDir = path.dirname(fullDest);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      fs.copyFileSync(fullSrc, fullDest);
      console.log(`   ✅ Sincronizado: ${item.src} ➔ ${item.destSubpath}`);
    } else {
      console.log(`   ⚠️ Origen no encontrado: ${item.src}`);
    }
  });

  // Asegurar que en Hostinger, portal.html sea el index.html principal
  if (targetDir.includes('SUBIR_A_HOSTINGER_LBM')) {
    const portalSrc = path.resolve(rootDir, 'portal.html');
    const indexDest = path.resolve(targetDir, 'index.html');
    if (fs.existsSync(portalSrc)) {
      fs.copyFileSync(portalSrc, indexDest);
      console.log(`   ✅ Portada principal de Hostinger configurada: portal.html ➔ index.html`);
    }
  }
});

console.log('\n🎉 SINCRONIZACIÓN ATÓMICA COMPLETADA CON ÉXITO.\n');
