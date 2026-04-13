import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'fun.anyflix.bizchat',
  appName: 'BizChat',
  webDir: 'dist',
  server: {
    // URL will be used in dev, in production it points to local webDir
    url: 'https://bizchat.anyflix.fun',
    cleartext: true,
  },
};

export default config;
