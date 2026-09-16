// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://inria.github.io',
  base: '/inocs-sum-project-demo',
  output: 'static',
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    // Prevent Vite from externalizing leaflet in SSR (Astro pre-render pass)
    ssr: {
      noExternal: ['leaflet', 'react-leaflet'],
    },
  },
});