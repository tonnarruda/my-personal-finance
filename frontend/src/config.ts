// Configuração da API
const getApiBaseUrl = (): string => {
  const envUrl = process.env.REACT_APP_API_BASE_URL;
  
  if (envUrl) {
    console.log('[CONFIG] Usando URL da API do env:', envUrl);
    return envUrl;
  }
  
  // Fallback para produção
  const hostname = window.location.hostname;
  const isProduction = hostname !== 'localhost' && hostname !== '127.0.0.1';
  const defaultUrl = isProduction 
    ? 'https://my-personal-finance.onrender.com/api'
    : 'http://localhost:8080/api';
    
  console.log('[CONFIG] Usando URL da API padrão:', defaultUrl);
  console.log('[CONFIG] Hostname:', hostname);
  console.log('[CONFIG] É produção?', isProduction);
  
  return defaultUrl;
};

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl()
}; 