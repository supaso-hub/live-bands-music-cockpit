/**
 * api/lead.js
 * Vercel Serverless Function para almacenamiento y resolución de tokens cortos LBM-XXX.
 * Compatible con Upstash Redis REST API / Vercel KV con fallback de memoria/stateless.
 */

// Almacén en memoria volátil de la instancia serverless (fallback si no hay Redis configurado)
const memoryStore = new Map();

export default async function handler(req, res) {
  // Configuración de cabeceras CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  const hasRedis = Boolean(redisUrl && redisToken);

  // -------------------------------------------------------------
  // POST: Guardar nuevo anteproyecto de lead
  // -------------------------------------------------------------
  if (req.method === "POST") {
    try {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const ref = body?.ref;

      if (!ref || typeof ref !== "string") {
        return res.status(400).json({ ok: false, error: "Referencia de lead requerida (ref)" });
      }

      const key = `lbm_lead:${ref}`;
      const payloadStr = JSON.stringify(body);
      const ttlSeconds = 30 * 24 * 60 * 60; // 30 días de TTL

      if (hasRedis) {
        // Almacenamiento en Upstash Redis vía HTTP REST
        const upstashEndpoint = `${redisUrl}/set/${encodeURIComponent(key)}?ex=${ttlSeconds}`;
        const redisRes = await fetch(upstashEndpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${redisToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(body)
        });

        if (!redisRes.ok) {
          console.warn("Fallo en Upstash Redis, recurriendo a memoria local de instancia");
          memoryStore.set(ref, body);
        }
      } else {
        // Fallback en memoria de instancia
        memoryStore.set(ref, body);
      }

      return res.status(200).json({
        ok: true,
        ref,
        storage: hasRedis ? "upstash_redis" : "serverless_memory",
        ttl_days: 30
      });
    } catch (error) {
      console.error("Error en POST /api/lead:", error);
      return res.status(500).json({ ok: false, error: error.message });
    }
  }

  // -------------------------------------------------------------
  // GET: Recuperar anteproyecto por referencia LBM-XXX
  // -------------------------------------------------------------
  if (req.method === "GET") {
    const { ref } = req.query;

    if (!ref) {
      return res.status(400).json({ ok: false, error: "Parámetro 'ref' requerido en query string" });
    }

    try {
      const key = `lbm_lead:${ref}`;

      if (hasRedis) {
        const upstashEndpoint = `${redisUrl}/get/${encodeURIComponent(key)}`;
        const redisRes = await fetch(upstashEndpoint, {
          headers: { Authorization: `Bearer ${redisToken}` }
        });

        if (redisRes.ok) {
          const redisData = await redisRes.json();
          if (redisData?.result) {
            const parsedLead = typeof redisData.result === "string" ? JSON.parse(redisData.result) : redisData.result;
            res.setHeader("Cache-Control", "private, max-age=60");
            return res.status(200).json({ ok: true, ref, lead: parsedLead, source: "upstash_redis" });
          }
        }
      }

      // Verificación en memoria volátil
      if (memoryStore.has(ref)) {
        res.setHeader("Cache-Control", "private, max-age=60");
        return res.status(200).json({ ok: true, ref, lead: memoryStore.get(ref), source: "serverless_memory" });
      }

      return res.status(404).json({ ok: false, error: `Lead '${ref}' no encontrado o expirado.` });
    } catch (error) {
      console.error("Error en GET /api/lead:", error);
      return res.status(500).json({ ok: false, error: error.message });
    }
  }

  return res.status(405).json({ ok: false, error: "Método no permitido" });
}
