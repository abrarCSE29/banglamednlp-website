// PM2 process config for the frontend. Build first (npm run build), then:
// pm2 start ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'frontend',
      script: 'node_modules/.bin/next',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3011,
      },
    },
  ],
};
