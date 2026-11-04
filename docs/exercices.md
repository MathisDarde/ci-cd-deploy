# Mini-exercices du cours

## Quel test choisir pour chaque problème ? (et à quel moment)

| #   | Problème                | Test                                          | Moment                      | Dans ce projet                               |
| --- | ----------------------- | --------------------------------------------- | --------------------------- | -------------------------------------------- |
| 1   | Calcul de la TVA        | Unitaire (Vitest)                             | chaque commit / PR          | `packages/shared/test/wishlist.test.ts`      |
| 2   | Paiement Stripe en test | Intégration (clés de test, sandbox)           | chaque PR                   | équivalent : `apps/api/test/integration/`    |
| 3   | Commander sur mobile    | E2E sur viewport mobile                       | après merge / nuit          | projet Playwright `mobile`                   |
| 4   | API : 401 sans token    | Intégration / contrat d'API (`app.request()`) | chaque PR                   | `apps/api/test/routes.test.ts` (400/404/409) |
| 5   | 1 000 users sur la home | Charge (k6)                                   | chaque nuit                 | `tests/load/browse.js`                       |
| 6   | Logo décalé de 20 px    | Régression visuelle (captures Playwright)     | après merge sur main        | `e2e/quality.spec.ts` `@visual`              |
| 7   | `/health` après deploy  | Smoke test                                    | après déploiement (< 1 min) | `scripts/smoke.mjs`                          |
| 8   | Bug injecté détecté ?   | Mutation (Stryker)                            | chaque nuit                 | `packages/shared/stryker.config.json`        |

## Cette CI vérifie le code. Que pourrait-on ajouter ?

Au-delà de install / lint / tests / build : format (Prettier), types (vue-tsc), tests
d'intégration sur une vraie base, audit des dépendances, détection de secrets (gitleaks),
SAST (CodeQL), checks maison (clés i18n), couverture avec seuils, E2E — tous présents dans
`.github/workflows/ci.yml`.

## Quel rendu choisir pour chaque site ?

| Site                      | Rendu                                    | Hébergement           | Arbitrage                                                                             |
| ------------------------- | ---------------------------------------- | --------------------- | ------------------------------------------------------------------------------------- |
| Blog tech, 300 articles   | SSG                                      | CDN / S3 + CloudFront | SEO excellent, coût quasi nul ; rebuild à chaque article (ou ISR)                     |
| Dashboard SaaS sous login | SPA                                      | CDN / S3              | aucun besoin de SEO derrière un login ; le moins cher                                 |
| E-commerce, 50 000 fiches | Hybride : ISR / SSR + cache (routeRules) | Vercel, Netlify, Node | SEO indispensable, prix et stocks frais ; générer 50 000 pages au build est trop long |
| App terrain hors réseau   | SPA + PWA (service worker, cache local)  | CDN                   | doit marcher sans réseau ; le SEO n'a aucun intérêt                                   |

PokéWishlist est hybride : catalogue chargé côté client, fiches Pokémon en SSR (Vercel) ou
pré-générées (S3 + CloudFront), pour comparer les deux.
