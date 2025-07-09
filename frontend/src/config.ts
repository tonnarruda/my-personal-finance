// Configuração da API
const getApiBaseUrl = (): string => {
  const envUrl = process.env.REACT_APP_API_BASE_URL;
  
  if (envUrl) {
    console.log('Using environment API URL:', envUrl);
    return envUrl;
  }
  
  // Fallback para produção
  const isProduction = window.location.hostname !== 'localhost';
  const defaultUrl = isProduction 
    ? 'https://my-personal-finance.onrender.com/api'
    : 'http://localhost:8080/api';
    
  console.log('Using default API URL:', defaultUrl);
  return defaultUrl;
};

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl()
}; 