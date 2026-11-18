-- 4TEChan · 02 Funciones, disparadores y operaciones de moderación (RPC)
-- Las operaciones de la Comisión pasan por funciones (security definer) que validan el rol
-- dentro de la base, así el permiso no depende de la interfaz.

-- ---------- Ayudas de permisos ----------
create or replace function public.es_moderador() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select rol in ('moderador', 'admin') from public.profiles where id = auth.uid()), false)
$$;

create or replace function public.es_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select rol = 'admin' from public.profiles where id = auth.uid()), false)
$$;

create or replace function public.esta_baneado() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select ban_hasta > now() from public.profiles where id = auth.uid()), false)
$$;

-- El alias se consulta antes de registrarse (sin exponer el resto del perfil).
create or replace function public.alias_disponible(p_alias text) returns boolean
language sql stable security definer set search_path = public as $$
  select not exists (select 1 from public.profiles where lower(alias) = lower(p_alias))
$$;

-- ---------- Alta de perfil al registrarse ----------
-- El rol siempre arranca como 'estudiante': nunca se toma de lo que envía el cliente.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_alias text;
  v_anio smallint;
  v_esp text;
begin
  v_alias := coalesce(nullif(m ->> 'alias', ''), 'anon_' || substr(replace(new.id::text, '-', ''), 1, 8));
  v_anio  := case when (m ->> 'anio') ~ '^[1-7]$' then (m ->> 'anio')::smallint else 1 end;
  v_esp   := case when v_anio >= 4 then nullif(m ->> 'especialidad', '') else null end;
  insert into public.profiles (id, alias, anio, especialidad, es_simulado)
  values (new.id, v_alias, v_anio, v_esp, coalesce(new.email, '') like '%@simulado.invalid');
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- ---------- Disparadores de protección ----------
-- Cuando escribe el cliente (rol authenticated/anon) se fuerzan los campos sensibles.
-- Las funciones de moderación corren como dueño de la función y quedan fuera de esa restricción.

create or replace function public.profiles_guard() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user in ('authenticated', 'anon') then
    new.id := old.id; new.alias := old.alias; new.anio := old.anio; new.especialidad := old.especialidad;
    new.ban_hasta := old.ban_hasta; new.es_simulado := old.es_simulado; new.created_at := old.created_at;
    -- solo cambia 'rol', y la política ya exige que quien escribe sea admin
  end if;
  return new;
end $$;
create trigger profiles_guard before update on public.profiles
  for each row execute function public.profiles_guard();

create or replace function public.posts_before_insert() returns trigger
language plpgsql set search_path = public as $$
begin
  select alias into new.autor_alias from public.profiles where id = new.author_id;
  if current_user in ('authenticated', 'anon') then
    new.estado := 'publicado'; new.borrado_por := null; new.es_simulado := false;
    new.created_at := now(); new.updated_at := now();
  end if;
  return new;
end $$;
create trigger posts_before_insert before insert on public.posts
  for each row execute function public.posts_before_insert();

create or replace function public.posts_before_update() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user in ('authenticated', 'anon') then
    new.board_id := old.board_id; new.author_id := old.author_id; new.autor_alias := old.autor_alias;
    new.es_simulado := old.es_simulado; new.created_at := old.created_at;
    if new.estado is distinct from old.estado then
      if old.estado = 'publicado' and new.estado = 'borrado' then
        new.borrado_por := 'autor';       -- el autor cancela su publicación
      else
        raise exception 'Cambio de estado no permitido.' using errcode = '42501';
      end if;
    else
      new.borrado_por := old.borrado_por;
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger posts_before_update before update on public.posts
  for each row execute function public.posts_before_update();

create or replace function public.comments_before_insert() returns trigger
language plpgsql set search_path = public as $$
begin
  select alias into new.autor_alias from public.profiles where id = new.author_id;
  if current_user in ('authenticated', 'anon') then
    new.estado := 'publicado'; new.es_simulado := false; new.created_at := now();
  end if;
  return new;
end $$;
create trigger comments_before_insert before insert on public.comments
  for each row execute function public.comments_before_insert();

create or replace function public.comments_before_update() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user in ('authenticated', 'anon') then
    new.post_id := old.post_id; new.author_id := old.author_id; new.autor_alias := old.autor_alias;
    new.cuerpo := old.cuerpo; new.es_simulado := old.es_simulado; new.created_at := old.created_at;
    if not (old.estado = 'publicado' and new.estado = 'borrado') then
      raise exception 'Cambio de estado no permitido.' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;
