#!/usr/bin/env python3
"""Genera los datos de prueba (SIMULADOS) de 4TEChan.
Salidas: db/04_seed_simulado.sql (Supabase) y src/data/seed.json (modo demo).
Es determinístico: siempre produce los mismos datos. Uso: python3 tools/gen_seed.py
No hay nombres reales: las cuentas son códigos (sim_01, mod_01...)."""
import json, random, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
random.seed(4)

def uid(n): return f"00000000-0000-4000-8000-{n:012d}"

BOARDS = ["prog", "taller", "compraventa", "eventos", "consultas"]
ESP = ["Programación", "Electrónica", "Electromecánica"]  # supuesto: ajustar a las especialidades reales

# ---- perfiles ----
anios = [1,1,1,1,2,2,2,3,3,3,4,4,5,5,6,6,7,7,7]
profiles = []
for i, a in enumerate(anios, start=1):
    profiles.append(dict(id=uid(i), alias=f"sim_{i:02d}", anio=a,
        especialidad=ESP[i % 3] if a >= 4 else None, rol="estudiante", created_h=random.randint(1500, 3000)))
for k in range(1, 6):
    profiles.append(dict(id=uid(19 + k), alias=f"mod_{k:02d}", anio=random.choice([5,6,7]),
        especialidad=ESP[k % 3], rol="moderador", created_h=random.randint(1500, 3000)))
profiles.append(dict(id=uid(25), alias="admin_sim", anio=7, especialidad=ESP[0], rol="admin", created_h=3200))
ALIAS = {p["id"]: p["alias"] for p in profiles}
def sim(n): return uid(n)

