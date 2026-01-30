import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import axios from 'axios';

import { fetchCurrentGasPrice } from '../../services/gas-service';
import {
  calculateDrivingTotal,
  estimateUberCost,
} from '../../utils/calculations';

const GOOGLE_MAPS_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

const PLACEHOLDER_COLOR = '#666';
const INPUT_COLOR = '#000';

export default function HomeScreen() {
  // Car state
  const [carYear, setCarYear] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [mpg, setMpg] = useState<number | null>(null);

  // Trip state
  const [origin, setOrigin] = useState<any>(null);
  const [parkingCost, setParkingCost] = useState('15.00');
  const [gasCost, setGasCost] = useState<string | null>(null);
  const [uberEstimate, setUberEstimate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch MPG when car info is entered
  const handleFetchMpg = async () => {
    if (!carYear || !make || !model) return;

    try {
      const res = await axios.get(
        'https://www.fueleconomy.gov/feg/ws/rest/vehicle/menu/options',
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

  const calculateTrip = async (destinationData: any, destinationDetails: any) => {
    if (!origin || !mpg || !GOOGLE_MAPS_API_KEY) {
      alert('Please complete car info and starting location.');
      return;
    }

    setLoading(true);

    try {
      // 1. Distance
      const distRes = await axios.get(
        'https://maps.googleapis.com/maps/api/distancematrix/json',
        {
          params: {
            origins: `place_id:${origin.place_id}`,
            destinations: `place_id:${destinationData.place_id}`,
            key: GOOGLE_MAPS_API_KEY,
          },
        }
      );

      const miles =
        distRes.data.rows[0].elements[0].distance.value * 0.000621371;

      // 2. Gas price (service)
      const gasPrice = await fetchCurrentGasPrice();

      // 3. Driving total (util)
      const drivingTotal = calculateDrivingTotal(
        miles,
        mpg,
        gasPrice,
        parseFloat(parkingCost)
      );
      setGasCost(drivingTotal);

      // 4. Uber estimate (util)
      const uber = estimateUberCost(miles);
      setUberEstimate(`$${uber}`);
    } catch (e) {
      console.error('Calculation error:', e);
    } finally {
      setLoading(false);
    }
  };

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <View style={styles.center}>
        <Text>Missing Google Maps API Key</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={{ height: 60 }} />
      <Text style={styles.title}>WayWise</Text>
      <View style={{ height: 30 }} />

      {/* CAR INFO */}
      <View style={styles.card}>
        <TextInput
          style={styles.input}
          placeholder="Year"
          placeholderTextColor={PLACEHOLDER_COLOR}
          value={carYear}
          onChangeText={setCarYear}
          onBlur={handleFetchMpg}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="Make"
          placeholderTextColor={PLACEHOLDER_COLOR}
          value={make}
          onChangeText={setMake}
          onBlur={handleFetchMpg}
        />
        <TextInput
          style={styles.input}
          placeholder="Model"
          placeholderTextColor={PLACEHOLDER_COLOR}
          value={model}
          onChangeText={setModel}
          onBlur={handleFetchMpg}
        />
        {mpg && <Text style={styles.mpgText}>{mpg} MPG</Text>}
      </View>

      <View style={{ height: 24 }} />

      {/* PARKING */}
      <View style={styles.card}>
        <Text style={styles.label}>Expected Parking Fee ($)</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          placeholderTextColor={PLACEHOLDER_COLOR}
          value={parkingCost}
          onChangeText={setParkingCost}
          keyboardType="numeric"
        />
      </View>

      <View style={{ height: 40 }} />

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

      <View style={{ height: 40 }} />

      {loading && <ActivityIndicator size="large" color="#000" />}

      {gasCost && (
        <View style={styles.resultCard}>
          <Text style={styles.resultLabel}>Driving (Gas + Parking)</Text>
          <Text style={styles.resultValue}>${gasCost}</Text>
        </View>
      )}

      {uberEstimate && (
        <View style={styles.resultCard}>
          <Text style={styles.resultLabel}>UberX Estimate</Text>
          <Text style={styles.resultValue}>{uberEstimate}</Text>
        </View>
      )}

      <View style={{ height: 180 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E3F2FD' },
  scrollContent: { paddingHorizontal: 20 },
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
    gap: 10,
  },
  label: { fontSize: 14, color: INPUT_COLOR, fontWeight: '600' },
  input: {
    borderBottomWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    color: INPUT_COLOR,
  },
  mpgText: { fontWeight: 'bold', color: '#2E7D32' },
  resultCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 14,
    marginTop: 15,
  },
  resultLabel: { fontSize: 14, color: '#555' },
  resultValue: { fontSize: 32, fontWeight: 'bold', color: INPUT_COLOR },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const placesStyles = {
  container: { flex: 0 }, // REQUIRED to prevent Expo crash
  textInput: {
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000',
    paddingHorizontal: 12,
    color: INPUT_COLOR,
  },
  listView: { backgroundColor: '#fff' },
};
