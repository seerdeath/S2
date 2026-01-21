function createDeck() {
    const deck = [];
    
    // Хелпер для добавления карт
    const add = (count, type, value, name) => {
        for(let i=0; i<count; i++) deck.push({ type, value, name });
    };

    // 1. Числовые (50%)
    add(10, 'number', 1, 'Малый шаг (+1)');
    add(8, 'number', 2, 'Шаг (+2)');
    add(6, 'number', 3, 'Рывок (+3)');
    add(6, 'number', 5, 'Крит. успех (+5)');
    add(7, 'number', -1, 'Спотыкание (-1)');
    add(6, 'number', -2, 'Откат (-2)');
    add(5, 'number', -3, 'Падение (-3)');
    add(2, 'number', -5, 'Обвал (-5)');

    // 2. События (30%)
    add(6, 'event', 0, 'Пусто');
    add(4, 'event', 'repeat', 'Повтор');
    add(4, 'event', 'steal', 'Вор');
    add(4, 'event', 'sting', 'Укол (-1 врагу)');
    add(1, 'event', 'equality', 'Великое Равенство');
    add(3, 'event', 'swap', 'Рокировка');
    add(1, 'event', 'cycle', 'Круговорот');
    // ...остальные события по аналогии

    // 3. Предметы (20%)
    add(5, 'item', 'shield', 'Щит');
    add(3, 'item', 'double', 'Удвоитель');
    add(3, 'item', 'second_chance', 'Второй шанс');
    add(1, 'item', 'crown', 'Корона');
    // ...остальные предметы

    return shuffle(deck);
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

module.exports = { createDeck };
