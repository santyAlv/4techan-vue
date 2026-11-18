<script setup>
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../services/index.js'
import { sesion } from '../stores/session.js'
import { toast } from '../stores/toast.js'
import { useAccion } from '../composables.js'
import { registerSchema, ESPECIALIDADES, LIMITES, validate, hasErrors } from '../utils/validators.js'
import FormField from '../components/FormField.vue'

const router = useRouter()
const form = reactive({ email: '', alias: '', password: '', password2: '', anio: '', especialidad: '' })
const errores = ref({})
const accion = useAccion()
const demo = sesion.state.modo === 'demo'
const pideEspecialidad = computed(() => Number(form.anio) >= 4)

async function enviar() {
  errores.value = validate(form, registerSchema)
  if (hasErrors(errores.value)) return
  const r = await accion.ejecutar(async () => {
    if (!(await api.aliasDisponible(form.alias.trim()))) {
      const e = new Error('Ese alias ya está en uso. Elegí otro.')
      e.code = 'DEMO'
      e.campo = 'alias'
      throw e
    }
    return sesion.registrar({ ...form, email: form.email.trim(), alias: form.alias.trim(), especialidad: pideEspecialidad.value ? form.especialidad : '' })
  })
  if (!r.ok) {
    if (r.error?.campo) errores.value = { [r.error.campo]: r.error.message }
    return
  }
  if (r.valor.needsConfirmation) {
    toast.info('Te enviamos un correo para confirmar la cuenta. Después podés ingresar.')
    router.replace('/ingresar')
  } else {
    toast.success('Cuenta creada. ¡Bienvenido!')
    router.replace('/')
  }
}
</script>

<template>
  <section class="angosto">
    <h1>Crear cuenta</h1>
    <div v-if="demo" class="aviso" role="note">
      <p><strong>Modo demostración:</strong> no hay registro. Elegí un rol simulado con el selector del encabezado.</p>
    </div>
    <form v-else novalidate class="formulario" @submit.prevent="enviar">
      <p class="aviso" role="note">El foro es anónimo: en las publicaciones solo se ve tu <strong>alias</strong>. No uses tu nombre real.</p>
      <FormField label="Correo" :error="errores.email" ayuda="Se usa solo para ingresar; no se muestra." v-slot="{ id, describe, invalido }">
        <input :id="id" v-model="form.email" type="email" autocomplete="email" inputmode="email" :aria-invalid="invalido" :aria-describedby="describe" />
      </FormField>
      <FormField label="Alias" :error="errores.alias" ayuda="De 3 a 20 caracteres: letras sin tilde, números y guion bajo." v-slot="{ id, describe, invalido }">
        <input :id="id" v-model="form.alias" type="text" :maxlength="LIMITES.alias.max" autocomplete="off" :aria-invalid="invalido" :aria-describedby="describe" />
      </FormField>
      <FormField label="Año que cursás" :error="errores.anio" v-slot="{ id, describe, invalido }">
        <select :id="id" v-model="form.anio" :aria-invalid="invalido" :aria-describedby="describe">
          <option value="" disabled>Elegí…</option>
          <option v-for="a in 7" :key="a" :value="String(a)">{{ a }}° año</option>
        </select>
      </FormField>
      <FormField v-if="pideEspecialidad" label="Especialidad" :error="errores.especialidad" v-slot="{ id, describe, invalido }">
        <select :id="id" v-model="form.especialidad" :aria-invalid="invalido" :aria-describedby="describe">
          <option value="" disabled>Elegí…</option>
          <option v-for="e in ESPECIALIDADES" :key="e" :value="e">{{ e }}</option>
        </select>
      </FormField>
      <FormField label="Contraseña" :error="errores.password" ayuda="Mínimo 8 caracteres, con al menos una letra y un número." v-slot="{ id, describe, invalido }">
        <input :id="id" v-model="form.password" type="password" autocomplete="new-password" :aria-invalid="invalido" :aria-describedby="describe" />
      </FormField>
      <FormField label="Repetir contraseña" :error="errores.password2" v-slot="{ id, describe, invalido }">
        <input :id="id" v-model="form.password2" type="password" autocomplete="new-password" :aria-invalid="invalido" :aria-describedby="describe" />
      </FormField>
      <button class="btn btn-primario" type="submit" :disabled="accion.cargando.value">{{ accion.cargando.value ? 'Creando cuenta…' : 'Crear cuenta' }}</button>
      <p>¿Ya tenés cuenta? <RouterLink to="/ingresar">Ingresá</RouterLink>.</p>
    </form>
  </section>
</template>
