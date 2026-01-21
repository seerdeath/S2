class RoomManager {
    constructor() {
        this.rooms = new Map(); // Хранилище активных игр
    }

    createRoom(hostId) {
        const roomId = this.generateCode();
        this.rooms.set(roomId, {
            id: roomId,
            host: hostId,
            players: [], // { id, name, socketId, score, hand, items }
            status: 'waiting', // waiting, playing
            gameState: null,
            lastActivity: Date.now()
        });
        return roomId;
    }

    getRoom(roomId) {
        return this.rooms.get(roomId);
    }

    joinRoom(roomId, player) {
        const room = this.rooms.get(roomId);
        if (!room) return { error: "Комната не найдена" };
        if (room.status !== 'waiting') return { error: "Игра уже идет" };
        if (room.players.length >= 4) return { error: "Комната переполнена" };

        room.players.push(player);
        room.lastActivity = Date.now();
        return { success: true, room };
    }

    removePlayer(socketId) {
        // Логика удаления игрока и авто-удаления пустых комнат
        for (const [roomId, room] of this.rooms.entries()) {
            const index = room.players.findIndex(p => p.socketId === socketId);
            if (index !== -1) {
                room.players.splice(index, 1);
                // Если игроков 0 — удаляем комнату
                if (room.players.length === 0) {
                    this.rooms.delete(roomId);
                } else if (room.host === socketId) {
                    // Передача хоста следующему
                    room.host = room.players[0].socketId;
                }
                return { roomId, room };
            }
        }
        return null;
    }

    generateCode() {
        // Генерация 4-значного кода (A-Z, 0-9)
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let result = "";
        do {
            result = "";
            for (let i = 0; i < 4; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
        } while (this.rooms.has(result));
        return result;
    }
}

module.exports = new RoomManager();
