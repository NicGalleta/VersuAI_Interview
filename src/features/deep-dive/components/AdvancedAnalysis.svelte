<script>
  import {
    advancedViews,
    advancedDefaults,
    advancedControls,
    offsetMonth,
  } from '../domain/advanced.js';
  import { monthName, number } from '../../../shared/utils/format.js';
  import AdvancedChart from './AdvancedChart.svelte';
  let { dive } = $props();
  const sector = $derived(dive.mode === 'sector');
  const account = $derived(dive.advanced.accounts[0]);
  const selectedGroups = $derived(
    dive.advanced.groups.filter(
      (group) => dive.advancedId === 'overview' || dive.advancedId === group.id,
    ),
  );
  const primaryLabel = $derived(
    advancedViews.find((view) => view.id === dive.advanced.main)?.label,
  );
  const fmt = (value) =>
    value == null ? 'Sin dato' : number(Math.round(value * 10) / 10);
</script>

<div class="advanced-analysis">
  <div
    class="advanced-priority"
    class:urgent={dive.advanced.main === 'service'}
  >
    <div>
      <span class="dd-kicker"
        >{dive.advanced.main === 'service'
          ? 'PRIORIDAD MÁXIMA · SERVICIO'
          : 'LECTURA DEL CORTE'}</span
      >
      <h3>
        {primaryLabel
          ? `Revisar primero: ${primaryLabel.toLowerCase()}`
          : 'Sin motivo principal confirmado'}
      </h3>
      <p>
        {dive.advanced.main === 'service'
          ? 'Hay evidencia de una incidencia del servicio. Revisar de inmediato; estos datos no confirman por sí solos la causa ni si el incidente continúa abierto.'
          : 'La prioridad se basa en señales observables. Los datos insuficientes no se interpretan como una cuenta sana.'}
      </p>
    </div>
  </div>
  <p class="advanced-period-note">
    Servicio y contexto: {monthName(dive.month)}{dive.advanced.partial
      ? ' (parcial)'
      : ''}. Desenganche y activación: meses completos hasta {monthName(
      dive.advanced.end,
    )}. Lectura histórica al corte seleccionado.
  </p>

  <div class="advanced-cards" class:single={selectedGroups.length === 1}>
    {#each selectedGroups as group}
      {@const signal = account?.signals[group.id]}
      <article
        class="advanced-card"
        class:flagged={group.affected > 0}
        class:critical={group.id === 'service' && group.affected > 0}
      >
        <span class="dd-kicker"
          >{group.id === 'service'
            ? '01 · SERVICIO'
            : group.id === 'engagement'
              ? '02 · PARTICIPACIÓN'
              : '03 · PRIMEROS MESES'}</span
        >
        <h3>{group.label}</h3>
        <strong
          >{sector
            ? `${group.affected} de ${group.evaluated} evaluables`
            : signal?.label}</strong
        >
        <p>
          {sector
            ? `${group.expected - group.evaluated} cuentas sin datos suficientes o fuera de la ventana de evaluación.`
            : signal?.evidence.join(' · ')}
        </p>
        {#if !sector && group.id === 'engagement'}<small
            >Orden de valores: {[-2, -1, 0]
              .map((offset) =>
                monthName(offsetMonth(dive.advanced.end, offset)),
              )
              .join(' → ')}.</small
          >{/if}
        <button class="button" onclick={() => (dive.advancedId = group.id)}
          >Ver evolución</button
        >
      </article>
    {/each}
  </div>

  <div class="advanced-charts">
    {#each dive.charts as chart}<AdvancedChart {chart} {sector} />{/each}
  </div>

  <section
    class="advanced-context"
    aria-label="Contexto operacional y comercial"
  >
    <h3>Contexto operacional y comercial</h3>
    <p>
      Complementa los motivos principales y ordena cuentas con la misma
      prioridad. No genera alertas independientes ni una probabilidad de churn.
    </p>
    <div class="advanced-factors">
      {#each dive.advanced.context as factor}
        <div class:raised={factor.elevatedCount > 0}>
          <span>{factor.label}</span>
          <strong
            >{sector
              ? `${factor.elevatedCount} cuentas sobre umbral`
              : `${fmt(factor.value)}${factor.value == null ? '' : ` ${factor.unit}`}`}</strong
          >
          <small
            >Umbral ≥ {factor.limit}
            {factor.unit} · {factor.evaluated}/{factor.expected} con dato válido</small
          >
        </div>
      {/each}
    </div>
    <p class="advanced-footnote">
      Derivaciones sin respuesta / derivadas a humano. Denominador cero, datos
      ausentes o numerador mayor al total: sin tasa válida. Los tickets
      reabiertos se muestran como conteo, porque no conocemos su cohorte de
      origen.
    </p>
  </section>

  {#if sector}
    <details class="advanced-accounts">
      <summary
        >Ver diagnóstico de las {dive.ids.length} cuentas del rubro</summary
      >
      <p>
        Orden: servicio → desenganche → activación; después, cantidad de
        factores adicionales sobre umbral. Incluye todas las cuentas con uso;
        activación solo evalúa fichas activas.
      </p>
      <div class="dd-table-scroll">
        <table>
          <caption
            >Diagnóstico individual · una cuenta puede tener más de un motivo</caption
          >
          <thead
            ><tr
              ><th scope="col">Cliente</th><th scope="col">Servicio</th><th
                scope="col">Desenganche</th
              ><th scope="col">Activación</th><th scope="col">Contexto</th></tr
            ></thead
          >
          <tbody>
            {#each dive.advanced.accounts as item}
              <tr
                ><th scope="row">{item.name}<small>{item.id}</small></th>
                {#each ['service', 'engagement', 'activation'] as key}<td
                    ><span
                      class:advanced-flag={item.signals[key].affected === true}
                      >{item.signals[key].label}</span
                    >
                    <details>
                      <summary>Evidencia</summary>
                      <p>{item.signals[key].evidence.join(' · ')}</p>
                    </details></td
                  >{/each}
                <td>{item.elevated} factores sobre umbral</td></tr
              >
            {/each}
          </tbody>
        </table>
      </div>
    </details>
  {/if}

  <details class="advanced-method">
    <summary>Criterios y umbrales de este análisis</summary>
    <ul>
      <li>
        Servicio: basta superar uno de los tres umbrales. Días inactivo ≥ {dive
          .rules.inactivity} (Reglas y criterios); errores y mensajes según los controles
        inferiores. Un dato conocido puede confirmar una incidencia aunque falten
        otros.
      </li>
      <li>
        Desenganche: sesiones, días y usuarios del panel en cero durante dos
        meses completos consecutivos; o caída en cada uno de dos intervalos,
        acumulando al menos {dive.advancedSettings.engagementDrop}% en al menos
        dos de esos tres indicadores. Requiere tres meses consecutivos para
        evaluar caídas. Cambios de configuración no dispara una señal por sí
        solo.
      </li>
      <li>
        Activación: ficha Activa, entre 30 y 120 días desde checkout, y dos
        meses completos posteriores a checkout con ≤ {dive.rules.lowUsage} conversaciones
        cada uno (Reglas y criterios). Checkout es una aproximación: el CSV no contiene
        fecha real de puesta en marcha. No se etiqueta como problema de activación
        durante implementación.
      </li>
      <li>
        No se usa una caída aislada de conversaciones para inferir desenganche.
        Meses faltantes rompen la tendencia; no se proyecta el mes parcial. Las
        fichas reflejan el estado actual disponible, sin historial de estados o
        rubros.
      </li>
      <li>
        Los umbrales iniciales son criterios operativos propuestos, no un modelo
        validado de churn. Ajustes solo para Deep Dive, en esta sesión; no
        cambian las alertas de la cartera. Inactividad, pago y activación toman
        los valores de Reglas y criterios.
      </li>
    </ul>
    <div class="advanced-settings">
      {#each advancedControls as control}
        <label
          >{control.label}<input
            type="range"
            min={control.min}
            max={control.max}
            bind:value={dive.advancedSettings[control.key]}
          /><span>{dive.advancedSettings[control.key]} {control.unit}</span
          ></label
        >
      {/each}
    </div>
    <button
      class="button"
      onclick={() => (dive.advancedSettings = { ...advancedDefaults })}
      >Restablecer umbrales avanzados</button
    >
  </details>
</div>
