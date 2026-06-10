import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Button, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { City, WeatherDetails } from '../src/types';
import { getWeatherForCoords } from '../src/services/weatherApi';
import { getFavorites, saveFavorites } from '../src/services/favoritesStorage';

export default function DetailsScreen() {
  const params = useLocalSearchParams();
  const cityParam = params.city as string;
  const city: City = JSON.parse(cityParam);

  const [weather, setWeather] = useState<WeatherDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [favorites, setFavorites] = useState<City[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    loadFavoritesAndCheck();
    fetchWeather();
  }, []);

  const loadFavoritesAndCheck = async () => {
    const favs = await getFavorites();
    setFavorites(favs);
    const exists = favs.some((c) => c.name === city.name && c.country === city.country);
    setIsFavorite(exists);
  };

  const fetchWeather = async () => {
    try {
      setIsLoading(true);
      const details = await getWeatherForCoords(city.latitude, city.longitude);
      setWeather(details);
    } catch (e) {
      console.log(e);
      Alert.alert('Erreur', 'Impossible de récupérer la météo de cette ville');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    let updated: City[];
    if (isFavorite) {
      updated = favorites.filter((c) => !(c.name === city.name && c.country === city.country));
    } else {
      updated = [...favorites, city];
    }
    setFavorites(updated);
    setIsFavorite(!isFavorite);
    await saveFavorites(updated);
  };

  if (isLoading || !weather) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text>Chargement des données météo...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.cityName}>{city.name}</Text>
      <Text style={styles.country}>{city.country}</Text>

      <View style={styles.section}>
        <Text>Température actuelle : {weather.temperature}°C</Text>
        <Text>Température ressentie : {weather.feelsLike}°C</Text>
        <Text>Min : {weather.tempMin}°C</Text>
        <Text>Max : {weather.tempMax}°C</Text>
        <Text>Description : {weather.description}</Text>
      </View>

      <View style={styles.section}>
        <Text>Humidité : {weather.humidity}%</Text>
        <Text>Vitesse du vent : {weather.windSpeed} km/h</Text>
        <Text>Direction du vent : {weather.windDirection}°</Text>
        <Text>Pression : {weather.pressure} hPa</Text>
        <Text>Pluie : {weather.rain} mm</Text>
      </View>

      <View style={styles.section}>
        <Text>Lever du soleil : {weather.sunrise}</Text>
        <Text>Coucher du soleil : {weather.sunset}</Text>
      </View>

      <View style={styles.section}>
        <Text>Dernière mise à jour : {weather.lastUpdated}</Text>
      </View>

      <Button
        title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        onPress={handleToggleFavorite}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cityName: { fontSize: 28, fontWeight: 'bold' },
  country: { fontSize: 18, marginBottom: 16 },
  section: { marginTop: 12, marginBottom: 8 },
});