<script>
  import { pages } from '../pages.js';
  import { ChevronRight, Bell } from 'lucide-svelte';
  let { navigation, sources } = $props();
</script>

<header class="topbar">
  <div>
    <span>Workspace</span><ChevronRight size={14} /><strong
      >{pages[navigation.page].label}</strong
    >
  </div>
  <div>
    <span class="local-badge"><span></span>Datos locales</span><button
      class="icon-button"
      aria-label="Ver alertas de datos"
      onclick={() => navigation.navigate('data')}
      ><Bell size={18} />{#if !sources.customers.length}<i></i>{/if}</button
    >
    <div class="avatar small">OP</div>
  </div>
</header>
