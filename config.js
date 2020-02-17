require('dotenv').config();

module.exports = {
  username: process.env.SN_USERNAME,
  password: process.env.SN_PASSWORD,
  instanceUrl: process.env.SN_INSTANCE_URL,
  DATA_INTERVAL: 1000 * 10, // 60 seconds
  LOGIN_INTERVAL: 1000 * 10, // 10 seconds
  RETURN_BYTES_OF_SERIAL: 22,
  RETURN_BYTES_OF_LOGIN: 12,
  RETURN_BYTES_OF_DATA: 53,
  hostname: '127.0.0.1',
  port: 3000
};
