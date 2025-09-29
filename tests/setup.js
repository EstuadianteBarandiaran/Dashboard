const { getServer, isServerSetup, setupServer } = require('./setupServer');
require('dotenv').config({ path: '.env' });

// Configurar servidor antes de todas las pruebas
beforeAll(async () => {
  try {
    if (!isServerSetup()) {
      console.log('Server not ready, setting up...');
      await setupServer();
    }
    const server = getServer();
    console.log('Server is ready for tests');
  } catch (error) {
    console.error('Error in setup:', error);
    // No throw error aquí para permitir que los tests con mocks continúen
  }
}, 30000);

// Mock global de console para reducir output
beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  // Verificar que los mocks existan antes de restaurar
  if (console.log.mockRestore) console.log.mockRestore();
  if (console.error.mockRestore) console.error.mockRestore();
});