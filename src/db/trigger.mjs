// import pgPool, { getPgClient } from './index.mjs';

// const createTrigger = async (resumo) => {
//   const client = await getPgClient(pgPool);
//   // Adiciona um listener para notificações
//   client.query('LISTEN clientes_changes');

//   // Manipula eventos de notificação
//   client.on('notification', (msg) => {
//     const { payload } = msg;
//     const { id, saldo, limite } = JSON.parse(payload);
//     resumo[id - 1] = { saldo, limite };
//   });

//   // Trata erros de conexão
//   client.on('error', (err) => {
//     console.error('Erro no cliente PostgreSQL:', err);
//   });
// };

// export default createTrigger;

import { getPgClient } from './index.mjs';

let resumo = [
  { saldo: 0, limite: 1000 * 100 },
  { saldo: 0, limite: 800 * 100 },
  { saldo: 0, limite: 10000 * 100 },
  { saldo: 0, limite: 100000 * 100 },
  { saldo: 0, limite: 5000 * 100 },
];

class TriggerListener {
  constructor(pgPool) {
    this.pgPool = pgPool;
    this.resumo = resumo;
    this.startListening();
  }

  async startListening() {
    try {
      const client = await getPgClient(this.pgPool);
      await this.updateInitialResume(client);
      // Adiciona um listener para notificações
      client.query('LISTEN clientes_changes');

      // Manipula eventos de notificação
      client.on('notification', (msg) => {
        const { payload } = msg;
        const { id, saldo, limite } = JSON.parse(payload);
        this.updateResumo(id, saldo, limite);
      });

      // Trata erros de conexão
      client.on('error', (err) => {
        console.error('Erro no cliente PostgreSQL:', err);
      });
    } catch (error) {
      console.error('Erro ao iniciar o listener do gatilho:', error);
    }
  }

  updateResumo(id, saldo, limite) {
    this.resumo[id - 1] = { saldo, limite };
  }

  async updateInitialResume(client) {
    const clientes = await client.query('SELECT * FROM clientes');
    clientes.rows.forEach((cliente) => {
      const { id, saldo, limite } = cliente;
      this.updateResumo(id, saldo, limite);
    });
  }

  getClientResume(id) {
    return this.resumo[id - 1];
  }
}

export default TriggerListener;
