# Corrections des Failles

## Faille 1: Output bindings nommés avec "on" ou préfixés par "on"

**Problème :** Dans le composant `mat-search-bar.component.ts`, les propriétés `@Output` étaient nommées `onBlur`, `onClose`, `onEnter`, `onFocus`, `onOpen`, ce qui viole la convention Angular interdisant les noms d'événements de sortie identiques aux événements DOM standards ou préfixés par "on".

**Localisation :**
- Fichier : `frontend/src/app/mat-search-bar/mat-search-bar.component.ts` (lignes 55-59)
- Utilisation : `frontend/src/app/navbar/navbar.component.html` (ligne 27)

**Solution apportée :** Renommé les outputs en `searchBlur`, `searchClose`, `searchEnter`, `searchFocus`, `searchOpen` pour éviter les conflits avec les événements DOM. Mis à jour toutes les émissions dans les méthodes du composant et l'utilisation dans le template parent.

**Explication :** Cette correction empêche les conflits potentiels avec les événements DOM natifs, améliorant la lisibilité et la conformité aux bonnes pratiques Angular, réduisant ainsi les risques de bugs inattendus lors de la liaison d'événements.

## Faille 2: Utilisation de données contrôlées par l'utilisateur pour le paramètre 'branch' dans le workflow GitHub

**Problème :** Dans le workflow `lint-fixer.yml`, le paramètre `branch` de l'action `git-auto-commit-action` utilisait directement `${{ github.head_ref }}`, une donnée contrôlée par l'utilisateur (nom de la branche), ce qui pouvait entraîner des vulnérabilités de sécurité comme l'injection de commandes ou l'accès non autorisé.

**Localisation :**
- Fichier : `.github/workflows/lint-fixer.yml` (ligne 28)

**Solution apportée :** Supprimé le paramètre `branch` pour que l'action commite automatiquement sur la branche actuelle, évitant ainsi l'utilisation de données user-controlled.

**Explication :** En omettant le paramètre branch, le workflow reste fonctionnel tout en éliminant le risque de sécurité associé à l'injection via le nom de branche, car l'action utilise la branche par défaut du contexte GitHub.

## Faille 3: Clé privée RSA codée en dur dans le code

**Problème :** Une clé privée RSA était codée en dur dans le fichier `lib/insecurity.ts`, exposant une clé de sécurité sensible directement dans le code source, ce qui constitue une faille de sécurité majeure.

**Localisation :**
- Fichier : `lib/insecurity.ts` (ligne 20-21)

**Solution apportée :** Remplacé la clé codée en dur par une lecture depuis une variable d'environnement `JWT_PRIVATE_KEY`. Ajouté le chargement de dotenv dans `app.ts` pour charger les variables depuis un fichier `.env` local. Créé le fichier `.env` avec la clé et ajouté `.env` au `.gitignore` pour éviter les commits de secrets.

**Explication :** Cette modification élimine l'exposition de la clé privée dans le dépôt de code, réduisant les risques de compromission. Les clés sensibles doivent être gérées via des variables d'environnement ou des services de gestion de secrets, pas stockées en dur dans le code.

## Faille 4: Format incorrect de la clé privée RSA dans le fichier .env

**Problème :** La clé privée RSA dans le fichier `.env` était formatée avec des séquences d'échappement `\n` au lieu de vraies nouvelles lignes, causant une erreur OpenSSL "unsupported" lors de la signature des JWT, empêchant la connexion des utilisateurs.

**Localisation :**
- Fichier : `.env` (ligne 1)

**Solution apportée :** Modifié le format de la variable `JWT_PRIVATE_KEY` dans `.env` en utilisant des guillemets pour préserver les sauts de ligne multilignes de la clé PEM.

**Explication :** Les fichiers `.env` interprètent les séquences d'échappement différemment selon le shell. En utilisant des guillemets, la clé conserve son format PEM valide requis par OpenSSL pour les opérations cryptographiques RSA.