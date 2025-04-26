// --- Telegram Web Apps API Integration ---
const playerInfoElement = document.getElementById('player-info');
let userName = 'Игрок';

if (window.Telegram && window.Telegram.WebApp) {
    const webApp = window.Telegram.WebApp;
    webApp.ready();
    //webApp.expand(); // Можно развернуть на весь экран

    if (webApp.initDataUnsafe && webApp.initDataUnsafe.user) {
        userName = webApp.initDataUnsafe.user.first_name || 'Игрок';
    }
     // Сообщаем Telegram, что приложение готово
     webApp.ready();
     // Опционально: установить цвет фона и текста из Telegram
     // document.body.style.backgroundColor = webApp.themeParams.bg_color || '#333';
     // document.body.style.color = webApp.themeParams.text_color || '#ccc';

}

playerInfoElement.textContent = `Привет, ${userName}!`;


// --- Game State ---
let currentGame = null; // 'color', 'symbols', 'key', 'coins', 'dice'
let currentMode = null; // 'intention' or 'vision'

const stats = {
    color: { attempts: 0, wins: 0, losses: 0 },
    symbols: { attempts: 0, wins: 0, losses: 0 },
    key: { attempts: 0, wins: 0, losses: 0 },
    coins: { attempts: 0, wins: 0, losses: 0 },
    dice: { attempts: 0, wins: 0, losses: 0 },
};

const rainbowColors = [
    { name: 'Красный', value: 'red', className: 'color-red' },
    { name: 'Оранжевый', value: 'orange', className: 'color-orange' },
    { name: 'Желтый', value: 'yellow', className: 'color-yellow' },
    { name: 'Зеленый', value: 'green', className: 'color-green' },
    { name: 'Синий', value: 'blue', className: 'color-blue' },
    { name: 'Индиго', value: 'indigo', className: 'color-indigo' },
    { name: 'Фиолетовый', value: 'violet', className: 'color-violet' },
];

let playerSelectedColors = ['red', 'blue']; // Цвета игрока по умолчанию

let colorRandomizerInterval = null; // Для режима Намерение
let colorRandomizerResult = null; // Результат последнего рандома (для Виденья или фиксации в Намерении)


// --- DOM Elements ---
const appElement = document.getElementById('app');
const mainMenuScreen = document.getElementById('main-menu');
const gameAreaScreen = document.getElementById('game-area');
const modeSelectionSection = document.getElementById('mode-selection');

// Color Game Elements
const colorGameSection = document.getElementById('color-game');
const colorCurrentModeSpan = document.getElementById('color-current-mode');
const colorVisionElements = document.getElementById('color-vision-elements');
const colorIntentionElements = document.getElementById('color-intention-elements');
const colorShuffleButton = document.getElementById('color-shuffle-button');
const colorShowButton = document.getElementById('color-show-button');
const colorShufflingIndicator = document.getElementById('color-shuffling-indicator');
const colorRandomizingIndicator = document.getElementById('color-randomizing-indicator');
const colorChoiceButtonsDiv = document.getElementById('color-choice-buttons');
const colorResultDiv = document.getElementById('color-result');
const colorStatsAttemptsSpan = document.getElementById('color-stats-attempts');
const colorStatsWinsSpan = document.getElementById('color-stats-wins');
const colorStatsLossesSpan = document.getElementById('color-stats-losses');
const playerColorSelect1 = document.getElementById('player-color-1');
const playerColorSelect2 = document.getElementById('player-color-2');


// Back buttons (common for all games)
const backButtons = document.querySelectorAll('.back-button');

// --- Navigation Functions ---
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function showGameSection(sectionId, gameType) {
    document.querySelectorAll('#game-area .game-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');

    // Сброс состояния предыдущей игры/режима
    stopCurrentGameLogic();
    currentGame = gameType; // Устанавливаем текущую игру
    currentMode = null; // Сбрасываем режим при переходе в выбор режима
}

function showMenu() {
    showScreen('main-menu');
    showGameSection('mode-selection', null); // Возвращаемся к выбору игры, сбрасываем текущую игру
    currentGame = null;
    currentMode = null;
     stopCurrentGameLogic(); // Останавливаем любую активную игровую логику
}

function startGame(gameType) {
    showScreen('game-area');
    showGameSection('mode-selection', gameType);
    currentGame = gameType; // Устанавливаем текущую игру
}

function selectMode(mode) {
    if (!currentGame) return; // Должна быть выбрана игра
    currentMode = mode;

    // Показываем нужную секцию игры и скрываем выбор режима
    showGameSection(`${currentGame}-game`, currentGame);

    // Настраиваем игру в зависимости от режима
    setupGame(currentGame, currentMode);
}

