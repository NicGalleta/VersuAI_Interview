# Versu · Ops workspace

Borrador de frontend en **Svelte 5 + Vite** para los dos casos del PDF. Interfaz en español, adaptable a móvil, con prioridades, detalle de cuenta, mensajes, carga de CSV, reglas editables y workspace de Nota.

## Ejecutar

Node 22.12+ (probado con Node 25). `npm install`, luego `npm run dev`. Abrir http://127.0.0.1:5173. Validación: `npm run check`, `npm test`, `npm run test:e2e` (requiere Chrome) y `npm run build`. La compilación estática queda en `dist/`; se puede publicar con comando `npm run build` y directorio `dist` en un hosting estático. Este borrador no se ha desplegado.

## Desplegar en Cloudflare Pages

Conectar este repositorio como proyecto de **Pages** con estos ajustes:

- Rama de producción: `main`.
- Framework preset: `None` (es Svelte + Vite, sin SvelteKit).
- Directorio raíz: raíz del repositorio (dejar vacío).
- Build command: `npm run build`.
- Build output directory: `dist`.

`.node-version` fija Node 22.16.0, compatible con Vite 7. Si el proyecto ya tiene una variable `NODE_VERSION`, quitarla o usar el mismo valor. Pages instala las dependencias antes de compilar; incluir las dependencias de desarrollo porque contienen Vite y el compilador de Svelte. No se necesitan secretos, funciones ni un comando de despliegue para la integración Git de Pages.

Los archivos de ejemplo importados desde `datos/` están versionados y se incluyen en el bundle; `clientes.csv` queda excluido. Para reproducir una instalación limpia: `npm ci`, `npm run check`, `npm test` y `npm run build`.

