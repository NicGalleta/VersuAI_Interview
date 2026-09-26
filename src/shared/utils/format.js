export const money = (n) =>
  n == null
    ? 'Sin dato'
    : new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(n);
export const number = (n) =>
  n == null ? '—' : new Intl.NumberFormat('es-CL').format(n);
export const monthName = (s) =>
  s
    ? new Intl.DateTimeFormat('es-CL', {
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      })
        .format(new Date(`${s}-01T00:00:00Z`))
        .replace('.', '')
    : 'Sin período';
