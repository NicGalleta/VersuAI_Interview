const defaultModel = "@cf/meta/llama-3.1-8b-instruct-fp8";
const defaultOrigins = [
  "https://versuai-interview.nicoversu.workers.dev",
  "http://127.0.0.1:5173",
  "http://localhost:5173"
];

const productKeywords = [
  "producto", "productos", "catálogo", "catalogo",
  "precio", "precios", "valor", "valores",
  "cuánto", "cuanto", "cuánta", "cuanta",
  "cuesta", "cuestan", "sale", "salen", "vale", "valen",
  "comprar", "compra", "llevar", "agregar", "añadir", "anadir", "carrito",
  "cotizar", "cotización", "cotizacion", "presupuesto",
  "oferta", "ofertas", "descuento", "descuentos", "quiero",
  "promo", "promos", "promoción", "promocion", "promociones",

  "stock", "disponible", "disponibles", "disponibilidad",
  "tienen", "les queda", "les quedan", "quedan",
  "agotado", "agotada", "agotados", "agotadas",
  "reposición", "reposicion", "inventario",

  "recomienda", "recomiendas", "recomiéndame", "recomiendame",
  "recomendación", "recomendacion", "recomendaciones",
  "sugieres", "sugerencia", "sugerencias",
  "opción", "opcion", "opciones", "alternativa", "alternativas",
  "qué hay", "que hay", "qué venden", "que venden",
  "qué tienes", "que tienes", "qué tienen", "que tienen",
  "qué ofrecen", "que ofrecen", "busco", "buscando",
  "mostrar", "listar", "tienda", "shop", "store",

  "notmilk", "not milk", "not-milk",
  "notprotein", "not protein", "not-protein",
  "notburger", "not burger", "not-burger",
  "notchicken", "not chicken", "not-chicken",
  "notsquare", "not square", "not-square",
  "notshake", "not shake", "not-shake",
  "nothotdog", "not hotdog", "not-hotdog", "not hot dog",
  "notmayo", "not mayo", "not-mayo",
  "notcream", "not cream", "not-cream",
  "noticecream", "not icecream", "not ice cream", "not-icecream",
  "notchori", "not chori", "not-chori",

  "bebida", "bebidas", "leche",
  "barra", "barras", "proteína", "proteina", "proteica", "proteico",
  "hamburguesa", "hamburguesas", "pollo",
  "vienesa", "vienesas", "salchicha", "salchichas",
  "hotdog", "hot dog", "chorizo", "chorizos",
  "salsa", "salsas", "mayonesa", "mayonesas",
  "crema", "cremas", "helado", "helados",
  "embutido", "embutidos", "batido", "batidos",
  "vegano", "vegana", "veganos", "veganas", "vegetal", "vegetales",

  "almendra", "chocolate", "vainilla", "vanilla",
  "caramelo", "café", "cafe",
  "zero", "sugar", "fat", "original", "barista", "kids",
  "peanut", "butter", "maní", "mani", "cacahuate",
  "mango", "maracuyá", "maracuya",
  "lemon", "limón", "limon", "cake", "fudge", "brownie",
  "cookies", "galleta", "galletas", "cream",
  "crunchy", "choco", "coco", "tentación", "tentacion",
  "nugget", "nuggets", "mila", "milanesa", "milanesas",
  "crispy", "flamin", "hot", "doritos", "special", "sauce",

  "sku", "formato", "formatos", "sabor", "sabores",
  "tamaño", "tamano", "tamaños", "tamanos",
  "litro", "litros", "pack", "packs", "botella", "botellas",
  "unidad", "unidades", "200 ml", "250 ml", "473 ml",
  "1 l", "95 g", "150 g", "300 g", "110 g",
  "250 g", "500 g", "315 g", "200 g", "400 g", "45 g", "30 g",

  "almuerzo", "cena", "desayuno", "snack", "snacks",
  "colación", "colacion", "colaciones", "merienda", "lonchera",
  "alimento", "alimentos", "comida", "alimentación", "alimentacion", "necesito", "necesitamos",

  "nm-ori-1l", "nm-ori-12", "nm-low-1l", "nm-low-12",
  "nm-zer-12", "nm-cho-1l", "nm-cho-12", "nm-bar-1l",
  "nm-bar-12", "nm-vai-12", "nm-alm-1l", "nm-kid-200",
  "np-fud-5", "np-coo-5", "np-coo-20", "np-lem-5",
  "np-lem-20", "np-pea-5", "np-man-5", "np-crc-30", "np-crp-30",
  "ns-pea-5", "ns-pea-12", "ns-chc-5", "ns-chc-12", "ns-ten-5",
  "nsh-caf-24", "nb-095", "nb-150",
  "nc-bur-95", "nc-nug-300", "nc-nuf-300", "nc-mil-110",
  "nh-250", "nh-500", "nma-ori-315", "nma-spe-315", "nma-dor-315",
  "ncr-200", "nic-vai", "nic-cho", "nch-400",
];

