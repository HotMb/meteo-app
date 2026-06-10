import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Button, FlatList, TextInput, TouchableOpacity } from 'react-native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { City, WeatherDetails } from '../src/types';
import { getWeatherForCoords, searchCityByName, searchCitiesByName  } from '../src/services/weatherApi';
import { getFavorites } from '../src/services/favoritesStorage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

export default function HomeScreen() {
  const router = useRouter();

  const [currentWeather, setCurrentWeather] = useState<WeatherDetails | null>(null);
  const [isLoadingCurrent, setIsLoadingCurrent] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);

  const [favorites, setFavorites] = useState<City[]>([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(true);

  const [suggestions, setSuggestions] = useState<City[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
      fetchCurrentLocationWeather();
    }, [])
  );

  useEffect(() => {
  if (searchQuery.trim().length < 3) {
    setSuggestions([]);
    return;
  }

  const timeout = setTimeout(() => {
    fetchSuggestions(searchQuery.trim());
  }, 400);

  return () => clearTimeout(timeout);
}, [searchQuery]);

  const fetchSuggestions = async (query: string) => {
    try {
      setIsLoadingSuggestions(true);
      const results = await searchCitiesByName(query);
      setSuggestions(results);
    } catch (e) {
      console.log(e);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleSelectSuggestion = (city: City) => {
    setSearchQuery(city.name);
    setSuggestions([]);
    goToDetails(city);
  };

  const loadFavorites = async () => {
    const favs = await getFavorites();
    setFavorites(favs);
    setIsLoadingFavorites(false);
  };

  const fetchCurrentLocationWeather = async () => {
    try {
      setIsLoadingCurrent(true);
      setGeoError(null);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setGeoError('Permission de géolocalisation refusée');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      const weather = await getWeatherForCoords(latitude, longitude);
      setCurrentWeather(weather);
    } catch (e) {
      console.log(e);
      setGeoError('Impossible de récupérer la météo de votre position');
    } finally {
      setIsLoadingCurrent(false);
    }
  };

  const goToDetails = (city: City) => {
    router.push({
      pathname: '/details',
      params: { city: JSON.stringify(city) },
    });
  };

  const handleSearchCity = async () => {
    if (!searchQuery.trim()) return;
    try {
      setSearchError(null);
      const city = await searchCityByName(searchQuery.trim());
      if (!city) {
        setSearchError('Ville introuvable');
        return;
      }
      goToDetails(city);
    } catch (e) {
      console.log(e);
      setSearchError('Erreur lors de la recherche de la ville');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Météo de ma position</Text>
      {isLoadingCurrent ? (
        <ActivityIndicator />
      ) : geoError ? (
        <Text style={styles.error}>{geoError}</Text>
      ) : currentWeather ? (
        <View style={styles.card}>
          <Text>Température: {currentWeather.temperature}°C</Text>
          <Text>Ressenti: {currentWeather.feelsLike}°C</Text>
          <Text>Min: {currentWeather.tempMin}°C / Max: {currentWeather.tempMax}°C</Text>
          <Text>Humidité: {currentWeather.humidity}%</Text>
        </View>
      ) : null}

      <Text style={styles.title}>Rechercher une ville</Text>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ex: Paris"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <Button title="Rechercher" onPress={handleSearchCity} />
      </View>
      {searchError && <Text style={styles.error}>{searchError}</Text>}

      {isLoadingSuggestions && <ActivityIndicator />}

      {suggestions.length > 0 && (
        <FlatList
          data={suggestions}
          keyExtractor={(item) => (item.id ?? `${item.name}-${item.country}`).toString()}
          renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => handleSelectSuggestion(item)}>
          <Text>{item.name}, {item.country}</Text>
          </TouchableOpacity>
        )}
      />
      )}

      <Text style={styles.title}>Villes favorites</Text>
      {isLoadingFavorites ? (
        <ActivityIndicator />
      ) : favorites.length === 0 ? (
        <Text>Aucun favori pour le moment</Text>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => (item.id ?? item.name).toString()}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => goToDetails(item)}>
              <Text>{item.name}, {item.country}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 18, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  card: { padding: 12, borderRadius: 8, backgroundColor: '#eee', marginBottom: 8 },
  error: { color: 'red' },
  searchContainer: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 4, paddingHorizontal: 8, marginRight: 8 },
});