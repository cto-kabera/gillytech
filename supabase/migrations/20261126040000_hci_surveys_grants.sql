-- hci_surveys was created after init grants; service_role needs table privileges.

alter table public.hci_surveys enable row level security;

grant select, insert, update, delete on public.hci_surveys to service_role;
grant select on public.hci_surveys to authenticated;