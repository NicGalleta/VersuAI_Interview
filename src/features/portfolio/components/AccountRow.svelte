<script>
  import { ArrowUpRight } from 'lucide-svelte';
  import { money } from '../../../shared/utils/format.js';
  let { account, onOpen } = $props();
</script>

<tr
  ><td
    ><button class="account-cell" onclick={() => onOpen(account.id)}
      ><span
        class="account-avatar"
        class:mint={account.current.plan === 'Max'}
        class:peach={account.current.plan === 'Starter'}
        >{account.name
          .split(' ')
          .map((n) => n[0])
          .slice(0, 2)
          .join('')}</span
      ><span
        ><strong>{account.name}</strong><small
          >{account.current.plan} <span>·</span>
          {account.profile?.rubro || account.id}</small
        ></span
      ></button
    ></td
  ><td
    >{#if account.signals.length}<span
        class={`badge ${account.signals[0].kind}`}
        ><span></span>{account.signals[0].label}</span
      >{#if account.signals.length > 1}<span class="more-signals"
          >+{account.signals.length - 1}</span
        >{/if}<small class="evidence">{account.signals[0].evidence}</small
      >{:else}<span class="badge neutral"
        >{!account.fresh
          ? 'Sin corte reciente'
          : !account.eligible
            ? 'Fuera de seguimiento'
            : 'Sin señales detectadas'}</span
      ><small class="evidence"
        >{account.profile?.estado || 'Ficha de cliente pendiente'}</small
      >{/if}</td
  ><td class="mrr">{money(account.current.mrr_usd)}</td><td
    ><span class="owner"
      >{#if account.profile?.ops_owner}<span class="mini-avatar"
          >{account.profile.ops_owner.replace('Ops ', '')}</span
        >{account.profile.ops_owner}{:else}<span class="muted">Sin ficha</span
        >{/if}</span
    ></td
  ><td
    ><button
      class="row-action"
      aria-label={`Ver detalle de ${account.name}`}
      onclick={() => onOpen(account.id)}><ArrowUpRight size={18} /></button
    ></td
  ></tr
>
