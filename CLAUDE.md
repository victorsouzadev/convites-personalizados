# convite-base — Constituição do Projeto

## O que é este projeto

Plataforma multi-tenant de convites digitais para múltiplos tipos de evento (casamentos, aniversários, formaturas, corporativos, outros). Um único deploy Angular serve N eventos via slug na URL: `domain.com/:slug/entrada?id=GUEST_ID`. Cada convite tem sua própria configuração, lista de convidados e assets — tudo isolado pelo `slug`.

## Stack

- **Angular 21** — standalone components, lazy-loaded routes, `ChangeDetectionStrategy.OnPush`, signals
- **Supabase** — PostgreSQL + realtime (`postgres_changes`) + RLS
- **Tailwind CSS v4** — compilado via CLI (`npx @tailwindcss/cli`) antes do build Angular
- **Netlify** — SPA com redirect `/* /index.html 200` via `netlify.toml` + `public/_redirects`
- **Font**: Great Vibes (script), Cormorant Garamond (serif), Inter (sans)

## Estrutura de rotas

```
/:slug/entrada   → EnvelopeComponent  (envelope animado — entrada do convite)
/:slug/convite   → WeddingComponent   (convite completo — genérico para todos os tipos)
/:slug/login     → LoginComponent
/:slug/admin     → AdminComponent     (requer authGuard)
/master/login    → MasterLoginComponent
/master          → MasterAdminComponent (requer masterAuthGuard)
```

## Tipos de evento suportados

| tipo        | Label       | Traje | PIX | Confirmação WA |
|-------------|-------------|-------|-----|----------------|
| casamento   | Casamento   | ✓     | ✓   | ✓              |
| aniversario | Aniversário | ✗     | ✗   | ✓              |
| formatura   | Formatura   | ✓     | ✗   | ✓              |
| corporativo | Corporativo | ✗     | ✗   | ✗              |
| outro       | Evento      | ✗     | ✗   | ✓              |

Textos exibidos no convite (subtítulos, mensagens WA, título Agenda) são configurados em `EventTypeConfig` — nunca hardcoded no template.

## Dados no Supabase

### Tabela `convites` (slug = PK)
Todos os campos de configuração: tipo, noivo/noiva (ou nome do responsável), data, local, WhatsApp, PIX, Spotify, cores (`cor_primaria`, `cor_acento`), caminhos de foto, senha admin.

### Tabela `guests`
Convidados por slug. Tracking: `open_count`, `opened_at`, `confirm_clicks`, `gifts_clicks`, `status` (pending/sent/confirmed/declined).

### Tabela `confirmations`
Confirmações avulsas (convidados sem ID que confirmam pelo nome).

## Assets

```
public/assets/
├── manual/          ← ícones compartilhados (manual dos convidados)
└── <slug>/          ← por convite: capa.jpg, share.jpg, brasao-icon.png
```

## Serviços

| Serviço               | Responsabilidade |
|-----------------------|------------------|
| `SupabaseService`     | Singleton do client Supabase |
| `ConviteConfigService`| Carrega config por slug, cache em Map |
| `EventTypeService`    | Retorna `EventTypeConfig` por tipo de evento |
| `GuestService`        | CRUD de guests + realtime + tracking |
| `AuthService`         | Auth por senha em localStorage (senha vem do Supabase) |
| `MasterAuthService`   | Auth do painel master via Edge Function |
| `MasterAdminService`  | CRUD de eventos (painel master) |

## Padrão de cores

Cores vêm **sempre** de `cfg.cor_primaria` e `cfg.cor_acento`. O template define CSS custom properties `--cor-p` e `--cor-a` no elemento raiz via `[style]="rootStyles"`. Use `var(--cor-p)` em inline styles — nunca hex hardcoded no template.

## Build

```bash
npm start                           # dev server na porta 4200
npm run build                       # Tailwind CLI + ng build de produção
netlify deploy --dir="dist\convite-base\browser" --prod  # deploy
```

O script `build` executa:
1. `npx @tailwindcss/cli -i src/tailwind.source.css -o src/tailwind.compiled.css`
2. `ng build`

**Nunca** criar `tailwind.config.js` — quebra o build com Tailwind v4.

## Regras de desenvolvimento

### Adicionar um novo evento
1. `INSERT INTO convites (slug, tipo, ...)` no Supabase SQL Editor
2. Criar `public/assets/<slug>/` com `capa.jpg`, `share.jpg`, `brasao-icon.png`
3. Testar em `localhost:4200/<slug>/entrada`

### Nunca fazer
- Não hardcodar cores, textos de evento, nomes de noivo/aniversariante ou slug — tudo vem do `ConviteConfig` + `EventTypeConfig`
- Não criar `tailwind.config.js`
- Não usar `NgClass` sem importar (componentes standalone)
- Não usar `ChangeDetectionStrategy.OnPush` sem `cdr.markForCheck()` após mudanças assíncronas

### Tracking
- `trackOpen` → chamado no `EnvelopeComponent.ngOnInit`
- `trackClick('clickedConfirm')` → antes da confirmação de presença
- `trackClick('clickedGifts')` → ao clicar em presentes/PIX

## Credenciais

As credenciais do Supabase ficam em `src/environments/environment.ts` (dev) e `environment.prod.ts` (prod). Esses arquivos **não** são commitados.

## Referências

- `supabase-setup.sql` — schema completo do banco
