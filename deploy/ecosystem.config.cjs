const path = require("node:path");

module.exports = {
  apps: [{
    name: "ai-company-chat",
    cwd: path.resolve(__dirname, ".."),
    script: "node_modules/next/dist/bin/next",
    args: "start -p 3012",
    env: { NODE_ENV: "production" },
  }],
};
