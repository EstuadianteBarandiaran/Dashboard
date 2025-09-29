const request = require('supertest');
const { getServer } = require('../setupServer');

let server;
let app;

beforeAll(() => {
  server = getServer();
  app = server.app;

  // Simula usuario válido
  server.ModelUsuarios.findOne = async ({ correo }) => {
    if (correo === 'test@test.com') {
      return { id: 1, correo, Password: 'password123' };
    }
    return null;
  };
});

describe('Sistema de Login - Integración', () => {
  test('debería autenticar usuario válido', async () => {
    const response = await request(app)
      .post('/login')
      .send({ correo: 'test@test.com', Password: 'password123' });

   
  });

  test('debería rechazar credenciales inválidas', async () => {
    const response = await request(app)
      .post('/login')
      .send({ correo: 'fake@user.com', Password: 'wrongpass' });

    expect(response.status).toBe(400);
  });

  test('debería cerrar sesión correctamente', async () => {
    const response = await request(app).get('/CerrarSesion');
    expect(response.status).toBe(302);
    expect(response.header.location).toBe('/');
  });
});
