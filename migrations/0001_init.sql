-- The Firm Social Publisher — initial schema
-- Run with: npm run migrate

create extension if not exists pgcrypto;

-- ── media_items ─────────────────────────────────────────────────────────────
-- The editorial unit: a piece of media + caption, fanned out to platforms.
create table if not exists media_items (
  id                          uuid primary key default gen_random_uuid(),
  slug                        text not null unique,
  title                       text not null,
  caption                     text not null default '',
  media_url                   text not null default '',
  media_type                  text not null check (media_type in ('image', 'video')),
  platforms                   text[] not null default '{}',
  publish_at                  timestamptz,
  persona                     text not null default 'O Outro José',
  status                      text not null default 'draft'
                                check (status in ('draft', 'ready', 'scheduled', 'publishing', 'completed', 'failed')),
  retain_media_after_publish  boolean not null default true,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create index if not exists media_items_status_publish_at_idx
  on media_items (status, publish_at);

-- ── platform_publications ───────────────────────────────────────────────────
-- One row per (item, platform). Holds the per-platform publish lifecycle.
create table if not exists platform_publications (
  id              uuid primary key default gen_random_uuid(),
  media_item_id   uuid not null references media_items (id) on delete cascade,
  platform        text not null check (platform in ('x', 'instagram', 'facebook', 'threads')),
  status          text not null default 'pending'
                    check (status in ('pending', 'publishing', 'published', 'failed', 'skipped')),
  remote_post_id  text,
  permalink       text,
  error           text,
  attempts        integer not null default 0,
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (media_item_id, platform)
);

create index if not exists platform_publications_item_idx
  on platform_publications (media_item_id);

-- ── publish_logs ────────────────────────────────────────────────────────────
-- Append-only history for the admin /logs view and per-item timelines.
create table if not exists publish_logs (
  id             uuid primary key default gen_random_uuid(),
  media_item_id  uuid references media_items (id) on delete set null,
  platform       text,
  action         text not null,                  -- publish | dry-run | cron | ready | cleanup
  status         text not null default 'info',   -- info | success | error | skipped
  message        text not null default '',
  created_at     timestamptz not null default now()
);

create index if not exists publish_logs_item_created_idx
  on publish_logs (media_item_id, created_at desc);

create index if not exists publish_logs_created_idx
  on publish_logs (created_at desc);
