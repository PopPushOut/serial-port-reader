// Use Express framework, which allows us to support HTTP protocol and Socket.IO
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// Define the route and select the file - in this case it is index.html
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});
function findClientsSocket(roomId, namespace = '/') {
  var res = [],
    // the default namespace is "/"
    ns = io.of(namespace);

  if (ns) {
    for (var id in ns.connected) {
      if (roomId) {
        var index = ns.connected[id].rooms.indexOf(roomId);
        if (index !== -1) {
          res.push(ns.connected[id]);
        }
      } else {
        res.push(ns.connected[id]);
      }
    }
  }
  return res;
}
//Listen 'connection' event, which is automatically send by the web client (no need to define it)
io.on('connection', function(socket) {
  socket.client.userName = 'Aivaras';
  io.emit(
    'client connected',
    `client with id: ${socket.client.userName} connected!`
  );
  socket.on('disconnect', () => {
    io.emit(
      'client disconnected',
      `client with id: ${socket.client.userName} disconnected!`
    );
  });
  // Listen 'chat message' event, which is sent by the web client while sending request
  socket.on('chat message', function(msg) {
    io.emit('chat message', socket.client.userName + ': ' + msg);
  });
});

// Select the port to be listened by the server
http.listen(3000, function() {
  console.log('Listening on *:3000');
});
