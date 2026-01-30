import axios from 'axios';
import { GAS_API_KEY } from '@env';

export const fetchCurrentGasPrice = async () => {
  try {
    // Fetches the latest Weekly U.S. All Grades All Formulations Retail Gasoline Price
    const response = await axios.get(
      `https://api.eia.gov/v2/petroleum/pri/gnd/data/?api_key=${GAS_API_KEY}&frequency=weekly&data[0]=value&sort[0][column]=period&sort[0][direction]=desc&size=1`
    );
    return response.data.response.data[0].value; 
  } catch (error) {
    console.error("Gas API error:", error);
    return 4.85; // Intelligent fallback
  }
};