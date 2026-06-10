// app/details.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Button, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { City, WeatherDetails } from '../src/types';
import { getWeatherForCoords } from '../src/services/weatherApi';
import { getFavorites, saveFavorites } from '../src/services/favoritesStorage';

export default function DetailsScreen() {
  const router = useRouter();
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
      <View style={styles.loadingScreen}>
        <ActivityIndicator color="#fff" />
        <Text style={styles.loadingText}>Chargement des données météo...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>‹ Retour</Text>
        </TouchableOpacity>

        {/* Carte principale */}
        <View style={styles.mainCard}>
          <Text style={styles.cityName}>{city.name}</Text>
          <Text style={styles.country}>{city.country}</Text>

          {/* Ici tu pourras ajouter une icône météo plus tard */}
          <Text style={styles.bigTemp}>{Math.round(weather.temperature)}°</Text>
          <Text style={styles.description}>{weather.description}</Text>
          <Text style={styles.feelsLike}>Ressenti : {Math.round(weather.feelsLike)}°</Text>
        </View>

        {/* Détails météo */}
        <Text style={styles.sectionTitle}>DÉTAILS MÉTÉO</Text>
        <View style={styles.detailsCard}>
          <DetailRow label="Min / Max" value={`${Math.round(weather.tempMin)}° / ${Math.round(weather.tempMax)}°`} />
          <DetailRow label="Humidité" value={`${weather.humidity}%`} />
          <DetailRow label="Vent" value={`${weather.windSpeed} km/h`} />
          <DetailRow label="Direction" value={`${weather.windDirection}°`} />
          <DetailRow label="Pression" value={`${weather.pressure} hPa`} />
          <DetailRow label="Pluie" value={`${weather.rain} mm`} />
          <DetailRow label="Lever du soleil" value={weather.sunrise} />
          <DetailRow label="Coucher du soleil" value={weather.sunset} />
        </View>

        <Text style={styles.updateText}>Dernière mise à jour : {weather.lastUpdated}</Text>

        {/* Bouton favoris */}
        <TouchableOpacity
          style={[styles.favoriteButton, isFavorite ? styles.favoriteButtonRemove : styles.favoriteButtonAdd]}
          onPress={handleToggleFavorite}
        >
          <Text style={styles.favoriteButtonText}>
            {isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

type DetailRowProps = {
  label: string;
  value: string | number;
};

const DetailRow: React.FC<DetailRowProps> = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#05224c',
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: '#05224c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 8,
  },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  backText: {
    color: '#b0c4de',
    marginBottom: 16,
  },
  mainCard: {
    backgroundColor: '#0c315f',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  cityName: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
  },
  country: {
    color: '#b0c4de',
    fontSize: 14,
    marginTop: 4,
    marginBottom: 16,
  },
  bigTemp: {
    color: '#ffffff',
    fontSize: 56,
    fontWeight: '700',
  },
  description: {
    color: '#ffffff',
    fontSize: 18,
    marginTop: 8,
  },
  feelsLike: {
    color: '#b0c4de',
    fontSize: 14,
    marginTop: 4,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  detailsCard: {
    backgroundColor: '#0c315f',
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  detailLabel: {
    color: '#b0c4de',
    fontSize: 14,
  },
  detailValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  updateText: {
    color: '#b0c4de',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  favoriteButton: {
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  favoriteButtonAdd: {
    backgroundColor: '#1e90ff',
  },
  favoriteButtonRemove: {
    backgroundColor: '#ff6b6b',
  },
  favoriteButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});