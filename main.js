const SerialPort = require('serialport');
const ByteLength = require('@serialport/parser-byte-length');
const http = require('http');

const sendDataToSnInstance = require('./DataServices/sn-rest-api');
const parseData = require('./DataServices/parser');
const commands = require('./SerialPortCommunication/commands');
const SerialCommunicator = require('./SerialPortCommunication/serialCom');
const {
  DATA_INTERVAL,
  LOGIN_INTERVAL,
  RETURN_BYTES_OF_DATA,
  RETURN_BYTES_OF_SERIAL,
  RETURN_BYTES_OF_LOGIN,
  hostname,
  port
} = require('./config');

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World');
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
  var namespace = {};
  namespace.com2 = constructSerialPort('COM2', 9600);
  namespace.com6 = constructSerialPort('COM6', 9600);
  namespace.com2.serial = [1, 0, 0, 0, 1, 8, 5, 1, 1, 0, 1];
  namespace.com6.serial = [1, 0, 0, 0, 2, 1, 2, 1, 1, 0, 1];
  connect(namespace.com2);
  connect(namespace.com6);
});

function constructSerialPort(port, baudRate) {
  return new SerialPort(
    port,
    {
      baudRate: baudRate,
      dataBits: 8,
      stopBits: 1,
      parity: 'none'
    },
    (error) => {
      if (error)
        console.log(
          `Connection with serialport (${port.path}) failed: ${error}`
        );
    }
  );
}
function decimalToAscii(data) {
  let result = '';
  data.map((charCode) => {
    result += String.fromCharCode(charCode);
  });
  return result;
}
function constructByteLengthParser(byteLen) {
  return new ByteLength({ length: byteLen });
function initNewCommunication(port) {
  //delete Communicator;
  port.close();
}

function onOpen() {
  let port = this;
  console.log(`${new Date().toLocaleString()} (${port.path}) Port opened.`);
  const parser = constructByteLengthParser(RETURN_BYTES_OF_SERIAL);
  //const parser = constructByteLengthParser(RETURN_BYTES_OF_LOGIN);
  let Communicator = new SerialCommunicator(port, parser);

  // start communicating with inverter using command (1st param) and interval frequency (2nd param)
  Communicator.setListener(commands.getSerialNumber, LOGIN_INTERVAL);

  //FAST START FOR TESTING!
  //Communicator.setListener(commands.logIn(port.serial, LOGIN_INTERVAL));

  Communicator.on('data', function(data) {
    const inverterNumber = Communicator.inverterNumber;
    // send received data to Servicenow
    sendDataToSnInstance(parseData(data, inverterNumber));

    if (Communicator.lastDataReceivedBeforeGivenMinutes(0.1)) {
      Communicator.clearListener();
      initNewCommunication(port);
    }
  });
  Communicator.on('log_in', function(data) {
    const parser = constructByteLengthParser(RETURN_BYTES_OF_DATA);

    Communicator.setListener(commands.getData, DATA_INTERVAL);
    Communicator.setParser(parser);
  });
  Communicator.on('serial_number', function(data) {
    const isInvalidSerialNumber = (arr) => arr.every((v) => v === arr[0]);

    const inverterNumberInDecimal = data.slice(9, 20);
    console.log(
      `serial number ${inverterNumberInDecimal} is invalid: ${isInvalidSerialNumber(
        inverterNumberInDecimal
      )}`
    );
    if (isInvalidSerialNumber(inverterNumberInDecimal)) return;

    const inverterNumberInAscii = decimalToAscii(inverterNumberInDecimal);
    const parser = constructByteLengthParser(RETURN_BYTES_OF_LOGIN);

    Communicator.setInverterNumber(inverterNumberInAscii);

    Communicator.setListener(
      commands.logIn(inverterNumberInDecimal),
      LOGIN_INTERVAL
    );
    Communicator.setParser(parser);
  });
}
function reconnect(port) {
  port = constructSerialPort(port.path.toString(), 9600);
  console.log(`${new Date().toLocaleString()} Reconnect to (${port.path}).`);
  connect(port);
}
function connect(port) {
  console.log(`${new Date().toLocaleString()} Connect to (${port.path}).`);
  port.on('open', onOpen.bind(port));
  port.on('close', reconnect.bind(this, port));
  port.on('error', reconnect.bind(this, port));
}
