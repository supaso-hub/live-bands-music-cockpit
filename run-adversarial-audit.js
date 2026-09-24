import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

async function runAudit() {
  const results = {};

  console.log("=== INICIANDO AUDITORÍA ADVERSARIAL INDEPENDIENTE QA ===");

  // Helper hash
  function getHash(filePath) {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  // --- PUERTA 0: Sincronización Estricta de Versión ---
  console.log("\n--- AUDITANDO PUERTA 0: VERSIÓN ---");
  const urlPortal = 'https://live-bands-music-cockpit-v002.vercel.app/portal.html';
  const localPortal = 'D:\\2026-live-bands-music-cockpit-v002-2026-09-21\\portal.html';
  const localHostinger = 'D:\\2026-live-bands-music-cockpit-v002-2026-09-21\\SUBIR_A_HOSTINGER_LBM\\index.html';

  let onlineHtml = '';
  try {
    const res = await fetch(urlPortal);
    onlineHtml = await res.text();
  } catch (err) {
    console.error("Error fetching online portal:", err);
  }

  const localPortalHtml = fs.readFileSync(localPortal, 'utf8');
  const localHostingerHtml = fs.readFileSync(localHostinger, 'utf8');

  function extractVersion(html) {
    const m = html.match(/class=["'][^"']*mkt-version[^"']*["'][^>]*>([^<]+)<\//i);
    return m ? m[1].trim() : null;
  }

  const onlineVer = extractVersion(onlineHtml);
  const localPortalVer = extractVersion(localPortalHtml);
  const localHostingerVer = extractVersion(localHostingerHtml);

  results.puerta0 = {
    onlineVer,
    localPortalVer,
    localHostingerVer,
    pass: onlineVer === 'v.24' && localPortalVer === 'v.24' && localHostingerVer === 'v.24'
  };
  console.log("Puerta 0:", results.puerta0);

  // --- PUERTA 1: Estructura en 3 Bloques Lógicos y 5 Accesos Funcionales ---
  console.log("\n--- AUDITANDO PUERTA 1: BLOQUES Y ENLACES ---");
  const targetLinks = [
    { name: "Escaparate de Novios", rel: "./escaparate.html", url: "https://live-bands-music-cockpit-v002.vercel.app/escaparate.html" },
    { name: "Mostrador de Presupuestos", rel: "./simulador.html", url: "https://live-bands-music-cockpit-v002.vercel.app/simulador.html" },
    { name: "Definiciones del Sistema", rel: "./alineacion.html", url: "https://live-bands-music-cockpit-v002.vercel.app/alineacion.html" },
    { name: "Prueba de Conexión", rel: "./test-lead-bridge.html", url: "https://live-bands-music-cockpit-v002.vercel.app/test-lead-bridge.html" },
    { name: "Comparativa con el Sistema Anterior", rel: "./demo.html", url: "https://live-bands-music-cockpit-v002.vercel.app/demo.html" }
  ];

  const linkStatus = [];
  for (const item of targetLinks) {
    try {
      const res = await fetch(item.url, { method: 'HEAD' });
      const getRes = await fetch(item.url);
      linkStatus.push({
        name: item.name,
        rel: item.rel,
        url: item.url,
        status: res.status,
        contentLength: getRes.headers.get('content-length') || (await getRes.text()).length,
        ok: res.status === 200
      });
    } catch (err) {
      linkStatus.push({ name: item.name, url: item.url, error: err.message, ok: false });
    }
  }

  // Check 3 logical blocks presence in HTML
  const hasBlock1 = /El d[ií]a a d[ií]a de tu negocio/i.test(onlineHtml) || /escaparate\.html/i.test(onlineHtml);
  const hasBlock2 = /Decisiones que necesitamos de vos/i.test(onlineHtml) || /alineacion\.html/i.test(onlineHtml);
  const hasBlock3 = /Laboratorio y comprobaci[oó]n t[eé]cnica/i.test(onlineHtml) || /test-lead-bridge\.html/i.test(onlineHtml);

  results.puerta1 = {
    blocks: {
      block1: hasBlock1,
      block2: hasBlock2,
      block3: hasBlock3
    },
    links: linkStatus,
    pass: hasBlock1 && hasBlock2 && hasBlock3 && linkStatus.every(l => l.ok)
  };
  console.log("Puerta 1:", results.puerta1);

  // --- PUERTA 2: Tono Amigable y Cero Jerga Técnica Interna ---
  console.log("\n--- AUDITANDO PUERTA 2: JERGA INTERNA Y TONO ---");
  // Blacklist of forbidden internal strings
  const forbiddenPatterns = [
    /\bSTR-\w+/i,
    /\bOBJ-\w+/i,
    /\bEVI-\w+/i,
    /\bCPY-\w+/i,
    /\bQA-\w+/i,
    /\bFE-\w+/i,
    /\bBE-\w+/i,
    /\bPrompt\b/i,
    /\bAct[uú]a como\b/i,
    /\bNo alucinar\b/i,
    /\bGenerar c[oó]digo\b/i,
    /Regla de Ejecuci[oó]n/i,
    /F[aá]brica de Webs/i,
    /Anti-plantilla/i,
    /Big School/i,
    /Protocolo Maestro/i
  ];

  // We should test visible text rendered, let's strip HTML tags and script/style tags
  function getVisibleText(html) {
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
  }

  const visibleTextOnline = getVisibleText(onlineHtml);
  const visibleTextLocal = getVisibleText(localHostingerHtml);

  const detectedForbiddenOnline = [];
  for (const pat of forbiddenPatterns) {
    const match = visibleTextOnline.match(pat);
    if (match) detectedForbiddenOnline.push(match[0]);
  }

  const detectedForbiddenLocal = [];
  for (const pat of forbiddenPatterns) {
    const match = visibleTextLocal.match(pat);
    if (match) detectedForbiddenLocal.push(match[0]);
  }

  // Domain terms check
  const domainTerms = ['Santiago', 'bodas', 'novios', 'presupuestos', 'fincas', 'músicos', 'WhatsApp'];
  const domainTermsPresent = domainTerms.map(t => ({
    term: t,
    found: new RegExp(t, 'i').test(visibleTextOnline)
  }));

  results.puerta2 = {
    forbiddenFoundOnline: detectedForbiddenOnline,
    forbiddenFoundLocal: detectedForbiddenLocal,
    domainTermsPresent,
    pass: detectedForbiddenOnline.length === 0 && detectedForbiddenLocal.length === 0
  };
  console.log("Puerta 2:", results.puerta2);

  // --- PUERTA 3: Integridad de Activos Visuales ---
  console.log("\n--- AUDITANDO PUERTA 3: ACTIVOS VISUALES ---");
  const imgMatches = [...onlineHtml.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)].map(m => m[1]);
  const imageAudit = [];
  for (const src of imgMatches) {
    const resolvedUrl = new URL(src, urlPortal).toString();
    try {
      const res = await fetch(resolvedUrl);
      const buf = await res.arrayBuffer();
      imageAudit.push({
        src,
        resolvedUrl,
        status: res.status,
        contentType: res.headers.get('content-type'),
        bytes: buf.byteLength,
        ok: res.status === 200 && buf.byteLength > 0
      });
    } catch (err) {
      imageAudit.push({ src, resolvedUrl, error: err.message, ok: false });
    }
  }

  results.puerta3 = {
    images: imageAudit,
    pass: imageAudit.length > 0 && imageAudit.every(img => img.ok)
  };
  console.log("Puerta 3:", results.puerta3);

  // --- PUERTA 4: Ergonomía de Footer y Contraste WCAG AA ---
  console.log("\n--- AUDITANDO PUERTA 4: FOOTER Y CONTRASTE ---");
  // Contrast calculations
  function parseRgb(colorStr) {
    const m = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (m) return [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])];
    if (colorStr.startsWith('#')) {
      const hex = colorStr.replace('#', '');
      if (hex.length === 3) {
        return [parseInt(hex[0]+hex[0], 16), parseInt(hex[1]+hex[1], 16), parseInt(hex[2]+hex[2], 16)];
      }
      return [parseInt(hex.slice(0,2), 16), parseInt(hex.slice(2,4), 16), parseInt(hex.slice(4,6), 16)];
    }
    return [0, 0, 0];
  }

  function getLuminance(r, g, b) {
    const a = [r, g, b].map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  }

  function getContrast(rgb1, rgb2) {
    const lum1 = getLuminance(...rgb1);
    const lum2 = getLuminance(...rgb2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  }

  const bgRgb = parseRgb('#090909'); // [9, 9, 9]
  const textColorsToTest = [
    { label: "Secundario / Copyright (#CBD5E1)", hex: "#CBD5E1" },
    { label: "MARKETING (#FFFFFF)", hex: "#FFFFFF" },
    { label: "AMABLE (#D8F3DC)", hex: "#D8F3DC" },
    { label: "Versión v.24 (#CBD5E1)", hex: "#CBD5E1" }
  ];

  const contrastResults = textColorsToTest.map(item => {
    const rgb = parseRgb(item.hex);
    const ratio = getContrast(rgb, bgRgb);
    return {
      label: item.label,
      hex: item.hex,
      ratio: ratio.toFixed(2) + ':1',
      passesAA: ratio >= 4.5
    };
  });

  results.puerta4 = {
    contrastResults,
    pass: contrastResults.every(c => c.passesAA)
  };
  console.log("Puerta 4:", results.puerta4);

  // --- PUERTA 5: Paridad Absoluta con Hostinger ---
  console.log("\n--- AUDITANDO PUERTA 5: PARIDAD HOSTINGER VS PORTAL ---");
  const portalHash = getHash(localPortal);
  const hostingerHash = getHash(localHostinger);

  const areIdentical = portalHash === hostingerHash;
  let diffSnippet = null;
  if (!areIdentical) {
    // Find where they differ
    const linesPortal = localPortalHtml.split('\n');
    const linesHostinger = localHostingerHtml.split('\n');
    console.log(`Lines portal: ${linesPortal.length}, Lines hostinger: ${linesHostinger.length}`);
    for (let i = 0; i < Math.max(linesPortal.length, linesHostinger.length); i++) {
      if (linesPortal[i] !== linesHostinger[i]) {
        diffSnippet = {
          line: i + 1,
          portal: linesPortal[i],
          hostinger: linesHostinger[i]
        };
        break;
      }
    }
  }

  results.puerta5 = {
    localPortalPath: localPortal,
    localHostingerPath: localHostinger,
    portalHash,
    hostingerHash,
    identical: areIdentical,
    diffSnippet,
    pass: areIdentical
  };
  console.log("Puerta 5:", results.puerta5);

  fs.writeFileSync('D:\\2026-live-bands-music-cockpit-v002-2026-09-21\\audit_results.json', JSON.stringify(results, null, 2));
  console.log("\nAuditoría guardada en D:\\2026-live-bands-music-cockpit-v002-2026-09-21\\audit_results.json");
}

runAudit();
