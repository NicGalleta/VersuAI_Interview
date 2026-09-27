const defaultModel = '@cf/meta/llama-3.1-8b-instruct-fp8';
const defaultOrigins = [
  'https://versuai-interview.nicoversu.workers.dev',
  'http://127.0.0.1:5173',
  'http://localhost:5173',
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');
    const allowedOrigins = env.ALLOWED_ORIGINS
      ? env.ALLOWED_ORIGINS.split(',').map((value) => value.trim())
      : defaultOrigins;
    const allowed = origin && allowedOrigins.includes(origin);
    const corsHeaders = {
      Vary: 'Origin',
      ...(allowed ? { 'Access-Control-Allow-Origin': origin } : {}),
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    const json = (body, status = 200) =>
      Response.json(body, { status, headers: corsHeaders });

    if (origin && !allowed) return json({ error: 'Origin not allowed' }, 403);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: { ...corsHeaders, 'Access-Control-Max-Age': '86400' },
      });
    }

    const model = env.AI_MODEL || defaultModel;
    if (request.method === 'GET' && url.pathname === '/') {
      return json({ status: 'ok', model });
    }
    if (request.method !== 'POST' || url.pathname !== '/chat') {
      return json({ error: 'Not found. Use POST /chat' }, 404);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid JSON body' }, 400);
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return json({ error: 'JSON body must be an object' }, 400);
    }
    const { messages, systemPrompt } = body;
    if (
      !Array.isArray(messages) ||
      messages.length === 0 ||
      messages.some(
        (message) =>
          !message ||
          !['user', 'assistant'].includes(message.role) ||
          typeof message.content !== 'string' ||
          !message.content.trim(),
      )
    ) {
      return json(
        {
          error:
            'messages must contain user or assistant messages with non-empty text',
        },
        400,
      );
    }
    if (systemPrompt !== undefined && typeof systemPrompt !== 'string') {
      return json({ error: 'systemPrompt must be a string' }, 400);
    }

    const fullMessages = systemPrompt
      ? [{ role: 'system', content: systemPrompt }]
      : [];
    fullMessages.push(
      ...messages.map(({ role, content }) => ({ role, content })),
    );

    try {
      const result = await env.AI.run(model, { messages: fullMessages });
      if (typeof result?.response !== 'string' || !result.response.trim()) {
        return json({ error: 'AI returned an invalid response' }, 502);
      }
      return json({ response: result.response });
    } catch {
      return json({ error: 'AI inference failed' }, 500);
    }
  },
};
