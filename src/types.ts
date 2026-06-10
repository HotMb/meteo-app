// src/types.ts
export type City = {
  id?: number;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
};

export type WeatherDetails = {
  temperature: number;
  feelsLike: number;
  tempMin: number;
  tempMax: number;
  description: string;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  rain: number;
  sunrise: string;
  sunset: string;
  lastUpdated: string;
};