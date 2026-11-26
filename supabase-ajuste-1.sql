-- Viver Inteira · AJUSTE 1 (rodar uma vez, depois do supabase.sql)
-- Motivo: o Supabase é o mesmo do app dos 50 dias. A trava "só compradoras" passa a valer
-- apenas para quem se cadastra pelo Viver Inteira, e os dados do Viver Inteira só abrem para compradoras ativas.

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
