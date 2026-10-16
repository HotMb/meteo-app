# Météo

Application mobile développée avec React Native et Expo. Elle affiche la météo d'une ville, permet de chercher des lieux et conserve une liste de favoris sur l'appareil.

## Parcours disponibles

- Météo de la position actuelle après autorisation de géolocalisation.
- Recherche d'une ville et suggestions après trois caractères.
- Détail des températures, de l'humidité et des conditions météo.
- Ajout et retrait de villes favorites, enregistrées avec AsyncStorage.

Les données viennent des API Open-Meteo de géocodage et de prévision. L'application n'a pas besoin d'une clé API côté client.

## Stack

React Native 0.81 · React 19 · Expo SDK 54 · Expo Router · TypeScript · Axios · AsyncStorage · Expo Location

## Lancer le projet

Prérequis : Node.js et npm.

    npm install
    npm start

Pour ouvrir une cible particulière :

    npm run android
    npm run ios
    npm run web

## Structure

- app/index.tsx : météo de la position et recherche de villes.
- app/details.tsx : détail météo et gestion des favoris.
- src/services/weatherApi.ts : appels aux API Open-Meteo.
- src/services/favoritesStorage.ts : stockage local des favoris.

Le dépôt reste un projet d'application mobile. Il ne fournit pas de service météo côté serveur.


