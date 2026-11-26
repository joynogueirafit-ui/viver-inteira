-- Viver Inteira · rodar uma vez no Supabase: SQL Editor → New query → colar tudo → Run

-- 1) Planner de cada usuária (cada uma só vê a própria linha)
create table if not exists public.viver (
  user_id uuid primary key references auth.users(id) on delete cascade,
  dados jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.viver enable row level security;
drop policy if exists "ver o próprio planner" on public.viver;
drop policy if exists "criar o próprio planner" on public.viver;
drop policy if exists "editar o próprio planner" on public.viver;
create policy "ver o próprio planner" on public.viver for select using (auth.uid() = user_id);
create policy "criar o próprio planner" on public.viver for insert with check (auth.uid() = user_id);
create policy "editar o próprio planner" on public.viver for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
grant select, insert, update on public.viver to authenticated;

-- 2) Compradoras: a Hotmart avisa (função hotmart-webhook) e o e-mail entra aqui.
create table if not exists public.compradoras (
  email text primary key,
  status text not null default 'ativa',      -- ativa | cancelada | reembolsada
  validade date,                              -- fim do acesso (1 ano após a compra)
  transacao text,
  atualizado timestamptz not null default now()
);
alter table public.compradoras enable row level security;  -- ninguém lê pelo app

-- 3) Só quem comprou consegue criar conta (mesmo e-mail da Hotmart)
create or replace function public.so_compradoras() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.compradoras c
                 where lower(c.email) = lower(new.email) and c.status = 'ativa'
                   and (c.validade is null or c.validade >= current_date)) then
    raise exception 'compradora não encontrada';
  end if;
  return new;
end $$;
drop trigger if exists so_compradoras on auth.users;
create trigger so_compradoras before insert on auth.users for each row execute function public.so_compradoras();

-- 4) O app pergunta se o acesso ainda vale (para avisar da renovação)
create or replace function public.meu_acesso() returns json
language sql security definer set search_path = public as $$
  select json_build_object('status', c.status, 'validade', c.validade)
  from public.compradoras c where lower(c.email) = lower(auth.jwt() ->> 'email');
$$;
grant execute on function public.meu_acesso() to authenticated;

-- Para liberar alguém na mão (ex.: você mesma, para testar):
-- insert into public.compradoras (email, validade) values ('email@exemplo.com', current_date + 365);
