export const calculateDrivingTotal = (miles: number, mpg: number, gasPrice: number, parkingFee: number = 0) => {
    const fuelCost = (miles / mpg) * gasPrice;
    return (fuelCost + parkingFee).toFixed(2);
  };
  
  export const estimateUberCost = (miles: number) => {
    // If Uber API is restricted, use a standard base estimate for LA/Major cities:
    // Base ($2.50) + Per Mile ($1.35) + Booking Fee ($3.00)
    const estimate = 2.50 + (miles * 1.35) + 3.00;
    return estimate.toFixed(2);
  };