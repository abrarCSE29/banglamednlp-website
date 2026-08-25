// PM2 process config for the backend. Build first (npm run build), then:
// pm2 start ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'backend',
      script: 'dist/index.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3010,
      },
    },
  ],
};
