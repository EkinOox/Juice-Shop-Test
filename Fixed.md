# Rapport de Correction des Vulnérabilités - OWASP Juice Shop

## 1. Résumé exécutif

### Problématiques principales
Le projet OWASP Juice Shop, conçu comme une application web intentionnellement vulnérable pour l'apprentissage de la sécurité, présentait plusieurs failles de sécurité critiques exposées dans le code source. Ces vulnérabilités incluaient l'exposition de secrets cryptographiques, des configurations dangereuses et des violations de bonnes pratiques de développement.

### Vulnérabilités critiques identifiées
- Exposition de clé privée RSA dans le code source
- Utilisation de secrets codés en dur (clés privées, mots de passe HMAC, seed phrases)
- Injection potentielle via paramètres de workflow GitHub
- Violations des conventions Angular pour les événements de sortie
- Exécution dynamique de code contrôlé par l'utilisateur (RCE)
- Construction de requêtes de base de données à partir de données utilisateur non validées

### Mesures correctives majeures
- Externalisation de tous les secrets vers des variables d'environnement
- Correction des formats de clés cryptographiques
- Sécurisation des workflows CI/CD
- Conformité aux bonnes pratiques Angular
- Mise en place d'un système de gestion des secrets via fichier .env
- Validation stricte des entrées pour prévenir les injections de code

## 2. Méthodologie

### Outils utilisés
- **SonarQube/SonarCloud** : Analyse statique du code pour identifier les vulnérabilités
- **Snyk** : Analyse des dépendances pour les vulnérabilités tierces
- **ESLint** : Vérification de la qualité du code
- **TypeScript Compiler** : Validation de la compilation
- **Git** : Gestion des versions et commits sécurisés

### Approche d'audit
1. Analyse statique automatisée avec SonarQube
2. Revue manuelle des alertes de sécurité
3. Test de compilation et exécution
4. Validation des corrections par re-test

### Étapes de test
- Compilation TypeScript sans erreurs
- Démarrage de l'application
- Test des fonctionnalités critiques (authentification JWT)
- Vérification de l'absence de secrets dans le code commité
- Test de validation des entrées utilisateur pour les challenges RCE

## 3. Analyse des vulnérabilités

### Vulnérabilité 1: Exposition de clé privée RSA
**Description** : Clé privée RSA codée en dur dans le fichier source, permettant à tout développeur ou attaquant ayant accès au dépôt de récupérer la clé.

**Localisation** : `lib/insecurity.ts`, ligne 20-21

**Impact** : Compromission complète de l'authentification JWT, permettant la génération de tokens arbitraires.

**Gravité** : Critique (CVSS 9.1) - CWE-798 (Use of Hard-coded Credentials)

### Vulnérabilité 2: Mot de passe HMAC compromis
**Description** : Secret utilisé pour les calculs HMAC codé en dur dans le code source.

**Localisation** : `lib/insecurity.ts`, ligne 44

**Impact** : Compromission des tokens deluxe et autres mécanismes HMAC-dépendants.

**Gravité** : Élevée (CVSS 7.5) - CWE-798 (Use of Hard-coded Credentials)

### Vulnérabilité 3: Injection via workflow GitHub
**Description** : Utilisation de données contrôlées par l'utilisateur (nom de branche) dans les paramètres du workflow CI/CD.

**Localisation** : `.github/workflows/lint-fixer.yml`, ligne 28

**Impact** : Potentielle injection de commandes ou accès non autorisé via noms de branches malveillants.

**Gravité** : Moyenne (CVSS 6.5) - CWE-94 (Code Injection)

### Vulnérabilité 4: Violations des conventions Angular
**Description** : Noms d'événements de sortie préfixés par "on", causant des conflits avec les événements DOM.

**Localisation** : `frontend/src/app/mat-search-bar/mat-search-bar.component.ts`, lignes 55-59

**Impact** : Bugs potentiels dans l'interface utilisateur, conflits d'événements.

**Gravité** : Faible (CVSS 2.0) - CWE-710 (Improper Adherence to Coding Standards)

### Vulnérabilité 5: Format incorrect de clé PEM
**Description** : Clé RSA mal formatée dans le fichier .env, causant des erreurs OpenSSL.

**Localisation** : `.env`, variable JWT_PRIVATE_KEY

**Impact** : Indisponibilité de l'authentification, empêchant les connexions utilisateurs.

**Gravité** : Moyenne (CVSS 5.0) - CWE-20 (Improper Input Validation)

