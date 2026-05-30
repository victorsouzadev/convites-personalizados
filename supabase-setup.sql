-- ============================================================
-- convite-base — schema Supabase
-- Execute no SQL Editor do painel do Supabase
-- ============================================================

-- Tabela de configuração de cada convite/evento
create table if not exists convites (
    slug                  text primary key,
    tipo                  text not null default 'casamento'
                              check (tipo in ('casamento', 'aniversario', 'formatura', 'corporativo', 'outro')),
    rotulo_personalizado  text,                              -- apenas quando tipo = 'outro'
    noivo                 text not null default '',
    noiva                 text not null default '',
    data_casamento        text not null,                    -- ISO: '2026-08-15T19:00:00'
    local_nome            text not null,
    local_endereco        text not null default '',
    local_map_embed_url   text not null default '',
    local_map_link        text not null default '',
    whatsapp_noivo        text not null default '',
    whatsapp_noiva        text not null default '',
    pix_codigo            text not null default '',
    spotify_track_id      text not null default '',
    instagram             text not null default '',
    admin_senha           text not null,
    cor_primaria          text not null default '#4a6e3a',
    cor_acento            text not null default '#a08040',
    tema                  text not null default 'green',
    foto_capa             text not null default '',
    foto_envelope         text not null default '',
    foto_share            text not null default '',
    foto_brasao           text not null default '',
    created_at            timestamptz default now()
);

-- Tabela de convidados (todos os eventos juntos, separados por slug)
create table if not exists guests (
    id                uuid primary key default gen_random_uuid(),
    slug              text not null references convites(slug) on delete cascade,
    name              text not null,
    whatsapp          text not null default '',
    side              text not null check (side in ('noivo', 'noiva')),
    status            text not null default 'pending' check (status in ('pending', 'sent', 'confirmed', 'declined')),
    created_at        timestamptz default now(),
    opened_at         timestamptz,
    open_count        int not null default 0,
    clicked_confirm_at timestamptz,
    clicked_gifts_at  timestamptz,
    confirm_clicks    int not null default 0,
    gifts_clicks      int not null default 0
);

create index if not exists guests_slug_idx on guests(slug);

-- Tabela de confirmações avulsas (convidados sem ID que confirmam pelo nome)
create table if not exists confirmations (
    id           uuid primary key default gen_random_uuid(),
    slug         text not null,
    guest_id     uuid references guests(id) on delete set null,
    name         text not null,
    confirmed_at timestamptz default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table convites enable row level security;
alter table guests enable row level security;
alter table confirmations enable row level security;

-- Convites: leitura e escrita pública (app master precisa criar/atualizar/deletar)
create policy "convites_read"   on convites for select using (true);
create policy "convites_insert" on convites for insert with check (true);
create policy "convites_update" on convites for update using (true);
create policy "convites_delete" on convites for delete using (true);

-- Guests: leitura e escrita pública (app precisa criar/atualizar)
create policy "guests_read"   on guests for select using (true);
create policy "guests_insert" on guests for insert with check (true);
create policy "guests_update" on guests for update using (true);
create policy "guests_delete" on guests for delete using (true);

-- Confirmations: inserção pública
create policy "confirmations_read"   on confirmations for select using (true);
create policy "confirmations_insert" on confirmations for insert with check (true);

-- ============================================================
-- Migração: adicionar coluna foto_brasao (se tabela já existir)
-- ============================================================

alter table convites add column if not exists foto_brasao text not null default '';

-- ============================================================
-- Storage: bucket para imagens dos eventos
-- Execute após criar as tabelas acima
-- ============================================================

-- Criar bucket público (imagens acessíveis por URL direta)
insert into storage.buckets (id, name, public)
values ('convites', 'convites', true)
on conflict (id) do nothing;

-- Policies do Storage (leitura pública, escrita pública — protegida pela senha do evento no app)
create policy "storage_convites_select" on storage.objects
    for select using (bucket_id = 'convites');

create policy "storage_convites_insert" on storage.objects
    for insert with check (bucket_id = 'convites');

create policy "storage_convites_update" on storage.objects
    for update using (bucket_id = 'convites');

create policy "storage_convites_delete" on storage.objects
    for delete using (bucket_id = 'convites');

-- ============================================================
-- Exemplo: inserir um evento de teste
-- ============================================================

-- insert into convites (
--     slug, tipo, admin_senha, data_casamento, local_nome,
--     noivo, noiva, whatsapp_noivo, whatsapp_noiva,
--     pix_codigo, spotify_track_id,
--     cor_primaria, cor_acento
-- ) values (
--     'joao-maria-2026', 'casamento', 'minhasenha123',
--     '2026-10-15T19:00:00', 'Espaço Jardins',
--     'João', 'Maria', '5511999990001', '5511999990002',
--     '00020126...', '30GMS5o33olHdkpdhQT09c',
--     '#4a6e3a', '#a08040'
-- );
-- (imagens são adicionadas via upload no painel /admin)
