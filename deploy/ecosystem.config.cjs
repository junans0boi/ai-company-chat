const path = require("node:path");

module.exports = {
  apps: [{
    name: "ai-company-chat",
    cwd: path.resolve(__dirname, ".."),
    script: "server/index.js",
    interpreter: "node",
    env: {
      NODE_ENV: "production",
      PORT: "3012",
      HOST: "127.0.0.1",
      UPSTREAM_ALLOWLIST: "localhost",
    },
  }],
};