### Vulnérabilité 6: Exécution dynamique de code contrôlé par l'utilisateur
**Description** : Code JavaScript exécuté dynamiquement via `vm.runInContext` avec des données provenant directement de la requête utilisateur, permettant potentiellement une injection de code malveillant.

**Localisation** : `routes/b2bOrder.ts`, ligne 20

**Impact** : Exécution arbitraire de code sur le serveur, compromission complète du système.

**Gravité** : Critique (CVSS 9.8) - CWE-94 (Code Injection)

### Vulnérabilité 7: Exposition de seed phrase Ethereum compromise
**Description** : Une seed phrase Ethereum codée en dur était présente dans le fichier `routes/checkKeys.ts`, permettant la génération de portefeuilles Ethereum pour des défis NFT. Cette seed phrase compromise pouvait être utilisée pour accéder à des fonds ou des actifs associés.

**Localisation** : `routes/checkKeys.ts`, ligne 15 (approximative), dans la fonction `checkKeys()`.

**Impact** : Accès potentiel à des portefeuilles Ethereum et actifs associés, compromission de la fonctionnalité NFT du challenge.

**Gravité** : Élevée (CVSS 7.5) - CWE-798 (Use of Hard-coded Credentials)

### Vulnérabilité 8: Construction de requêtes de base de données à partir de données utilisateur non validées
**Description** : Les requêtes de base de données dans `routes/createProductReviews.ts` utilisaient directement les paramètres `req.params.id`, `req.body.author` et `req.body.message` sans validation préalable, permettant potentiellement des attaques d'injection NoSQL ou des données malformées.

**Localisation** : `routes/createProductReviews.ts`, lignes 24-26, dans la fonction `createProductReviews()`.

**Impact** : Injection NoSQL possible, corruption de données, erreurs d'application, ou comportements inattendus dus à des données invalides.

**Gravité** : Moyenne (CVSS 6.5) - CWE-20 (Improper Input Validation)

## 4. Mesures correctives

### Correctif 1: Externalisation de la clé privée RSA
**Description détaillée** : Remplacement de la constante codée en dur par une variable d'environnement `JWT_PRIVATE_KEY`.

**Justification technique** : Les secrets ne doivent jamais être stockés dans le code source. L'utilisation de variables d'environnement permet une gestion sécurisée et évite l'exposition accidentelle.

**Extraits de code corrigés** :
```typescript
// Avant
const privateKey = '-----BEGIN RSA PRIVATE KEY-----...'

// Après
const privateKey = process.env.JWT_PRIVATE_KEY ?? 'placeholder-private-key'
```

**Références** : OWASP ASVS 2.10.4, CWE-798

**Effets attendus** : Élimination de l'exposition de la clé privée, maintien de la fonctionnalité d'authentification.

### Correctif 2: Externalisation du secret HMAC
**Description détaillée** : Remplacement du mot de passe HMAC codé en dur par la variable d'environnement `HMAC_SECRET`.

**Justification technique** : Cohérence avec la gestion des secrets, prévention de l'exposition de credentials compromis.

**Extraits de code corrigés** :
```typescript
// Avant
export const hmac = (data: string) => crypto.createHmac('sha256', 'pa4qacea4VK9t9nGv7yZtwmj').update(data).digest('hex')

// Après
export const hmac = (data: string) => crypto.createHmac('sha256', process.env.HMAC_SECRET ?? 'default-secret').update(data).digest('hex')
```

**Références** : OWASP ASVS 2.10.4

**Effets attendus** : Sécurisation des calculs HMAC, prévention de l'utilisation de secrets compromis.

### Correctif 3: Sécurisation du workflow GitHub
**Description détaillée** : Suppression du paramètre `branch` utilisant des données user-controlled.

**Justification technique** : Prévention des injections via les noms de branches, utilisation du comportement par défaut sécurisé.

**Configuration corrigée** :
```yaml
# Avant
with:
  branch: ${{ github.head_ref }}

# Après
# Paramètre branch omis - utilise la branche actuelle par défaut
```

**Références** : OWASP ASVS 14.2.1 (CI/CD Security)

**Effets attendus** : Élimination du risque d'injection, maintien de la fonctionnalité de commit automatique.

### Correctif 4: Conformité Angular
**Description détaillée** : Renommage des outputs Angular pour éviter les conflits avec les événements DOM.

**Justification technique** : Respect des bonnes pratiques Angular, prévention des bugs d'interface utilisateur.

**Extraits de code corrigés** :
```typescript
// Avant
@Output() onBlur = new EventEmitter<string>()

// Après
@Output() searchBlur = new EventEmitter<string>()
```

