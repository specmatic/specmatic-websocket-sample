const { execSync } = require("child_process");

const cwd = process.cwd();

execSync(
  `docker run --rm --network host \
   -v "${cwd}/specmatic.yaml:/usr/src/app/specmatic.yaml" \
   -v "${cwd}/specification:/usr/src/app/specification" \
   specmatic/specmatic-async test \
   --overlay=specification/overlay.yaml`,
  { stdio: "inherit" }
);
