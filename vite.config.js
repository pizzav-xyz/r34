import { defineConfig } from 'vite';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

function getProxyPort() {
  const portFile = resolve(__dirname, '.proxy-port');
  if (!existsSync(portFile)) return null;
  try {
    return Number(readFileSync(portFile, 'utf-8').trim());
  } catch {
    return null;
  }
}

const proxyPort = getProxyPort();

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    proxy: proxyPort
      ? {
          '/api': {
            target: `http://127.0.0.1:${proxyPort}`,
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ''),
          },
        }
      : undefined,
  },
});
