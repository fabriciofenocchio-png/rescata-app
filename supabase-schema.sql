-- ============================================================
-- Rescatá — esquema de base de datos (Supabase / Postgres)
-- ============================================================
-- Cómo usar: Supabase → tu proyecto → SQL Editor → pegar todo
-- este archivo → Run. Se crea todo de una vez.

-- Extensión para generar IDs únicos
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
-- Tabla: comercios
-- Cada fila está ligada 1 a 1 a un usuario de Supabase Auth
-- (el "id" es el mismo id que genera Supabase al registrarse).
-- ------------------------------------------------------------
create table comercios (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  categoria text not null,
  barrio text not null,
  direccion text not null,
  comision_pct numeric not null default 15,
  mp_access_token text,       -- token privado del comercio en Mercado Pago (split de pagos)
  mp_refresh_token text,
  mp_user_id text,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- Tabla: bolsas (bolsas sorpresa que carga cada comercio)
-- ------------------------------------------------------------
create table bolsas (
  id uuid primary key default uuid_generate_v4(),
  comercio_id uuid not null references comercios(id) on delete cascade,
  descripcion text not null,
  precio_original numeric not null,
  precio_descuento numeric not null,
  cantidad int not null,
  horario text not null,
  activa boolean not null default true,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- Tabla: reservas (se crean solo cuando el pago se confirma,
-- vía el webhook del backend — nunca directo desde el navegador)
-- ------------------------------------------------------------
create table reservas (
  id uuid primary key default uuid_generate_v4(),
  bolsa_id uuid not null references bolsas(id),
  codigo text not null,
  estado text not null default 'pendiente', -- pendiente | pagada | retirada | cancelada
  mp_payment_id text,
  monto_total numeric not null,
  monto_comision numeric not null,
  created_at timestamptz default now()
);

-- ============================================================
-- Row Level Security (RLS): quién puede ver/editar qué
-- ============================================================
alter table comercios enable row level security;
alter table bolsas enable row level security;
alter table reservas enable row level security;

-- Un comercio puede ver y editar SOLO su propia fila
create policy "comercio ve su propio perfil"
  on comercios for select
  using (auth.uid() = id);

create policy "comercio edita su propio perfil"
  on comercios for update
  using (auth.uid() = id);

create policy "cualquier usuario autenticado crea su fila de comercio"
  on comercios for insert
  with check (auth.uid() = id);

-- Cualquiera (incluso sin login) puede VER las bolsas activas —
-- esto es lo que alimenta la pantalla pública "Explorar"
create policy "todos ven bolsas activas"
  on bolsas for select
  using (activa = true and cantidad > 0);

-- Un comercio ve TODAS sus propias bolsas (activas o no)
create policy "comercio ve sus propias bolsas"
  on bolsas for select
  using (auth.uid() = comercio_id);

-- Un comercio solo puede crear/editar/borrar SUS PROPIAS bolsas
create policy "comercio crea sus bolsas"
  on bolsas for insert
  with check (auth.uid() = comercio_id);

create policy "comercio edita sus bolsas"
  on bolsas for update
  using (auth.uid() = comercio_id);

create policy "comercio borra sus bolsas"
  on bolsas for delete
  using (auth.uid() = comercio_id);

-- Reservas: nadie las lee/crea directo desde el navegador.
-- Solo el backend (con la "service role key", que nunca se expone
-- al navegador) puede tocarlas — por eso NO hay policies de
-- insert/select públicas acá. El backend evita esta restricción
-- automáticamente porque usa una clave con permisos totales.
