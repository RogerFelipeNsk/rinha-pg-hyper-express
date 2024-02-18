// export const getClient = async (pgClient, clientId) => {
//   // await pgClient.query('BEGIN');
//   // await pgClient.query('BEGIN ISOLATION LEVEL REPEATABLE READ');
//   // SELECT pg_advisory_lock(id) FROM foo WHERE id = 12345;
//   const res = await pgClient.query(
//     'SELECT * FROM clientes WHERE id = $1 FOR UPDATE',
//     [clientId]
//   );
//   // await pgClient.query('COMMIT');
//   return res.rows[0];
// };

// export const getClientAndTransactions = async (pgClient, cli_id) => {
//   let cliente;
//   let transactions;
//   try {
//     // Iniciar a transação
//     await pgClient.query('BEGIN');
//     // await pgClient.query('BEGIN ISOLATION LEVEL REPEATABLE READ');
//     // Realizar a consulta
//     cliente = await getClient(pgClient, cli_id);
//     transactions = await pgClient.query(
//       'SELECT * FROM transacoes WHERE client_id = $1 ORDER BY data_transacao DESC LIMIT 10;',
//       [cli_id]
//     );

//     // Commit da transação
//     await pgClient.query('COMMIT');

//     return { cliente, transactions };
//   } catch (error) {
//     console.error('Error during transaction:', error);

//     // Rollback da transação em caso de erro
//     await pgClient.query('ROLLBACK');

//     throw error; // Propaga o erro para o chamador
//   }
// };

export const getClient = async (pgClient, clientId) => {
  try {
    // Obter o lock advisory de forma bloqueante
    // await pgClient.query('SELECT pg_advisory_lock($1)', [clientId]);

    // const res = await pgClient.query(
    //   'SELECT * FROM clientes WHERE id = $1 FOR UPDATE',
    //   [clientId]
    // );
    const res = await pgClient.query('SELECT * FROM clientes WHERE id = $1', [
      clientId,
    ]);
    // await pgClient.query('SELECT pg_advisory_unlock($1)', [clientId]);
    return res.rows[0];
  } catch (error) {
    // await pgClient.query('SELECT pg_advisory_unlock($1)', [clientId]);
    console.error('Error while getting client:', error);
    throw error;
  }
};

export const updateClientAndSaveTransaction = async (
  pgClient,
  clientId,
  valor,
  tipo,
  descricao,
  res
) => {
  try {
    // await pgClient.query('SELECT pg_try_advisory_xact_lock($1);', [clientId]);
    await pgClient.query('SELECT pg_advisory_lock($1)', [clientId]);
    // await pgClient.query('BEGIN ISOLATION LEVEL REPEATABLE READ');
    await pgClient.query('BEGIN');
    const cliente = await getClient(pgClient, clientId);
    let saldo = cliente.saldo;
    const limite = cliente.limite;
    const numberValor = parseInt(valor);
    const accLimit = limite * -1;

    if (tipo === 'c') {
      saldo = saldo + numberValor;
    } else {
      saldo = saldo - numberValor;

      if (saldo < accLimit) {
        await pgClient.query('SELECT pg_advisory_unlock($1)', [clientId]);
        return res.status(422).send();
      }
    }
    const updateRes = await pgClient.query(
      `UPDATE clientes SET saldo = $1 WHERE id = $2 RETURNING saldo`,
      [saldo, clientId]
    );

    await pgClient.query(
      'INSERT INTO transacoes (client_id, valor, tipo, descricao, data_transacao) VALUES ($1, $2, $3, $4, NOW())',
      [clientId, valor, tipo, descricao]
    );
    await pgClient.query('COMMIT');
    // await pgClient.query('SELECT pg_try_advisory_xact_lock($1);', [clientId]);
    await pgClient.query('SELECT pg_advisory_unlock($1)', [clientId]);

    const saldoAtualizado = updateRes.rows[0].saldo;
    return { saldoAtualizado, limite };
  } catch (error) {
    // await pgClient.query('SELECT pg_try_advisory_xact_lock($1);', [clientId]);
    await pgClient.query('SELECT pg_advisory_unlock($1)', [clientId]);
    await pgClient.query('ROLLBACK');
    throw error;
  }
};

export const getClientAndTransactions = async (pgClient, cli_id) => {
  let cliente;
  let transactions;
  try {
    // await pgClient.query('SELECT pg_try_advisory_xact_lock($1);', [cli_id]);
    await pgClient.query('SELECT pg_advisory_lock($1)', [cli_id]);
    await pgClient.query('BEGIN');

    cliente = await getClient(pgClient, cli_id);
    transactions = await pgClient.query(
      'SELECT * FROM transacoes WHERE client_id = $1 ORDER BY data_transacao DESC LIMIT 10;',
      [cli_id]
    );

    await pgClient.query('COMMIT');
    await pgClient.query('SELECT pg_advisory_unlock($1)', [cli_id]);
    // await pgClient.query('SELECT pg_try_advisory_xact_lock($1);', [cli_id]);
    return { cliente, transactions };
  } catch (error) {
    await pgClient.query('SELECT pg_advisory_unlock($1)', [cli_id]);
    // await pgClient.query('SELECT pg_try_advisory_xact_lock($1);', [cli_id]);
    console.error('Error during transaction:', error);
    await pgClient.query('ROLLBACK');
    throw error;
  }
};
