import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
export default defineConfig({
  plugins: [svelte()],
  server: {
    fs: {
      deny: [
        '.env',
        '.env.*',
        '**/*.{crt,pem}',
        '**/.git/**',
        '**/clientes.csv',
      ],
    },
  },
});
