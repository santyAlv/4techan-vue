# Historias de usuario y pantallas de la v1 (punto 1)

No se encontraron las pantallas ni las historias de etapas anteriores entre los archivos; se redefinieron a partir de la Etapa 4 (variables, tablones, Comisión de Normas y Convivencia) y de la actividad de KPI. Se priorizó lo necesario para responder las tres preguntas de investigación.

## Funciones indispensables (incluidas)

| # | Rol | Historia | Pantalla | Pregunta/KPI que habilita |
|---|---|---|---|---|
| H1 | Invitado | Ver tablones y publicaciones sin registrarme, para encontrar apuntes y avisos. | Inicio, Tablón, Publicación | P1 (tiempo de búsqueda) |
| H2 | Invitado | Buscar por texto y ordenar, para no recorrer todo el tablón. | Tablón | P1 |
| H3 | Estudiante | Crear una cuenta con alias, año y especialidad, sin exponer mi nombre. | Crear cuenta / Ingresar | P2 (uso por año) |
| H4 | Estudiante | Publicar en un tablón. | Nueva publicación | P2 (publicaciones por semana) |
| H5 | Estudiante | Modificar o cancelar mi publicación sin perder el historial. | Publicación, Mi actividad | Historial |
| H6 | Estudiante | Comentar una publicación. | Publicación | P2 |
| H7 | Estudiante | Reportar una publicación indicando el motivo. | Publicación (diálogo) | P3 |
| H8 | Estudiante | Ver qué resolvió la Comisión sobre lo mío y apelar. | Mi actividad | P3 (reversión) |
| H9 | Comisión | Resolver reportes: descartar, borrar, borrar con suspensión de 3 días o derivar al docente asesor. | Moderación | P3 |
| H10 | Comisión | Resolver apelaciones: mantener o revertir. | Moderación | P3 |
| H11 | Comisión | Consultar el historial con filtros. | Historial | P3 |
| H12 | Comisión | Ver indicadores (cuentas activas, reportes, reversión con semáforo). | Estadísticas | KPI 3 |
| H13 | Administrador | Cambiar el rol de una cuenta. | Cuentas y roles | Operación |

## Fuera de la v1

Imágenes y adjuntos, mensajes privados, notificaciones, moderación de comentarios, carga de matrícula y costos, grilla de turnos de moderación, recuperación de contraseña propia, edición de comentarios, filtros por año del autor.

## Recorrido de uso

Invitado: Inicio → Tablón → Publicación → (Ingresar para participar).
Estudiante: Inicio → Publicar → Publicación creada → Mi actividad → Apelar si corresponde.
Comisión: Moderación → Resolver reporte (confirmación) → Historial → Estadísticas.
Administrador: Cuentas y roles.

## Mapa de pantallas y rutas

| Ruta | Pantalla | Quién entra |
|---|---|---|
| `/` | Inicio (tablones y últimas publicaciones) | Todos |
| `/t/:slug` | Tablón con búsqueda, orden y paginación | Todos |
| `/p/:id` | Publicación, comentarios, reportar | Todos (acciones según rol) |
| `/nueva`, `/p/:id/editar` | Formulario de publicación | Estudiante, Comisión, Admin |
| `/mi-actividad` | Mis publicaciones y moderación de lo mío | Estudiante, Comisión, Admin |
| `/moderacion` | Reportes y apelaciones pendientes | Comisión, Admin |
| `/moderacion/historial` | Historial con filtros | Comisión, Admin |
| `/estadisticas` | Indicadores | Comisión, Admin |
| `/usuarios` | Cuentas y roles | Admin |
| `/ingresar`, `/registro` | Autenticación | Todos |
| `/acerca` | Qué incluye y qué está simulado | Todos |