**Références** : Angular Style Guide, CWE-710

**Effets attendus** : Amélioration de la stabilité de l'interface utilisateur.

### Correctif 5: Correction du format PEM
**Description détaillée** : Utilisation de guillemets dans .env pour préserver les sauts de ligne de la clé PEM.

**Justification technique** : Les fichiers .env nécessitent un formatage spécial pour les chaînes multilignes.

**Configuration corrigée** :
```env
# Format incorrect
JWT_PRIVATE_KEY=-----BEGIN...\n...

# Format correct
JWT_PRIVATE_KEY="-----BEGIN...
..."
```

**Références** : Documentation dotenv

**Effets attendus** : Fonctionnement correct de la cryptographie RSA, restauration de l'authentification.

### Correctif 6: Validation stricte des entrées pour exécution dynamique
**Description détaillée** : Ajout d'une validation par expression régulière pour limiter les entrées utilisateur à des expressions mathématiques simples uniquement.

**Justification technique** : L'exécution dynamique de code basé sur des entrées utilisateur est extrêmement dangereuse. La validation stricte réduit le risque d'injection tout en préservant la fonctionnalité du challenge.

**Extraits de code corrigés** :
```typescript
// Validation ajoutée
if (!/^[0-9+\-*/()\s.]+$/.test(orderLinesData)) {
  return next(new Error('Invalid order data format'))
}
```

**Références** : OWASP ASVS 5.2.4 (Input Validation), CWE-94

**Effets attendus** : Prévention des injections de code tout en permettant les calculs mathématiques légitimes pour le challenge.

### Correctif 7: Externalisation de la seed phrase Ethereum
**Description détaillée** : Remplacement de la seed phrase codée en dur par une variable d'environnement `MNEMONIC_SECRET`.

**Justification technique** : Les seed phrases Ethereum sont des secrets critiques qui ne doivent jamais être exposés dans le code source. Leur compromission peut entraîner la perte d'actifs numériques.

**Extraits de code corrigés** :
```typescript
// Avant
const mnemonic = 'crazy dawn invite tumble pool area ...'

// Après
const mnemonic = process.env.MNEMONIC_SECRET ?? 'default mnemonic phrase'
```

**Références** : OWASP ASVS 2.10.4, CWE-798

**Effets attendus** : Sécurisation de la seed phrase Ethereum, prévention de l'accès non autorisé aux portefeuilles associés.

### Correctif 8: Validation stricte des entrées pour les requêtes de base de données
**Description détaillée** : Ajout d'une validation complète des paramètres utilisateur avant leur utilisation dans les requêtes de base de données.

**Justification technique** : Les données utilisateur non validées peuvent causer des injections NoSQL, des erreurs d'application, ou des corruptions de données. Une validation stricte empêche ces attaques et assure l'intégrité des données.

**Extraits de code corrigés** :
```typescript
// Validation ajoutée
const productId = parseInt(req.params.id)
if (isNaN(productId) || productId <= 0) {
  return res.status(400).json({ error: 'Invalid product ID' })
}

const { author, message } = req.body
if (!author || typeof author !== 'string' || author.trim().length === 0 || author.length > 100) {
  return res.status(400).json({ error: 'Invalid author name' })
}

if (!message || typeof message !== 'string' || message.trim().length === 0 || message.length > 1000) {
  return res.status(400).json({ error: 'Invalid message content' })
}

// Utilisation des données validées
await reviewsCollection.insert({
  product: productId,
  message: sanitizedMessage,
  author: sanitizedAuthor,
  likesCount: 0,
  likedBy: []
})
```

**Références** : OWASP ASVS 5.2.4 (Input Validation), CWE-20

**Effets attendus** : Prévention des injections NoSQL, validation des données utilisateur, amélioration de la robustesse de l'application.

## 5. Recommandations supplémentaires

### Améliorations possibles
- Migration vers un service de gestion de secrets (Vault, AWS Secrets Manager)
- Implémentation de rotation automatique des clés
- Ajout de tests de sécurité automatisés
- Mise en place de code reviews obligatoires pour les changements de sécurité

### Mesures de durcissement global
- Activation de l'analyse de sécurité dans la CI/CD
- Mise en place de pre-commit hooks pour détecter les secrets
- Audit régulier des dépendances

### Tests de non-régression proposés
- Test d'authentification JWT après chaque déploiement
- Vérification de l'absence de secrets dans les commits
- Validation du format des clés cryptographiques
- Test des challenges RCE avec entrées malveillantes pour vérifier la validation
- Test des workflows GitHub avec différents noms de branches