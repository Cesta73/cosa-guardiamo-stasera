-- Eseguire una volta nel progetto Supabase dedicato a questa app.
-- Non contiene nomi, età, gusti o credenziali della famiglia.
begin;
create table public.cgs_family_archives (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null check (jsonb_typeof(data) = 'object' and data->>'version' = '1'),
  revision bigint not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now()
);
alter table public.cgs_family_archives enable row level security;
revoke all on public.cgs_family_archives from anon;
revoke all on public.cgs_family_archives from authenticated;
grant select, insert, update on public.cgs_family_archives to authenticated;
create policy "La famiglia legge il proprio archivio" on public.cgs_family_archives
  for select to authenticated using ((select auth.uid()) = owner_id);
create policy "La famiglia crea il proprio archivio" on public.cgs_family_archives
  for insert to authenticated with check ((select auth.uid()) = owner_id and revision = 0);
create policy "La famiglia aggiorna il proprio archivio" on public.cgs_family_archives
  for update to authenticated using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create function public.cgs_check_archive_revision() returns trigger language plpgsql
set search_path = '' as $$
begin
  if new.owner_id <> old.owner_id or new.revision <> old.revision + 1 then
    raise exception 'Revisione non valida';
  end if;
  new.updated_at := now();
  return new;
end;
$$;
create trigger check_archive_revision before update on public.cgs_family_archives
for each row execute function public.cgs_check_archive_revision();
commit;
