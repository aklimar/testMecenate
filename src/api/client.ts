import axios from 'axios';
import { API_BASE } from './constants';
import { getSessionBearerToken } from './sessionToken';

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    Accept: 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getSessionBearerToken()?.trim();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
