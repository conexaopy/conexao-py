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
  item record;
begin
  if p_status = 'CANCELADO' then
    raise exception 'Status de reativação inválido.';
  end if;

  select status, stock_reserved
  into v_status, v_reserved
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

  update public.orders
  set
    stock_reserved = true,
    status = p_status
  where id = p_order_id;
end;
$$;

revoke execute on function public.reactivate_cancelled_order(uuid, text)
from public, anon, authenticated;

grant execute on function public.reactivate_cancelled_order(uuid, text)
to service_role;
