console.log('Starting dummy process...');
console.error('This is a test error message');

process.stdin.on('data', (data) => {
  console.log(`Received command: ${data.toString().trim()}`);
});

const heartbeat = setInterval(() => console.log('heart beat'), 5000);

process.on('SIGTERM', () => {
  clearInterval(heartbeat);
  process.exit(0);
});
