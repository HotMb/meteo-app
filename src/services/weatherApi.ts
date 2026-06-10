// src/services/weatherApi.ts
import axios from 'axios';
import { City, WeatherDetails } from '../types';

const GEO_BASE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_BASE_URL = 'https://api.open-meteo.com/v1/forecast';

function formatTime(isoString: string): string {
  // Ex: "2026-06-10T05:14" -> "05:14"
  const date = new Date(isoString);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Cherche une ville par son nom (1 résultat)
export async function searchCityByName(name: string): Promise<City | null> {
  const response = await axios.get(GEO_BASE_URL, {
    params: {
      name,
      count: 1,
      language: 'fr',
      format: 'json',
    },
  });

  const data = response.data;
  if (!data.results || data.results.length === 0) {
    return null;
  }

  const city = data.results[0];

  const result: City = {
    id: city.id,
    name: city.name,
    country: city.country,
    latitude: city.latitude,
    longitude: city.longitude,
  };

  return result;
}

// Retourne plusieurs villes pour l’auto-complétion
export async function searchCitiesByName(name: string, limit = 5): Promise<City[]> {
  const response = await axios.get(GEO_BASE_URL, {
    params: {
      name,
      count: limit,
      language: 'fr',
      format: 'json',
    },
  });

  const data = response.data;
  if (!data.results || data.results.length === 0) {
    return [];
  }

  const cities: City[] = data.results.map((city: any) => ({
    id: city.id,
    name: city.name,
    country: city.country,
    latitude: city.latitude,
    longitude: city.longitude,
  }));

  return cities;
}

// Récupère la météo pour des coordonnées
export async function getWeatherForCoords(
  latitude: number,
  longitude: number
): Promise<WeatherDetails> {
  const response = await axios.get(WEATHER_BASE_URL, {
    params: {
      latitude,
      longitude,
      current:
        // SANS "time" sinon 400 Bad Request
        'temperature_2m,apparent_temperature,relative_humidity_2m,pressure_msl,wind_speed_10m,wind_direction_10m,precipitation',
      daily: 'temperature_2m_max,temperature_2m_min,sunrise,sunset',
      timezone: 'auto',
    },
  });

  const data = response.data;
  const current = data.current;
  const daily = data.daily;

  const details: WeatherDetails = {
    temperature: current.temperature_2m,
    feelsLike: current.apparent_temperature,
    tempMin: daily.temperature_2m_min[0],
    tempMax: daily.temperature_2m_max[0],
    description: 'Conditions météo actuelles',
    humidity: current.relative_humidity_2m,
    windSpeed: current.wind_speed_10m,
    windDirection: current.wind_direction_10m,
    pressure: current.pressure_msl,
    rain: current.precipitation ?? 0,
    sunrise: formatTime(daily.sunrise[0]),
    sunset: formatTime(daily.sunset[0]),
    // "time" est renvoyé par l’API même si on ne le met pas dans current
    lastUpdated: formatTime(current.time),
  };

  return details;
}