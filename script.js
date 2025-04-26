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
const colorRevealedColorDisplay = document.getElementById('color-revealed-color-display'); // Новый элемент
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

     // Скрываем все игровые элементы и индикаторы при переходе в выбор режима
     colorVisionElements.classList.remove('active');
     colorIntentionElements.classList.remove('active');
     colorShufflingIndicator.classList.remove('active');
     colorRandomizingIndicator.classList.remove('active');
     colorRevealedColorDisplay.style.display = 'none';
     colorChoiceButtonsDiv.style.display = 'none';
     colorResultDiv.style.display = 'none';
}

function showMenu() {
    showScreen('main-menu');
    showGameSection('mode-selection', null); // Возвращаемся к выбору игры, сбрасываем текущую игру
}

function startGame(gameType) {
    showScreen('game-area');
    showGameSection('mode-selection', gameType);
    currentGame = gameType; // Устанавливаем текущую игру
}

function selectMode(mode) {
    if (!currentGame) return; // Должна быть выбрана игра
    currentMode = mode;

    // Показываем нужную секцию игры
    document.getElementById(`${currentGame}-game`).classList.add('active');
    // Скрываем выбор режима
    modeSelectionSection.classList.remove('active');


    // Настраиваем игру в зависимости от режима
    setupGame(currentGame, currentMode);
}

function setupGame(gameType, mode) {
    // Обновляем отображение режима в заголовке игры
    document.getElementById(`${gameType}-current-mode`).textContent = mode === 'intention' ? 'Намерение' : 'Виденье';

    // Сброс результатов и кнопок выбора
    document.getElementById(`${gameType}-result`).textContent = '';
    document.getElementById(`${gameType}-result`).classList.remove('active', 'success', 'failure');
    document.getElementById(`${gameType}-revealed-color-display`).textContent = '';
    document.getElementById(`${gameType}-revealed-color-display`).style.display = 'none';
    document.getElementById(`${gameType}-choice-buttons`).innerHTML = ''; // Очищаем кнопки выбора
     document.getElementById(`${gameType}-choice-buttons`).style.display = 'none';


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

    // Скрываем дисплей выявленного цвета и кнопки выбора при старте игры
     colorRevealedColorDisplay.style.display = 'none';
     colorChoiceButtonsDiv.style.display = 'none';
     colorResultDiv.classList.remove('active');


    if (mode === 'vision') {
        colorVisionElements.classList.add('active');
        colorShuffleButton.disabled = false;
         colorShowButton.disabled = true; // Кнопка "Показать" не нужна в Виденьи
    } else { // intention
        colorIntentionElements.classList.add('active');
        colorShuffleButton.disabled = true; // Кнопка "Перемешать" не нужна в Намерении
        colorShowButton.disabled = false;
        // Запускаем постоянный рандомайзер для Намерения
        startIntentionColorRandomizer();
    }

    // Отображаем кнопки выбора цветов игрока (но скрываем сам div)
    renderColorChoiceButtons();

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
             // Обработчик клика будет добавлен позже, когда кнопки будут активны
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
    colorResultDiv.classList.remove('active');
    colorRevealedColorDisplay.style.display = 'none'; // Скрываем все другие дисплеи
    colorChoiceButtonsDiv.style.display = 'none'; // Скрываем кнопки пока идет перемешивание

    // Запускаем рандомайзер и ждем 2 секунды
    setTimeout(() => {
        colorRandomizerResult = getRandomColorValue(); // Результат фиксируется после перемешивания
        colorShufflingIndicator.classList.remove('active');
        // Показываем кнопки выбора
        colorChoiceButtonsDiv.style.display = 'flex';
        colorChoiceButtonsDiv.querySelectorAll('button').forEach(btn => {
             btn.disabled = false;
             btn.removeEventListener('click', handleColorChoiceVision); // Удаляем старый, если есть
             btn.addEventListener('click', handleColorChoiceVision); // Добавляем новый
         });

    }, 2000);
}

