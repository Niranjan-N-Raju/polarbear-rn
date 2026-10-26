/// <reference types="vite/client" />

export const defaultLoginCredentials = import.meta.env.DEV
  ? {
      email: import.meta.env.VITE_TEST_LOGIN_EMAIL ?? '',
      password: import.meta.env.VITE_TEST_LOGIN_PASSWORD ?? '',
    }
  : { email: '', password: '' };
