const { teardownServer } = require('./setupServer');
require('dotenv').config({ path: '.env' });

module.exports = async () => {
  console.log('Jest: Iniciando la limpieza global...');
  try {
    await teardownServer();
    console.log('Jest: Limpieza global completa.');
  } catch (error) {
    console.error('Jest: Error en limpieza global:', error);
    throw error;
  }
};