import AsyncStorage from '@react-native-async-storage/async-storage';
import { City } from '../types';

const KEY = '@meteo/favorites';

export async function getFavorites(): Promise<City[]> {
  const json = await AsyncStorage.getItem(KEY);
  if (!json) return [];

  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveFavorites(favorites: City[]): Promise<void> {
  const json = JSON.stringify(favorites);
  await AsyncStorage.setItem(KEY, json);
}
