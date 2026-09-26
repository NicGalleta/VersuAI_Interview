import { defaults } from '../rules/defaults.js';
import { analyze } from './domain/analyze.js';
import { normalize } from '../../shared/utils/normalize.js';
import { draft } from './domain/draft.js';
import { download } from '../../shared/utils/download.js';

export function createPortfolio(sources, getPage) {
  let rules = $state({ ...defaults });
  let search = $state('');
  let filter = $state('all');
  let owner = $state('all');
  let selectedId = $state(null);
  let selectedReason = $state(0);
  let copied = $state(false);
  const accounts = $derived(analyze(sources.usage, sources.customers, rules));
  const queue = $derived(accounts.filter((a) => a.signals.length));
  const critical = $derived(
    queue.filter((a) => a.signals.some((s) => s.kind === 'critical')),
  );
  const risks = $derived(
    queue.filter((a) => a.signals.some((s) => s.kind !== 'growth')),
  );
  const growth = $derived(queue.filter((a) => a.opportunity));
  const riskMRR = $derived(
    risks.reduce((sum, a) => sum + (a.current.mrr_usd ?? 0), 0),
  );
  const growthMRR = $derived(growth.reduce((sum, a) => sum + a.opportunity, 0));
  const latest = $derived(
    sources.usage
      .map((r) => r.mes)
      .sort()
      .at(-1),
  );
  const owners = $derived(
    [
      ...new Set(sources.customers.map((c) => c.ops_owner).filter(Boolean)),
    ].sort(),
  );
  const visible = $derived(
    (getPage() === 'accounts' ? accounts : queue).filter(
      (a) =>
        normalize(a.name + a.id).includes(normalize(search)) &&
        (owner === 'all' || a.profile?.ops_owner === owner) &&
        (filter === 'all' ||
          (filter === 'clear'
            ? !a.signals.length
            : a.signals.some((s) => s.kind === filter))),
    ),
  );
  const selected = $derived(accounts.find((a) => a.id === selectedId));
  const activeSignal = $derived(
    selected?.signals[selectedReason] || selected?.signals[0],
  );
  const selectedDraft = $derived(selected ? draft(selected, activeSignal) : '');
  function openAccount(id) {
    selectedId = id;
    selectedReason = 0;
    copied = false;
  }
  async function copyDraft() {
    try {
      await navigator.clipboard.writeText(selectedDraft);
      copied = true;
    } catch {
      download(`${selected.id}-mensaje.txt`, selectedDraft);
    }
  }
  const reasonCount = (kind) =>
    queue.filter((a) => a.signals.some((s) => s.kind === kind)).length;
  return {
    get rules() {
      return rules;
    },
    set rules(value) {
      rules = value;
    },
    get search() {
      return search;
    },
    set search(value) {
      search = value;
    },
    get filter() {
      return filter;
    },
    set filter(value) {
      filter = value;
    },
    get owner() {
      return owner;
    },
    set owner(value) {
      owner = value;
    },
    get selectedId() {
      return selectedId;
    },
    set selectedId(value) {
      selectedId = value;
    },
    get selectedReason() {
      return selectedReason;
    },
    set selectedReason(value) {
      selectedReason = value;
    },
    get copied() {
      return copied;
    },
    set copied(value) {
      copied = value;
    },
    get accounts() {
      return accounts;
    },
    get queue() {
      return queue;
    },
    get critical() {
      return critical;
    },
    get risks() {
      return risks;
    },
    get growth() {
      return growth;
    },
    get riskMRR() {
      return riskMRR;
    },
    get growthMRR() {
      return growthMRR;
    },
    get latest() {
      return latest;
    },
    get owners() {
      return owners;
    },
    get visible() {
      return visible;
    },
    get selected() {
      return selected;
    },
    get activeSignal() {
      return activeSignal;
    },
    get selectedDraft() {
      return selectedDraft;
    },
    openAccount,
    copyDraft,
    reasonCount,
  };
}
