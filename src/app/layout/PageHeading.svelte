<script>
  let { page, children } = $props();
</script>

<div class="page-heading">
  <div>
    {#if page.eyebrow}<div class="eyebrow">{page.eyebrow}</div>{/if}
    <h1>{page.title}</h1>
    {#if page.description}<p>{page.description}</p>{/if}
  </div>
  <div class="heading-actions">{@render children?.()}</div>
</div>
