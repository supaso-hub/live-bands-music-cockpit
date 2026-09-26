const fs = require('fs');
const path = require('path');
const https = require('https');

const rootDir = path.resolve(__dirname, '..');

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

// Contrast ratio calculation (WCAG 2.1)
function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(hex1, hex2) {
  const parseHex = h => {
    const num = parseInt(h.replace('#', ''), 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  };
  const [r1, g1, b1] = parseHex(hex1);
  const [r2, g2, b2] = parseHex(hex2);
  const l1 = getLuminance(r1, g1, b1);
  const l2 = getLuminance(r2, g2, b2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

async function runExtendedChecks() {
  console.log('--- VERIFICACIÓN ONLINE DE URLS COMPLEMENTARIAS EN VERCEL ---');
  const urls = [
    'https://live-bands-music-cockpit-v002.vercel.app/portal.html',
    'https://live-bands-music-cockpit-v002.vercel.app/como-funciona.html',
    'https://live-bands-music-cockpit-v002.vercel.app/escaparate.html'
  ];

  for (const u of urls) {
    const res = await fetchUrl(u);
    if (res.error) {
      console.log(`❌ ${u} -> Error: ${res.error}`);
    } else {
      const vMatch = res.body.match(/class=["'][^"']*mkt-version[^"']*["']>([^<]+)</);
      const v = vMatch ? vMatch[1].trim() : 'NONE';
      console.log(`✅ ${u} -> HTTP ${res.statusCode} | .mkt-version: "${v}"`);
    }
  }

  console.log('\n--- VERIFICACIÓN MATEMÁTICA WCAG AA (Regla 14) ---');
  // Background: #0D0D0D
  const bg = '#0D0D0D';
  // Copyright & secondary text: #CBD5E1
  const textSec = '#CBD5E1';
  // Legal links: #E2E8F0
  const textLegal = '#E2E8F0';
  // Marketing Amable green: #D8F3DC
  const textGreen = '#D8F3DC';
  // Monospace version: #94A3B8
  const textVer = '#94A3B8';

  const rSec = getContrastRatio(bg, textSec).toFixed(2);
  const rLegal = getContrastRatio(bg, textLegal).toFixed(2);
  const rGreen = getContrastRatio(bg, textGreen).toFixed(2);
  const rVer = getContrastRatio(bg, textVer).toFixed(2);

  console.log(`Contraste Texto Secundario / Copyright (${textSec} vs ${bg}): ${rSec}:1 (Mínimo WCAG AA: 4.5:1) -> ${rSec >= 4.5 ? 'PASS' : 'FAIL'}`);
  console.log(`Contraste Enlaces Legales (${textLegal} vs ${bg}): ${rLegal}:1 (Mínimo WCAG AA: 4.5:1) -> ${rLegal >= 4.5 ? 'PASS' : 'FAIL'}`);
  console.log(`Contraste Marca Verde (${textGreen} vs ${bg}): ${rGreen}:1 (Mínimo WCAG AA: 4.5:1) -> ${rGreen >= 4.5 ? 'PASS' : 'FAIL'}`);
  console.log(`Contraste Versión Monospace (${textVer} vs ${bg}): ${rVer}:1 (Mínimo WCAG AA: 4.5:1) -> ${rVer >= 4.5 ? 'PASS' : 'FAIL'}`);

  console.log('\n--- VERIFICACIÓN DE ESTILOS FOOTER EN PORTAL.HTML ---');
  const portalHtml = fs.readFileSync(path.join(rootDir, 'portal.html'), 'utf8');
  const hasSubfooterHeightRule = portalHtml.includes('.mkt-subfooter') || portalHtml.includes('mkt-subfooter');
  console.log(`Estructura subfooter presente en CSS/DOM: ${hasSubfooterHeightRule ? 'PASS' : 'FAIL'}`);
}

runExtendedChecks();
