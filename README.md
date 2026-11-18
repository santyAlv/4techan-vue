# 4TEChan · primera versión

Foro anónimo de la comunidad de la E.E.S.T. N°1 (proyecto de la precooperativa). Reúne en un solo lugar los apuntes, avisos y materiales que hoy se pierden entre grupos de WhatsApp e Instagram. Hecho con **Vue 3 + Vite + Vue Router** y **Supabase** (Postgres, Auth y RLS).

Esta versión incluye solo lo indispensable para probar el servicio y medir los KPI definidos en la actividad anterior (ver `docs/historias-y-pantallas.md`).

## Cómo correrlo

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # validaciones y lógica del modo demo
npm run build
```

**Sin configurar nada** la app arranca en **modo demostración**: usa los datos de prueba de `src/data/seed.json`, los guarda en el navegador (localStorage) y **simula los roles** con un selector en el encabezado (Invitado, Estudiante, Comisión, Administrador). No hay cuentas ni contraseñas.

**Con Supabase** hay cuentas reales y los permisos los aplica la base:

1. Creá un proyecto en <https://supabase.com> (plan gratuito alcanza).
2. En *SQL Editor* ejecutá, **en este orden**, los archivos de `db/`: `01_tablas.sql`, `02_funciones.sql`, `03_politicas_rls.sql` y `04_seed_simulado.sql` (datos de prueba).
3. Copiá `.env.example` como `.env` y completá `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` (*Project Settings → API*). **Solo la clave publicable.** Nunca pegues la `service_role` ni la contraseña de la base.
4. `npm run dev`, registrate desde la app y, para probar los otros roles, promové tu cuenta desde el SQL Editor:
   ```sql
   update public.profiles set rol = 'admin' where alias = 'tu_alias';   -- o 'moderador'
   ```
   (Desde ahí, el administrador cambia roles desde la pantalla *Cuentas*.)
5. Si en *Authentication → Providers → Email* está activada la confirmación por correo, la app avisa que hay que confirmar antes de ingresar.

Las cuentas del seed (`sim_01`…, `mod_01`…, `admin_sim`) **no tienen contraseña**: sirven para que haya publicaciones, reportes e historial, pero no se puede ingresar con ellas.

## Estructura

```
db/            01_tablas · 02_funciones · 03_politicas_rls · 04_seed_simulado (SQL reproducible)
docs/          historias de usuario, pantallas y modelo de datos
tools/         gen_seed.py: genera db/04_seed_simulado.sql y src/data/seed.json (mismos datos)
src/views/     una vista por pantalla
src/components/  piezas reutilizables (formularios, tarjetas, avisos, diálogos)
src/services/  index.js elige mockApi (demo) o supabaseApi; misma interfaz en ambos
src/stores/    sesión, avisos y confirmaciones
src/utils/     validadores, permisos por rol, errores y formato
src/data/      seed.json (datos de prueba del modo demostración)
src/router/    rutas y guard por permiso
```

## Roles y permisos

| Acción | Invitado | Estudiante | Comisión | Admin |
|---|:-:|:-:|:-:|:-:|
| Leer tablones, publicaciones y comentarios | ✔ | ✔ | ✔ | ✔ |
| Publicar, comentar | | ✔ | ✔ | ✔ |
| Modificar / cancelar lo propio, reportar lo ajeno, apelar | | ✔ | ✔ | ✔ |
| Resolver reportes y apelaciones, historial, estadísticas | | | ✔ | ✔ |
| Cambiar roles de las cuentas | | | | ✔ |

**Qué está simulado:** en modo demostración, *los cuatro roles* y *la persistencia* (solo en el navegador). Con Supabase no se simula ningún rol: vienen de `profiles.rol`. En ambos modos los registros de prueba llevan la insignia **«Dato de prueba»** (`es_simulado = true`).

## Qué se conserva y qué se comparte (punto 10)

| Información | Dónde vive | Por qué |
|---|---|---|
| Publicaciones, comentarios, reportes, resoluciones, apelaciones, perfiles | Base de datos (compartida) | Las ven y usan varias personas desde distintos dispositivos. |
| Sesión (token de Supabase) | Navegador (lo maneja `supabase-js`) | Para no volver a ingresar al cerrar la pestaña. Es por dispositivo. |
| Rol simulado y datos de prueba del modo demo | `localStorage` del navegador | Solo existe en demostración; no se comparte. |
| Texto de formularios, filtros, pestañas | Memoria de la pantalla | Es provisorio: se pierde al recargar y no hace falta conservarlo. |

**Historial:** no se borra nada físicamente. Cancelar una publicación (autor) o eliminarla (Comisión) cambia `estado` a `borrado` y guarda quién lo hizo (`borrado_por`); las resoluciones y apelaciones son permanentes. Es lo que permite calcular después cuántas resoluciones se apelan o se revierten.

## ¿Hace falta backend? (punto 11)

**Sí, pero no uno propio:** se usa Supabase como backend administrado (BaaS). Motivos:

- Los datos tienen que **compartirse entre usuarios y dispositivos** (publicaciones, reportes). `localStorage` es por navegador: cada estudiante vería un foro distinto.
- Hay **cuentas y roles**: la moderación y la administración no pueden decidirse en el navegador, porque cualquiera puede modificar el código del cliente. Los permisos se aplican en la base (RLS y funciones `security definer`).
- Hay **reglas de negocio con varias escrituras a la vez** (resolver un reporte borra la publicación, registra la resolución y puede suspender al autor): se hacen en una sola transacción dentro de funciones SQL.

Se evitó un servidor propio (Node, etc.) para no tener que mantener y pagar otro servicio: con RLS + funciones SQL alcanza.

**Si no se usara backend** (como en el modo demostración) los datos quedarían en `localStorage`: se pierden si se borra el navegador, no se comparten, no hay autenticación real y cualquiera puede cambiar su rol desde las herramientas del navegador. Sirve para mostrar la interfaz, no para operar el foro.

## Seguridad (puntos 15 y 16)

- **RLS activado en todas las tablas** (`db/03_politicas_rls.sql`): el invitado solo lee lo publicado; el estudiante solo modifica lo suyo; las resoluciones y apelaciones solo se escriben con funciones que verifican el rol dentro de la base.
- Los **disparadores** de `02_funciones.sql` fuerzan los campos sensibles (alias del autor, estado, fechas, rol). El rol de una cuenta nueva siempre es `estudiante`.
- Las cuentas **suspendidas** no pueden publicar, comentar ni reportar: lo impone la política, no solo la pantalla.
- El cliente usa únicamente la **URL y la clave publicable**. No hay contraseñas ni claves de administración en el código, el `.env.example` ni esta documentación. `.env` está en `.gitignore`.
- Cada operación muestra **carga** (botón deshabilitado y texto), **confirmación** (aviso verde) y **error** (aviso rojo con un mensaje en castellano; ver `src/utils/errors.js`).

## Verificación hecha

- `npm test`: 17 pruebas (validaciones de formularios y lógica completa del modo demo: permisos, cancelación con historial, reporte → suspensión → apelación → reversión, roles).
- `npm run build`: compila sin errores.
- Navegador headless en escritorio (1200 px) y celular (390 px): navegación por rol, validaciones, alta de publicación, sin errores de consola ni desborde horizontal.
- **SQL probado en PostgreSQL 16 local** con un esquema `auth` simulado: tablas, funciones, políticas y seed aplican sin errores, y se comprobaron los permisos de invitado, estudiante, suspendido, Comisión y administrador.
- **Probado contra Supabase** (proyecto `4techan`, región sa-east-1): los cuatro scripts aplican sin errores y la app carga los datos simulados. Como invitado, la API rechaza leer reportes, publicar y ver estadísticas (401), y oculta las publicaciones borradas: los permisos los aplica la base, no la pantalla.
- *Advisors → Security*: se fijó `search_path` en los disparadores y se quitó el acceso por API a `handle_new_user`. Quedan avisos intencionales: las funciones de rol (`es_moderador`, etc.) las necesitan las políticas RLS, `alias_disponible` se usa al registrarse y las RPC de moderación verifican el rol por dentro. La protección contra contraseñas filtradas se activa desde *Authentication → Settings* (según el plan).

## Limitaciones conocidas

- La matrícula por año, los costos de hosting y la grilla de turnos (KPI 2 y 4 de la actividad anterior) todavía no se cargan en el sistema: la pantalla de estadísticas calcula con los registros del foro (cuentas activas, reportes y reversión, KPI 3).
- Las especialidades (`Programación`, `Electrónica`, `Electromecánica`) son un supuesto: ajustalas en `src/utils/validators.js`.
- Sin imágenes ni adjuntos, mensajes privados, notificaciones ni edición de comentarios.
- El historial y la lista de cuentas muestran hasta 300 y 200 filas respectivamente (sin paginar).
