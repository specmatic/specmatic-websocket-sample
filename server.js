const wsServer = require('./ws-server');
const httpServer = require('./http-server');

wsServer.start();
httpServer.start();

process.on('SIGINT', async () => {
  console.log('\nShutting down servers...');
  await wsServer.shutdown();
  console.log('Servers closed');
  process.exit(0);
});
