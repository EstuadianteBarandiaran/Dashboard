const { getServer } = require('../setupServer');

let server;

beforeAll(async () => {
  server = getServer();
});

describe('Database Connections', () => {
  test('debería conectar a MySQL exitosamente', async () => {
    // Simula respuesta exitosa
    server.pool.query = async () => [[{ id: 1, username: 'test' }]];


  });

  test('debería manejar error de conexión MySQL', async () => {
    // Simula error de conexión
    server.pool.query = async () => { throw new Error('Connection failed'); };

    const connection = await server.probarConexion();
   
  });
});
