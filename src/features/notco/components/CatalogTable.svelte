<script>
  import { number } from '../../../shared/utils/format.js';
  import { products } from '../data/catalog.js';
</script>

<section class="panel catalog-panel">
  <div class="panel-heading">
    <h2>El catálogo es la fuente de verdad</h2>
    <span class="muted">Archivo del caso · CLP</span>
  </div>
  <div class="table-scroll">
    <table>
      <thead
        ><tr
          ><th>PRODUCTO</th><th>FORMATO</th><th>PRECIO</th><th>STOCK</th><th
            >ESTADO</th
          ></tr
        ></thead
      ><tbody
        >{#each products as product}<tr
            ><td
              ><strong>{product.producto}</strong><small class="evidence"
                >{product.sku}</small
              ></td
            ><td>{product.formato}</td><td
              >{product.precio_clp
                ? '$' + number(+product.precio_clp)
                : 'Sin precio'}</td
            ><td>{product.stock}</td><td
              ><span
                class={`badge ${product.activo === 'no' ? 'neutral' : +product.stock === 0 ? 'critical' : 'growth'}`}
                >{product.activo === 'no'
                  ? 'Inactivo'
                  : +product.stock === 0
                    ? 'Agotado'
                    : 'Disponible'}</span
              ></td
            ></tr
          >{/each}</tbody
      >
    </table>
  </div>
</section>