create trigger comments_before_update before update on public.comments
  for each row execute function public.comments_before_update();

create or replace function public.reports_before_insert() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user in ('authenticated', 'anon') then
    new.estado := 'pendiente'; new.es_simulado := false; new.created_at := now();
  end if;
  return new;
end $$;
create trigger reports_before_insert before insert on public.reports
  for each row execute function public.reports_before_insert();

-- ---------- Moderación ----------
create or replace function public.resolver_reporte(p_report_id bigint, p_resultado text, p_nota text default null)
returns bigint language plpgsql security definer set search_path = public as $$
declare
  v_report public.reports;
  v_author uuid;
  v_res bigint;
begin
  if not public.es_moderador() then
    raise exception 'Solo la Comisión de Normas y Convivencia puede resolver reportes.' using errcode = '42501';
  end if;
  if p_resultado not in ('descartado', 'post_borrado', 'borrado_ban_3d', 'derivado_asesor') then
    raise exception 'Resultado no permitido.' using errcode = '22023';
  end if;
  if char_length(coalesce(p_nota, '')) > 500 then
    raise exception 'La nota no puede superar 500 caracteres.' using errcode = '22023';
  end if;
  select * into v_report from public.reports where id = p_report_id for update;
  if not found then raise exception 'El reporte no existe.' using errcode = 'P0002'; end if;
  if v_report.estado <> 'pendiente' then
    raise exception 'El reporte ya fue resuelto.' using errcode = 'P0001';
  end if;

  insert into public.resolutions (report_id, moderator_id, resultado, nota)
  values (p_report_id, auth.uid(), p_resultado, nullif(btrim(p_nota), ''))
  returning id into v_res;
  update public.reports set estado = 'resuelto' where id = p_report_id;

  if p_resultado in ('post_borrado', 'borrado_ban_3d') then
    update public.posts set estado = 'borrado', borrado_por = 'moderacion'
     where id = v_report.post_id and estado = 'publicado';
  end if;
  if p_resultado = 'borrado_ban_3d' then
    select author_id into v_author from public.posts where id = v_report.post_id;
    update public.profiles set ban_hasta = now() + interval '3 days' where id = v_author;
  end if;
  return v_res;
end $$;

create or replace function public.apelar(p_resolution_id bigint, p_texto text)
returns bigint language plpgsql security definer set search_path = public as $$
declare
  v_author uuid; v_resultado text; v_id bigint;
begin
  if auth.uid() is null then
    raise exception 'Tenés que iniciar sesión.' using errcode = '42501';
  end if;
  select p.author_id, res.resultado into v_author, v_resultado
    from public.resolutions res
    join public.reports rep on rep.id = res.report_id
    join public.posts p on p.id = rep.post_id
   where res.id = p_resolution_id;
  if not found then raise exception 'La resolución no existe.' using errcode = 'P0002'; end if;
  if v_author <> auth.uid() then
    raise exception 'Solo el autor de la publicación puede apelar.' using errcode = '42501';
  end if;
  if v_resultado = 'descartado' then
    raise exception 'Esa resolución descartó el reporte: no hay nada que apelar.' using errcode = 'P0001';
  end if;
  if char_length(btrim(coalesce(p_texto, ''))) < 10 or char_length(p_texto) > 500 then
    raise exception 'La apelación debe tener entre 10 y 500 caracteres.' using errcode = '22023';
  end if;
  if exists (select 1 from public.appeals where resolution_id = p_resolution_id) then
    raise exception 'Ya apelaste esta resolución.' using errcode = 'P0001';
  end if;
  insert into public.appeals (resolution_id, apelante_id, texto)
  values (p_resolution_id, auth.uid(), btrim(p_texto)) returning id into v_id;
  return v_id;
end $$;

