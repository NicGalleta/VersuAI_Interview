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

- Priorizar días de agente inactivo, después activación estancada, baja adopción persistente y atrasos; desempatar por MRR. Expansión: dos meses completos consecutivos sobre el límite del mismo plan. El potencial es la diferencia al siguiente plan, no ingreso garantizado. MRR en riesgo se cuenta una sola vez por cuenta.
- El último mes se considera parcial (exportación del día 21); solo se usa para incidentes y atrasos. Se puede cambiar en **Reglas y criterios**. No se alerta por caída de volumen aislada para evitar confundir estacionalidad con abandono. La comparación por rubro queda pendiente.
- Carga desde pantalla; encabezados obligatorios, CSV malformados, números inválidos, duplicados y archivos vacíos producen errores conservando la carga anterior. IDs y encabezados se normalizan; no se unen cuentas por nombre. Vacíos numéricos siguen siendo desconocidos. Solo cuentas activas con corte reciente entran en la lista al cargar fichas. Fichas sin uso aparecen contadas en calidad de datos.
- La vista inicial lee `datos/uso_mensual.csv` como archivo; no contiene fichas ni contactos. `datos/clientes.csv` sigue excluido de Git y de la compilación. El servidor de desarrollo también bloquea su descarga directa. Las cargas viven en memoria, no salen del navegador. Sin fichas, las señales son provisionales y no se evalúa onboarding. Recargar vuelve al ejemplo. Reglas no persisten entre recargas.
- Los mensajes usan plantillas por motivo y evidencia de cada cuenta. Se copian o descargan en texto; la lista se exporta a CSV. Elegimos este camino para que una persona revise y envíe desde su canal habitual, sin permisos de correo ni envíos automáticos.

## Caso NotCo y alcance del borrador

Prompt editable con catálogo del caso incluido, guardado de versiones en este navegador, consulta preparada para exportar, ocho pruebas originales con expectativas, catálogo y preguntas de kickoff. **No hay backend de IA: el chat no genera respuestas y las pruebas no se ejecutan ni muestran aprobaciones ficticias.** La exportación JSON captura el prompt actual y mensajes para una integración posterior. El historial local del prompt conserva hasta diez versiones; no almacena las fichas de clientes.

La [web oficial de NotCo](https://notco.com/cl/) enlaza a su [tienda online](https://tienda.notco.com). El catálogo del ejercicio sigue siendo la única fuente de productos. Las políticas se toman del levantamiento, pendientes de confirmar; no se agregan productos ni afirmaciones de salud desde la web. El flujo de compra en web es una limitación explícita del prototipo: confirmar carrito antes de activar. No se simulan pedidos, fotos, tickets ni derivaciones. Saludo/políticas y disparadores se configuran en sus capas correspondientes; el prompt solo no las activa.

Con una semana más: backend con secretos solo en servidor, consulta real al catálogo, ejecución de pruebas contra el prompt vigente, evaluación revisable, comparación por rubro, normalización de fechas del checkout y despliegue. La entrega final del PDF también requiere una URL desplegada y chat real: ambos quedan pendientes en este borrador.

## Organización del código

La guía de [estructura y responsabilidades](src/README.md) muestra dónde viven cada pantalla, componente, estado y función de negocio. `App.svelte` compone las pantallas; `npm run format` mantiene el formato consistente.
