-- Remove permissões desnecessárias das tabelas públicas.
revoke all privileges on table
  public.categories,
  public.coupons,
  public.customers,
  public.order_items,
  public.orders,
  public.products,
  public.settings
from anon, authenticated;

-- Funções internas não devem ser executadas diretamente
-- por visitantes ou usuários autenticados.
revoke execute on function public.generate_order_number()
from public, anon, authenticated;

revoke execute on function public.rls_auto_enable()
from public, anon, authenticated;

revoke execute on function public.set_updated_at()
from public, anon, authenticated;

-- O backend privilegiado continua autorizado.
grant execute on function public.generate_order_number()
to service_role;

grant execute on function public.rls_auto_enable()
to service_role;

grant execute on function public.set_updated_at()
to service_role;
