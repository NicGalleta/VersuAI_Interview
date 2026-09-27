export function draft(account, signal = account.signals[0]) {
  const first =
    account.profile?.contacto_nombre?.trim().split(/\s+/)[0] || 'equipo';
  const intros = {
    'Agente inactivo':
      'Queremos revisar con ustedes la continuidad del agente.',
    'Baja adopción':
      'Queremos ayudar a que su equipo aproveche mejor el agente.',
    'Pago pendiente': 'Queremos revisar si necesitan ayuda con su facturación.',
    'Activación estancada':
      'Nos gustaría acompañarlos en los primeros pasos con el agente.',
    'Oportunidad de expansión':
      'Vimos una oportunidad para acompañar el crecimiento de su cuenta.',
  };
  const closings = {
    'Agente inactivo':
      '¿Les parece que revisemos juntos qué está pasando con la integración y cómo volver a poner el agente en marcha?',
    'Baja adopción':
      '¿Cómo les ha ido usando el panel? Si hay algo que les esté costando, podemos revisarlo juntos.',
    'Pago pendiente':
      '¿Han tenido algún problema con el pago? Cuéntennos para ayudarles a resolverlo.',
    'Activación estancada':
      '¿Hay algo que les esté dificultando empezar a usar el agente? Podemos acompañarlos con la configuración y las primeras conversaciones.',
    'Oportunidad de expansión':
      '¿Les gustaría que revisemos si el plan actual sigue siendo el más adecuado para el volumen de conversaciones que están teniendo?',
  };
  return `Hola ${first}, ¿cómo están?\n\n${intros[signal?.label] || 'Queremos revisar cómo va su cuenta.'}\n${signal?.evidence || 'revisión de seguimiento'}.\n\n${closings[signal?.label] || '¿Cómo les ha ido con el agente? Cuéntennos si hay algo en lo que podamos ayudarlos.'}`;
}
