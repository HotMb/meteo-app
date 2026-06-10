// app/index.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Button,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { City, WeatherDetails } from '../src/types';
import { getWeatherForCoords, searchCityByName, searchCitiesByName } from '../src/services/weatherApi';
import { getFavorites } from '../src/services/favoritesStorage';

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

  // 1) Géo + météo position actuelle : une seule fois au montage
  useEffect(() => {
    fetchCurrentLocationWeather();
  }, []);

  // 2) Favoris : rafraîchis à chaque fois que l’écran est focus
  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [])
  );

  // 3) Suggestions : debounce + arrêt auto si moins de 3 caractères
  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 3) {
      setSuggestions([]);
      setIsLoadingSuggestions(false);
      return;
    }

    const timeout = setTimeout(() => {
      fetchSuggestions(query.toLowerCase());
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const loadFavorites = async () => {
    try {
      const favs = await getFavorites();
      setFavorites(favs);
    } catch (e) {
      console.log(e);
    } finally {
      setIsLoadingFavorites(false);
    }
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

  const handleChangeSearch = (text: string) => {
    setSearchQuery(text);
    if (searchError) setSearchError(null);
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
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.appTitle}>Météo</Text>
        <Text style={styles.subtitle}>Vos villes en un coup d'œil</Text>

        {/* Barre de recherche */}
        <View style={styles.searchCard}>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher une ville"
            placeholderTextColor="#b0c4de"
            value={searchQuery}
            onChangeText={handleChangeSearch}
          />
          <Button title="OK" onPress={handleSearchCity} />
        </View>
        {searchError && <Text style={styles.error}>{searchError}</Text>}

        {isLoadingSuggestions && <ActivityIndicator color="#fff" />}

        {suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            {suggestions.map((item) => (
              <TouchableOpacity
                key={item.id ?? `${item.name}-${item.country}`}
                style={styles.suggestionItem}
                onPress={() => handleSelectSuggestion(item)}
              >
                <Text style={styles.suggestionText}>
                  {item.name}, {item.country}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Carte position actuelle */}
        <Text style={styles.sectionLabel}>Ma position</Text>
        <View style={styles.currentCard}>
          {isLoadingCurrent ? (
            <ActivityIndicator color="#fff" />
          ) : geoError ? (
            <Text style={styles.error}>{geoError}</Text>
          ) : currentWeather ? (
            <>
              <Text style={styles.currentCity}>Votre position</Text>
              <Text style={styles.currentTemp}>{Math.round(currentWeather.temperature)}°</Text>
              <Text style={styles.currentDescription}>{currentWeather.description}</Text>
              <Text style={styles.feelsLike}>
                Ressenti : {Math.round(currentWeather.feelsLike)}°
              </Text>

              <View style={styles.minMaxRow}>
                <Text style={styles.minMaxLabel}>
                  Min {Math.round(currentWeather.tempMin)}°
                </Text>
                <Text style={styles.minMaxLabel}>
                  Max {Math.round(currentWeather.tempMax)}°
                </Text>
              </View>
            </>
          ) : (
            <Text style={styles.infoText}>Aucune donnée météo pour le moment</Text>
          )}
        </View>

        {/* Favoris */}
        <Text style={styles.sectionTitle}>VILLES FAVORITES</Text>
        {isLoadingFavorites ? (
          <ActivityIndicator color="#fff" />
        ) : favorites.length === 0 ? (
          <Text style={styles.infoText}>
            Ajoutez des villes aux favoris depuis la page détail.
          </Text>
        ) : (
          <View style={styles.favoritesRowWrap}>
            {favorites.map((item) => (
              <TouchableOpacity
                key={item.id ?? item.name}
                style={styles.favoriteCard}
                onPress={() => goToDetails(item)}
              >
                <Text style={styles.favoriteCity}>{item.name}</Text>
                <Text style={styles.favoriteCountry}>{item.country}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#05224c' },
  container: { padding: 16, paddingBottom: 32 },
  appTitle: { fontSize: 26, fontWeight: '700', color: '#ffffff', marginTop: 8 },
  subtitle: { fontSize: 14, color: '#b0c4de', marginBottom: 16 },
  searchCard: {
    backgroundColor: '#0c315f',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  searchInput: { flex: 1, color: '#ffffff', marginRight: 8 },
  suggestionsContainer: {
    backgroundColor: '#0c315f',
    borderRadius: 16,
    marginBottom: 16,
    paddingVertical: 4,
  },
  suggestionItem: { paddingHorizontal: 16, paddingVertical: 8 },
  suggestionText: { color: '#ffffff' },
  sectionLabel: { marginTop: 16, marginBottom: 8, color: '#b0c4de', fontSize: 13 },
  currentCard: { backgroundColor: '#0c315f', borderRadius: 24, padding: 16 },
  currentCity: { color: '#ffffff', fontSize: 14, marginBottom: 4 },
  currentTemp: { color: '#ffffff', fontSize: 40, fontWeight: '700' },
  currentDescription: { color: '#ffffff', fontSize: 16, marginTop: 4 },
  feelsLike: { color: '#b0c4de', fontSize: 13, marginTop: 4 },
  minMaxRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  minMaxLabel: { color: '#b0c4de', fontSize: 13 },
  sectionTitle: { marginTop: 24, marginBottom: 8, color: '#ffffff', fontSize: 14, fontWeight: '600' },
  favoritesRowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  favoriteCard: {
    backgroundColor: '#0c315f',
    borderRadius: 20,
    padding: 12,
    marginBottom: 12,
    width: '48%',
  },
  favoriteCity: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  favoriteCountry: { color: '#b0c4de', fontSize: 12, marginTop: 4 },
  error: { color: '#ff6b6b', marginTop: 4 },
  infoText: { color: '#b0c4de', marginTop: 4 },
});