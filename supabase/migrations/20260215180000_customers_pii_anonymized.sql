-- Marca clientes cuyos datos personales fueron redactados (reservas e historial se conservan).
alter table public.customers
  add column if not exists pii_anonymized_at timestamptz null;

comment on column public.customers.pii_anonymized_at is
  'Si no es null, los datos personales fueron anonimizados por política de privacidad; la fila y las reservas siguen existiendo.';
