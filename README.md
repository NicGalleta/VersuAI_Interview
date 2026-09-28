# Versu · Ops workspace

App en Svelte 5 + Vite para priorizar la cartera y probar el agente de NotCo. Proyecto para mi entrevista de Versu AI 2026.

**Cómo se corre.** Con Node 22.16+, ejecutar `npm ci` y `npm run dev`; abrir http://127.0.0.1:5173. Desde la interfaz se cargan `uso_mensual.csv` y `clientes.csv`; el ejemplo inicial solo incluye uso, por lo que sus señales son provisionales.
El chat requiere un Worker operativo, configurable con `VITE_CHAT_ENDPOINT`.

**Qué señales elegí y por qué.** Priorizo agente inactivo (≥3 días), activación estancada (≤30 conversaciones durante dos meses completos consecutivos, entre 30 y 120 días desde checkout), baja adopción (≤2 sesiones de panel durante dos meses completos consecutivos) y pagos atrasados (≥15 días). Buscan detectar interrupciones, falta de valor y bloqueos de cobro.

Para expansión, exijo dos meses completos consecutivos sobre el límite del mismo plan. Trato el último mes como parcial por el corte del día 21 y evito alertar por caídas aisladas de volumen para reducir falsos positivos por estacionalidad. Los umbrales son editables.

**Qué hice con los datos sucios.** Normalicé encabezados, espacios, IDs y planes conocidos; crucé por ID. Los vacíos numéricos quedan como desconocidos. Rechazo duplicados, números inválidos y CSV incompletos o malformados, conservando la carga anterior. Las fechas de checkout fuera del formato esperado quedan sin evaluar para activación; su normalización está pendiente. Los CSV cargados permanecen en memoria del navegador.

**Por dónde sale el mensaje.** Genero un borrador con la señal y su evidencia, disponible para copiar o descargar; también exporto la cola a CSV. Elegí revisión y envío manual desde el canal habitual del responsable para validar contexto antes de contactar.

**Qué haría con una semana más.**

- Agregar columna de método preferido de comunicación por cliente y revelar la integración (email, slack, etc dinámicamente)
- Agregar columna de "dáa de facturación" por cliente. Esto cambia un poco los datos: up-sell no es tan importante para "llamada de dáa lunes" pero si podria serlo si es que un cliente sobrepasa mucho su límite y está a punto de renovar.
- Que tipo de clientes tiene cada cliente? ver si son mayoritariamente B2B o B2C (podria ser una nueva columna en clientes.csv). Esto me puede ayudar a crear/diferenciar el prompt
- Ver más metadatos del chatter para diferenciar el prompt
  1. Por ejemplo, si el chatter tiene cuenta en la página o historial en el chat, se puede diferenciar o profundizar el prompt

**Extras que suman.**

- Se cargó el catálogo de productos en una base de datos D1 de cloudfare. El worker reconoce un prompt que consulta sobre productos y lo carga dinámicamente. El paso que faltó fue agregar la función de Vectorize, lo cual consulta por productos especificos (como una app RAG).
- Veredicto automático por cada prueba, con otro endpoint al AI worker.
- Se muestra que partes tiene cambios, pero en realidad no cumple con el requisito real de dejar un historial de como ha cambiado el system prompt.
- Hay una estimación de plata al lado de las categorías de señales que indican cuanto se puede ganar.
- Adicional: una vista de Deep Dive, que contiene métricas avanzadas para hacer un análisis más profundo por rubro o cliente.

**Recursos IA utilizados**

- OpenAI chatgpt: organizacion, analisis
- OpenAI Codex: implementacion frontend
- Cloudfare AI Assistant: simple infraestructura cloud (workers)
- Meta: @cf/meta/llama-3.1-8b-instruct LLM como chatbot (primera iteracion)
- Meta: @cf/meta/llama-3.3-70b-instruct-fp8-fast LLM como chatbot (segunda iteracion)
