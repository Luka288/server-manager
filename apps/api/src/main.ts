import express from 'express';
import { ServerRegistry } from '@game-server/server-manager';
import { createServerRoutes } from './routes/servers';

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const app = express();
app.use(express.json());

const registry = new ServerRegistry();

app.use('/api/servers', createServerRoutes(registry));

app.listen(port, host, () => {
  console.log(`[ ready ] http://${host}:${port}`);
});
