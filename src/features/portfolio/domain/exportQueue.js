import Papa from 'papaparse';
import { draft } from './draft.js';

export function exportQueue(accounts) {
  return Papa.unparse(
    accounts
      .filter((a) => a.signals.length)
      .map((a) => ({
        cliente_id: a.id,
        cliente: a.name,
        responsable: a.profile?.ops_owner || '',
        motivo: a.signals[0].label,
        evidencia: a.signals[0].evidence,
        mrr_usd: a.current.mrr_usd,
        borrador: draft(a),
      })),
    { escapeFormulae: true },
  );
}
