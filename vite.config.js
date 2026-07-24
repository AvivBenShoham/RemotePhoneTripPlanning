import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base must match the GitHub Pages sub-path so built asset URLs resolve at
// https://<user>.github.io/RemotePhoneTripPlanning/. Override with BASE_PATH
// (e.g. '/' ) for a custom domain / root deploy.
export default defineConfig({
  base: process.env.BASE_PATH || '/RemotePhoneTripPlanning/',
  plugins: [react()],
});
