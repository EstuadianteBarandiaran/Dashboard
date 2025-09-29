module.exports = {
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockImplementation((mailOptions, callback) => {
      if (typeof callback === 'function') {
        callback(null, { messageId: 'test-message-id', response: '250 OK' });
      }
      return Promise.resolve({ messageId: 'test-message-id' });
    })
  })
};