alter table public.orders
add column if not exists stock_reserved boolean not null default false;

create or replace function public.reserve_order_stock(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reserved boolean;
  v_status text;
  item record;
begin
  select stock_reserved, status
  into v_reserved, v_status
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Pedido não encontrado.';
  end if;

  if v_status = 'CANCELADO' then
    raise exception 'Não é possível reservar estoque de um pedido cancelado.';
  end if;

  if v_reserved then
    return;
  end if;

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

  update public.orders
  set stock_reserved = true
  where id = p_order_id;
end;
$$;

create or replace function public.release_order_stock(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reserved boolean;
  item record;
begin
  select stock_reserved
  into v_reserved
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Pedido não encontrado.';
  end if;

  if not v_reserved then
    return;
  end if;

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

  update public.orders
  set stock_reserved = false
  where id = p_order_id;
end;
$$;

revoke execute on function public.reserve_order_stock(uuid)
from public, anon, authenticated;

revoke execute on function public.release_order_stock(uuid)
from public, anon, authenticated;

grant execute on function public.reserve_order_stock(uuid)
to service_role;

grant execute on function public.release_order_stock(uuid)
to service_role;
