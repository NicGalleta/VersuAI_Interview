<script>
  import {
    LayoutDashboard,
    Users,
    ChartNoAxesCombined,
    Bot,
    SlidersHorizontal,
    Database,
    ArrowUpRight,
    CircleHelp,
    Sparkles,
  } from 'lucide-svelte';
  let { navigation, sources, portfolio, feedback } = $props();
  const nav = [
    { id: 'overview', label: 'Resumen', icon: LayoutDashboard },
    { id: 'accounts', label: 'Cartera de clientes', icon: Users },
    { id: 'deep-dive', label: 'Deep Dive', icon: ChartNoAxesCombined },
    { id: 'agent', label: 'Agente NotCo', icon: Bot },
  ];
</script>

<aside class="sidebar">
  <a
    class="brand"
    href="/"
    onclick={(e) => {
      e.preventDefault();
      navigation.navigate('overview');
    }}
    aria-label="Versu inicio"
    ><img
      class="brand-logo"
      src="/versu-logo.png"
      alt="Versu"
      width="392"
      height="59"
    /><img
      class="brand-symbol"
      src="/favicon.svg"
      alt=""
      width="36"
      height="36"
    /></a
  >
  <div class="nav-label">WORKSPACE</div>
  <nav aria-label="Navegación principal">
    {#each nav as item}<button
        aria-label={item.label}
        class:active={navigation.page === item.id}
        onclick={() => navigation.navigate(item.id)}
        ><item.icon size={19} /><span>{item.label}</span
        >{#if item.id === 'overview'}<span class="nav-count"
            >{portfolio.queue.length}</span
          >{/if}</button
      >{/each}
  </nav>
  <div class="nav-label second">CONFIGURACIÓN</div>
  <nav aria-label="Configuración">
    <button
      class:active={navigation.page === 'data'}
      onclick={() => navigation.navigate('data')}
      ><Database size={18} />Fuentes de datos{#if !sources.customers.length}<span
          class="little-dot"
        ></span>{/if}</button
    ><button
      class:active={navigation.page === 'rules'}
      onclick={() => navigation.navigate('rules')}
      ><SlidersHorizontal size={18} />Reglas y criterios</button
    >
  </nav>
  <span class="local-badge" title="Datos locales"
    ><span></span>Datos locales</span
  >
  <div class="sidebar-bottom">
    <div class="draft-note">
      <Sparkles size={17} /><strong>Menos ruido. Más foco.</strong>
      <p>De los datos a la próxima buena conversación.</p>
      <span>PROTOTIPO · V0.1</span>
    </div>
    <button
      class="help"
      onclick={() => {
        navigation.navigate('data');
        feedback.notice =
          'Carga uso_mensual.csv y clientes.csv para activar todas las señales. Los archivos se procesan solo en tu navegador.';
      }}
      ><CircleHelp size={17} />Guía del workspace<ArrowUpRight
        size={15}
      /></button
    >
    <div class="profile">
      <div class="avatar purple">OP</div>
      <div>
        <strong>Equipo de operaciones</strong><small>Workspace local</small>
      </div>
      <span class="online-dot"></span>
    </div>
  </div>
</aside>
