console.log('Starting dummy process...');
console.error('This is a test error message');
console.log('Done (dummy server ready)');

process.stdin.on('data', (data) => {
  const command = data.toString().trim();

  console.log(`Received command: ${command}`);

  if (command === 'stop') {
    clearInterval(heartbeat);
    process.exit(0);
  }
});

const heartbeat = setInterval(() => console.log('heart beat'), 5000);

process.on('SIGTERM', () => {
  clearInterval(heartbeat);
  process.exit(0);
});
