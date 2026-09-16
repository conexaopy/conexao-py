alter table public.orders
add column if not exists coupon_consumed boolean not null default false;


-- =========================================================
-- RESERVA DE ESTOQUE + CONSUMO DO CUPOM
-- Usada na criação inicial do pedido.
-- Tudo ocorre na mesma transação.
-- =========================================================

create or replace function public.reserve_order_stock(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reserved boolean;
  v_status text;
  v_coupon_id uuid;
  v_coupon_consumed boolean;
  item record;
begin
  select
    stock_reserved,
    status,
    coupon_id,
    coupon_consumed
  into
    v_reserved,
    v_status,
    v_coupon_id,
    v_coupon_consumed
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Pedido não encontrado.';
  end if;

  if v_status = 'CANCELADO' then
    raise exception 'Não é possível reservar estoque de um pedido cancelado.';
  end if;

  if not v_reserved then
    for item in
      select product_id, quantity
      from public.order_items
      where order_id = p_order_id
    loop
      if item.product_id is null then
        raise exception 'Item do pedido sem produto vinculado.';
      end if;

      update public.products
      set stock_quantity = stock_quantity - item.quantity
      where id = item.product_id
        and stock_quantity >= item.quantity;

      if not found then
        raise exception 'Estoque insuficiente para um ou mais produtos.';
      end if;
    end loop;
  end if;

  if v_coupon_id is not null and not v_coupon_consumed then
    update public.coupons
    set
      used_count = used_count + 1,
      updated_at = now()
    where id = v_coupon_id
      and active = true
      and (starts_at is null or starts_at <= now())
      and (expires_at is null or expires_at >= now())
      and (usage_limit is null or used_count < usage_limit);

    if not found then
      raise exception 'Cupom indisponível ou limite de utilizações atingido.';
    end if;

    v_coupon_consumed := true;
  end if;

  update public.orders
  set
    stock_reserved = true,
    coupon_consumed = v_coupon_consumed
  where id = p_order_id;
end;
$$;


-- =========================================================
-- CANCELAMENTO ATÔMICO
-- Devolve estoque + libera cupom + cancela pedido.
-- =========================================================

create or replace function public.cancel_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reserved boolean;
  v_coupon_id uuid;
  v_coupon_consumed boolean;
  item record;
begin
  select
    stock_reserved,
    coupon_id,
    coupon_consumed
  into
    v_reserved,
    v_coupon_id,
    v_coupon_consumed
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Pedido não encontrado.';
  end if;

  if v_reserved then
    for item in
      select product_id, quantity
      from public.order_items
      where order_id = p_order_id
    loop
      if item.product_id is not null then
        update public.products
        set stock_quantity = stock_quantity + item.quantity
        where id = item.product_id;
      end if;
    end loop;
  end if;

  if v_coupon_id is not null and v_coupon_consumed then
    update public.coupons
    set
      used_count = greatest(used_count - 1, 0),
      updated_at = now()
    where id = v_coupon_id;
  end if;

  update public.orders
  set
    stock_reserved = false,
    coupon_consumed = false,
    status = 'CANCELADO'
  where id = p_order_id;
end;
$$;


-- =========================================================
-- REATIVAÇÃO ATÔMICA
-- Reserva novamente estoque + cupom + muda status.
-- Se alguma etapa falhar, tudo é revertido.
-- =========================================================

create or replace function public.reactivate_cancelled_order(
  p_order_id uuid,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_reserved boolean;
  v_coupon_id uuid;
  v_coupon_consumed boolean;
  item record;
begin
  if p_status = 'CANCELADO' then
    raise exception 'Status de reativação inválido.';
  end if;

  select
    status,
    stock_reserved,
    coupon_id,
    coupon_consumed
  into
    v_status,
    v_reserved,
    v_coupon_id,
    v_coupon_consumed
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Pedido não encontrado.';
  end if;

  if v_status <> 'CANCELADO' then
    raise exception 'O pedido não está cancelado.';
  end if;

  if not v_reserved then
    for item in
      select product_id, quantity
      from public.order_items
      where order_id = p_order_id
    loop
      if item.product_id is null then
        raise exception 'Item do pedido sem produto vinculado.';
      end if;

      update public.products
      set stock_quantity = stock_quantity - item.quantity
      where id = item.product_id
        and stock_quantity >= item.quantity;

      if not found then
        raise exception 'Estoque insuficiente para um ou mais produtos.';
      end if;
    end loop;
  end if;

  if v_coupon_id is not null and not v_coupon_consumed then
    update public.coupons
    set
      used_count = used_count + 1,
      updated_at = now()
    where id = v_coupon_id
      and active = true
      and (starts_at is null or starts_at <= now())
      and (expires_at is null or expires_at >= now())
      and (usage_limit is null or used_count < usage_limit);

    if not found then
      raise exception 'Cupom indisponível ou limite de utilizações atingido.';
    end if;

    v_coupon_consumed := true;
  end if;

  update public.orders
  set
    stock_reserved = true,
    coupon_consumed = v_coupon_consumed,
    status = p_status
  where id = p_order_id;
end;
$$;


-- =========================================================
-- SEGURANÇA DAS RPCs
-- =========================================================

revoke execute on function public.reserve_order_stock(uuid)
from public, anon, authenticated;

revoke execute on function public.cancel_order(uuid)
from public, anon, authenticated;

revoke execute on function public.reactivate_cancelled_order(uuid, text)
from public, anon, authenticated;

grant execute on function public.reserve_order_stock(uuid)
to service_role;

grant execute on function public.cancel_order(uuid)
to service_role;

grant execute on function public.reactivate_cancelled_order(uuid, text)
to service_role;


-- =========================================================
-- REMOVE FUNÇÕES ANTIGAS/INTERMEDIÁRIAS
-- =========================================================

drop function if exists public.consume_coupon(uuid);
drop function if exists public.consume_order_coupon(uuid);
drop function if exists public.release_order_coupon(uuid);
