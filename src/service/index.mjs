// import { randomUUID } from 'crypto';
import {
  updateClientAndSaveTransaction,
  getClient,
  getClientAndTransactions,
} from './../db/queries.mjs';
import { getPgClient } from './../db/index.mjs';

function isInt(str) {
  return /^\d+$/.test(str);
}

const worker = async ({ req, res, pool, request_type, triggerListener }) => {
  let body = {};
  let request_client_id = req?.path_parameters?.id;

  switch (request_type) {
    case 'extrato':
      const client = await getPgClient(pool);
      try {
        let id = req?.path_parameters?.id;
        const cli_id = +id;

        if (cli_id <= 0 || cli_id > 5) {
          console.log({
            type: 'Extrato validate id user',
            date: new Date().toISOString(),
            request_client_id,
          });
          return res.status(404).send();
        }
        if (isNaN(cli_id) || !id) {
          console.log({
            type: 'Invalid id extrato',
            date: new Date().toISOString(),
            request_client_id,
          });
          return res.status(422).send();
        }

        const { cliente, transactions } = await getClientAndTransactions(
          client,
          cli_id
        );
        const response = {
          saldo: {
            total: cliente.saldo,
            data_extrato: new Date().toISOString(),
            limite: cliente.limite,
          },
          ultimas_transacoes: transactions.rows.map((row) => ({
            valor: row.valor,
            tipo: row.tipo,
            descricao: row.descricao,
            realizada_em: new Date(row.data_transacao).toISOString(),
          })),
        };
        console.log({
          type: 'Success extrato',
          date: new Date().toISOString(),
          request_client_id,
          response,
        });
        return res.send(JSON.stringify(response));
      } catch (error) {
        console.log({
          type: 'Error 500 extrato',
          date: new Date().toISOString(),
          request_client_id,
        });
        console.log('Error on extrato: ', error);
        return res.status(500).send('Error');
      } finally {
        await client.release();
      }
    case 'transacoes':
      const transactionClient = await getPgClient(pool);
      try {
        let id = req?.path_parameters?.id;
        const cli_id = +id;
        const requestBody = await req.json();
        const { valor, tipo, descricao } = requestBody;
        body = requestBody;

        if (
          !tipo ||
          !descricao ||
          !valor ||
          typeof descricao !== 'string' ||
          typeof tipo !== 'string' ||
          typeof valor !== 'number' ||
          !id
        ) {
          console.log({
            type: 'Validation 1',
            date: new Date().toISOString(),
            body,
            cli_id,
          });
          return res.status(422).send();
        }

        if (tipo !== 'c' && tipo !== 'd') {
          console.log({
            type: 'Validation 2',
            date: new Date().toISOString(),
            body,
            cli_id,
          });
          return res.status(422).send();
        }

        if (descricao.length > 10 || descricao.length < 1) {
          console.log({
            type: 'Validation 3',
            date: new Date().toISOString(),
            body,
            cli_id,
          });
          return res.status(422).send();
        }

        if (valor <= 0 || !isInt(valor)) {
          console.log({
            type: 'Validation 4',
            date: new Date().toISOString(),
            body,
            cli_id,
          });
          return res.status(422).send();
        }

        if (cli_id <= 0 || cli_id > 5) {
          console.log({
            type: 'Validation 5',
            date: new Date().toISOString(),
            body,
            cli_id,
          });
          return res.status(404).send();
        }

        // const cliente = await triggerListener.getClientResume(cli_id);

        const { saldoAtualizado, limite } =
          await updateClientAndSaveTransaction(
            transactionClient,
            cli_id,
            valor,
            tipo,
            descricao,
            res
          );
        // await updateClient(transactionClient, cli_id, numberValor);
        // await saveTransaction(transactionClient, transacao);
        console.log({
          type: 'success transaction',
          date: new Date().toISOString(),
          body,
          cli_id,
          limite,
          saldo: saldoAtualizado,
        });
        return res
          .status(200)
          .send(JSON.stringify({ limite, saldo: saldoAtualizado }));
      } catch (error) {
        console.log({
          type: 'Throw error transaction',
          date: new Date().toISOString(),
          body,
          request_client_id,
        });
        console.log('Erro na transação: ', error);
        return res.status(500).send('Erro interno do servidor');
      } finally {
        await transactionClient.release();
      }
    default:
      console.log('failed');
      return res.status(404).send();
  }
};

export default worker;