# ---- publicaciones: (tablón, título, cuerpo) ----
P = [
("prog","Apuntes de árboles binarios (Programación 3)","Subo el resumen de la clase: recorridos inorden, preorden y postorden con ejemplos en JavaScript."),
("prog","¿Alguien tiene el TP de bases de datos?","Me falta la consigna del trabajo práctico de consultas SQL. ¿Me la pasan por acá?"),
("prog","Error en Vue: Cannot read properties of undefined","Me aparece al renderizar una lista antes de que lleguen los datos. ¿Se soluciona con v-if?"),
("prog","Editor recomendado para practicar C++","¿Qué editor liviano usan en las netbooks de la escuela? El que tengo anda muy lento."),
("prog","Grupo de estudio para el parcial de algoritmos","Armamos un grupo los martes en la biblioteca. Pueden sumarse de cualquier división."),
("prog","Guía de Git para el proyecto integrador","Dejo una guía corta con commit, branch y merge, pensada para trabajar en equipo."),
("prog","¿Cómo conectar un formulario con Supabase?","Ya tengo el formulario en Vue y necesito guardar los datos. ¿Por dónde empiezo?"),
("prog","Ejercicios resueltos de recursividad","Hice la resolución de los ejercicios 1 al 8 de la guía. Revisen si ven errores."),
("prog","Se cayó la red del laboratorio","Desde la primera hora no conecta ninguna máquina del laboratorio 2. ¿Pasa lo mismo en otras aulas?"),
("prog","Bibliotecas de gráficos para JavaScript","Busco una librería simple para hacer gráficos de barras en la feria de ciencias."),
("taller","Aviso: taller cerrado el jueves","Por tareas de mantenimiento el taller no abre el jueves. Se retoma el viernes en el horario habitual."),
("taller","Se perdió una llave inglesa de 14 mm","La dejé en el banco 3 después de la práctica. Si la encuentran avisen por acá."),
("taller","Guía de soldadura con estaño","Resumen con temperaturas, tipos de punta y errores comunes. Pensado para primer año de taller."),
("taller","¿Quién tiene el plano del proyecto de tercer año?","Necesito la hoja 2 del plano para terminar el soporte. La mía se mojó."),
("taller","Se necesitan voluntarios para ordenar el pañol","Sábado a la mañana. Se entrega certificado de horas solidarias."),
("taller","Normas de seguridad: lentes obligatorios","Recordatorio: no se puede usar ninguna máquina sin lentes y calzado cerrado."),
("taller","Sobran resistencias de 220 ohm","Tengo una bolsa de resistencias de más. Las dejo en el pañol para quien las necesite."),
("taller","Torno fuera de servicio","El torno 2 tiene una falla en el husillo. No usarlo hasta que lo revisen."),
("compraventa","Vendo calculadora científica","Casi sin uso, con funda. Se puede ver en el recreo largo. Consultar precio por acá."),
("compraventa","Compro tester digital","Busco un tester usado en buen estado para electrónica. Pago razonable."),
("compraventa","Vendo apuntes encuadernados de Física","Tengo los apuntes completos del año pasado, anillados y ordenados por unidad."),
("compraventa","Vendo placa Arduino con cables","Incluye cables y protoboard. La usé en un solo proyecto. Cambio por otra cosa también."),
("compraventa","Busco mochila resistente","Que tenga lugar para una netbook de 14 pulgadas. Acepto usada."),
("compraventa","Vendo guardapolvo talle M","Muy buen estado, lavado. Retiro por la escuela."),
("compraventa","Intercambio libros de matemática","Cambio un libro de álgebra por uno de análisis. Misma editorial."),
("eventos","Muestra de proyectos técnicos: fecha y lugar","Se hará en el patio cubierto. Cada curso debe confirmar su stand antes del viernes."),
("eventos","Torneo de fútbol interdivisión","Inscripción por curso en la preceptoría. Los partidos son en los recreos largos."),
("eventos","Charla de egresados sobre trabajo en tecnología","Participan tres egresados de distintas especialidades. Entrada libre."),
("eventos","Feria de ciencias: inscripción abierta","Pueden presentarse proyectos individuales o grupales. Hay categorías por ciclo."),
("eventos","Maratón de programación escolar","Equipos de tres. Se resuelven problemas en 3 horas. Traer netbook."),
("eventos","Jornada de limpieza del patio","Participan todos los cursos de la mañana. Traer guantes si tienen."),
("eventos","Acto del aniversario de la escuela","Ensayo general el miércoles a la tarde. Participan 1° y 2° año."),
("eventos","Visita a una planta industrial","Para 6° y 7° año. Hay que entregar la autorización firmada."),
("consultas","¿Cuándo se entregan los boletines?","¿Alguien sabe la fecha? En preceptoría no me supieron decir."),
("consultas","¿Hay clases mañana?","Escuché que cortan la luz en la zona. ¿Confirmaron algo?"),
("consultas","Fechas de mesas de examen","¿Dónde se publica el calendario de mesas de diciembre?"),
("consultas","¿Cómo pido un certificado de alumno regular?","Lo necesito para un trámite. ¿Se pide en secretaría o en preceptoría?"),
("consultas","Horario del buffet","¿Hasta qué hora atiende el buffet en el turno tarde?"),
("consultas","Cambio de división: ¿se puede?","Mi división tiene el taller a contraturno y me complica. ¿Hay forma de cambiar?"),
("consultas","¿Quién es el docente asesor de la cooperativa?","Quiero sumarme a la cooperativa y no sé con quién hablar."),
("consultas","Uso de celulares en clase","¿Hay una regla general o cada profesor decide?"),
]
# (post, reporter, motivo, detalle, report_h, resultado, nota, mod, res_h, apelación)
R = [
(19, 3,"spam",None,700,"descartado","Es una venta normal, cumple las reglas.",1,690,None),
(20, 9,"compraventa_prohibida","Pide pagos por fuera de la escuela.",640,"post_borrado","Se pedían pagos adelantados.",2,630,("mantenida","Pido que revisen, era un precio normal.",600,580)),
(23,12,"otro","Publica datos personales de otra persona en el texto.",600,"borrado_ban_3d","Datos personales de terceros.",3,590,("revertida","Los datos eran míos, no de otra persona.",570,540)),
(4,  2,"contenido_inapropiado",None,560,"descartado","El contenido es adecuado.",1,555,None),
(36,14,"acoso","Se burla de un docente con nombre y apellido.",500,"post_borrado","Referencias a una persona concreta.",4,490,None),
(8,  5,"spam",None,450,"descartado",None,5,440,None),
(31,17,"otro","Incita a faltar a la maratón y insulta a organizadores.",400,"derivado_asesor","Se deriva para hablar con las partes.",2,390,None),
(22, 7,"compraventa_prohibida","Ofrece un artículo que no se puede vender en la escuela.",300,"post_borrado","Artículo no permitido.",1,290,("pendiente","Era un juego de mesa, no entiendo por qué no se puede.",250,None)),
(40, 1,"acoso","Insultos hacia otro estudiante en los comentarios.",120,"borrado_ban_3d","Insultos reiterados.",3,50,None),
(14,11,"spam",None,90,"descartado","No es spam.",3,60,None),
(27, 4,"contenido_inapropiado","Tiene una imagen que no corresponde.",70,None,None,None,None,None),
(12,16,"otro","El aviso parece falso, el taller no cerró ese día.",40,None,None,None,None,None),
(38, 8,"acoso","Comentarios hirientes sobre un compañero.",30,None,None,None,None,None),
(5, 10,"spam",None,20,None,None,None,None,None),
(21,13,"compraventa_prohibida","Vende algo que no es suyo.",12,None,None,None,None,None),
(33,18,"contenido_inapropiado",None,5,None,None,None,None,None),
]
FIXED_AUTHOR = {20: 6, 23: 15, 22: 19, 36: 13, 40: 16}
BORRADO_AUTOR = {6, 16, 29}
reported_by = {}
for r in R: reported_by.setdefault(r[0], []).append(r)

