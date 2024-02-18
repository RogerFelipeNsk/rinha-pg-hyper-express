'strict mode';
const __dirname = import.meta.dirname;
import HyperExpress from 'hyper-express';
import queue from 'fastq';

import routes from './routes/index.mjs';
import pgPool, { getPgClient } from './db/index.mjs';
import TriggerListener from './db/trigger.mjs';
import worker from './service/index.mjs';

const port = process.env.PORT || 9999;
const maxAttempts = 10;
const retryDelay = 10000;

const webserver = new HyperExpress.Server();

async function startServer() {
  let attempts = 0;
  while (attempts < maxAttempts) {
    try {
      const client = await getPgClient(pgPool);
      if (!client) {
        throw new Error('Failed to connect to pg db server');
      }

      const triggerListener = null; //new TriggerListener(pgPool);
      // const fastq = queue.promise(worker, 1);
      const serviceRoutes = await routes(
        webserver,
        pgPool,
        triggerListener
        // fastq
      );
      serviceRoutes
        .listen(port)
        .then((socket) => console.log(`Webserver started on port ${port}`))
        .catch((error) =>
          console.log(`Failed to start webserver on port ${port}`)
        );

      return;
    } catch (error) {
      console.error(`Tentativa ${attempts + 1} falhou.`, error);

      // Aumentar o número de tentativas e esperar antes da próxima tentativa
      attempts++;
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }

  console.error(
    `Não foi possível conectar após ${maxAttempts} tentativas. Encerrando o programa.`
  );
  process.exit(1);
}

startServer();
