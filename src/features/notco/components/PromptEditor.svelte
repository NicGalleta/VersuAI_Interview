<script>
  import { Check, RotateCcw } from 'lucide-svelte';
  let { agent } = $props();

  // Keep offsets into the original string so headings and spacing survive edits.
  function splitSections(prompt) {
    const headings = [
      ...prompt.matchAll(/^([A-ZÁÉÍÓÚÜÑ][A-ZÁÉÍÓÚÜÑ \t·—–-]*)(?=\r?\n)/gm),
    ];
    if (!headings.length) {
      return [{ title: 'Prompt de Nota', start: 0, end: prompt.length }];
    }
    const result = [];
    const firstStart = headings[0].index;
    if (prompt.slice(0, firstStart).trim()) {
      result.push({ title: 'Introducción', start: 0, end: firstStart });
    }
    headings.forEach((heading, index) => {
      const start = heading.index + heading[0].length;
      const end = headings[index + 1]?.index ?? prompt.length;
      const content = prompt.slice(start, end);
      const leading = content.match(/^\s*/)[0].length;
      const trailing = content.trim() ? content.match(/\s*$/)[0].length : 0;
      result.push({
        title: heading[1],
        start: start + leading,
        end: end - trailing,
      });
    });
    return result;
  }

  let sections = $state([]);
  let displayedPrompt = $state(null);
  $effect(() => {
    if (agent.prompt !== displayedPrompt) {
      sections = splitSections(agent.prompt);
      displayedPrompt = agent.prompt;
    }
  });

  function updateSection(section, value) {
    const difference = value.length - (section.end - section.start);
    agent.prompt =
      agent.prompt.slice(0, section.start) +
      value +
      agent.prompt.slice(section.end);
    const index = sections.indexOf(section);
    section.end += difference;
    for (const following of sections.slice(index + 1)) {
      following.start += difference;
      following.end += difference;
    }
    displayedPrompt = agent.prompt;
    agent.saved = false;
  }
</script>

<section class="panel editor-panel">
  <div class="panel-heading">
    <h2>Edita el prompt por partes</h2>
    <span class="muted"
      >{agent.prompt.length.toLocaleString('es-CL')} caracteres</span
    >
  </div>
  <div class="prompt-sections">
    {#each sections as section, index}
      <details class="prompt-section" open={false}>
        <summary>{section.title}</summary>
        <textarea
          class="prompt-editor"
          aria-label={section.title}
          value={agent.prompt.slice(section.start, section.end)}
          oninput={(event) => updateSection(section, event.currentTarget.value)}
          spellcheck="false"></textarea>
      </details>
    {/each}
  </div>
  <div class="editor-footer">
    <button
      class="button primary"
      disabled={!agent.hasPromptChanges}
      onclick={agent.savePrompt}
      ><Check size={15} />{agent.saved
        ? 'Guardado localmente'
        : 'Guardar versión'}</button
    >
  </div>
  {#if agent.revisions.length}<details class="revisions">
      <summary>Historial local · {agent.revisions.length} versiones</summary
      >{#each agent.revisions as revision}<button
          class="text-button"
          onclick={() => {
            agent.prompt = revision.text;
            agent.saved = false;
          }}>Restaurar {revision.date}<RotateCcw size={12} /></button
        >{/each}
    </details>{/if}
</section>

<style>
  .editor-footer button:disabled {
    filter: grayscale(1);
  }
</style>
