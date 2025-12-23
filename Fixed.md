# Corrections des Failles

## Faille 1: Output bindings nommés avec "on" ou préfixés par "on"

**Problème :** Dans le composant `mat-search-bar.component.ts`, les propriétés `@Output` étaient nommées `onBlur`, `onClose`, `onEnter`, `onFocus`, `onOpen`, ce qui viole la convention Angular interdisant les noms d'événements de sortie identiques aux événements DOM standards ou préfixés par "on".

**Localisation :**
- Fichier : `frontend/src/app/mat-search-bar/mat-search-bar.component.ts` (lignes 55-59)
- Utilisation : `frontend/src/app/navbar/navbar.component.html` (ligne 27)

**Solution apportée :** Renommé les outputs en `searchBlur`, `searchClose`, `searchEnter`, `searchFocus`, `searchOpen` pour éviter les conflits avec les événements DOM. Mis à jour toutes les émissions dans les méthodes du composant et l'utilisation dans le template parent.

**Explication :** Cette correction empêche les conflits potentiels avec les événements DOM natifs, améliorant la lisibilité et la conformité aux bonnes pratiques Angular, réduisant ainsi les risques de bugs inattendus lors de la liaison d'événements.