function setupGame(gameType, mode) {
    // Обновляем отображение режима в заголовке игры
    document.getElementById(`${gameType}-current-mode`).textContent = mode === 'intention' ? 'Намерение' : 'Виденье';

    // Сброс результатов и кнопок выбора
     document.getElementById(`${gameType}-result`).textContent = '';
     document.getElementById(`${gameType}-choice-buttons`).innerHTML = ''; // Очищаем кнопки выбора

    // Обновляем статистику для текущей игры
    updateStatsDisplay(gameType);


    // Логика для конкретной игры
    switch (gameType) {
        case 'color':
            setupColorGame(mode);
            break;
        case 'symbols':
             setupSymbolsGame(mode); // Функция для символов
             break;
        // Добавить другие игры
         default:
             console.warn(`Game setup not implemented for ${gameType}`);
             break;
    }
}

function stopCurrentGameLogic() {
     // Останавливаем специфичную для игр логику (например, интервалы)
     if (colorRandomizerInterval) {
        clearInterval(colorRandomizerInterval);
        colorRandomizerInterval = null;
     }
     // Добавить остановку логики для других игр
}


// --- Game Logic: Color ---

function setupColorGame(mode) {
    // Скрываем элементы другого режима и показываем нужные
    colorVisionElements.classList.remove('active');
    colorIntentionElements.classList.remove('active');
     colorShufflingIndicator.classList.remove('active');
     colorRandomizingIndicator.classList.remove('active');
    colorShuffleButton.disabled = false;
    colorShowButton.disabled = false;


    if (mode === 'vision') {
        colorVisionElements.classList.add('active');
    } else { // intention
        colorIntentionElements.classList.add('active');
        // Запускаем постоянный рандомайзер для Намерения
        startIntentionColorRandomizer();
    }

    // Отображаем кнопки выбора цветов игрока
    renderColorChoiceButtons();
    // Скрываем кнопки выбора до начала раунда
    colorChoiceButtonsDiv.style.display = 'none';

    // Устанавливаем выбранные игроком цвета по умолчанию в селекты при загрузке игры
    populateColorSelectors();
    playerColorSelect1.value = playerSelectedColors[0];
    playerColorSelect2.value = playerSelectedColors[1];

}

function populateColorSelectors() {
    const options = rainbowColors.map(color =>
        `<option value="${color.value}">${color.name}</option>`
    ).join('');

    playerColorSelect1.innerHTML = options;
    playerColorSelect2.innerHTML = options;
}

function renderColorChoiceButtons() {
    colorChoiceButtonsDiv.innerHTML = ''; // Очищаем предыдущие кнопки
    playerSelectedColors.forEach(colorValue => {
        const color = rainbowColors.find(c => c.value === colorValue);
        if (color) {
            const button = document.createElement('button');
            button.textContent = color.name;
            button.classList.add(color.className);
            button.setAttribute('data-choice', color.value);
            button.addEventListener('click', () => makeColorChoice(color.value));
            colorChoiceButtonsDiv.appendChild(button);
        }
    });
}

function getRandomColorValue() {
     // Рандомайзер выбирает один из двух выбранных игроком цветов
     const randomIndex = Math.floor(Math.random() * playerSelectedColors.length);
     return playerSelectedColors[randomIndex];
}


// --- Vision Mode Specifics (Color) ---
function shuffleColors() {
    colorShuffleButton.disabled = true;
    colorShufflingIndicator.classList.add('active');
    colorResultDiv.textContent = '';
    colorChoiceButtonsDiv.style.display = 'none'; // Скрываем кнопки пока идет перемешивание

    // Запускаем рандомайзер и ждем 2 секунды
    setTimeout(() => {
        colorRandomizerResult = getRandomColorValue(); // Результат фиксируется после перемешивания
        colorShufflingIndicator.classList.remove('active');
        // Показываем кнопки выбора
        colorChoiceButtonsDiv.style.display = 'flex';
        colorChoiceButtonsDiv.querySelectorAll('button').forEach(btn => btn.disabled = false);

    }, 2000);
}

// --- Intention Mode Specifics (Color) ---
function startIntentionColorRandomizer() {
    colorRandomizingIndicator.classList.add('active');
    // Запускаем интервал, который постоянно обновляет случайный цвет
    colorRandomizerInterval = setInterval(() => {
        colorRandomizerResult = getRandomColorValue();
         // В этом режиме результат не показывается до клика игрока
    }, 50); // Обновляем быстро, чтобы было ощущение постоянного изменения
}

function showIntentionColor() {
    // При нажатии "Показать Цвет"
    if (colorRandomizerInterval) {
        clearInterval(colorRandomizerInterval); // Останавливаем рандомайзер
        colorRandomizerInterval = null;
    }
     colorShowButton.disabled = true;
     colorRandomizingIndicator.classList.remove('active');


    // colorRandomizerResult уже содержит последний случайный цвет из интервала

    // Показываем результат сразу после остановки рандомайзера
    const resultColor = rainbowColors.find(c => c.value === colorRandomizerResult);
    colorResultDiv.textContent = `Выявленный цвет: ${resultColor ? resultColor.name : colorRandomizerResult}`;
    colorResultDiv.className = 'result'; // Сброс классов успеха/неудачи временно

     // Ждем 1 секунду перед показом кнопок выбора
     setTimeout(() => {
        // Теперь игрок делает свой выбор
        colorChoiceButtonsDiv.style.display = 'flex';
        colorChoiceButtonsDiv.querySelectorAll('button').forEach(btn => btn.disabled = false);
     }, 1000); // Задержка 1 секунда как по ТЗ
}


