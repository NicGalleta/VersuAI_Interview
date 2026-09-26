export const usageColumns =
  'cliente_id,cliente,mes,plan,mrr_usd,conversaciones,resueltas_por_agente,derivadas_a_humano,derivadas_sin_respuesta,seg_respuesta_agente,carritos_recuperados,ventas_atribuidas_usd,sesiones_panel,dias_activos_panel,usuarios_activos_panel,usuarios_cuenta,cambios_configuracion,horas_respuesta_equipo,tickets_soporte,tickets_reabiertos,errores_integracion,dias_agente_inactivo,productos_sincronizados,mensajes_no_entregados,canales_activos,dias_pago_atrasado'.split(
    ',',
  );
export const customerColumns =
  'cliente_id,cliente,rubro,pais,cms,plan_actual,fecha_checkout,ops_owner,estado,contacto_nombre,contacto_email,telefono'.split(
    ',',
  );
export const textColumns = new Set([
  'cliente_id',
  'cliente',
  'mes',
  'plan',
  'canales_activos',
]);