// Обработчик выбора для режима Виденья
function handleColorChoiceVision(event) {
    const choice = event.target.getAttribute('data-choice');
     // Вызываем общую функцию обработки выбора
     makeColorChoice(choice);
}


// --- Intention Mode Specifics (Color) ---
function startIntentionColorRandomizer() {
    colorRandomizingIndicator.classList.add('active');
    colorShowButton.disabled = false; // Включаем кнопку "Показать Цвет"
    // Запускаем интервал, который постоянно обновляет случайный цвет
    // Визуально цвет не отображается здесь, только индикатор
    colorRandomizerInterval = setInterval(() => {
        colorRandomizerResult = getRandomColorValue();
         // В этом режиме результат не показывается до клика игрока "Показать Цвет"
    }, 50); // Обновляем быстро
}

function showIntentionColor() {
    // При нажатии "Показать Цвет"
    if (colorRandomizerInterval) {
        clearInterval(colorRandomizerInterval); // Останавливаем рандомайзер
        colorRandomizerInterval = null;
    }
     colorShowButton.disabled = true; // Отключаем кнопку пока идет процесс
     colorRandomizingIndicator.classList.remove('active'); // Скрываем индикатор

    // colorRandomizerResult содержит последний случайный цвет из интервала

    // Показываем выявленный цвет на специальном дисплее
    const revealedColor = rainbowColors.find(c => c.value === colorRandomizerResult);
    colorRevealedColorDisplay.textContent = revealedColor ? revealedColor.name : colorRandomizerResult;
    // Удаляем старые классы и добавляем класс для цвета
     colorRevealedColorDisplay.className = 'revealed-display'; // Сбрасываем классы
     if (revealedColor) {
         colorRevealedColorDisplay.classList.add(`revealed-${revealedColor.value}`);
     }
    colorRevealedColorDisplay.style.display = 'block'; // Показываем дисплей

     colorResultDiv.classList.remove('active', 'success', 'failure'); // Убеждаемся, что результат скрыт

     // Ждем 1 секунду перед показом кнопок выбора
     setTimeout(() => {
        colorRevealedColorDisplay.style.display = 'none'; // Скрываем выявленный цвет
        // Теперь игрок делает свой выбор
        colorChoiceButtonsDiv.style.display = 'flex';
        colorChoiceButtonsDiv.querySelectorAll('button').forEach(btn => {
            btn.disabled = false;
             btn.removeEventListener('click', handleColorChoiceIntention); // Удаляем старый, если есть
            btn.addEventListener('click', handleColorChoiceIntention); // Добавляем новый
         });
     }, 1000); // Задержка 1 секунда как по ТЗ
}

// Обработчик выбора для режима Намерения
function handleColorChoiceIntention(event) {
     const choice = event.target.getAttribute('data-choice');
     // Вызываем общую функцию обработки выбора
     makeColorChoice(choice);
}


// --- Common Game Logic (Color) ---

// Общая функция обработки выбора (используется обоими режимами)
function makeColorChoice(choice) {
    // Отключаем кнопки выбора после клика
    colorChoiceButtonsDiv.querySelectorAll('button').forEach(btn => btn.disabled = true);
    colorChoiceButtonsDiv.style.display = 'none'; // Скрываем кнопки после выбора
    colorRevealedColorDisplay.style.display = 'none'; // Убеждаемся, что выявленный цвет скрыт

    const isCorrect = choice === colorRandomizerResult; // Используем зафиксированный результат

    stats.color.attempts++;
    let resultText = '';

    if (isCorrect) {
        stats.color.wins++;
        resultText = `Успех!`;
        colorResultDiv.className = 'result success active';
    } else {
        stats.color.losses++;
         const correctColorName = rainbowColors.find(c => c.value === colorRandomizerResult).name;
        resultText = `Попробуй ещё. Был: ${correctColorName}`; // Показываем правильный цвет в случае неудачи
         colorResultDiv.className = 'result failure active';
    }

    colorResultDiv.textContent = resultText;
    // colorResultDiv.classList.add('active'); // Устанавливается в className выше

    updateStatsDisplay('color');

    // Подготовка к следующему раунду
    const nextRoundDelay = currentMode === 'vision' ? 1000 : 2000; // Задержка перед следующим раундом
    setTimeout(() => {
        colorResultDiv.classList.remove('active', 'success', 'failure'); // Скрываем результат
        colorResultDiv.textContent = ''; // Очищаем текст результата

        if (currentMode === 'vision') {
             // В Виденьи просто включаем кнопку "Перемешать"
             colorShuffleButton.disabled = false;
        } else { // intention
            // В Намерении снова запускаем рандомайзер и включаем кнопку "Показать Цвет"
            startIntentionColorRandomizer(); // Запускаем новый интервал
            colorShowButton.disabled = false;
            // Индикатор активен при запуске startIntentionColorRandomizer
        }
    }, nextRoundDelay);

}