// --- Common Game Logic (Color) ---

function makeColorChoice(choice) {
    // Отключаем кнопки выбора после клика
    colorChoiceButtonsDiv.querySelectorAll('button').forEach(btn => btn.disabled = true);

    const isCorrect = choice === colorRandomizerResult;

    stats.color.attempts++;
    if (isCorrect) {
        stats.color.wins++;
        colorResultDiv.textContent = `Успех! Вы угадали цвет: ${rainbowColors.find(c => c.value === colorRandomizerResult).name}`;
        colorResultDiv.className = 'result success';
    } else {
        stats.color.losses++;
        colorResultDiv.textContent = `Попробуй ещё. Был: ${rainbowColors.find(c => c.value === colorRandomizerResult).name}`;
         colorResultDiv.className = 'result failure';
    }

    updateStatsDisplay('color');

    // Подготовка к следующему раунду
    setTimeout(() => {
        if (currentMode === 'vision') {
             colorChoiceButtonsDiv.style.display = 'none';
             colorShuffleButton.disabled = false; // Включаем кнопку перемешать
        } else { // intention
            // Для Намерения мы уже показали результат и выбор.
            // Теперь просто очищаем и готовимся к следующему клику "Показать Цвет"
             colorResultDiv.textContent = ''; // Очищаем результат
             colorChoiceButtonsDiv.style.display = 'none'; // Скрываем кнопки выбора

            // Запускаем рандомайзер снова и включаем кнопку "Показать Цвет"
            startIntentionColorRandomizer(); // Запускаем новый интервал
            colorShowButton.disabled = false;
        }
    }, currentMode === 'vision' ? 1000 : 2000); // Пауза перед следующим раундом (можно настроить)

}


function updateStatsDisplay(gameType) {
    const currentStats = stats[gameType];
    document.getElementById(`${gameType}-stats-attempts`).textContent = currentStats.attempts;
    document.getElementById(`${gameType}-stats-wins`).textContent = currentStats.wins;
    document.getElementById(`${gameType}-stats-losses`).textContent = currentStats.losses;
}


// --- Player Color Selection Logic ---
function updatePlayerColors() {
    playerSelectedColors = [playerColorSelect1.value, playerColorSelect2.value];
    // Обновляем кнопки выбора в игре Цвет, если она активна
     if (currentGame === 'color' && (currentMode === 'vision' || currentMode === 'intention')) {
         renderColorChoiceButtons();
         // Скрываем кнопки выбора до начала следующего раунда,
         // иначе игрок может сделать выбор, пока мы меняем кнопки
         colorChoiceButtonsDiv.style.display = 'none';
         colorResultDiv.textContent = ''; // Сброс результата
         // Возвращаем игру в исходное состояние для этого режима
         if (currentMode === 'vision') {
              colorShuffleButton.disabled = false;
         } else {
             // В режиме Намерения нужно убедиться, что интервал запущен и кнопка "Показать" активна
             stopCurrentGameLogic(); // Останавливаем старый интервал
             startIntentionColorRandomizer(); // Запускаем новый
             colorShowButton.disabled = false;
         }
     }
}


// --- Event Listeners ---
document.querySelectorAll('#main-menu button').forEach(button => {
    button.addEventListener('click', (e) => {
        const gameType = e.target.getAttribute('data-game');
        startGame(gameType);
    });
});

document.querySelectorAll('#mode-selection button').forEach(button => {
    button.addEventListener('click', (e) => {
        const mode = e.target.getAttribute('data-mode');
        selectMode(mode);
    });
});

backButtons.forEach(button => {
    button.addEventListener('click', showMenu);
});

// Color Game Specific Listeners
colorShuffleButton.addEventListener('click', shuffleColors);
colorShowButton.addEventListener('click', showIntentionColor);

// Player color selection listeners
playerColorSelect1.addEventListener('change', updatePlayerColors);
playerColorSelect2.addEventListener('change', updatePlayerColors);


// --- Initial Setup ---
showScreen('main-menu');
populateColorSelectors(); // Заполняем селекты при загрузке страницы


// --- Placeholder functions for other games ---
// Эти функции нужно будет реализовать по аналогии с setupColorGame
function setupSymbolsGame(mode) {
     // Настроить элементы для режима (Намерение/Виденье)
     document.getElementById('symbols-game').querySelector('.game-section.active').classList.remove('active');
     document.getElementById(`symbols-${mode}-elements`).classList.add('active'); // Предполагая наличие таких элементов

     // Обновить статистику
     updateStatsDisplay('symbols');

     // Реализовать логику игры Символы (рандомайзер, кнопки выбора круг/треугольник SVG)
     console.log(`Setting up Symbols game in ${mode} mode`);
}
// И так далее для Key, Coins, Dice...
