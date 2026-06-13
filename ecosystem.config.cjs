module.exports = {
  apps: [
    {
      name: "dashboard-epis",
      script: "server/index.js",
      instances: 1,
      exec_mode: "fork",
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
        DB_HOST: "127.0.0.1",
        DB_PORT: 3306,
        DB_NAME: "dashboard_epis",
      },
    },
  ],
};
