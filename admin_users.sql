-- ============================================================
-- DAKTARI ADMIN USERS — Completely independent login system
-- No dependency on auth.users at all
-- Run in Supabase SQL Editor
-- ============================================================

-- Enable pgcrypto for password hashing
create extension if not exists pgcrypto;

-- Drop old admins table if it exists (was tied to auth.users)
drop table if exists daktari.admins cascade;

-- ── New independent admin users table ────────────────────────
create table daktari.admin_users (
  id           uuid primary key default gen_random_uuid(),
  full_name    text not null,
  email        text not null unique,
  password_hash text not null,
  role         text not null default 'admin'
                 check (role in ('super_admin', 'admin', 'viewer')),
  is_active    boolean default true,
  last_login   timestamptz,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ── RLS: completely open for service_role, no auth.uid() needed ──
alter table daktari.admin_users enable row level security;

-- Allow service_role full access (used by admin panel via anon key)
create policy "admin_users_service_role"
  on daktari.admin_users for all
  to service_role using (true);

-- Allow anon to SELECT only (for login check)
create policy "admin_users_anon_read"
  on daktari.admin_users for select
  to anon using (true);

-- ── Login function ────────────────────────────────────────────
-- Returns the admin row if email+password match, null otherwise
create or replace function daktari.admin_login(
  p_email    text,
  p_password text
)
returns table (
  id        uuid,
  full_name text,
  email     text,
  role      text,
  is_active boolean
)
language plpgsql security definer as $$
begin
  -- Update last_login on successful match
  update daktari.admin_users
  set last_login = now()
  where daktari.admin_users.email = lower(trim(p_email))
    and daktari.admin_users.password_hash = crypt(p_password, daktari.admin_users.password_hash)
    and daktari.admin_users.is_active = true;

  return query
  select
    u.id, u.full_name, u.email, u.role, u.is_active
  from daktari.admin_users u
  where u.email = lower(trim(p_email))
    and u.password_hash = crypt(p_password, u.password_hash)
    and u.is_active = true;
end;
$$;

-- Allow anon to call the login function
grant execute on function daktari.admin_login(text, text) to anon, authenticated;

-- ── Create admin function ─────────────────────────────────────
create or replace function daktari.create_admin_user(
  p_full_name text,
  p_email     text,
  p_password  text,
  p_role      text default 'admin'
)
returns text language plpgsql security definer as $$
begin
  insert into daktari.admin_users (full_name, email, password_hash, role)
  values (
    p_full_name,
    lower(trim(p_email)),
    crypt(p_password, gen_salt('bf', 10)),
    p_role
  )
  on conflict (email) do update
    set password_hash = crypt(p_password, gen_salt('bf', 10)),
        full_name     = p_full_name,
        role          = p_role,
        updated_at    = now();

  return 'Admin created: ' || p_email;
end;
$$;

grant execute on function daktari.create_admin_user(text, text, text, text) to anon, authenticated, service_role;

-- ── Also update RLS on other tables to use admin_users ───────
-- Admins can now be verified via a session token we manage ourselves

-- ── CREATE YOUR FIRST ADMIN NOW ──────────────────────────────
-- Run this line (change the password!):
select daktari.create_admin_user('Jimmy', 'jpmpanga@gmail.com', 'REDACTED', 'super_admin');

-- Verify it worked:
select id, full_name, email, role, is_active, created_at
from daktari.admin_users;
