# convite-base — Guia de Setup

## 1. Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Vá em **SQL Editor** e execute o conteúdo de `supabase-setup.sql`
3. Copie **Project URL** e **anon public key** (Settings → API)
4. Cole em `src/environments/environment.ts`:

```ts
export const environment = {
    production: false,
    supabase: {
        url: 'https://xxxx.supabase.co',
        anonKey: 'eyJ...',
    },
};
```

---

## 2. Criar um novo convite

### 2.1 Inserir no Supabase

Execute no SQL Editor (ou via dashboard do Supabase):

```sql
insert into convites (
    slug, noivo, noiva, data_casamento,
    local_nome, local_endereco, local_map_embed_url, local_map_link,
    whatsapp_noivo, whatsapp_noiva, pix_codigo, spotify_track_id,
    admin_senha, cor_primaria, cor_acento,
    foto_capa, foto_envelope, foto_share
) values (
    'joao-maria-2026',            -- slug: aparece na URL
    'João', 'Maria',
    '2026-10-15T19:00:00',        -- data e hora do casamento
    'Espaço Jardins',
    'Rua das Flores, 100 — SP',
    'https://www.google.com/maps/embed?pb=...', -- embed URL do Maps
    'https://maps.google.com/?q=Espaço+Jardins',
    '5511999990001',              -- WhatsApp do noivo (com DDI)
    '5511999990002',              -- WhatsApp da noiva
    '00020126...',                -- código PIX copia-e-cola
    '30GMS5o33olHdkpdhQT09c',    -- ID da track no Spotify
    'senha-do-admin',
    '#4a6e3a', '#a08040',         -- cores (primária e acento)
    'capa.jpg', 'capa.jpg', 'share.jpg'
);
```

### 2.2 Adicionar assets do convite

Crie a pasta `public/assets/<slug>/` e coloque:

```
public/assets/joao-maria-2026/
├── capa.jpg          ← foto hero (foto_capa)
├── share.jpg         ← foto para compartilhar convite via WhatsApp
└── brasao-icon.png   ← brasão/monograma para o envelope e hero
```

As imagens do manual dos convidados são compartilhadas em `public/assets/manual/`.

### 2.3 Testar localmente

```bash
npm start
# Abra: http://localhost:4200/joao-maria-2026/casamento
# Admin: http://localhost:4200/joao-maria-2026/admin
```

---

## 3. URLs do convite

| Página | URL |
|---|---|
| Envelope (entrada) | `seudominio.com/<slug>/casamento?id=GUEST_ID` |
| Convite completo | `seudominio.com/<slug>/convite?id=GUEST_ID` |
| Admin | `seudominio.com/<slug>/admin` |

---

## 4. Deploy (Firebase Hosting)

```bash
npm run build
firebase deploy --only hosting
```

O `firebase.json` já está configurado com rewrite para SPA (`**` → `index.html`).

---

## 5. Estrutura de assets

```
public/
├── assets/
│   ├── manual/                  ← ícones do manual (compartilhados entre convites)
│   │   ├── confirme_presença.png
│   │   └── ...
│   ├── joao-maria-2026/         ← assets específicos do convite
│   │   ├── capa.jpg
│   │   ├── share.jpg
│   │   └── brasao-icon.png
│   └── pedro-ana-2027/
│       └── ...
```
