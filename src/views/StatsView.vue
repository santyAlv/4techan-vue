<script setup>
import { computed } from 'vue'
import { api } from '../services/index.js'
import { useCarga } from '../composables.js'
import { pct } from '../utils/format.js'
import StateBlock from '../components/StateBlock.vue'

const { datos: s, cargando, error, recargar } = useCarga(() => api.getStats())

// KPI 3 de la actividad de KPI: resoluciones revertidas ÷ resoluciones totales (meta: 5% o menos).
const META_REVERSION = 5
const reversion = computed(() => (s.value ? pct(s.value.revertidas_30d, s.value.resoluciones_30d) : null))
// Semáforo: verde = cumple la meta; amarillo = entre 80% y 99% de la meta; rojo = menos de 80%.
const estado = computed(() => {
  if (reversion.value === null) return { color: 'gris', etiqueta: 'Sin datos' }
  if (reversion.value <= META_REVERSION) return { color: 'verde', etiqueta: 'Cumplida' }
  if (META_REVERSION / reversion.value >= 0.8) return { color: 'amarillo', etiqueta: 'En riesgo' }
  return { color: 'rojo', etiqueta: 'No cumplida' }
})
const maxSemana = computed(() => Math.max(1, ...(s.value?.publicaciones_por_semana ?? []).map((x) => x.total)))
const maxAnio = computed(() => Math.max(1, ...(s.value?.activas_por_anio ?? []).map((x) => x.cuentas)))
const sem = (d) => new Date(d + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
</script>

<template>
  <h1>Estadísticas del foro</h1>
  <p class="lead">Indicadores de seguimiento de la Etapa 4 calculados con los registros del foro. Incluyen los datos de prueba.</p>
  <StateBlock :cargando="cargando" :error="error" @reintentar="recargar">
    <div v-if="s" class="kpis">
      <div class="kpi"><span class="kpi-valor">{{ s.cuentas_activas_semana }}</span><span>cuentas que publicaron en los últimos 7 días</span><small>{{ s.cuentas_registradas }} estudiantes registrados</small></div>
      <div class="kpi"><span class="kpi-valor">{{ s.reportes_pendientes }}</span><span>reportes pendientes</span><small>{{ s.reportes_30d }} recibidos en 30 días</small></div>
      <div class="kpi" :class="`kpi-${estado.color}`">
        <span class="kpi-valor">{{ reversion === null ? '—' : reversion + '%' }}</span>
        <span>resoluciones revertidas (30 días)</span>
        <small>{{ s.revertidas_30d }} de {{ s.resoluciones_30d }} · meta ≤ {{ META_REVERSION }}%</small>
        <strong class="semaforo">{{ estado.color.toUpperCase() }} — {{ estado.etiqueta }}</strong>
        <small v-if="reversion === null">Sin resoluciones en el período: no se informa 0%.</small>
      </div>
    </div>

    <section v-if="s" aria-labelledby="h-sem">
      <h2 id="h-sem">Publicaciones por semana (últimas 8)</h2>
      <p v-if="!s.publicaciones_por_semana.length" class="estado">Sin publicaciones en el período.</p>
      <ul class="barras sin-vineta">
        <li v-for="x in s.publicaciones_por_semana" :key="x.semana">
          <span class="barra-etiqueta">Sem. {{ sem(x.semana) }}</span>
          <span class="barra-dato" :style="{ width: (x.total / maxSemana) * 100 + '%' }"></span>
          <span class="barra-valor">{{ x.total }}</span>
        </li>
      </ul>
    </section>

    <section v-if="s" aria-labelledby="h-anio">
      <h2 id="h-anio">Cuentas activas por año (últimos 7 días)</h2>
      <p v-if="!s.activas_por_anio.length" class="estado">Nadie publicó en los últimos 7 días.</p>
      <ul class="barras sin-vineta">
        <li v-for="x in s.activas_por_anio" :key="x.anio">
          <span class="barra-etiqueta">{{ x.anio }}° año</span>
          <span class="barra-dato" :style="{ width: (x.cuentas / maxAnio) * 100 + '%' }"></span>
          <span class="barra-valor">{{ x.cuentas }}</span>
        </li>
      </ul>
      <p class="meta">Para el porcentaje sobre la matrícula de cada año hay que cargar la matrícula (se pide en preceptoría); la base todavía no la guarda.</p>
    </section>
  </StateBlock>
</template>
