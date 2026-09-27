// Each definition owns its calculation. Future derived metrics can supply a
// different calculate(rows) function without changing cards or history views.
function metric(id, label, group, aggregation = 'sum', unit = '') {
  return {
    id,
    label,
    group,
    aggregation,
    unit,
    calculate(rows) {
      const values = rows.map((row) => row[id]).filter(Number.isFinite);
      const total = values.reduce((sum, value) => sum + value, 0);
      return {
        value: values.length
          ? total / (aggregation === 'mean' ? values.length : 1)
          : null,
        count: values.length,
      };
    },
  };
}

export const metrics = [
  metric('mrr_usd', 'MRR', 'Negocio', 'sum', 'USD'),
  metric('ventas_atribuidas_usd', 'Ventas atribuidas', 'Negocio', 'sum', 'USD'),
  metric('carritos_recuperados', 'Carritos recuperados', 'Negocio'),
  metric(
    'dias_pago_atrasado',
    'Días de pago atrasado',
    'Negocio',
    'mean',
    'días',
  ),
  metric('conversaciones', 'Conversaciones', 'Conversaciones'),
  metric('resueltas_por_agente', 'Resueltas por el agente', 'Conversaciones'),
  metric('derivadas_a_humano', 'Derivadas a humano', 'Conversaciones'),
  metric(
    'derivadas_sin_respuesta',
    'Derivadas sin respuesta',
    'Conversaciones',
  ),
  metric(
    'seg_respuesta_agente',
    'Respuesta del agente',
    'Conversaciones',
    'mean',
    's',
  ),
  metric(
    'horas_respuesta_equipo',
    'Respuesta del equipo',
    'Conversaciones',
    'mean',
    'h',
  ),
  metric('sesiones_panel', 'Sesiones en el panel', 'Adopción'),
  metric(
    'dias_activos_panel',
    'Días activos en el panel',
    'Adopción',
    'mean',
    'días',
  ),
  metric('usuarios_activos_panel', 'Usuarios activos en el panel', 'Adopción'),
  metric('usuarios_cuenta', 'Usuarios de la cuenta', 'Adopción'),
  metric('cambios_configuracion', 'Cambios de configuración', 'Adopción'),
  metric('tickets_soporte', 'Tickets de soporte', 'Operación'),
  metric('tickets_reabiertos', 'Tickets reabiertos', 'Operación'),
  metric('errores_integracion', 'Errores de integración', 'Operación'),
  metric(
    'dias_agente_inactivo',
    'Días de agente inactivo',
    'Operación',
    'mean',
    'días',
  ),
  metric('productos_sincronizados', 'Productos sincronizados', 'Operación'),
  metric('mensajes_no_entregados', 'Mensajes no entregados', 'Operación'),
];

export const metricGroups = [...new Set(metrics.map((item) => item.group))];

export const defaultMetricId = 'conversaciones';
export const historyMetrics = [
  metrics.find((item) => item.id === defaultMetricId),
  ...metrics.filter(
    (item) => item.id !== defaultMetricId && item.id !== 'mrr_usd',
  ),
];

export function formatMetric(metric, value) {
  if (value == null) return 'Sin dato';
  const formatted = new Intl.NumberFormat('es-CL', {
    maximumFractionDigits: metric.unit === 'USD' ? 2 : 1,
    ...(metric.unit === 'USD' ? { style: 'currency', currency: 'USD' } : {}),
  }).format(value);
  return metric.unit && metric.unit !== 'USD'
    ? `${formatted} ${metric.unit}`
    : formatted;
}
