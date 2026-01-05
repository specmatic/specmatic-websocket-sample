const { spawn, execSync } = require("child_process");

const server = spawn("node", ["server.js"], { stdio: "inherit" });

setTimeout(() => {
  try {
    execSync("node contract-test.js", { stdio: "inherit" });
  } finally {
    server.kill("SIGTERM");
  }
}, 2000);
