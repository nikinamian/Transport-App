import axios from 'axios';

const GAS_API_KEY = process.env.EXPO_PUBLIC_GAS_API_KEY ?? '';

export const fetchCurrentGasPrice = async (): Promise<number> => {
  if (!GAS_API_KEY) {
    console.warn('Missing GAS API key, using fallback');
    return 4.85;
  }

  try {
    const response = await axios.get(
      'https://api.eia.gov/v2/petroleum/pri/gnd/data/',
      {
        params: {
          api_key: GAS_API_KEY,
          frequency: 'weekly',
          'data[0]': 'value',
          'sort[0][column]': 'period',
          'sort[0][direction]': 'desc',
          size: 1,
        },
      }
    );

    return response.data.response.data[0].value;
  } catch (error) {
    console.error('Gas API error:', error);
    return 4.85; // smart fallback
  }
};
