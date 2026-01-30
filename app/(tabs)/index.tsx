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

// Import your new modular logic
import { fetchCurrentGasPrice } from '../../services/gas-service';
import { calculateDrivingTotal, estimateUberCost } from '../../utils/calculations';

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY!;
const PLACEHOLDER_COLOR = '#666'; 
const INPUT_COLOR = '#000';

export default function HomeScreen() {
  // Car State
  const [carYear, setCarYear] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [mpg, setMpg] = useState<number | null>(null);

  // Trip State
  const [origin, setOrigin] = useState<any>(null);
  const [parkingCost, setParkingCost] = useState('15.00'); 
  const [gasCost, setGasCost] = useState<string | null>(null);
  const [uberEstimate, setUberEstimate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // This still lives here as it's a simple fetch triggered by UI input
  const handleFetchMpg = async () => {
    if (!carYear || !make || !model) return;
    try {
      const res = await axios.get(
        `https://www.fueleconomy.gov/feg/ws/rest/vehicle/menu/options`,
        { params: { year: carYear, make, model }, headers: { Accept: 'application/json' } }
      );
      const vehicleId = res.data.menuItem?.[0]?.value;
      if (!vehicleId) return;

      const detailRes = await axios.get(
        `https://www.fueleconomy.gov/feg/ws/rest/vehicle/${vehicleId}`,
        { headers: { Accept: 'application/json' } }
      );
      setMpg(detailRes.data.comb08);
    } catch (e) {
      setMpg(null);
    }
  };

  const calculateTrip = async (destinationData: any, destinationDetails: any) => {
    if (!origin || !mpg) {
      alert('Please complete car info and starting location.');
      return;
    }

    setLoading(true);
    try {
      // 1. Get Distance from Google
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

      const miles = distRes.data.rows[0].elements[0].distance.value * 0.000621371;

      // 2. Fetch Live Gas Price (from service)
      const currentGasPrice = await fetchCurrentGasPrice();

      // 3. Calculate Driving Cost (from util)
      const drivingTotal = calculateDrivingTotal(
        miles, 
        mpg, 
        currentGasPrice, 
        parseFloat(parkingCost)
      );
      setGasCost(drivingTotal);

      // 4. Estimate Uber Cost (from util)
      const uber = estimateUberCost(miles);
      setUberEstimate(`$${uber}`);

    } catch (e) {
      console.error("Calculation Error:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ height: 60 }} />
      <Text style={styles.title}>WayWise</Text>
      <View style={{ height: 30 }} />

      {/* CAR INFO CARD */}
      <View style={styles.card}>
        <TextInput
          style={styles.input}
          value={carYear}
          onChangeText={setCarYear}
          onBlur={handleFetchMpg}
          placeholder="Year"
          placeholderTextColor={PLACEHOLDER_COLOR}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          value={make}
          onChangeText={setMake}
          onBlur={handleFetchMpg}
          placeholder="Make"
          placeholderTextColor={PLACEHOLDER_COLOR}
        />
        <TextInput
          style={styles.input}
          value={model}
          onChangeText={setModel}
          onBlur={handleFetchMpg}
          placeholder="Model"
          placeholderTextColor={PLACEHOLDER_COLOR}
        />
        {mpg && <Text style={styles.mpgText}>Efficiency: {mpg} MPG</Text>}
      </View>

      <View style={{ height: 20 }} />

      {/* PARKING INPUT */}
      <View style={styles.card}>
        <Text style={styles.label}>Expected Parking Fee ($)</Text>
        <TextInput
          style={styles.input}
          value={parkingCost}
          onChangeText={setParkingCost}
          keyboardType="numeric"
          placeholder="0.00"
        />
      </View>

      <View style={{ height: 40 }} />

      {/* LOCATION SEARCH */}
      <GooglePlacesAutocomplete
        placeholder="Start Location"
        fetchDetails
        onPress={(data, details = null) => setOrigin({ ...data, ...details })}
        query={{ key: GOOGLE_MAPS_API_KEY, language: 'en' }}
        styles={placesStyles}
      />

      <View style={{ height: 16 }} />

      <GooglePlacesAutocomplete
        placeholder="Destination"
        fetchDetails
        onPress={calculateTrip}
        query={{ key: GOOGLE_MAPS_API_KEY, language: 'en' }}
        styles={placesStyles}
      />

      <View style={{ height: 40 }} />

      {loading && <ActivityIndicator size="large" color="#000" />}

      {/* RESULTS COMPARISON */}
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

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E3F2FD' },
  scrollContent: { paddingHorizontal: 20 },
  title: { fontSize: 42, fontWeight: '900', textAlign: 'center', color: INPUT_COLOR },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 14, gap: 10 },
  label: { fontSize: 14, color: INPUT_COLOR, fontWeight: '600' },
  input: { borderBottomWidth: 1, borderColor: '#ccc', padding: 8, color: INPUT_COLOR },
  mpgText: { marginTop: 5, fontWeight: 'bold', color: '#2E7D32' },
  resultCard: { backgroundColor: '#fff', padding: 20, borderRadius: 14, marginTop: 15, elevation: 2 },
  resultLabel: { fontSize: 14, color: '#555' },
  resultValue: { fontSize: 32, fontWeight: 'bold', color: INPUT_COLOR },
});

const placesStyles = {
  textInput: { height: 50, borderRadius: 8, borderWidth: 1, borderColor: '#000', paddingHorizontal: 12 },
};