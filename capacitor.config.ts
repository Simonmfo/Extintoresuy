import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.extintoresuy.app',
  appName: 'Extintor.uy',
  webDir: 'dist',
  server: {
    url: 'https://extintoruy.vercel.app',
    cleartext: true
  }
};

export default config;