function updateStatsDisplay(gameType) {
    const currentStats = stats[gameType];
    document.getElementById(`${gameType}-stats-attempts`).textContent = currentStats.attempts;
    document.getElementById(`${gameType}-stats-wins`).textContent = currentStats.wins;
    document.getElementById(`${gameType}-stats-losses`).textContent = currentStats.losses;
}


// --- Player Color Selection Logic ---
function updatePlayerColors() {
    const newColor1 = playerColorSelect1.value;
    const newColor2 = playerColorSelect2.value;

     // Простая валидация, чтобы не выбрать два одинаковых цвета (опционально)
     if (newColor1 === newColor2) {
         alert("Выберите два разных цвета!");
         // Возвращаем старые значения или сбрасываем
         playerColorSelect1.value = playerSelectedColors[0];
         playerColorSelect2.value = playerSelectedColors[1];
         return;
     }

    playerSelectedColors = [newColor1, newColor2];

    // Обновляем кнопки выбора в игре Цвет, если она активна
     if (currentGame === 'color' && (currentMode === 'vision' || currentMode === 'intention')) {
         // Перезапускаем игру с новыми цветами, чтобы сбросить состояние
         setupGame('color', currentMode);
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
// Shuffle button is only used in Vision mode
colorShuffleButton.addEventListener('click', shuffleColors);

// Show button is only used in Intention mode
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
     console.log(`Setting up Symbols game in ${mode} mode`);
      // Показываем нужные элементы режима для символов (нужно добавить в HTML)
     const symbolsVisionElements = document.getElementById('symbols-vision-elements'); // Предполагаем наличие
     const symbolsIntentionElements = document.getElementById('symbols-intention-elements'); // Предполагаем наличие
     const symbolsChoiceButtonsDiv = document.getElementById('symbols-choice-buttons'); // Предполагаем наличие
     const symbolsResultDiv = document.getElementById('symbols-result'); // Предполагаем наличие
     const symbolsRevealedSymbolDisplay = document.getElementById('symbols-revealed-symbol-display'); // Предполагаем наличие

     symbolsVisionElements.classList.remove('active');
     symbolsIntentionElements.classList.remove('active');
     symbolsChoiceButtonsDiv.style.display = 'none';
     symbolsResultDiv.classList.remove('active', 'success', 'failure');
     if(symbolsRevealedSymbolDisplay) symbolsRevealedSymbolDisplay.style.display = 'none';


     if (mode === 'vision') {
        symbolsVisionElements.classList.add('active');
        // Добавить логику для Виденья: кнопку "Перемешать", индикатор, слушатель
     } else { // intention
        symbolsIntentionElements.classList.add('active');
         // Добавить логику для Намерения: кнопку "Показать Символ", индикатор, слушатель, интервал
     }

     updateStatsDisplay('symbols');
     // renderSymbolsChoiceButtons(); // Нужно будет создать эту функцию
}
// И так далее для Key, Coins, Dice...
// Не забудьте добавить соответствующие HTML элементы и слушатели для других игр.