Referencias: [configuración de builds](https://developers.cloudflare.com/pages/configuration/build-configuration/) y [versión de Node](https://developers.cloudflare.com/pages/configuration/build-image/).

## Criterio y datos

**Deep Dive** permite seleccionar un cliente o un rubro, explorar las 21 métricas numéricas de `uso_mensual.csv` por mes y consultar su evolución. Los rubros requieren cargar `clientes.csv`; se unen por ID. Los agregados suman volúmenes e importes y promedian tiempos y días por cliente con dato, mostrando cobertura y meses parciales. La vista incluye todas las cuentas con historial de uso, independientemente de su estado. Las definiciones y cálculos viven en un registro extensible de métricas, separado de la interfaz.

- Priorizar días de agente inactivo, después activación estancada, baja adopción persistente y atrasos; desempatar por MRR. Expansión: dos meses completos consecutivos sobre el límite del mismo plan. El potencial es la diferencia al siguiente plan, no ingreso garantizado. MRR en riesgo se cuenta una sola vez por cuenta.
- El último mes se considera parcial (exportación del día 21); solo se usa para incidentes y atrasos. Se puede cambiar en **Reglas y criterios**. No se alerta por caída de volumen aislada para evitar confundir estacionalidad con abandono. La comparación por rubro queda pendiente.
- Carga desde pantalla; encabezados obligatorios, CSV malformados, números inválidos, duplicados y archivos vacíos producen errores conservando la carga anterior. IDs y encabezados se normalizan; no se unen cuentas por nombre. Vacíos numéricos siguen siendo desconocidos. Solo cuentas activas con corte reciente entran en la lista al cargar fichas. Fichas sin uso aparecen contadas en calidad de datos.
- La vista inicial lee `datos/uso_mensual.csv` como archivo; no contiene fichas ni contactos. `datos/clientes.csv` sigue excluido de Git y de la compilación. El servidor de desarrollo también bloquea su descarga directa. Las cargas viven en memoria, no salen del navegador. Sin fichas, las señales son provisionales y no se evalúa onboarding. Recargar vuelve al ejemplo. Reglas no persisten entre recargas.
- Los mensajes usan plantillas por motivo y evidencia de cada cuenta. Se copian o descargan en texto; la lista se exporta a CSV. Elegimos este camino para que una persona revise y envíe desde su canal habitual, sin permisos de correo ni envíos automáticos.

## Caso NotCo y alcance del borrador

Prompt editable con datos de productos inyectados dinámicamente por el Worker desplegado, guardado de versiones en este navegador, chat conectado a Cloudflare Workers AI, ocho pruebas originales con expectativas, catálogo y preguntas de kickoff. El chat envía el prompt vigente y el historial de la sesión a `https://versuai-chatbot.nicoversu.workers.dev/chat` mediante `POST { systemPrompt, messages }` y espera `{ response: string }`. Enter envía; Shift+Enter agrega una línea. Nueva conversación limpia el historial. Los errores conservan el mensaje para reenviarlo y las solicitudes expiran tras 60 segundos.

**Ejecutar pruebas** envía los ocho casos de forma independiente con una copia del prompt al iniciar. Las respuestas requieren revisión manual; no se asignan aprobaciones automáticas. La exportación incluye los resultados y el prompt utilizado. El historial local del prompt conserva hasta diez versiones; las conversaciones y los resultados solo viven en memoria.

### Configurar el endpoint

La URL se configura con `VITE_CHAT_ENDPOINT`; si está ausente o vacía, se usa `https://versuai-chatbot.nicoversu.workers.dev/chat`. Copiar `.env.example` a `.env.local` para cambiarla localmente. En Cloudflare, agregarla como variable del **build del frontend** y volver a compilar/desplegar. Las variables `VITE_*` son públicas y se incorporan al bundle al compilar; no contienen secretos. Ver [variables de Vite](https://vite.dev/guide/env-and-mode).

### Worker de chat

El código está en [worker/src/index.js](worker/src/index.js) y la configuración independiente en [worker/wrangler.jsonc](worker/wrangler.jsonc). `AI` es la vinculación de Workers AI; `AI_MODEL` configura el modelo y `ALLOWED_ORIGINS` contiene los orígenes separados por comas. Los valores por defecto permiten el frontend de producción y Vite en `localhost:5173` y `127.0.0.1:5173`. Para otra URL de preview o puerto, agregar el origen exacto.

Se usa `@cf/meta/llama-3.1-8b-instruct-fp8`, que mantiene el contrato de mensajes y respuesta de texto. El modelo original `@cf/meta/llama-3.1-8b-instruct` fue retirado el 30 de mayo de 2026. Referencias: [modelo FP8](https://developers.cloudflare.com/workers-ai/models/llama-3.1-8b-instruct-fp8/) y [retiro de modelos](https://developers.cloudflare.com/changelog/post/2026-05-08-planned-model-deprecations/).

El Worker responde a OPTIONS con 204 y devuelve las cabeceras CORS para el origen permitido también en errores. Valida el cuerpo, los roles y el contenido antes de llamar a la IA. CORS controla acceso desde navegadores; el endpoint sigue siendo público y no implementa autenticación.

Para desplegar **solo el Worker de chat**, desde la raíz del repositorio, con Wrangler y una sesión de Cloudflare autorizada:

```sh
npx wrangler deploy --config worker/wrangler.jsonc
```

También se puede copiar `worker/src/index.js` al editor del Worker existente en Cloudflare, mantener la vinculación `AI` y publicar. Los valores por defecto permiten ese flujo sin agregar variables. El frontend se compila y publica por separado.

Verificación del endpoint el 26 de septiembre de 2026: la URL pública todavía devolvía OPTIONS 404 sin CORS y POST 500 por el modelo retirado. Esta implementación está preparada localmente; queda pendiente desplegar el Worker y verificar una respuesta real desde el navegador. GET `/` informa configuración y disponibilidad del Worker, sin ejecutar inferencia.

La [web oficial de NotCo](https://notco.com/cl/) enlaza a su [tienda online](https://tienda.notco.com). El prompt base no incluye el catálogo completo; usa los datos de productos proporcionados dinámicamente. La pestaña de catálogo conserva el CSV del ejercicio como referencia. El Worker de este repositorio solo reenvía mensajes y no implementa la consulta a la base de datos del Worker desplegado. Las políticas se toman del levantamiento, pendientes de confirmar; no se agregan productos ni afirmaciones de salud desde la web. El flujo de compra en web es una limitación explícita del prototipo: confirmar carrito antes de activar. No se simulan pedidos, fotos, tickets ni derivaciones. Saludo/políticas y disparadores se configuran en sus capas correspondientes; el prompt solo no las activa.

Con una semana más: consulta real al catálogo, evaluación revisable, comparación por rubro, normalización de fechas del checkout y despliegue. La entrega final del PDF también requiere una URL desplegada y chat real: la conexión real queda pendiente de los ajustes del Worker descritos arriba y la URL debe verificarse al desplegar.

## Organización del código

La guía de [estructura y responsabilidades](src/README.md) muestra dónde viven cada pantalla, componente, estado y función de negocio. `App.svelte` compone las pantallas; `npm run format` mantiene el formato consistente.
