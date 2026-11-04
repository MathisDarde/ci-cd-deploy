-- PokéWishlist: initial schema.
-- Idempotent: safe to run on an empty or an existing database
-- (Supabase SQL editor, docker-entrypoint-initdb.d, `pnpm db:migrate`).
-- Later schema changes go to db/migrations/NNN_*.sql, never here.

create table if not exists wishlist (
  -- National Pokédex number: a Pokémon appears at most once.
  id integer primary key check (id > 0),
  -- PokéAPI slug, e.g. "pikachu".
  name text not null check (name ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  created_at timestamptz not null default now()
);

create table if not exists schema_migrations (
  version text primary key,
  applied_at timestamptz not null default now()
);

-- The API connects with its own role; the browser never talks to the table directly.
alter table wishlist enable row level security;
