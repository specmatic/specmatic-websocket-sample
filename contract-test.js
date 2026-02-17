const { execSync } = require("child_process");

const cwd = process.cwd();

execSync(
  `docker run --rm --network host \
   -v "${cwd}/specmatic.yaml:/usr/src/app/specmatic.yaml" \
   -v "${cwd}/specification:/usr/src/app/specification" \
   -v "${cwd}/build:/usr/src/app/build" \
   specmatic/enterprise test \
   `,
  { stdio: "inherit" }
);
