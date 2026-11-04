# PokéWishlist

[![CI](https://github.com/MathisDarde/ci-cd-deploy/actions/workflows/ci.yml/badge.svg)](https://github.com/MathisDarde/ci-cd-deploy/actions/workflows/ci.yml)
[![CD](https://github.com/MathisDarde/ci-cd-deploy/actions/workflows/cd.yml/badge.svg)](https://github.com/MathisDarde/ci-cd-deploy/actions/workflows/cd.yml)
[![Coverage](https://img.shields.io/endpoint?url=https://mathisdarde.github.io/ci-cd-deploy/badges/coverage.json)](https://mathisdarde.github.io/ci-cd-deploy/)

TP fil rouge du module **IIM M1 — Intégration & Déploiement continu** : une liste de 6 Pokémon à
capturer, avec un front **Nuxt** (SSR sur Vercel + SSG sur S3/CloudFront), une API **Hono**
(AWS Lambda + API Gateway), une base **PostgreSQL** (Supabase), et toute la chaîne CI/CD autour.

```
apps/web         Nuxt 4 — catalogue PokéAPI, wishlist, fiches /pokemon/[name], 4 langues
apps/api         Hono — GET/POST/DELETE /wishlist, likes, /health ; Node, Docker ou Lambda
packages/shared  Types et règles métier partagés (doublon, limite de 6, validation)
db/              init.sql + migrations/NNN_*.sql (runner maison, table schema_migrations)
e2e/             Playwright — parcours réels navigateur → Nuxt → Hono → PostgreSQL
infra/           Terraform — bootstrap (state, OIDC GitHub, budget) + stack par environnement
scripts/         Checks maison : i18n, smoke tests, SEO sans JS, résumé de couverture
tests/load/      Test de charge k6
.github/         Workflows CI, CD, rollback, nightly, CodeQL, coverage, Dependabot
```

## Démarrer en local

Prérequis : Node 22+, pnpm 10 (`corepack enable`), Docker (pour PostgreSQL).

```bash
pnpm install                  # installe aussi le hook pre-commit (lint-staged)
cp .env.example .env          # optionnel

# Sans base : API en mémoire (le tableau du TP "back sans BDD")
pnpm dev                      # API http://localhost:3001, front http://localhost:3000

# Avec PostgreSQL
docker compose up -d db
DATABASE_URL=postgres://pokewishlist:pokewishlist@localhost:5432/pokewishlist pnpm db:migrate
DATABASE_URL=postgres://pokewishlist:pokewishlist@localhost:5432/pokewishlist pnpm dev

# Tout en conteneurs (API + BDD + migrations + front SSR)
docker compose up --build
```

Un **dev container** (`.devcontainer/`) fournit le même environnement à tout le monde :
Node, pnpm, Terraform, AWS CLI, PostgreSQL, navigateurs Playwright.

## Commandes

| Commande                                           | Rôle                                                           |
| -------------------------------------------------- | -------------------------------------------------------------- |
| `pnpm lint`                                        | ESLint (interdit `console.log` et `debugger`)                  |
| `pnpm format:check`                                | Prettier `--check` (`singleQuote: true`, `semi: false`)        |
| `pnpm typecheck`                                   | `tsc` (API, shared) + `nuxt typecheck` (vue-tsc)               |
| `pnpm test`                                        | Vitest, tous les paquets                                       |
| `pnpm test:coverage`                               | Vitest + couverture v8 (seuils bloquants)                      |
| `pnpm test:integration`                            | Routes Hono sur une vraie BDD (`TEST_DATABASE_URL`)            |
| `pnpm build`                                       | Bundle API (esbuild) + `nuxt build`                            |
| `pnpm test:e2e`                                    | Playwright (après `pnpm build`)                                |
| `pnpm check:i18n`                                  | Compare chaque locale à `en.json`, front et back               |
| `pnpm db:migrate`                                  | `init.sql` puis migrations non encore appliquées               |
| `pnpm smoke`                                       | Smoke tests post-déploiement (`API_URL`, `SSR_URL`, `SSG_URL`) |
| `pnpm seo:check <url>…`                            | HTML brut des fiches : title, h1, meta, canonical, hreflang    |
| `pnpm --filter @pokewishlist/shared test:mutation` | Stryker (tests de mutation)                                    |
| `pnpm --filter @pokewishlist/web generate`         | SSG (`PRERENDER_POKEMON_LIMIT`, 151 par défaut)                |

## Quand les tests tournent

| Moment               | Ce qui tourne                                                                                          | Où                                           |
| -------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------- |
| Commit (local)       | Prettier, ESLint, Vitest `related` sur les fichiers modifiés                                           | `lint-staged.config.mjs`                     |
| Chaque push / PR     | lint, format, types, i18n, unitaires + couverture, intégration (Postgres), build, audit, gitleaks, E2E | `ci.yml`                                     |
| Après merge sur main | régression visuelle, rapport de couverture + badge (GitHub Pages), CodeQL                              | `e2e-main.yml`, `coverage.yml`, `codeql.yml` |
| Chaque nuit          | mutation (Stryker), charge (k6), DAST (OWASP ZAP), E2E complet                                         | `nightly.yml`                                |
| Après déploiement    | smoke tests + check SEO, rollback automatique de l'API si rouge                                        | `deploy.yml`                                 |

## Du commit à la production

```
push ──► CI (ci.yml) ──vert sur main──► CD (cd.yml)
                                         ├─ stg : automatique
                                         └─ prd : après approbation (environment "prd")
deploy.yml, toujours dans cet ordre :
  1. INFRA       terraform plan/apply (environments/<env>.tfvars)
  2. MIGRATIONS  pnpm db:migrate (expand only)
  3. BUILD       un artefact : bundle Lambda versionné par le SHA
  4. DEPLOY      Lambda (nouvelle version + alias "live") · Vercel (SSR) · S3 + CloudFront (SSG)
  5. SMOKE       /health, page SSR, page SSG, codes HTTP + check SEO
                 rouge ⇒ l'alias Lambda revient à la version précédente (et Vercel en prd)
  6. TAG         deploy-<env>-<date> = dernier déploiement stable
```

Rollback manuel : workflow **Rollback** (`rollback.yml`) — alias Lambda sur la version
précédente, `vercel rollback`, SSG régénéré depuis le tag stable précédent, puis smoke tests.

## Mise en place du cloud (à faire une fois)

### 1. Supabase

1. Créer un projet ; dans **SQL Editor**, exécuter [`db/init.sql`](db/init.sql).
2. Récupérer deux chaînes de connexion (_Project Settings → Database_) :
   - **Transaction pooler** (port 6543) → `DATABASE_URL` (utilisée par Lambda) ;
   - **Session / direct** (port 5432) → `MIGRATION_DATABASE_URL` (utilisée par les migrations).
3. En local : `MIGRATION_DATABASE_URL=… pnpm db:migrate` applique `001_likes.sql`.

### 2. AWS

1. Créer une **alerte budget** — c'est fait par le bootstrap ci-dessous.
2. Bootstrap (une fois, avec un compte admin) :
   ```bash
   cd infra/bootstrap
   terraform init
   terraform apply -var github_repository=MathisDarde/ci-cd-deploy -var budget_email=vous@example.com
   ```
   Il crée le bucket de state Terraform, la confiance **OIDC GitHub** (aucune clé AWS stockée
   dans GitHub) et le rôle de déploiement.

### 3. Vercel

1. Importer le dépôt, **Root Directory = `apps/web`**, framework Nuxt.
2. Désactiver les déploiements Git automatiques (c'est GitHub Actions qui déploie après la CI).
3. Créer un token (_Account Settings → Tokens_).

### 4. GitHub

_Settings → Environments_ : créer `stg` et `prd` (sur `prd` : **Required reviewers**, le clic humain).

| Type     | Nom                                  | Valeur                                             |
| -------- | ------------------------------------ | -------------------------------------------------- |
| variable | `AWS_DEPLOY_ROLE_ARN`                | sortie `deploy_role_arn` du bootstrap              |
| variable | `AWS_REGION`                         | `eu-west-3`                                        |
| variable | `TF_STATE_BUCKET`                    | sortie `tfstate_bucket` du bootstrap               |
| variable | `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` | `.vercel/project.json` après `vercel link`         |
| secret   | `DATABASE_URL`                       | Supabase, pooler 6543 (une base par environnement) |
| secret   | `MIGRATION_DATABASE_URL`             | Supabase, connexion directe 5432                   |
| secret   | `VERCEL_TOKEN`                       | token Vercel                                       |

Variables de dépôt optionnelles pour la nuit : `STG_API_URL`, `STG_SSR_URL` (k6 et ZAP).
_Settings → Pages → Source : GitHub Actions_ pour le rapport de couverture et le badge.
_Settings → Branches_ : protéger `main` avec le check requis **CI passed**.

## Prouver que la CI bloque (rendu du TP)

Sur une branche, ouvrir une PR, pousser un échec volontaire, constater le rouge, corriger :

| Check cassé | Échec volontaire                                                              |
| ----------- | ----------------------------------------------------------------------------- |
| Lint        | ajouter `console.log('debug')` dans `apps/web/app/pages/index.vue`            |
| Format      | remplacer des `'` par des `"` dans un fichier `.ts`                           |
| Types       | `const n: number = 'six'` dans `apps/web/app/utils/display.ts`                |
| Unitaires   | `WISHLIST_LIMIT = 7` dans `packages/shared/src/wishlist.ts`                   |
| Build       | `import { nope } from '~/utils/nope'` dans une page                           |
| i18n        | supprimer une clé de `apps/web/i18n/locales/de.json`                          |
| E2E         | renvoyer `409` au lieu de `201` dans `POST /wishlist` (`apps/api/src/app.ts`) |

## Choix d'architecture

- **Rendu** : les fiches `/pokemon/[name]` sont rendues côté serveur (SSR sur Vercel) ou
  pré-générées (SSG, un HTML par Pokémon et par langue) : un robot reçoit tout le contenu.
  Le catalogue complet (~1 000 Pokémon filtrables) est chargé côté client.
- **i18n** : anglais par défaut sans préfixe, `/fr`, `/es`, `/de` ; `hreflang` + canonique,
  sitemap multilingue. L'API traduit ses erreurs selon `Accept-Language`.
- **Un artefact, une config par environnement** : `NUXT_PUBLIC_API_BASE`, `DATABASE_URL`,
  `CORS_ORIGINS`… viennent des variables d'environnement, jamais du code.
- **Migrations expand/contract** : on ajoute (colonne nullable ou avec défaut) dans une release,
  on supprime l'ancien dans une release suivante — voir [`db/README.md`](db/README.md).

Réponses aux mini-exercices du cours : [`docs/exercices.md`](docs/exercices.md).
