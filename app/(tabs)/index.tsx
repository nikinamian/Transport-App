import { GOOGLE_MAPS_API_KEY, UBER_API_KEY } from '@env';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

export default function App() {
  // state for vehicle and trip details
  const [carYear, setCarYear] = useState('2024'); 
  const [mpg, setMpg] = useState<number | null>(null);
  const [origin, setOrigin] = useState<any>(null);
  const [gasCost, setGasCost] = useState<string | null>(null);
  const [uberEstimate, setUberEstimate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // fetch mpg dynamically based on car year
  useEffect(() => {
    const fetchMpg = async () => {
      try {
        const res = await axios.get(`https://www.fueleconomy.gov/feg/ws/rest/vehicle/menu/options?year=${carYear}&make=Honda&model=Civic`, {
          headers: { 'Accept': 'application/json' }
        });
        const vehicleId = res.data.menuItem[0].value;
        const detailRes = await axios.get(`https://www.fueleconomy.gov/feg/ws/rest/vehicle/${vehicleId}`, {
          headers: { 'Accept': 'application/json' }
        });
        setMpg(detailRes.data.comb08); 
      } catch (e) {
        setMpg(25); // fallback for missing data
      }
    };
    fetchMpg();
  }, [carYear]);

  const calculateTrip = async (destinationData: any, destinationDetails: any) => {
    if (!origin) {
        alert("please select a starting point first!");
        return;
    }

    setLoading(true);
    try {
      // 1. dynamic distance calculation between two user-selected points
      const distUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=place_id:${origin.place_id}&destinations=place_id:${destinationData.place_id}&key=${GOOGLE_MAPS_API_KEY}`;
      const distRes = await axios.get(distUrl);
      const miles = distRes.data.rows[0].elements[0].distance.value * 0.000621371;

      // 2. gas calculation using dynamic miles and fetched mpg
      if (mpg) {
        const gasPrice = 4.85; // can be automated with a gas api later
        setGasCost(((miles / mpg) * gasPrice).toFixed(2));
      }

      // 3. uber price estimate using dynamic coordinates from both inputs
      const start = origin.geometry.location;
      const end = destinationDetails.geometry.location;
      const uberUrl = `https://api.uber.com/v1.2/estimates/price?start_latitude=${start.lat}&start_longitude=${start.lng}&end_latitude=${end.lat}&end_longitude=${end.lng}`;
      const uberRes = await axios.get(uberUrl, { 
        headers: { 'Authorization': `Token ${UBER_API_KEY}` } 
      });
      setUberEstimate(uberRes.data.prices[0].estimate);

    } catch (e) {
      console.error('calculation error', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>waywise</Text>
      
      {/* car year input - updates mpg state */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>car year</Text>
        <TextInput 
          style={styles.smallInput} 
          value={carYear} 
          onChangeText={setCarYear} 
          keyboardType="numeric"
          placeholder="2024"
        />
        <Text style={styles.mpgInfo}>{mpg ? `${mpg} mpg (honda civic)` : 'fetching mpg...'}</Text>
      </View>

      {/* dynamic origin input */}
      <GooglePlacesAutocomplete
        placeholder='from where?'
        onPress={(data, details = null) => setOrigin({ ...data, ...details })}
        query={{ key: GOOGLE_MAPS_API_KEY, language: 'en' }}
        fetchDetails={true}
        styles={{ container: { flex: 0, marginBottom: 10 }, textInput: styles.searchBar }}
      />

      {/* dynamic destination input */}
      <GooglePlacesAutocomplete
        placeholder='to where?'
        onPress={calculateTrip}
        query={{ key: GOOGLE_MAPS_API_KEY, language: 'en' }}
        fetchDetails={true}
        styles={{ container: { flex: 0, marginBottom: 20 }, textInput: styles.searchBar }}
      />

      {loading && <ActivityIndicator color="#01579B" size="large" />}

      <ScrollView>
        {gasCost && (
          <View style={styles.resCard}>
            <Text style={styles.resLabel}>driving cost</Text>
            <Text style={styles.resVal}>${gasCost}</Text>
          </View>
        )}
        {uberEstimate && (
          <View style={[styles.resCard, { borderLeftColor: '#000' }]}>
            <Text style={styles.resLabel}>uberx estimate</Text>
            <Text style={styles.resVal}>{uberEstimate}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E3F2FD', padding: 20, paddingTop: 60 },
  title: { fontSize: 32, fontWeight: '900', color: '#01579B', marginBottom: 20 },
  inputGroup: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 20 },
  label: { fontSize: 12, color: '#546E7A', textTransform: 'lowercase', marginBottom: 5 },
  smallInput: { borderBottomWidth: 1, borderBottomColor: '#B0BEC5', fontSize: 18, color: '#01579B', paddingVertical: 5 },
  mpgInfo: { fontSize: 11, color: '#90A4AE', marginTop: 5 },
  searchBar: { height: 45, borderRadius: 8, paddingHorizontal: 15, backgroundColor: '#fff', elevation: 2 },
  resCard: { backgroundColor: '#fff', padding: 20, borderRadius: 15, marginBottom: 15, borderLeftWidth: 6, borderLeftColor: '#0288D1' },
  resLabel: { fontSize: 13, color: '#78909C' },
  resVal: { fontSize: 28, fontWeight: 'bold', color: '#01579B' }
});