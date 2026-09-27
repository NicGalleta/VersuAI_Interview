<script>
  import { products } from './data/catalog.js';
  import PromptEditor from './components/PromptEditor.svelte';
  import ChatPreview from './components/ChatPreview.svelte';
  import TestSuite from './components/TestSuite.svelte';
  import CatalogTable from './components/CatalogTable.svelte';
  import KickoffChecklist from './components/KickoffChecklist.svelte';
  let { agent } = $props();
</script>

<div class="agent-status">
  <div class="notco-logo">N</div>
  <div>
    <strong>Nota <span class="badge growth">Borrador</span></strong>
    <p>NotCo Chile · WhatsApp · Plan Pro</p>
  </div>
  <span class="backend-status"
    ><span class="tiny-dot amber-dot"></span>Cloudflare Workers AI</span
  >
</div>
<div class="agent-tabs tabs">
  {#each [{ id: 'editor', label: 'Prompt y conversación' }, { id: 'tests', label: 'Batería de pruebas · 8' }, { id: 'catalog', label: `Catálogo · ${products.length}` }, { id: 'questions', label: 'Antes de activar' }] as tab}<button
      class:chosen={agent.agentTab === tab.id}
      onclick={() => (agent.agentTab = tab.id)}>{tab.label}</button
    >{/each}
</div>
{#if agent.agentTab === 'editor'}<div class="agent-grid">
    <PromptEditor {agent} />
    <ChatPreview {agent} />
  </div>
{:else if agent.agentTab === 'tests'}<TestSuite {agent} />
{:else if agent.agentTab === 'catalog'}<CatalogTable />
{:else}<KickoffChecklist />{/if}
