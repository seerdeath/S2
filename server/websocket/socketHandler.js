const roomManager = require('../lobby/roomManager');
const Game = require('../gameLogic/game');

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        socket.on('create_game', (playerName) => {
            const roomId = roomManager.createRoom(socket.id);
            const { success, room } = roomManager.joinRoom(roomId, {
                socketId: socket.id,
                name: playerName || 'Player 1',
                score: 5,
                items: [],
                isDead: false
            });
            
            socket.join(roomId);
            socket.emit('game_created', roomId);
            io.to(roomId).emit('update_lobby', room.players);
        });

        socket.on('join_game', ({ roomId, playerName }) => {
            // Приводим к верхнему регистру
            roomId = roomId.toUpperCase();
            const result = roomManager.joinRoom(roomId, {
                socketId: socket.id,
                name: playerName || `Player`,
                score: 5,
                items: [],
                isDead: false
            });

            if (result.error) {
                socket.emit('error_msg', result.error);
            } else {
                socket.join(roomId);
                socket.emit('joined_success', roomId);
                io.to(roomId).emit('update_lobby', result.room.players);
            }
        });

        socket.on('start_game', (roomId) => {
            const room = roomManager.getRoom(roomId);
            if (room && room.host === socket.id && room.players.length >= 2) {
                room.gameState = new Game(room, io);
                room.gameState.start();
                io.to(roomId).emit('game_started');
            }
        });

        socket.on('action_draw', (roomId) => {
            const room = roomManager.getRoom(roomId);
            if (room && room.gameState) {
                room.gameState.playerAction(socket.id, 'draw');
            }
        });

        socket.on('disconnect', () => {
            const result = roomManager.removePlayer(socket.id);
            if (result) {
                io.to(result.roomId).emit('update_lobby', result.room.players);
            }
        });
    });
};
