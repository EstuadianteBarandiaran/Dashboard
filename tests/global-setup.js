const { setupServer } = require('./setupServer');
require('dotenv').config({ path: '.env' });

module.exports = async () => {
  console.log('Jest: Iniciando la configuración global...');
  try {
    await setupServer();
    console.log('Jest: Configuración global completa.');
  } catch (error) {
    console.error('Jest: Error en configuración global:', error);
    throw error;
  }
};