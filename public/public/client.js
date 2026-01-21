const socket = io();

// Элементы
const screens = {
    auth: document.getElementById('auth-screen'),
    lobby: document.getElementById('lobby-screen'),
    game: document.getElementById('game-screen'),
    win: document.getElementById('win-screen')
};

let currentRoomId = null;
let myId = null;

// Показать нужный экран
function showScreen(screenKey) {
    Object.values(screens).forEach(s => s.classList.add('hidden'));
    screens[screenKey].classList.remove('hidden');
}

// --- АВТОРИЗАЦИЯ И ВХОД ---

document.getElementById('btn-create').onclick = () => {
    const name = document.getElementById('player-name').value;
    socket.emit('create_game', name);
};

document.getElementById('btn-join').onclick = () => {
    const name = document.getElementById('player-name').value;
    const code = document.getElementById('room-code').value.trim();
    if (code) socket.emit('join_game', { roomId: code, playerName: name });
};

socket.on('game_created', (roomId) => {
    currentRoomId = roomId;
    myId = socket.id;
    document.getElementById('display-code').innerText = roomId;
    showScreen('lobby');
});

socket.on('joined_success', (roomId) => {
    currentRoomId = roomId;
    myId = socket.id;
    document.getElementById('display-code').innerText = roomId;
    showScreen('lobby');
});

socket.on('error_msg', (msg) => alert(msg));

// --- ЛОББИ ---

socket.on('update_lobby', (players) => {
    const list = document.getElementById('player-list');
    list.innerHTML = players.map(p => `
        <div class="player-row">
            <span>${p.name} ${p.socketId === socket.id ? '(Вы)' : ''}</span>
            <span>${p.socketId === players[0].socketId ? '👑 Хост' : ''}</span>
        </div>
    `).join('');

    // Только хост видит кнопку старта
    if (players[0].socketId === socket.id && players.length >= 2) {
        document.getElementById('btn-start').classList.remove('hidden');
    } else {
        document.getElementById('btn-start').classList.add('hidden');
    }
});

document.getElementById('btn-start').onclick = () => {
    socket.emit('start_game', currentRoomId);
};

// --- ИГРОВОЙ ПРОЦЕСС ---

socket.on('game_started', () => {
    showScreen('game');
});

socket.on('timer_tick', (seconds) => {
    document.getElementById('timer').innerText = seconds;
});

socket.on('update_game', (data) => {
    const { players, activePlayerId, timeLeft } = data;
    
    // 1. Обновляем статус игроков
    const stats = document.getElementById('players-stats');
    stats.innerHTML = players.map(p => `
        <div class="stat-card ${p.socketId === activePlayerId ? 'active-player' : ''} ${p.isDead ? 'dead' : ''}">
            <span>${p.name}</span>
            <span>${p.score} очков</span>
        </div>
    `).join('');

    // 2. Кто сейчас ходит?
    const activePlayer = players.find(p => p.socketId === activePlayerId);
    document.getElementById('turn-indicator').innerText = `Ходит: ${activePlayer.name}`;

    // 3. Блокировка кнопок
    const isMyTurn = (activePlayerId === socket.id);
    document.getElementById('btn-draw').disabled = !isMyTurn;

    // 4. Мой инвентарь (карманы)
    const me = players.find(p => p.socketId === socket.id);
    const itemsCont = document.getElementById('items-container');
    itemsCont.innerHTML = me.items.map(item => `
        <div class="item-card">${item.name}</div>
    `).join('') || 'Пусто';
});

// Действие: Тянуть карту
document.getElementById('btn-draw').onclick = () => {
    socket.emit('action_draw', currentRoomId);
};

// Финал
socket.on('game_over', (data) => {
    showScreen('win');
    document.getElementById('winner-name').innerText = `Победитель: ${data.winner}!`;
});
