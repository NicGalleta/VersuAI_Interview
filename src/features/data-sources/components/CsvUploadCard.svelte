<script>
  import { Database, Upload, FileText } from 'lucide-svelte';
  let { source, onUpload } = $props();
</script>

<section class="panel upload-card">
  <span class="large-icon"><Database size={24} /></span>
  <h2>{source.title}</h2>
  <p>{source.subtitle}</p>
  <label class="dropzone"
    ><Upload size={26} /><strong>Seleccionar archivo CSV</strong><span
      >Hasta 10 MB · encabezados obligatorios</span
    ><input
      type="file"
      accept=".csv,text/csv"
      aria-label={`Cargar ${source.title}`}
      onchange={(event) => onUpload(event, source.type)}
    /></label
  >
  <div class="file-status">
    <FileText size={16} /><span>{source.filename}</span><strong
      >{source.count} filas</strong
    >
  </div>
</section>
