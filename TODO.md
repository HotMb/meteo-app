# TODO - Corrections erreurs (web + favoris)

## 1) Analyse & causes
- Comprendre la différence entre `expo-storage` (provoque erreur validatePath) et `AsyncStorage`.
- Confirmer quel app est lancée : c'est cella C:\Users\walid\Documents\otmane\Dev Mobile\meteo\meteo app\meteo-app

## 2) Corriger stockage favoris pour le web
- Remplacer `Storage` de `expo-storage` par `@react-native-async-storage/async-storage` dans `meteo app/meteo-app/src/services/favoritesStorage.ts`.
- Retirer toute logique dépendante de `expo-file-system` (non supporté sur web).

## 3) Vérifier dépendances
- S’assurer que `@react-native-async-storage/async-storage` est installé dans `meteo app/meteo-app/package.json`.

## 4) Re-rendre / tester
- Lancer `expo start --web` et vérifier :
  - Pas d’erreur “validatePath is not a function”.
  - Favoris chargent / sauvegardent.
  - Les warnings restants sont acceptables.

## 5) (Optionnel) Nettoyer warnings RN/web
- Remplacer `props.pointerEvents` par `style.pointerEvents` si présent dans le code (si on retrouve la source).