students = list(range(1, 20))
posts = []
for i, (b, t, c) in enumerate(P, start=1):
    a = FIXED_AUTHOR.get(i, random.choice(students))
    while any(r[1] == a for r in reported_by.get(i, [])):
        a = random.choice(students)
    h = random.randint(30, 1300)
    if i in reported_by:
        h = max(h, max(r[4] for r in reported_by[i]) + 20)
    posts.append(dict(id=i, board=b, author_id=sim(a), autor_alias=f"sim_{a:02d}", titulo=t, cuerpo=c,
                      estado="publicado", borrado_por=None, created_h=h))
mods = {r[0] for r in R if r[5] in ("post_borrado", "borrado_ban_3d")}
for p in posts:
    if p["id"] in mods:
        p["estado"], p["borrado_por"] = "borrado", "moderacion"
    if p["id"] in BORRADO_AUTOR:
        p["estado"], p["borrado_por"] = "borrado", "autor"
# el borrado de la resolución 3 se revirtió tras la apelación
posts[23 - 1]["estado"], posts[23 - 1]["borrado_por"] = "publicado", None

CM = ["Gracias por compartirlo.","Yo tengo lo mismo, te escribo por acá.","Confirmado, pasó igual en mi curso.",
      "¿Podés subir una foto?","Sirve, lo pruebo y cuento.","Creo que lo publican en la puerta de preceptoría.",
      "Me interesa, ¿sigue disponible?","Excelente aporte para el parcial.","No me funcionó, ¿qué versión usás?",
      "Lo vi en el pasillo, es para la semana próxima."]
comments = []
pub = [p for p in posts if p["estado"] == "publicado"]
for n in range(1, 31):
    p = random.choice(pub)
    a = random.choice(students)
    comments.append(dict(id=n, post_id=p["id"], author_id=sim(a), autor_alias=f"sim_{a:02d}",
                         cuerpo=random.choice(CM), estado="publicado",
                         created_h=max(1, p["created_h"] - random.randint(1, max(1, min(p["created_h"] - 1, 200))))))

reports, resolutions, appeals = [], [], []
for n, (post, rep, motivo, det, rh, res, nota, mod, resh, ap) in enumerate(R, start=1):
    reports.append(dict(id=n, post_id=post, reporter_id=sim(rep), motivo=motivo, detalle=det,
                        estado="resuelto" if res else "pendiente", created_h=rh))
    if res:
        resolutions.append(dict(id=n, report_id=n, moderator_id=sim(19 + mod), resultado=res, nota=nota, created_h=resh))
        if ap:
            est, txt, ach, rsh = ap
            author = [p for p in posts if p["id"] == post][0]["author_id"]
            appeals.append(dict(id=len(appeals) + 1, resolution_id=n, apelante_id=author, texto=txt, estado=est,
                                resuelta_por=sim(19 + (mod % 5) + 1) if est != "pendiente" else None,
                                created_h=ach, resolved_h=rsh))

ban = {sim(16): 22}  # horas restantes de la sanción vigente (resolución 9)

boards = [dict(slug=s) for s in BOARDS]
json.dump(dict(profiles=profiles, posts=posts, comments=comments, reports=reports, resolutions=resolutions,
               appeals=appeals, ban_in_h=ban), open(ROOT / "src/data/seed.json", "w"), ensure_ascii=False, indent=1)

