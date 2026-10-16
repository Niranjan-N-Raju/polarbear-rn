/// <reference types="vite/client" />

const localApiUrl = 'http://localhost:4000/api';

export const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL?.trim() || localApiUrl).replace(/\/+$/, '');