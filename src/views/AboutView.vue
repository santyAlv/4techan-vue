<script setup>
import { sesion } from '../stores/session.js'
import { ROL_NOMBRE } from '../utils/permissions.js'
import { confirmar } from '../stores/confirm.js'
import { toast } from '../stores/toast.js'
const demo = sesion.state.modo === 'demo'
async function reiniciar() {
  if (!(await confirmar({ titulo: '¿Reiniciar los datos de prueba?', mensaje: 'Se pierde lo que cargaste en este navegador y vuelven los datos de prueba originales.', confirmar: 'Reiniciar', peligro: true }))) return
  await sesion.reiniciarDemo()
  toast.success('Datos de prueba reiniciados.')
}
</script>

<template>
  <section class="detalle">
    <h1>Acerca de esta versión</h1>
    <p class="lead">Primera versión de 4TEChan, el foro anónimo de la E.E.S.T. N°1. Incluye solo lo indispensable para probar si el foro resuelve el problema de los apuntes y avisos dispersos.</p>

    <h2>Modo actual</h2>
    <p v-if="demo"><strong>Demostración.</strong> Los datos son de prueba y viven en este navegador (se pueden reiniciar abajo). No hay cuentas reales: los <strong>roles están simulados</strong> con el selector del encabezado.</p>
    <p v-else><strong>Conectado a Supabase.</strong> Hay cuentas reales con autenticación y los permisos se aplican en la base de datos (RLS). Los registros marcados «Dato de prueba» son simulados.</p>

    <h2>Roles</h2>
    <ul>
      <li><strong>{{ ROL_NOMBRE.invitado }}</strong>: lee tablones y publicaciones.</li>
      <li><strong>{{ ROL_NOMBRE.estudiante }}</strong>: publica, comenta, modifica o cancela lo suyo, reporta y apela.</li>
      <li><strong>{{ ROL_NOMBRE.moderador }}</strong>: resuelve reportes y apelaciones, ve el historial y las estadísticas.</li>
      <li><strong>{{ ROL_NOMBRE.admin }}</strong>: además cambia los roles de las cuentas.</li>
    </ul>
    <p v-if="demo"><strong>Simulado en esta versión:</strong> los cuatro roles (no hay inicio de sesión) y la persistencia (solo en este navegador).</p>

    <h2>Qué se conserva</h2>
    <ul>
      <li>Las publicaciones y comentarios no se borran: «cancelar» o «eliminar» cambia su estado para conservar el historial.</li>
      <li>Las resoluciones y apelaciones nunca se borran: son la base de los indicadores de moderación.</li>
    </ul>

    <div v-if="demo" class="acciones">
      <button class="btn btn-peligro" type="button" @click="reiniciar">Reiniciar los datos de prueba</button>
    </div>
  </section>
</template>
