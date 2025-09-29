const request = require('supertest');
const { getServer } = require('../setupServer');

let server;
let app;
let agent;

beforeAll(() => {
  server = getServer();
  app = server.app;
  agent = request.agent(app);

  // Simula usuario con rol correcto
  server.ModelUsuarios.findOne = async ({ correo }) => {
    if (correo === 'medico@example.com') {
      return { id: 1, correo, Password: '1234', id_Rol: 'medico' };
    }
    return null;
  };
});

describe('Rutas Protegidas', () => {
  test('debería permitir acceso con rol correcto', async () => {
    await agent
      .post('/login')
      .send({ correo: 'n291791@gmail.com', Password: 'fkwE2d'});

  });
});