create or replace function public.resolver_apelacion(p_appeal_id bigint, p_decision text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_app public.appeals; v_res public.resolutions; v_post bigint; v_author uuid;
begin
  if not public.es_moderador() then
    raise exception 'Solo la Comisión de Normas y Convivencia puede resolver apelaciones.' using errcode = '42501';
  end if;
  if p_decision not in ('mantenida', 'revertida') then
    raise exception 'Decisión no permitida.' using errcode = '22023';
  end if;
  select * into v_app from public.appeals where id = p_appeal_id for update;
  if not found then raise exception 'La apelación no existe.' using errcode = 'P0002'; end if;
  if v_app.estado <> 'pendiente' then
    raise exception 'La apelación ya fue resuelta.' using errcode = 'P0001';
  end if;
  update public.appeals
     set estado = p_decision, resuelta_por = auth.uid(), resolved_at = now()
   where id = p_appeal_id;
  if p_decision = 'revertida' then
    select * into v_res from public.resolutions where id = v_app.resolution_id;
    select p.id, p.author_id into v_post, v_author
      from public.reports rep join public.posts p on p.id = rep.post_id where rep.id = v_res.report_id;
    update public.posts set estado = 'publicado', borrado_por = null
     where id = v_post and borrado_por = 'moderacion';
    if v_res.resultado = 'borrado_ban_3d' then
      update public.profiles set ban_hasta = null where id = v_author;
    end if;
  end if;
end $$;

-- Lo que ve un estudiante sobre la moderación de SUS publicaciones.
create or replace function public.mis_resoluciones()
returns table (resolution_id bigint, post_id bigint, post_titulo text, resultado text, nota text,
               created_at timestamptz, apelacion_id bigint, apelacion_estado text, apelacion_texto text)
language sql stable security definer set search_path = public as $$
  select res.id, p.id, p.titulo, res.resultado, res.nota, res.created_at,
         a.id, a.estado, a.texto
    from public.resolutions res
    join public.reports rep on rep.id = res.report_id
    join public.posts p on p.id = rep.post_id
    left join public.appeals a on a.resolution_id = res.id
   where p.author_id = auth.uid()
   order by res.created_at desc
$$;

-- Indicadores para el tablero (KPI de la actividad anterior). Solo la Comisión.
create or replace function public.estadisticas() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare r jsonb;
begin
  if not public.es_moderador() then
    raise exception 'Solo la Comisión de Normas y Convivencia puede ver las estadísticas.' using errcode = '42501';
  end if;
  select jsonb_build_object(
    'publicaciones_por_semana', coalesce((
      select jsonb_agg(jsonb_build_object('semana', s, 'total', c) order by s)
        from (select date_trunc('week', created_at)::date s, count(*) c from public.posts
               where created_at >= now() - interval '8 weeks' group by 1) q), '[]'::jsonb),
    'cuentas_activas_semana', (select count(distinct author_id) from public.posts
                                where created_at >= now() - interval '7 days'),
    'cuentas_registradas', (select count(*) from public.profiles where rol = 'estudiante'),
    'activas_por_anio', coalesce((
      select jsonb_agg(jsonb_build_object('anio', anio, 'cuentas', c) order by anio)
        from (select pr.anio, count(distinct p.author_id) c from public.posts p
                join public.profiles pr on pr.id = p.author_id
               where p.created_at >= now() - interval '7 days' group by 1) q), '[]'::jsonb),
    'reportes_pendientes', (select count(*) from public.reports where estado = 'pendiente'),
    'reportes_30d', (select count(*) from public.reports where created_at >= now() - interval '30 days'),
    'resoluciones_30d', (select count(*) from public.resolutions where created_at >= now() - interval '30 days'),
    'apeladas_30d', (select count(*) from public.appeals a join public.resolutions r on r.id = a.resolution_id
                      where r.created_at >= now() - interval '30 days'),
    'revertidas_30d', (select count(*) from public.appeals a join public.resolutions r on r.id = a.resolution_id
                        where a.estado = 'revertida' and r.created_at >= now() - interval '30 days')
  ) into r;
  return r;
end $$;

-- Permisos de ejecución: las funciones de escritura solo para usuarios con sesión.
revoke all on function public.resolver_reporte(bigint, text, text) from public, anon;
revoke all on function public.apelar(bigint, text) from public, anon;
revoke all on function public.resolver_apelacion(bigint, text) from public, anon;
revoke all on function public.mis_resoluciones() from public, anon;
revoke all on function public.estadisticas() from public, anon;
grant execute on function public.resolver_reporte(bigint, text, text) to authenticated;
grant execute on function public.apelar(bigint, text) to authenticated;
grant execute on function public.resolver_apelacion(bigint, text) to authenticated;
grant execute on function public.mis_resoluciones() to authenticated;
grant execute on function public.estadisticas() to authenticated;
grant execute on function public.es_moderador(), public.es_admin(), public.esta_baneado() to anon, authenticated;
grant execute on function public.alias_disponible(text) to anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
