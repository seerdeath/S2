const { createDeck } = require('./deck');

class Game {
    constructor(room, io) {
        this.room = room;
        this.io = io;
        this.deck = createDeck();
        this.currentTurnIndex = 0;
        this.timer = null;
        this.timerSeconds = 30; // Время на ход
    }

    start() {
        this.room.status = 'playing';
        // Раздаем стартовые очки (5)
        this.room.players.forEach(p => {
            p.score = 5;
            p.items = []; // Карманы [null, null]
            p.isDead = false;
        });
        
        this.startTurn();
    }

    startTurn() {
        // Пропуск выбывших игроков
        let attempts = 0;
        while(this.room.players[this.currentTurnIndex].isDead && attempts < 4) {
             this.currentTurnIndex = (this.currentTurnIndex + 1) % this.room.players.length;
             attempts++;
        }

        const player = this.room.players[this.currentTurnIndex];
        
        // Сброс таймера
        if (this.timer) clearInterval(this.timer);
        let timeLeft = this.timerSeconds;

        this.io.to(this.room.id).emit('update_game', {
            players: this.room.players,
            activePlayerId: player.socketId,
            timeLeft: timeLeft
        });

        this.timer = setInterval(() => {
            timeLeft--;
            if (timeLeft <= 0) {
                this.forceEndTurn(); // Время вышло -> авто-ход
            } else {
                this.io.to(this.room.id).emit('timer_tick', timeLeft);
            }
        }, 1000);
    }

    playerAction(socketId, action, payload) {
        const player = this.room.players[this.currentTurnIndex];
        if (player.socketId !== socketId) return; // Не твой ход!

        if (action === 'draw') {
            const card = this.deck.pop();
            if (!this.deck.length) this.deck = createDeck(); // Решаффл

            this.processCard(player, card);
            this.endTurn();
        }
        
        // Тут логика использования предметов (use_item)
    }

    processCard(player, card) {
        // Упрощенная логика для прототипа
        if (card.type === 'number') {
            player.score += card.value;
        } else if (card.type === 'item') {
            if (player.items.length < 2) {
                player.items.push(card);
            } else {
                // Если карманы полны — пока просто сбрасываем (для MVP)
                // В полной версии тут нужен выбор: заменить или сбросить
            }
        } else if (card.type === 'event') {
             // Реализация событий (Укол, Равенство...)
             if (card.value === 0) { /* Пусто */ }
        }

        // Проверка условий победы/поражения
        this.checkWinConditions();
    }

    checkWinConditions() {
        let winner = null;
        
        this.room.players.forEach(p => {
            if (p.score <= 0) {
                p.score = 0;
                p.isDead = true;
                p.items = []; // Потеря предметов
            }
            if (p.score >= 30) winner = p;
        });

        // Проверка: остался только один живой
        const alive = this.room.players.filter(p => !p.isDead);
        if (alive.length === 1 && this.room.players.length > 1) {
            winner = alive[0];
        }

        if (winner) {
            clearInterval(this.timer);
            this.io.to(this.room.id).emit('game_over', { winner: winner.name });
            this.room.status = 'finished';
        }
    }

    forceEndTurn() {
        // Автоматическое вытягивание карты
        const player = this.room.players[this.currentTurnIndex];
        const card = this.deck.pop();
        this.processCard(player, card);
        this.endTurn();
    }

    endTurn() {
        if (this.room.status !== 'playing') return;
        clearInterval(this.timer);
        this.currentTurnIndex = (this.currentTurnIndex + 1) % this.room.players.length;
        this.startTurn();
    }
}

module.exports = Game;
