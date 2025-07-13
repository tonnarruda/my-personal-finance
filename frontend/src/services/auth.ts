import { logout as apiLogout } from './api';

export function logout() {
  apiLogout();
}

export function setUser(user: any) {
  localStorage.setItem('user', JSON.stringify(user));
  // Armazenar o token separadamente se existir
  if (user.token) {
    localStorage.setItem('auth_token', user.token);
  }
}

export function getUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

export function getAuthToken() {
  return localStorage.getItem('auth_token');
}

export function isAuthenticated() {
  const user = getUser();
  const token = getAuthToken();
  return !!(user && token);
}

export function clearAuth() {
  localStorage.removeItem('user');
  localStorage.removeItem('auth_token');
} 