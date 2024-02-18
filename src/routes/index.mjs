import worker from '../service/index.mjs';

const routes = async (router, pool, triggerListener, fastq) => {
  // router.get('/clientes/:id/extrato', async (req, res) => {
  //   fastq.push({ req, res, pool, request_type: 'extrato', triggerListener });
  // });

  // router.post('/clientes/:id/transacoes', async (req, res) => {
  //   fastq.push({ req, res, pool, request_type: 'transacoes', triggerListener });
  // });

  router.get('/clientes/:id/extrato', async (req, res) =>
    worker({ req, res, pool, request_type: 'extrato', triggerListener })
  );

  router.post('/clientes/:id/transacoes', async (req, res) =>
    worker({ req, res, pool, request_type: 'transacoes', triggerListener })
  );

  return router;
};

export default routes;
