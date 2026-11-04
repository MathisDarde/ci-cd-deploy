# Base de données

- `init.sql` — schéma initial, **idempotent** (`create … if not exists`). Exécuté une fois sur
  Supabase (SQL Editor), automatiquement par Docker (`docker-entrypoint-initdb.d`) et au début
  de `pnpm db:migrate`. On ne le modifie plus : les évolutions vont dans `migrations/`.
- `migrations/NNN_nom.sql` — appliquées dans l'ordre par le runner maison
  [`apps/api/src/migrate.ts`](../apps/api/src/migrate.ts) :
  - chaque fichier tourne **dans une transaction** : un échec est annulé et arrête la suite ;
  - la table `schema_migrations` enregistre les fichiers appliqués : **chacun ne s'exécute
    qu'une fois** ;
  - un fichier déjà appliqué ne se modifie jamais ; on en écrit un nouveau.

```bash
DATABASE_URL=postgres://… pnpm db:migrate
# MIGRATION_DATABASE_URL est prioritaire (connexion directe Supabase, port 5432)
```

## Modifier le schéma sans interrompre l'application (expand / contract)

Pendant un déploiement, l'ancienne et la nouvelle version de l'API tournent en même temps sur la
même base : chaque migration doit rester compatible avec la version précédente.

| Étape      | Exemple : renommer `name` en `slug`                                    | Release |
| ---------- | ---------------------------------------------------------------------- | ------- |
| 1 EXPAND   | `alter table wishlist add column slug text` (nullable)                 | N       |
| 2 MIGRATE  | le code écrit `name` **et** `slug` ; `update wishlist set slug = name` | N       |
| 3 SWITCH   | le code lit `slug` (après vérification)                                | N + 1   |
| 4 CONTRACT | `alter table wishlist drop column name`                                | N + 2   |

`001_likes.sql` est un pur _expand_ : la colonne a une valeur par défaut, les lignes existantes
sont conservées (0 like) et l'ancienne API, qui ne la lit pas, continue de fonctionner.