function isProductRelated(messages) {
  const lastUserMsg = [...messages].reverse().find(m => m.role === "user");
  if (!lastUserMsg) return false;
  const text = lastUserMsg.content.toLowerCase();
  return productKeywords.some(kw => text.includes(kw));
}

async function getCatalogue(env) {
  const result = await env.CATALOGUE_DB.prepare(
    "SELECT sku, producto, categoria, formato, precio_clp, stock, activo FROM products ORDER BY categoria, producto, formato"
  ).all();

  if (!result.results || result.results.length === 0) return "";

  const lines = result.results.map(r =>
    "- " + r.sku + " | " + r.producto + " | " + r.categoria + " | " + r.formato + " | " + r.precio_clp + " | " + r.stock + " | " + r.activo
  );

  return lines.join("\n");
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");
    const allowedOrigins = env.ALLOWED_ORIGINS
      ? env.ALLOWED_ORIGINS.split(",").map(v => v.trim())
      : defaultOrigins;
    const allowed = origin && allowedOrigins.includes(origin);
    const corsHeaders = {
      Vary: "Origin",
      ...(allowed ? { "Access-Control-Allow-Origin": origin } : {}),
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };
    const json = (body, status = 200) =>
      Response.json(body, { status, headers: corsHeaders });

    if (origin && !allowed) return json({ error: "Origin not allowed" }, 403);
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: { ...corsHeaders, "Access-Control-Max-Age": "86400" }
      });
    }

    const model = env.AI_MODEL || defaultModel;

    if (request.method === "GET" && url.pathname === "/") {
      return json({ status: "ok", model });
    }

    if (request.method !== "POST" || url.pathname !== "/chat") {
      return json({ error: "Not found. Use POST /chat" }, 404);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return json({ error: "JSON body must be an object" }, 400);
    }

    const { messages, systemPrompt, mode = "chat" } = body;
    if (!["chat", "evaluation"].includes(mode)) {
      return json({ error: "Invalid mode" }, 400);
    }

    if (
      !Array.isArray(messages) ||
      messages.length === 0 ||
      messages.some(
        m =>
          !m ||
          !["user", "assistant"].includes(m.role) ||
          typeof m.content !== "string" ||
          !m.content.trim()
      )
    ) {
      return json(
        { error: "messages must contain user or assistant messages with non-empty text" },
        400
      );
    }

    if (systemPrompt !== undefined && typeof systemPrompt !== "string") {
      return json({ error: "systemPrompt must be a string" }, 400);
    }

    const fullMessages = [];
    let systemContent = systemPrompt || "";

    const productRelated = mode === "chat" && isProductRelated(messages);

    if (productRelated) {
      let catalogue;
      try {
        catalogue = await getCatalogue(env);
      } catch (error) {
        console.error(JSON.stringify({ event: "catalogue_error", error: String(error) }));
        return json({ error: "Catalogue lookup failed", code: "CATALOGUE_FAILED" }, 503);
      }
      if (catalogue) {
        systemContent = systemContent
          ? systemContent + "\n\n" + catalogue
          : catalogue;
      }
    }

    if (systemContent) {
      fullMessages.push({ role: "system", content: systemContent });
    }

    fullMessages.push(
      ...messages.map(({ role, content }) => ({ role, content }))
    );

    console.log(JSON.stringify({
      event: "request",
      model,
      messageCount: fullMessages.length,
      productRelated,
      mode
    }));

    try {
      const result = await env.AI.run(model, {
        messages: fullMessages,
        ...(mode === "evaluation" ? {
          max_tokens: 512,
          temperature: 0,
          response_format: {
            type: "json_schema",
            json_schema: {
              type: "object",
              properties: {
                results: {
                  type: "array", minItems: 1, maxItems: 1,
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      verdict: { type: "string", enum: ["pass", "fail", "inconclusive"] },
                      reason: { type: "string" },
                    },
                    required: ["id", "verdict", "reason"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["results"],
              additionalProperties: false,
            },
          },
        } : {}),
      });
      // JSON mode may return an object. Keep the existing frontend text contract.
      const output = result?.response;
      const response = mode === "evaluation" && output && typeof output === "object" && !Array.isArray(output)
        ? JSON.stringify(output)
        : output;
      if (typeof response !== "string" || !response.trim()) {
        console.log(JSON.stringify({
          event: "response_error",
          error: "AI returned an invalid response",
          mode,
          responseType: typeof output,
          toolCallCount: result?.tool_calls?.length || 0,
          usage: result?.usage
        }));
        return json({ error: "AI returned an invalid response", code: "AI_INVALID_RESPONSE" }, 502);
      }

      console.log(JSON.stringify({
        event: "response",
        mode,
        responseLength: response.length
      }));

      return json({ response });
    } catch (e) {
      console.log(JSON.stringify({
        event: "response_error",
        error: e instanceof Error ? e.message : String(e)
      }));
      return json({ error: "AI inference failed" }, 500);
    }
  }
};