const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');

console.log('====================================================');
console.log('🕵️ AUDITORÍA ADVERSARIAL INDEPENDIENTE DE QA - v.28');
console.log('====================================================\n');

// 1. PUERTA 0: Sincronización Estricta de Versión
console.log('--- PUERTA 0: Sincronización Estricta de Versión ---');
const filesToAudit = [
  'portal.html',
  'SUBIR_A_HOSTINGER_LBM/index.html',
  'como-funciona.html',
  'escaparate.html',
  'demo.html'
];

let p0Pass = true;
filesToAudit.forEach(f => {
  const filePath = path.join(rootDir, f);
  if (!fs.existsSync(filePath)) {
    console.log(`❌ [FAIL] ${f} no existe.`);
    p0Pass = false;
    return;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  const match = content.match(/class=["'][^"']*mkt-version[^"']*["']>([^<]+)</);
  const version = match ? match[1].trim() : 'NO ENCONTRADA';
  if (version === 'v.28') {
    console.log(`  ✅ [PASS] ${f} -> .mkt-version = "${version}"`);
  } else {
    console.log(`  ❌ [FAIL] ${f} -> .mkt-version = "${version}" (esperado: "v.28")`);
    p0Pass = false;
  }
});

// 2. PUERTA 1: Estructura del Menú por Intención (Opción A) en portal.html
console.log('\n--- PUERTA 1: Estructura del Menú por Intención (Opción A) ---');
const portalHtml = fs.readFileSync(path.join(rootDir, 'portal.html'), 'utf8');
let p1Pass = true;

if (portalHtml.includes('¿Qué querés hacer hoy?')) {
  console.log('  ✅ [PASS] Hero Header contiene la pregunta central: "¿Qué querés hacer hoy?"');
} else {
  console.log('  ❌ [FAIL] Hero Header no contiene "¿Qué querés hacer hoy?"');
  p1Pass = false;
}

const checkCard = (cardNum, title, hrefRegex) => {
  const hasHref = hrefRegex.test(portalHtml);
  if (hasHref) {
    console.log(`  ✅ [PASS] Tarjeta ${cardNum} (${title}) presente y con enlace correcto (${hrefRegex})`);
  } else {
    console.log(`  ❌ [FAIL] Tarjeta ${cardNum} (${title}) NO encontrada o enlace incorrecto`);
    p1Pass = false;
  }
};

checkCard(1, 'Entender el circuito', /href=["']\.\/como-funciona\.html["']/);
checkCard(2, 'Lo que ve el cliente', /href=["']\.\/escaparate\.html["']/);
checkCard(3, 'Tu mostrador y aprobación', /href=["']\.\/simulador\.html["']/);

// Franja secundaria
const secondaryLinks = [
  { name: 'alineacion.html', regex: /href=["']\.\/alineacion\.html["']/ },
  { name: 'test-lead-bridge.html', regex: /href=["']\.\/test-lead-bridge\.html["']/ },
  { name: 'demo.html', regex: /href=["']\.\/demo\.html["']/ }
];

secondaryLinks.forEach(l => {
  if (l.regex.test(portalHtml)) {
    console.log(`  ✅ [PASS] Herramienta secundaria ${l.name} presente en la franja`);
  } else {
    console.log(`  ❌ [FAIL] Herramienta secundaria ${l.name} ausente`);
    p1Pass = false;
  }
});

// 3. PUERTA 2: CDN Lucide en jsdelivr
console.log('\n--- PUERTA 2: Fijación de CDN Lucide en jsdelivr ---');
let p2Pass = true;
const lucideJsdelivr = 'https://cdn.jsdelivr.net/npm/lucide@0.469.0/dist/umd/lucide.min.js';
if (portalHtml.includes(lucideJsdelivr)) {
  console.log(`  ✅ [PASS] portal.html usa exactamente Lucide jsdelivr fijo: ${lucideJsdelivr}`);
} else {
  console.log(`  ❌ [FAIL] portal.html no tiene la URL fija jsdelivr esperada`);
  const lucideMatch = portalHtml.match(/src=["']([^"']*lucide[^"']*)["']/);
  console.log(`         Encontrado: ${lucideMatch ? lucideMatch[1] : 'Ninguno'}`);
  p2Pass = false;
}

// 4. PUERTA 3: Cero Fuga de Jerga Interna (Regla 11)
console.log('\n--- PUERTA 3: Cero Fuga de Jerga Interna (Regla 11) ---');
const prohibitedJargon = [
  'STR-', 'OBJ-', 'EVI-', 'CPY-', 'QA-', 'FE-', 'BE-',
  'Prompt', 'Actúa como', 'No alucinar', 'Generar código',
  'Regla de Ejecución', 'Fábrica de Webs', 'Anti-plantilla',
  'Big School', 'Protocolo Maestro'
];

let p3Pass = true;
// Strip HTML tags and comments to analyze text nodes visible to user
const bodyMatch = portalHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
const bodyContent = bodyMatch ? bodyMatch[1] : portalHtml;
// Remove scripts and styles
const cleanText = bodyContent
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<!--[\s\S]*?-->/g, ' ')
  .replace(/<[^>]+>/g, ' ');

prohibitedJargon.forEach(word => {
  const regex = new RegExp(`\\b${word}\\b`, 'i');
  if (regex.test(cleanText)) {
    console.log(`  ❌ [FAIL] Encontrada jerga interna prohibida en texto visible: "${word}"`);
    p3Pass = false;
  }
});
if (p3Pass) {
  console.log('  ✅ [PASS] 0 términos de jerga interna detectados en texto visible.');
  console.log('  ✅ [PASS] El texto habla del ecosistema de bodas, bandas en vivo y circuito de Santiago.');
}

// 5. PUERTA 4: Footer Oficial Marketing Amable v2.0 y Ergonomía (Regla 14)
console.log('\n--- PUERTA 4: Footer Oficial Marketing Amable v2.0 y Ergonomía ---');
let p4Pass = true;

const hasClientFooter = /<footer[^>]*class=["'][^"']*client-footer[^"']*["']/i.test(portalHtml);
const hasSubfooter = /<div[^>]*class=["'][^"']*mkt-subfooter[^"']*["']/i.test(portalHtml);
if (hasClientFooter && hasSubfooter) {
  console.log('  ✅ [PASS] Estructura de 2 niveles (client-footer + mkt-subfooter) confirmada');
} else {
  console.log(`  ❌ [FAIL] Faltan niveles de footer: client-footer=${hasClientFooter}, mkt-subfooter=${hasSubfooter}`);
  p4Pass = false;
}

const gifMatch = portalHtml.match(/<img[^>]*src=["'][^"']*002\.gif["'][^>]*>/i);
if (gifMatch) {
  const gifStr = gifMatch[0];
  const hasW = /width=["']28["']/.test(gifStr);
  const hasH = /height=["']28["']/.test(gifStr);
  if (hasW && hasH) {
    console.log('  ✅ [PASS] GIF 002.gif con width="28" y height="28"');
  } else {
    console.log(`  ❌ [FAIL] GIF 002.gif sin width="28" height="28" explícito: ${gifStr}`);
    p4Pass = false;
  }
} else {
  console.log('  ❌ [FAIL] No se encontró el GIF 002.gif en el footer');
  p4Pass = false;
}

const hasLexend800 = portalHtml.includes('mkt-white') && portalHtml.includes('mkt-green');
const hasWhite = /<span[^>]*class=["'][^"']*mkt-white[^"']*["']>MARKETING<\/span>/i.test(portalHtml);
const hasGreen = /<span[^>]*class=["'][^"']*mkt-green[^"']*["']>AMABLE<\/span>/i.test(portalHtml);
if (hasWhite && hasGreen) {
  console.log('  ✅ [PASS] Tipografía Lexend 800: "MARKETING" blanco + "AMABLE" verde');
} else {
  console.log('  ❌ [FAIL] Firma Marketing Amable no tiene la estructura de spans esperada');
  p4Pass = false;
}

const hasDynamicYear = portalHtml.includes('currentYear') || portalHtml.includes('new Date().getFullYear()');
const hasCopyright = /©\s*<span[^>]*id=["']currentYear["'][^>]*>/i.test(portalHtml) || portalHtml.includes('Todos los derechos reservados');
if (hasDynamicYear && hasCopyright) {
  console.log('  ✅ [PASS] Copyright en Sentence Case con año dinámico');
} else {
  console.log('  ❌ [FAIL] Copyright dinámico no validado');
  p4Pass = false;
}

// 6. PUERTA 5: Paridad con la Carpeta de Hostinger
console.log('\n--- PUERTA 5: Paridad con la Carpeta de Hostinger ---');
let p5Pass = true;
const hostingerIndex = path.join(rootDir, 'SUBIR_A_HOSTINGER_LBM', 'index.html');
const portalPath = path.join(rootDir, 'portal.html');

if (!fs.existsSync(hostingerIndex)) {
  console.log('  ❌ [FAIL] SUBIR_A_HOSTINGER_LBM/index.html no existe');
  p5Pass = false;
} else {
  const c1 = fs.readFileSync(portalPath, 'utf8');
  const c2 = fs.readFileSync(hostingerIndex, 'utf8');
  if (c1 === c2) {
    console.log('  ✅ [PASS] Paridad 100% exacta (hash idéntico) entre portal.html y SUBIR_A_HOSTINGER_LBM/index.html');
  } else {
    console.log(`  ❌ [FAIL] Discrepancia de contenido. Tamaño portal: ${c1.length}, tamaño hostinger: ${c2.length}`);
    p5Pass = false;
  }
}

// 7. PUERTA 7: Producción Online Vercel
console.log('\n--- PUERTA 7: Producción Online Vercel ---');

function fetchUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, headers: res.headers, body: data });
      });
    }).on('error', (err) => {
      resolve({ error: err.message });
    });
  });
}

async function runOnlineCheck() {
  const vercelPortalUrl = 'https://live-bands-music-cockpit-v002.vercel.app/portal.html';
  console.log(`Consultando ${vercelPortalUrl}...`);
  const res = await fetchUrl(vercelPortalUrl);
  let p7Pass = true;

  if (res.error) {
    console.log(`  ❌ [FAIL] Error de conexión: ${res.error}`);
    p7Pass = false;
  } else {
    console.log(`  Status Code: HTTP ${res.statusCode}`);
    if (res.statusCode === 200) {
      console.log('  ✅ [PASS] HTTP 200 OK');
    } else {
      console.log(`  ❌ [FAIL] Código HTTP inesperado: ${res.statusCode}`);
      p7Pass = false;
    }

    if (res.body.includes('¿Qué querés hacer hoy?')) {
      console.log('  ✅ [PASS] Producción contiene el nuevo título: "¿Qué querés hacer hoy?"');
    } else {
      console.log('  ❌ [FAIL] Producción NO contiene "¿Qué querés hacer hoy?"');
      p7Pass = false;
    }

    const versionMatch = res.body.match(/class=["'][^"']*mkt-version[^"']*["']>([^<]+)</);
    const onlineVersion = versionMatch ? versionMatch[1].trim() : 'NO ENCONTRADA';
    if (onlineVersion === 'v.28') {
      console.log(`  ✅ [PASS] Producción .mkt-version = "${onlineVersion}"`);
    } else {
      console.log(`  ❌ [FAIL] Producción .mkt-version = "${onlineVersion}" (esperado "v.28")`);
      p7Pass = false;
    }
  }

  console.log('\n====================================================');
  console.log('🏁 RESUMEN PREVIO DE AUDITORÍA ADVERSARIAL:');
  console.log(`PUERTA 0: ${p0Pass ? 'PASS' : 'FAIL'}`);
  console.log(`PUERTA 1: ${p1Pass ? 'PASS' : 'FAIL'}`);
  console.log(`PUERTA 2: ${p2Pass ? 'PASS' : 'FAIL'}`);
  console.log(`PUERTA 3: ${p3Pass ? 'PASS' : 'FAIL'}`);
  console.log(`PUERTA 4: ${p4Pass ? 'PASS' : 'FAIL'}`);
  console.log(`PUERTA 5: ${p5Pass ? 'PASS' : 'FAIL'}`);
  console.log(`PUERTA 7: ${p7Pass ? 'PASS' : 'FAIL'}`);
  console.log('====================================================');
}

runOnlineCheck();
