# Apuntes y base para presentación

## Métricas importantes por cliente

- número de veces que se entra al "panel"
- agente: dias sin responder / %tiempo sin responder del mes (pero en la planilla de consumo eso se ve normal??) PREGUNTAR TALVEZ
- consumo vs plan
- Cuentas que nunca despega**

Todo estaba en los datos, busquemoslo

## pendiente ver

- cambiar readme !!
- Enfasis en explorar y ordenar datos sucios (pagina 4/8 pdf)
- las jugueterias, experimentan caidas de ventas parecidas en otras fechas relacionadas a juguetes? (agosto dia del niño, diciembre-enero por navidad)
- Que clientes realmente son la prioridad?
  1. Los que ya tienen el mejor plan?
  2. Los que tienen planes menores pero tienen mayor proyección a largo plazo -> tendran que mejorar su plan (crecimiento para Versu)

- AGREGAR VISTA POR RUBRO PARA VER TENDENCIAS

## Si tuviera una semana.....

- Agregar columna de metodo preferido de comunicacion por cliente y revelar la integracion (email, slack, etc dinamicamente)
- Agregar columna de "dia de facturacion" por cliente. Esto cambia un poco los datos: upsell no es tan importante para "llamada de dia lunes" pero si podria serlo si es que un cliente sobrepasa mucho su limite y esta a punto de renovar.
- Que tipo de clientes tiene cada cliente? ver si son mayoritariamente B2B o B2C (podria ser una nueva columna en clientes.csv). Esto me puede ayudar a crear/diferenciar el prompt
- Ver más metadatos del chatter para diferenciar el prompt
  1. Por ejemplo, si el chatter tiene cuenta en la página o historial en el chat, se puede diferenciar o profundizar el prompt

# Estructura Presentacion

0. Presentacion personal -> chess, ball, grunge, ganas de ser parte del equipo
1. Mostrar el problema
2. Supuestos
3. Decisiones
4. Solucion
5. Caso NotCo
6. Tests
7. Qué dejé fuera (?)
8. Si tuviera una semana extra...

# Recursos IA utilizados

- OpenAI chatgpt: organizacion, analisis
- OpenAI Codex: implementacion frontend
- Cloudfare AI Assistant: simple infraestructura cloud (workers)
- Meta: @cf/meta/llama-3.1-8b-instruct LLM como chatbot (primera iteracion)
- Meta: @cf/meta/llama-3.3-70b-instruct-fp8-fast LLM como chatbot (segunda iteracion)
