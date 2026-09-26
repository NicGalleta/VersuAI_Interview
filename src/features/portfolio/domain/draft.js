export function draft(account, signal = account.signals[0]) {
  const first = account.profile?.contacto_nombre?.split(' ')[0] || 'equipo';
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
  return `Hola ${first}, ¿cómo están?\n\n${intros[signal?.label] || 'Queremos revisar cómo va su cuenta.'}\nEn ${account.name}: ${signal?.evidence || 'revisión de seguimiento'}.\n\n${signal?.action || 'Revisemos juntos los siguientes pasos.'}\n¿Tienen un espacio esta semana para conversarlo?`;
}
