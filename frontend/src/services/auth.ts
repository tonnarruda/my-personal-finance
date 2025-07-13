import { logout as apiLogout } from './api';

export function logout() {
  apiLogout();
}

export function setUser(user: any) {
  localStorage.setItem('user', JSON.stringify(user));
}

export function getUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

export function isAuthenticated() {
  return !!getUser();
} 