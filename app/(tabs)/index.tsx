import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function App() {
  // We'll eventually replace these with API selectors
  const [mpg, setMpg] = useState('25');
  const [gasPrice, setGasPrice] = useState('4.50');
  const [distance, setDistance] = useState('10');
  const [totalCost, setTotalCost] = useState<string | null>(null);

  const calculateCost = () => {
    const cost = (parseFloat(distance) / parseFloat(mpg)) * parseFloat(gasPrice);
    setTotalCost(cost.toFixed(2));
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Waywise Breakdown</Text>
      </View>
      
      <View style={styles.card}>
        <Text style={styles.sectionHeader}>Your Vehicle</Text>
        <Text style={styles.description}>We'll pull your MPG automatically soon.</Text>
        
        <Text style={styles.label}>Car MPG:</Text>
        <TextInput style={styles.input} keyboardType="numeric" onChangeText={setMpg} value={mpg} />

        <View style={styles.divider} />

        <Text style={styles.sectionHeader}>Trip Details</Text>
        <Text style={styles.label}>Current Gas Price ($):</Text>
        <TextInput style={styles.input} keyboardType="numeric" onChangeText={setGasPrice} value={gasPrice} />

        <Text style={styles.label}>Destination Distance (miles):</Text>
        <TextInput style={styles.input} keyboardType="numeric" onChangeText={setDistance} value={distance} />

        <TouchableOpacity style={styles.button} onPress={calculateCost}>
          <Text style={styles.buttonText}>Compare Options</Text>
        </TouchableOpacity>

        {totalCost && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultLabel}>Driving Cost</Text>
            <Text style={styles.resultValue}>${totalCost}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#E3F2FD', alignItems: 'center', padding: 20 },
  header: { marginTop: 60, marginBottom: 20 },
  title: { fontSize: 32, fontWeight: '900', color: '#01579B' },
  sectionHeader: { fontSize: 18, fontWeight: '700', color: '#0277BD', marginBottom: 5 },
  description: { fontSize: 12, color: '#546E7A', marginBottom: 10 },
  card: {
    backgroundColor: '#fff',
    width: '100%',
    borderRadius: 25,
    padding: 25,
    shadowColor: '#ADD8E6', // Light Blue shadow
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  label: { fontSize: 14, fontWeight: '600', color: '#455A64', marginTop: 15 },
  input: { 
    height: 50, 
    backgroundColor: '#F1F8FB', 
    borderRadius: 12, 
    paddingHorizontal: 15, 
    marginTop: 8,
    fontSize: 16,
    color: '#01579B'
  },
  divider: { height: 1, backgroundColor: '#E1F5FE', marginVertical: 20 },
  button: { 
    backgroundColor: '#81D4FA', // Beautiful Light Blue
    padding: 20, 
    borderRadius: 15, 
    marginTop: 25, 
    alignItems: 'center' 
  },
  buttonText: { color: '#01579B', fontSize: 18, fontWeight: 'bold' },
  resultContainer: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#E1F5FE',
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#B3E5FC'
  },
  resultLabel: { fontSize: 14, color: '#0288D1', textTransform: 'uppercase', fontWeight: 'bold' },
  resultValue: { fontSize: 36, color: '#01579B', fontWeight: '900' }
});