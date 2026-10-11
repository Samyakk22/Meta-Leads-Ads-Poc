const { Server } = require('socket.io');
const leadStore = require('./leadStore');

let io = null;

function init(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: '*' },
  });

  io.on('connection', (socket) => {
    console.log(`[socket] client connected: ${socket.id} (${io.engine.clientsCount} online)`);
    socket.emit('leads:init', leadStore.all());
    socket.on('disconnect', (reason) => {
      console.log(`[socket] client disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
}

function broadcastNewLead(lead) {
  if (!io) return;
  io.emit('lead:new', lead);
}

function clientCount() {
  return io ? io.engine.clientsCount : 0;
}

module.exports = { init, broadcastNewLead, clientCount };
