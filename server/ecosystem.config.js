module.exports = {
  apps: [
    {
      name: 'estatecore-api',
      script: 'server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env_production: { NODE_ENV: 'production' },
    },
  ],
};
