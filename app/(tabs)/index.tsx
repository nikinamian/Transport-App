import axios from 'axios';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY!;
const UBER_API_KEY = process.env.EXPO_PUBLIC_UBER_API_KEY!;


const PLACEHOLDER_COLOR = '#666'; 
const INPUT_COLOR = '#000';

export default function HomeScreen() {
  const [carYear, setCarYear] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [mpg, setMpg] = useState<number | null>(null);

  const [origin, setOrigin] = useState<any>(null);
  const [gasCost, setGasCost] = useState<string | null>(null);
  const [uberEstimate, setUberEstimate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!carYear || !make || !model) return;

    const fetchMpg = async () => {
      try {
        const res = await axios.get(
          `https://www.fueleconomy.gov/feg/ws/rest/vehicle/menu/options`,
          {
            params: { year: carYear, make, model },
            headers: { Accept: 'application/json' },
          }
        );

        const vehicleId = res.data.menuItem?.[0]?.value;
        if (!vehicleId) return;

        const detailRes = await axios.get(
          `https://www.fueleconomy.gov/feg/ws/rest/vehicle/${vehicleId}`,
          { headers: { Accept: 'application/json' } }
        );

        setMpg(detailRes.data.comb08);
      } catch {
        setMpg(null);
      }
    };

    fetchMpg();
  }, [carYear, make, model]);

  const calculateTrip = async (destinationData: any, destinationDetails: any) => {
    if (!origin || !mpg) {
      alert('Please complete car info and starting location.');
      return;
    }

    setLoading(true);
    try {
      const distRes = await axios.get(
        `https://maps.googleapis.com/maps/api/distancematrix/json`,
        {
          params: {
            origins: `place_id:${origin.place_id}`,
            destinations: `place_id:${destinationData.place_id}`,
            key: GOOGLE_MAPS_API_KEY,
          },
        }
      );

      const meters =
        distRes.data.rows[0].elements[0].distance.value;
      const miles = meters * 0.000621371;

      const gasPrice = 4.85;
      setGasCost(((miles / mpg) * gasPrice).toFixed(2));

      const start = origin.geometry.location;
      const end = destinationDetails.geometry.location;

      const uberRes = await axios.get(
        `https://api.uber.com/v1.2/estimates/price`,
        {
          params: {
            start_latitude: start.lat,
            start_longitude: start.lng,
            end_latitude: end.lat,
            end_longitude: end.lng,
          },
          headers: {
            Authorization: `Token ${UBER_API_KEY}`,
          },
        }
      );

      setUberEstimate(uberRes.data.prices[0].estimate);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={{ height: 30 }} />

      <Text style={styles.title}>WayWise</Text>

      <View style={{ height: 30 }} />

      {/* CAR INFO */}
      <View style={styles.card}>
        <Text style={styles.label}>Car Year</Text>
        <TextInput
          style={styles.input}
          value={carYear}
          onChangeText={setCarYear}
          keyboardType="numeric"
          placeholder="e.g. 2021"
          placeholderTextColor={PLACEHOLDER_COLOR}
        />

        <Text style={styles.label}>Make</Text>
        <TextInput
          style={styles.input}
          value={make}
          onChangeText={setMake}
          placeholder="e.g. Toyota"
          placeholderTextColor={PLACEHOLDER_COLOR}
        />

        <Text style={styles.label}>Model</Text>
        <TextInput
          style={styles.input}
          value={model}
          onChangeText={setModel}
          placeholder="e.g. Camry"
          placeholderTextColor={PLACEHOLDER_COLOR}
        />

        {mpg && <Text style={styles.mpgText}>{mpg} MPG</Text>}
      </View>

      <View style={{ height: 60 }} />

      {/* FROM */}
      <GooglePlacesAutocomplete
        placeholder="From"
        fetchDetails
        onPress={(data, details = null) =>
          setOrigin({ ...data, ...details })
        }
        query={{ key: GOOGLE_MAPS_API_KEY, language: 'en' }}
        styles={placesStyles}
        textInputProps={{
          placeholderTextColor: PLACEHOLDER_COLOR,
        }}
      />

      <View style={{ height: 16 }} />

      {/* TO */}
      <GooglePlacesAutocomplete
        placeholder="To"
        fetchDetails
        onPress={calculateTrip}
        query={{ key: GOOGLE_MAPS_API_KEY, language: 'en' }}
        styles={placesStyles}
        textInputProps={{
          placeholderTextColor: PLACEHOLDER_COLOR,
        }}
      />

      <View style={{ height: 50 }} />

      {loading && <ActivityIndicator size="large" />}

      {gasCost && (
        <View style={styles.resultCard}>
          <Text style={styles.resultLabel}>Driving Cost</Text>
          <Text style={styles.resultValue}>${gasCost}</Text>
        </View>
      )}

      {uberEstimate && (
        <View style={styles.resultCard}>
          <Text style={styles.resultLabel}>UberX Estimate</Text>
          <Text style={styles.resultValue}>{uberEstimate}</Text>
        </View>
      )}

      {/* MASSIVE scroll buffer */}
      <View style={{ height: 220 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E3F2FD',
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    textAlign: 'center',
    color: INPUT_COLOR,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 14,
  },
  label: {
    fontSize: 14,
    marginTop: 10,
    marginBottom: 4,
    color: INPUT_COLOR,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 8,
    padding: 10,
    color: INPUT_COLOR,
  },
  mpgText: {
    marginTop: 10,
    fontWeight: 'bold',
    color: INPUT_COLOR,
  },
  resultCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 14,
    marginTop: 20,
  },
  resultLabel: {
    fontSize: 14,
    color: INPUT_COLOR,
  },
  resultValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: INPUT_COLOR,
  },
});

const placesStyles = {
  container: {
    flex: 0,
  },
  textInputContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 8,
  },
  textInput: {
    height: 50,
    backgroundColor: '#fff',
    color: INPUT_COLOR, // user input = black
    fontSize: 16,
    paddingHorizontal: 12,
  },
  listView: {
    backgroundColor: '#fff',
  },
};
