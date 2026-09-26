import Papa from 'papaparse';
import { normalize, idOf } from '../../../shared/utils/normalize.js';
import { usageColumns, customerColumns, textColumns } from './schema.js';

export function parseCSV(text, type) {
  const required = type === 'usage' ? usageColumns : customerColumns;
  const result = Papa.parse(text.replace(/^\uFEFF/, ''), {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (s) => normalize(s).replace(/\s+/g, '_'),
  });
  const missing = required.filter((k) => !result.meta.fields?.includes(k));
  if (missing.length)
    throw new Error(`Faltan columnas: ${missing.join(', ')}.`);
  if (result.errors.length)
    throw new Error(`CSV inválido: ${result.errors[0].message}`);
  if (!result.data.length)
    throw new Error('El archivo está vacío: agrega al menos una fila.');
  const seen = new Set();
  const warnings = [];
  const rows = result.data.map((row, index) => {
    const r = Object.fromEntries(
      Object.entries(row).map(([k, v]) => [k, String(v ?? '').trim()]),
    );
    r.cliente_id = idOf(r.cliente_id);
    if (!r.cliente_id || !r.cliente)
      throw new Error(`Fila ${index + 2}: falta cliente_id o cliente.`);
    if (type === 'usage') {
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(r.mes))
        throw new Error(`Fila ${index + 2}: mes inválido; usa AAAA-MM.`);
      for (const key of usageColumns.filter((k) => !textColumns.has(k))) {
        if (r[key] === '') {
          r[key] = null;
          warnings.push(
            `Fila ${index + 2}: ${key} sin dato; no se interpreta como cero.`,
          );
        } else {
          const value = Number(r[key]);
          if (!Number.isFinite(value) || value < 0)
            throw new Error(
              `Fila ${index + 2}: ${key} debe ser un número positivo o cero.`,
            );
          r[key] = value;
        }
      }
      r.plan =
        { starter: 'Starter', pro: 'Pro', max: 'Max' }[normalize(r.plan)] ??
        r.plan;
      if (!['Starter', 'Pro', 'Max'].includes(r.plan))
        warnings.push(
          `Fila ${index + 2}: plan desconocido, sin cálculo de expansión.`,
        );
    }
    const key = `${r.cliente_id}${type === 'usage' ? '/' + r.mes : ''}`;
    if (seen.has(key))
      throw new Error(
        `Fila ${index + 2}: registro duplicado (${key}). Corrígelo antes de cargar.`,
      );
    seen.add(key);
    return r;
  });
  return { rows, warnings };
}
