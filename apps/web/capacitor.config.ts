import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bizchat.app',
  appName: 'BizChat',
  webDir: 'dist',
  server: {
    cleartext: true
  }
};

export default config;
