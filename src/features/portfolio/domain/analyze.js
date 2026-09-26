import { defaults } from '../../rules/defaults.js';
import { normalize } from '../../../shared/utils/normalize.js';
import { money, number, monthName } from '../../../shared/utils/format.js';

const limit = { Starter: 300, Pro: 2000, Max: 4000 };
const expansion = { Starter: 150, Pro: 250, Max: 0 };
const adjacent = (a, b) => {
  if (!a || !b) return false;
  const d = new Date(`${a.mes}-01T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + 1);
  return d.toISOString().slice(0, 7) === b.mes;
};
export function analyze(usage, customers, rules = defaults) {
  const latest = [...new Set(usage.map((r) => r.mes))].sort().at(-1);
  const profiles = new Map(customers.map((r) => [r.cliente_id, r]));
  const groups = new Map();
  usage.forEach((r) => {
    if (!groups.has(r.cliente_id)) groups.set(r.cliente_id, []);
    groups.get(r.cliente_id).push(r);
  });
  return [...groups.entries()]
    .map(([id, records]) => {
      const history = records.toSorted((a, b) => a.mes.localeCompare(b.mes));
      const current = history.at(-1);
      const profile = profiles.get(id);
      const signals = [];
      const complete = history.filter(
        (r) => !rules.partial || r.mes !== latest,
      );
      const last = complete.at(-1);
      const previous = complete.at(-2);
      const consecutive = adjacent(previous, last);
      const eligible = !profile || normalize(profile.estado) === 'activo';
      const fresh = current.mes === latest;
      const add = (kind, label, evidence, action, score) =>
        signals.push({ kind, label, evidence, action, score });
      if (eligible && fresh) {
        if (
          current.dias_agente_inactivo >= rules.inactivity &&
          current.dias_agente_inactivo != null
        )
          add(
            'critical',
            'Agente inactivo',
            `${current.dias_agente_inactivo} días sin operar · ${current.errores_integracion ?? 's/d'} errores de integración`,
            'Revisar la integración y acordar un plan de recuperación.',
            100,
          );
        if (
          consecutive &&
          last.sesiones_panel != null &&
          previous.sesiones_panel != null &&
          last.sesiones_panel <= rules.panel &&
          previous.sesiones_panel <= rules.panel
        )
          add(
            'risk',
            'Baja adopción',
            `${previous.sesiones_panel} y ${last.sesiones_panel} sesiones de panel en ${monthName(previous.mes)} y ${monthName(last.mes)}`,
            'Agendar una revisión de uso con el equipo y recuperar la adopción.',
            80,
          );
        if (
          current.dias_pago_atrasado != null &&
          current.dias_pago_atrasado >= rules.late
        )
          add(
            'risk',
            'Pago pendiente',
            `${current.dias_pago_atrasado} días de atraso en el último corte`,
            'Confirmar si hay un bloqueo de facturación antes de escalar.',
            70,
          );
        if (
          profile?.fecha_checkout &&
          /^\d{4}-\d{2}-\d{2}$/.test(profile.fecha_checkout) &&
          consecutive
        ) {
          const age =
            (Date.parse(`${current.mes}-21`) -
              Date.parse(profile.fecha_checkout)) /
            86400000;
          if (
            age >= 30 &&
            age <= 120 &&
            [last, previous].every(
              (r) =>
                r.conversaciones != null && r.conversaciones <= rules.lowUsage,
            )
          )
            add(
              'risk',
              'Activación estancada',
              `${previous.conversaciones} y ${last.conversaciones} conversaciones en los dos últimos meses completos`,
              'Revisar el onboarding y definir el primer hito de valor.',
              85,
            );
        }
        if (
          consecutive &&
          expansion[current.plan] &&
          [last, previous].every(
            (r) =>
              r.plan === current.plan &&
              r.conversaciones != null &&
              r.conversaciones > (limit[r.plan] * rules.upsell) / 100,
          )
        )
          add(
            'growth',
            'Oportunidad de expansión',
            `${number(previous.conversaciones)} y ${number(last.conversaciones)} conversaciones · límite ${number(limit[current.plan])}`,
            `Revisar el ajuste de plan. Potencial: ${money(expansion[current.plan])}/mes.`,
            40,
          );
      }
      signals.sort((a, b) => b.score - a.score);
      return {
        id,
        name: profile?.cliente || current.cliente,
        profile,
        current,
        history,
        signals,
        eligible,
        fresh,
        score: signals[0]?.score ?? 0,
        opportunity: signals.some((s) => s.kind === 'growth')
          ? expansion[current.plan]
          : 0,
      };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        (b.current.mrr_usd ?? 0) - (a.current.mrr_usd ?? 0),
    );
}
