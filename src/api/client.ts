import axios from 'axios';
import { rootStore } from '../stores/rootStore';
import { API_BASE } from './constants';

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    Accept: 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = rootStore.session.token?.trim();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
