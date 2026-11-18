import { describe, it, expect } from 'vitest'
import { validate, hasErrors, registerSchema, postSchema, reportSchema, resolutionSchema, loginSchema, appealSchema } from './validators.js'

const okReg = { email: 'a@b.com', alias: 'sim_01', password: 'clave1234', password2: 'clave1234', anio: '2', especialidad: '' }

describe('registro', () => {
  it('acepta datos válidos de ciclo básico sin especialidad', () => {
    expect(hasErrors(validate(okReg, registerSchema))).toBe(false)
  })
  it('exige especialidad desde 4° año', () => {
    expect(validate({ ...okReg, anio: '4' }, registerSchema).especialidad).toMatch(/especialidad/i)
    expect(hasErrors(validate({ ...okReg, anio: '4', especialidad: 'Electrónica' }, registerSchema))).toBe(false)
  })
  it('rechaza año fuera de rango o no entero', () => {
    for (const a of ['0', '8', '2.5', 'x']) expect(validate({ ...okReg, anio: a }, registerSchema).anio).toBeTruthy()
  })
  it('valida formato de correo y alias', () => {
    expect(validate({ ...okReg, email: 'sin-arroba' }, registerSchema).email).toBeTruthy()
    expect(validate({ ...okReg, alias: 'a b' }, registerSchema).alias).toBeTruthy()
    expect(validate({ ...okReg, alias: 'ab' }, registerSchema).alias).toBeTruthy()
    expect(validate({ ...okReg, alias: 'x'.repeat(21) }, registerSchema).alias).toBeTruthy()
  })
  it('exige contraseña con letra y número, y que coincidan', () => {
    expect(validate({ ...okReg, password: 'sololetras', password2: 'sololetras' }, registerSchema).password).toBeTruthy()
    expect(validate({ ...okReg, password: 'abc12', password2: 'abc12' }, registerSchema).password).toBeTruthy()
    expect(validate({ ...okReg, password2: 'otra1234' }, registerSchema).password2).toBeTruthy()
  })
})

describe('otros formularios', () => {
  it('login: obligatorios', () => {
    expect(Object.keys(validate({ email: '', password: '' }, loginSchema))).toEqual(['email', 'password'])
  })
  it('publicación: límites de título y cuerpo', () => {
    expect(validate({ board_id: '1', titulo: 'abc', cuerpo: 'texto largo' }, postSchema).titulo).toBeTruthy()
    expect(validate({ board_id: '', titulo: 'Título ok', cuerpo: 'texto largo' }, postSchema).board_id).toBeTruthy()
    expect(hasErrors(validate({ board_id: '1', titulo: 'Título ok', cuerpo: 'texto largo' }, postSchema))).toBe(false)
  })
  it('reporte: motivo permitido y detalle obligatorio en «otro»', () => {
    expect(validate({ motivo: 'inventado', detalle: '' }, reportSchema).motivo).toBeTruthy()
    expect(validate({ motivo: 'otro', detalle: 'corto' }, reportSchema).detalle).toBeTruthy()
    expect(hasErrors(validate({ motivo: 'spam', detalle: '' }, reportSchema))).toBe(false)
  })
  it('resolución: la suspensión exige nota', () => {
    expect(validate({ resultado: 'borrado_ban_3d', nota: '' }, resolutionSchema).nota).toBeTruthy()
    expect(hasErrors(validate({ resultado: 'descartado', nota: '' }, resolutionSchema))).toBe(false)
  })
  it('apelación: mínimo 10 caracteres', () => {
    expect(validate({ texto: 'no' }, appealSchema).texto).toBeTruthy()
  })
})
