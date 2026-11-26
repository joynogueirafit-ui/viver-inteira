create table if not exists public.viver (
  user_id uuid primary key references auth.users(id) on delete cascade,
  dados jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.viver enable row level security;
grant select, insert, update on public.viver to authenticated;

create table if not exists public.compradoras (
  email text primary key,
  status text not null default 'ativa',
  validade date,
  transacao text,
  atualizado timestamptz not null default now()
);
alter table public.compradoras enable row level security;

create or replace function public.compradora_ativa(e text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.compradoras c
                 where lower(c.email) = lower(e) and c.status = 'ativa'
                   and (c.validade is null or c.validade >= current_date));
$$;

create or replace function public.so_compradoras() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(new.raw_user_meta_data ->> 'app', '') = 'viver' and not public.compradora_ativa(new.email) then
    raise exception 'compradora não encontrada';
  end if;
  return new;
end $$;
drop trigger if exists so_compradoras on auth.users;
create trigger so_compradoras before insert on auth.users for each row execute function public.so_compradoras();

drop policy if exists "ver o próprio planner" on public.viver;
drop policy if exists "criar o próprio planner" on public.viver;
drop policy if exists "editar o próprio planner" on public.viver;
create policy "ver o próprio planner" on public.viver for select
  using (auth.uid() = user_id and public.compradora_ativa(auth.jwt() ->> 'email'));
create policy "criar o próprio planner" on public.viver for insert
  with check (auth.uid() = user_id and public.compradora_ativa(auth.jwt() ->> 'email'));
create policy "editar o próprio planner" on public.viver for update
  using (auth.uid() = user_id and public.compradora_ativa(auth.jwt() ->> 'email'))
  with check (auth.uid() = user_id and public.compradora_ativa(auth.jwt() ->> 'email'));

create or replace function public.meu_acesso() returns json
language sql security definer set search_path = public as $$
  select json_build_object('status', c.status, 'validade', c.validade)
  from public.compradoras c where lower(c.email) = lower(auth.jwt() ->> 'email');
$$;
grant execute on function public.meu_acesso() to authenticated;
