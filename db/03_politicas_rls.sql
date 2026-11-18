-- 4TEChan · 03 Seguridad a nivel de filas (RLS) y permisos por rol
-- Roles: invitado (anon, solo lectura) · estudiante · moderador · admin.

alter table public.profiles    enable row level security;
alter table public.boards      enable row level security;
alter table public.posts       enable row level security;
alter table public.comments    enable row level security;
alter table public.reports     enable row level security;
alter table public.resolutions enable row level security;
alter table public.appeals     enable row level security;

-- Permisos de tabla mínimos (RLS decide además qué filas).
revoke all on all tables in schema public from anon, authenticated;
grant select on public.boards, public.posts, public.comments to anon;
grant select on public.profiles, public.boards, public.posts, public.comments,
                public.reports, public.resolutions, public.appeals to authenticated;
grant insert on public.posts, public.comments, public.reports to authenticated;
grant update (titulo, cuerpo, estado) on public.posts to authenticated;
grant update (estado) on public.comments to authenticated;
grant update (rol) on public.profiles to authenticated;

-- profiles: cada cuenta ve la suya; la Comisión ve todas; solo admin cambia roles.
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.es_moderador());
create policy profiles_update_admin on public.profiles for update to authenticated
  using (public.es_admin()) with check (public.es_admin());

-- boards: lectura abierta.
create policy boards_select on public.boards for select to anon, authenticated using (activo);

-- posts: lo publicado lo ve cualquiera; lo borrado, solo su autor y la Comisión.
create policy posts_select on public.posts for select to anon, authenticated
  using (estado = 'publicado' or author_id = auth.uid() or public.es_moderador());
create policy posts_insert on public.posts for insert to authenticated
  with check (author_id = auth.uid() and not public.esta_baneado());
create policy posts_update_autor on public.posts for update to authenticated
  using (author_id = auth.uid() and estado = 'publicado')
  with check (author_id = auth.uid());

-- comments
create policy comments_select on public.comments for select to anon, authenticated
  using (estado = 'publicado' or author_id = auth.uid() or public.es_moderador());
create policy comments_insert on public.comments for insert to authenticated
  with check (author_id = auth.uid() and not public.esta_baneado()
              and exists (select 1 from public.posts p where p.id = post_id and p.estado = 'publicado'));
create policy comments_update_autor on public.comments for update to authenticated
  using (author_id = auth.uid() and estado = 'publicado') with check (author_id = auth.uid());

-- reports: quien reporta ve los suyos; la Comisión ve todos. No se puede reportar lo propio.
create policy reports_select on public.reports for select to authenticated
  using (reporter_id = auth.uid() or public.es_moderador());
create policy reports_insert on public.reports for insert to authenticated
  with check (reporter_id = auth.uid() and not public.esta_baneado()
              and exists (select 1 from public.posts p
                           where p.id = post_id and p.estado = 'publicado' and p.author_id <> auth.uid()));

-- resolutions y appeals: solo se escriben con las funciones de 02_funciones.sql.
create policy resolutions_select on public.resolutions for select to authenticated
  using (public.es_moderador());
create policy appeals_select on public.appeals for select to authenticated
  using (apelante_id = auth.uid() or public.es_moderador());
