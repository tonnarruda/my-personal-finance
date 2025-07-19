import { exchangeRateService } from './api';

describe('Exchange Rate Service', () => {
  it('should fetch exchange rate between USD and BRL', async () => {
    try {
      const rate = await exchangeRateService.getExchangeRate('USD', 'BRL');
      console.log('Exchange rate USD to BRL:', rate);
      expect(rate).toBeGreaterThan(0);
      expect(typeof rate).toBe('number');
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      throw error;
    }
  });

  it('should fetch exchange rate between BRL and USD', async () => {
    try {
      const rate = await exchangeRateService.getExchangeRate('BRL', 'USD');
      console.log('Exchange rate BRL to USD:', rate);
      expect(rate).toBeGreaterThan(0);
      expect(typeof rate).toBe('number');
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      throw error;
    }
  });
}); 