import { GOOGLE_MAPS_API_KEY, UBER_API_KEY } from '@env';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

export default function App() {
  const [mpg, setMpg] = useState<number | null>(null);
  const [gasCost, setGasCost] = useState<string | null>(null);
  const [uberEstimate, setUberEstimate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // automatically fetch honda civic mpg on load
  useEffect(() => {
    const fetchMpg = async () => {
      try {
        const res = await axios.get('https://www.fueleconomy.gov/feg/ws/rest/vehicle/47513', {
          headers: { 'Accept': 'application/json' }
        });
        setMpg(res.data.comb08);
      } catch (e) {
        setMpg(25); // fallback
      }
    };
    fetchMpg();
  }, []);

  const handleTrip = async (data: any, details: any) => {
    setLoading(true);
    try {
      // 1. get distance from google
      const distUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=Santa+Monica+College&destinations=place_id:${data.place_id}&key=${GOOGLE_MAPS_API_KEY}`;
      const distRes = await axios.get(distUrl);
      const miles = distRes.data.rows[0].elements[0].distance.value * 0.000621371;

      // 2. gas math
      if (mpg) setGasCost(((miles / mpg) * 4.85).toFixed(2));

      // 3. uber price
      const dest = details.geometry.location;
      const uberUrl = `https://api.uber.com/v1.2/estimates/price?start_latitude=34.0194&start_longitude=-118.4697&end_latitude=${dest.lat}&end_longitude=${dest.lng}`;
      const uberRes = await axios.get(uberUrl, { headers: { 'Authorization': `Token ${UBER_API_KEY}` } });
      setUberEstimate(uberRes.data.prices[0].estimate);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>waywise</Text>
      
      <View style={styles.carCard}>
        <Text style={styles.label}>active vehicle: 2024 honda civic</Text>
        <Text style={styles.mpg}>{mpg ? `${mpg} mpg` : 'loading...'}</Text>
      </View>

      <GooglePlacesAutocomplete
        placeholder='search destination'
        onPress={handleTrip}
        query={{ key: GOOGLE_MAPS_API_KEY, language: 'en' }}
        fetchDetails={true}
        styles={{ container: { flex: 0, marginBottom: 20 }, textInput: styles.input }}
      />

      {loading && <ActivityIndicator color="#01579B" />}

      <ScrollView>
        {gasCost && (
          <View style={styles.resCard}>
            <Text style={styles.resLabel}>gas cost</Text>
            <Text style={styles.resVal}>${gasCost}</Text>
          </View>
        )}
        {uberEstimate && (
          <View style={[styles.resCard, { borderLeftColor: '#000' }]}>
            <Text style={styles.resLabel}>uberx</Text>
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
  carCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 20 },
  label: { fontSize: 12, color: '#546E7A', textTransform: 'lowercase' },
  mpg: { fontSize: 20, fontWeight: 'bold', color: '#01579B' },
  input: { height: 50, borderRadius: 10, paddingHorizontal: 15, backgroundColor: '#fff' },
  resCard: { backgroundColor: '#fff', padding: 20, borderRadius: 15, marginBottom: 15, borderLeftWidth: 6, borderLeftColor: '#0288D1' },
  resLabel: { fontSize: 13, color: '#78909C' },
  resVal: { fontSize: 28, fontWeight: 'bold', color: '#01579B' }
});