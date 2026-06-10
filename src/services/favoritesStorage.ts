import { Storage } from 'expo-storage';
import { City } from '../types';

const KEY = 'favorites';

export async function getFavorites(): Promise<City[]> {
  try {
    const json = await Storage.getItem({ key: KEY });
    if (!json) return [];
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.log('Erreur lecture favoris', e);
    return [];
  }
}

export async function saveFavorites(favorites: City[]): Promise<void> {
  try {
    const json = JSON.stringify(favorites);
    await Storage.setItem({
      key: KEY,
      value: json,
    });
  } catch (e) {
    console.log('Erreur sauvegarde favoris', e);
  }
}