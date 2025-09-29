const Server = require('../models/server');
require('dotenv').config({ path: '.env.test' }); // Usa .env.test para entorno de pruebas

let serverInstance = null;
let isSetup = false;
let setupPromise = null;

const setupServer = async () => {
  if (serverInstance && isSetup) {
    return serverInstance;
  }

  if (setupPromise) {
    return await setupPromise;
  }

  console.log('Setting up test server...');
  
  setupPromise = (async () => {
    try {
      serverInstance = new Server();
      serverInstance.port = process.env.TEST_PORT || 5001;

      await setupMocks(serverInstance);

      try {
        await serverInstance.conectarMongo(true);
      } catch (error) {
        console.warn('Conexión MongoDB falló, usando mocks:', error.message);
      }

      serverInstance.originalListen = serverInstance.listen;
      serverInstance.listen = async () => Promise.resolve();

      await serverInstance.listen();

      isSetup = true;
      console.log('Test server setup complete (con mocks)');
      return serverInstance;
    } catch (error) {
      console.error('Error setting up test server:', error);
      setupPromise = null;
      throw error;
    }
  })();

  return await setupPromise;
};

const setupMocks = async (server) => {
  // Mock de modelos MongoDB
  const MockModel = function (data) {
    Object.assign(this, data);
  };
  MockModel.find = async () => [];
  MockModel.findOne = async () => null;
  MockModel.prototype.save = async function () { return this; };
  MockModel.deleteOne = async () => ({ deletedCount: 1 });

  server.ModelUsuarios = MockModel;
  server.ModelConsultas = MockModel;
  server.ModelRecetas = MockModel;
  server.ModelHistorialClinico = MockModel;
  server.ModelSugerencia = MockModel;

  // Mock de MySQL sin jest.fn()
  server.pool = {
    query: async () => [[{ id: 1 }]],
    getConnection: async () => ({
      query: async () => [[]],
      release: () => {}
    })
  };
};

const teardownServer = async () => {
  if (serverInstance) {
    console.log('Tearing down test server...');
    try {
      if (serverInstance.close) {
        await serverInstance.close();
      }
    } catch (error) {
      console.error('Error during teardown:', error);
    }
    serverInstance = null;
    isSetup = false;
    setupPromise = null;
  }
};

const getServer = () => {
  if (!serverInstance || !isSetup) {
    throw new Error('Server not initialized. Call setupServer() first.');
  }
  return serverInstance;
};

const isServerSetup = () => isSetup;

module.exports = {
  setupServer,
  teardownServer,
  getServer,
  isServerSetup
};