# ---------------- SQL ----------------
def q(v):
    if v is None: return "null"
    return "'" + str(v).replace("'", "''") + "'"
def ts(h): return "null" if h is None else f"now() - interval '{h} hours'"

L = ["-- 4TEChan · 04 Datos de prueba (SIMULADOS). Generado por tools/gen_seed.py: no editar a mano.",
     "-- Todos los registros llevan es_simulado = true. Las cuentas son códigos, sin nombres reales,",
     "-- y no tienen contraseña: no se puede iniciar sesión con ellas.", ""]
L.append("insert into auth.users (instance_id, id, aud, role, email, raw_user_meta_data, email_confirmed_at, created_at, updated_at) values")
rows = []
for p in profiles:
    meta = json.dumps(dict(alias=p["alias"], anio=str(p["anio"]), especialidad=p["especialidad"] or ""), ensure_ascii=False)
    rows.append(f"  ('00000000-0000-0000-0000-000000000000', '{p['id']}', 'authenticated', 'authenticated', "
                f"'{p['alias']}@simulado.invalid', {q(meta)}::jsonb, now(), now(), now())")
L.append(",\n".join(rows) + ";")
L.append("update auth.users set confirmation_token = '', recovery_token = '', email_change = '', email_change_token_new = '', email_change_token_current = ''")
L.append(" where email like '%@simulado.invalid';")
L.append("")
for p in profiles:
    L.append(f"update public.profiles set rol = {q(p['rol'])}, created_at = {ts(p['created_h'])} where id = '{p['id']}';")
L.append("")
L.append("insert into public.posts (id, board_id, author_id, autor_alias, titulo, cuerpo, estado, borrado_por, es_simulado, created_at, updated_at) values")
L.append(",\n".join(
    f"  ({p['id']}, (select id from public.boards where slug = {q(p['board'])}), '{p['author_id']}', {q(p['autor_alias'])}, "
    f"{q(p['titulo'])}, {q(p['cuerpo'])}, {q(p['estado'])}, {q(p['borrado_por'])}, true, {ts(p['created_h'])}, {ts(p['created_h'])})"
    for p in posts) + ";")
L.append("")
L.append("insert into public.comments (id, post_id, author_id, autor_alias, cuerpo, estado, es_simulado, created_at) values")
L.append(",\n".join(f"  ({c['id']}, {c['post_id']}, '{c['author_id']}', {q(c['autor_alias'])}, {q(c['cuerpo'])}, 'publicado', true, {ts(c['created_h'])})" for c in comments) + ";")
L.append("")
L.append("insert into public.reports (id, post_id, reporter_id, motivo, detalle, estado, es_simulado, created_at) values")
L.append(",\n".join(f"  ({r['id']}, {r['post_id']}, '{r['reporter_id']}', {q(r['motivo'])}, {q(r['detalle'])}, {q(r['estado'])}, true, {ts(r['created_h'])})" for r in reports) + ";")
L.append("")
L.append("insert into public.resolutions (id, report_id, moderator_id, resultado, nota, es_simulado, created_at) values")
L.append(",\n".join(f"  ({r['id']}, {r['report_id']}, '{r['moderator_id']}', {q(r['resultado'])}, {q(r['nota'])}, true, {ts(r['created_h'])})" for r in resolutions) + ";")
L.append("")
L.append("insert into public.appeals (id, resolution_id, apelante_id, texto, estado, resuelta_por, es_simulado, created_at, resolved_at) values")
L.append(",\n".join(
    f"  ({a['id']}, {a['resolution_id']}, '{a['apelante_id']}', {q(a['texto'])}, {q(a['estado'])}, "
    f"{q(a['resuelta_por'])}, true, {ts(a['created_h'])}, {ts(a['resolved_h'])})" for a in appeals) + ";")
L.append("")
for uidv, h in ban.items():
    L.append(f"update public.profiles set ban_hasta = now() + interval '{h} hours' where id = '{uidv}';")
L.append("")
for t in ("posts", "comments", "reports", "resolutions", "appeals"):
    L.append(f"select setval(pg_get_serial_sequence('public.{t}', 'id'), (select max(id) from public.{t}));")
(ROOT / "db/04_seed_simulado.sql").write_text("\n".join(L) + "\n")
print("posts", len(posts), "comments", len(comments), "reports", len(reports), "resolutions", len(resolutions), "appeals", len(appeals))
