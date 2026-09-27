export const chatEndpoint =
  import.meta.env?.VITE_CHAT_ENDPOINT?.trim() ||
  'https://versuai-chatbot.nicoversu.workers.dev/chat';

export async function requestReply(systemPrompt, messages) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);
  try {
    const currentDateTime = new Intl.DateTimeFormat('es-CL', {
      timeZone: 'America/Santiago',
      dateStyle: 'full',
      timeStyle: 'long',
      hourCycle: 'h23',
    }).format(new Date());
    const timeContext = `FECHA Y HORA ACTUAL\n${currentDateTime} (America/Santiago). Usa esta referencia para interpretar fechas relativas como hoy, mañana y ayer.`;
    const res = await fetch(chatEndpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        systemPrompt: systemPrompt
          ? `${systemPrompt}\n\n${timeContext}`
          : timeContext,
        messages,
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(
        `El servicio de IA devolvió un error (${res.status}). Intenta nuevamente.`,
      );
    }
    const { response } = await res.json();
    if (typeof response !== 'string' || !response.trim()) {
      throw new Error(
        'El servicio de IA devolvió una respuesta vacía o inválida. Intenta nuevamente.',
      );
    }
    return response;
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error('La respuesta tardó demasiado. Intenta nuevamente.');
    }
    if (error instanceof TypeError || error instanceof SyntaxError) {
      throw new Error(
        'No se pudo obtener una respuesta. Revisa la conexión e intenta nuevamente.',
      );
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
