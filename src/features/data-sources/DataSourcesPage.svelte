<script>
  import CsvUploadCard from './components/CsvUploadCard.svelte';
  import DataQualitySummary from './components/DataQualitySummary.svelte';
  let { sources, portfolio } = $props();
</script>

<div class="upload-grid">
  {#each [{ type: 'usage', title: 'Uso mensual', subtitle: 'Actividad, adopción e incidentes por cuenta y mes.', filename: sources.usageFile, count: sources.usage.length }, { type: 'customers', title: 'Ficha de clientes', subtitle: 'Responsables, estado y contactos de cada cuenta.', filename: sources.customersFile, count: sources.customers.length }] as source}<CsvUploadCard
      {source}
      onUpload={sources.upload}
    />{/each}
</div>
<DataQualitySummary {sources} {portfolio} />
