const mongoose = require('mongoose');

// Mock de Mongoose para testing
jest.mock('mongoose', () => {
  const actualMongoose = jest.requireActual('mongoose');
  
  return {
    ...actualMongoose,
    connect: jest.fn().mockImplementation(() => Promise.resolve()),
    connection: {
      readyState: 1,
      on: jest.fn(),
      close: jest.fn().mockResolvedValue(),
      once: jest.fn()
    },
    model: jest.fn().mockImplementation((name, schema) => {
      // Mock de modelo simple
      const MockModel = function(data) {
        Object.assign(this, data);
      };
      
      MockModel.find = jest.fn().mockResolvedValue([]);
      MockModel.findOne = jest.fn().mockResolvedValue(null);
      MockModel.prototype.save = jest.fn().mockResolvedValue(this);
      MockModel.deleteOne = jest.fn().mockResolvedValue({ deletedCount: 1 });
      
      return MockModel;
    }),
    Schema: actualMongoose.Schema
  };
});

module.exports = mongoose;