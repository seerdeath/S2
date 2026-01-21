const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const socketHandler = require('./websocket/socketHandler');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

// Раздача клиентских файлов (Frontend)
app.use(express.static(path.join(__dirname, '../public')));

// Инициализация логики сокетов
socketHandler(io);

// Порт для Railway или локально
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
