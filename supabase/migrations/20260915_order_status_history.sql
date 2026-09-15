create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null,
  created_at timestamptz not null default now()
);

create index if not exists order_status_history_order_id_created_at_idx
on public.order_status_history(order_id, created_at);

alter table public.order_status_history enable row level security;

revoke all on table public.order_status_history
from public, anon, authenticated;

grant all on table public.order_status_history
to service_role;
