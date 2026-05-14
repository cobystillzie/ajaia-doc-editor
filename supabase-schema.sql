create table if not exists public.users (
  id text primary key,
  name text not null,
  email text not null unique
);

create table if not exists public.documents (
  id text primary key,
  title text not null,
  content_json jsonb not null,
  content_html text not null default '',
  owner_id text not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.document_shares (
  id text primary key,
  document_id text not null references public.documents(id) on delete cascade,
  user_id text not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (document_id, user_id)
);

insert into public.users (id, name, email)
values
  ('coby', 'Coby Stillman', 'coby@demo.com'),
  ('alex', 'Alex Reviewer', 'alex@demo.com')
on conflict (id) do update
set name = excluded.name,
    email = excluded.email;

insert into public.documents (id, title, content_json, content_html, owner_id)
values (
  'welcome-doc',
  'Ajaia assessment notes',
  '{
    "type": "doc",
    "content": [
      { "type": "heading", "attrs": { "level": 1 }, "content": [{ "type": "text", "text": "Ajaia collaborative editor" }] },
      { "type": "paragraph", "content": [
        { "type": "text", "text": "This starter document demonstrates " },
        { "type": "text", "marks": [{ "type": "bold" }], "text": "rich text" },
        { "type": "text", "text": ", persistence, upload, and sharing flows." }
      ] }
    ]
  }'::jsonb,
  '<h1>Ajaia collaborative editor</h1><p>This starter document demonstrates <strong>rich text</strong>, persistence, upload, and sharing flows.</p>',
  'coby'
)
on conflict (id) do nothing;
