<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { sesion } from '../stores/session.js'
import { useAccion } from '../composables.js'
import { loginSchema, validate, hasErrors } from '../utils/validators.js'
import FormField from '../components/FormField.vue'

const route = useRoute()
const router = useRouter()
const form = reactive({ email: '', password: '' })
const errores = ref({})
const accion = useAccion()
const demo = sesion.state.modo === 'demo'

async function enviar() {
  errores.value = validate(form, loginSchema)
  if (hasErrors(errores.value)) return
  const r = await accion.ejecutar(() => sesion.ingresar({ email: form.email.trim(), password: form.password }), { ok: 'Ingresaste correctamente.' })
  if (r.ok) router.replace(typeof route.query.volver === 'string' && route.query.volver.startsWith('/') ? route.query.volver : '/')
}
</script>

<template>
  <section class="angosto">
    <h1>Ingresar</h1>
    <p v-if="route.query.volver" class="aviso" role="note">Necesitás iniciar sesión para entrar a esa página.</p>
    <div v-if="demo" class="aviso" role="note">
      <p><strong>Modo demostración:</strong> no hay cuentas ni contraseñas. Elegí un rol simulado (estudiante, Comisión o administrador) con el selector del encabezado.</p>
    </div>
    <form v-else novalidate class="formulario" @submit.prevent="enviar">
      <FormField label="Correo" :error="errores.email" v-slot="{ id, describe, invalido }">
        <input :id="id" v-model="form.email" type="email" autocomplete="email" inputmode="email" :aria-invalid="invalido" :aria-describedby="describe" />
      </FormField>
      <FormField label="Contraseña" :error="errores.password" v-slot="{ id, describe, invalido }">
        <input :id="id" v-model="form.password" type="password" autocomplete="current-password" :aria-invalid="invalido" :aria-describedby="describe" />
      </FormField>
      <button class="btn btn-primario" type="submit" :disabled="accion.cargando.value">{{ accion.cargando.value ? 'Ingresando…' : 'Ingresar' }}</button>
      <p>¿No tenés cuenta? <RouterLink to="/registro">Creala acá</RouterLink>.</p>
    </form>
  </section>
</template>
