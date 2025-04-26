const tg = window.Telegram.WebApp;

// Глобальные переменные состояния
let currentGame = null; // 'color', 'symbols', 'keys', 'coins', 'dice'
let currentMode = null; // 'vision', 'intention'
let targetValue = null; // Значение, которое нужно угадать
let intentionInterval = null; // ID интервала для режима "Намерение"
let intentionCanShow = true; // Флаг для кнопки "Показать" в Намерении

// Статистика (можно будет сохранять в localStorage или через API бекенда)
const stats = {
    color: { attempts: 0, success: 0, fail: 0 },
    symbols: { attempts: 0, success: 0, fail: 0 },
    keys: { attempts: 0, success: 0, fail: 0 },
    coins: { attempts: 0, success: 0, fail: 0 },
    dice: { attempts: 0, success: 0, fail: 0 },
};

// Настройки игры (с дефолтными значениями)
const gameSettings = {
    color: {
        options: ['red', 'blue'], // Текущие выбранные цвета
        allOptions: ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet'],
        displayNames: { // Для отображения на русском
            red: 'Красный', orange: 'Оранжевый', yellow: 'Желтый',
            green: 'Зеленый', blue: 'Синий', indigo: 'Индиго', violet: 'Фиолетовый'
        }
    },
    symbols: {
        options: ['circle', 'triangle'],
        displayNames: { circle: 'Круг', triangle: 'Треугольник' }
    },
    keys: {
        options: ['keyA', 'keyB'], // Используем строки для ключей
        displayNames: { keyA: 'Ключ A', keyB: 'Ключ B' } // Отображать можно картинками или текстом
    },
    coins: {
        options: ['heads', 'tails'],
        displayNames: { heads: 'Орёл', tails: 'Решка' }
    },
    dice: {
        options: [1, 2, 3, 4, 5, 6],
        displayNames: { 1: '1', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6' }
    }
};

// DOM Элементы
const mainMenu = document.getElementById('main-menu');
const gameArea = document.getElementById('game-area');
const gameTitle = document.getElementById('game-title');
const playerGreeting = document.getElementById('player-greeting');
const modeSelection = document.getElementById('mode-selection');
const gameContent = document.getElementById('game-content');
const currentModeDisplay = document.getElementById('current-mode-display');

// Элементы управления режимами
const visionControls = document.getElementById('vision-controls');
const visionRandomizeBtn = document.getElementById('vision-randomize-btn');
const visionRandomizingText = document.getElementById('vision-randomizing-text');
const intentionControls = document.getElementById('intention-controls');
const intentionRandomizerDisplay = document.getElementById('intention-randomizer-display');
const intentionShowBtn = document.getElementById('intention-show-btn');
const intentionWaitingText = document.getElementById('intention-waiting-text');

const playerChoiceArea = document.getElementById('player-choice-area');
const choiceButtonsContainer = document.getElementById('choice-buttons');
const resultArea = document.getElementById('result-area');
const resultValue = document.getElementById('result-value');
const resultMessage = document.getElementById('result-message');

// Статистика
const statsArea = document.getElementById('stats-area');
const statsGameName = document.getElementById('stats-game-name');
const statsAttempts = document.getElementById('stats-attempts');
const statsSuccess = document.getElementById('stats-success');
const statsFail = document.getElementById('stats-fail');

// Настройки цвета
const colorSettingsDiv = document.getElementById('color-settings');
const changeColorBtn = document.getElementById('change-color-btn');
const colorPicker = document.getElementById('color-picker');
const colorOptionsContainer = document.querySelector('.color-options');
const selectedColorsDisplay = document.getElementById('selected-colors-display');

// Кнопки Назад
const backButtons = document.querySelectorAll('.back-button');
const gameBackButton = document.getElementById('game-back-button');

// --- Инициализация ---
tg.ready(); // Сообщаем Telegram, что приложение готово

// Отображение имени пользователя
if (tg.initDataUnsafe?.user) {
    const user = tg.initDataUnsafe.user;
    playerGreeting.textContent = `Привет, ${user.first_name}!`;
} else {
    playerGreeting.textContent = 'Привет, Игрок!';
}

// --- Функции навигации ---
function showSection(sectionId) {
    document.querySelectorAll('.game-section').forEach(section => {
        section.classList.remove('active');
        section.classList.add('hidden');
    });
    const sectionToShow = document.getElementById(sectionId);
    if (sectionToShow) {
        sectionToShow.classList.remove('hidden');
        sectionToShow.classList.add('active');
    }
}

// --- Функции игры ---

// Выбор игры из главного меню
document.querySelectorAll('.menu-button').forEach(button => {
    button.addEventListener('click', () => {
        currentGame = button.getAttribute('data-game');
        gameTitle.textContent = button.textContent; // Устанавливаем заголовок игры
        statsGameName.textContent = button.textContent;
        resetGameState(); // Сброс перед началом новой игры
        showSection('game-area');
        modeSelection.classList.remove('hidden'); // Показываем выбор режима
        gameContent.classList.add('hidden');      // Скрываем игровое поле
        // Показываем/скрываем настройки цвета
        colorSettingsDiv.classList.toggle('hidden', currentGame !== 'color');
        updateColorPickerSelection(); // Обновить выделение в пикере
    });
});

// Выбор режима (Видение/Намерение)
document.getElementById('mode-vision-btn').addEventListener('click', () => selectMode('vision'));
document.getElementById('mode-intention-btn').addEventListener('click', () => selectMode('intention'));

function selectMode(mode) {
    currentMode = mode;
    modeSelection.classList.add('hidden'); // Скрываем выбор режима
    gameContent.classList.remove('hidden'); // Показываем игровое поле
    currentModeDisplay.textContent = mode === 'vision' ? 'Видение' : 'Намерение';
    resetGameUI(); // Сброс UI перед началом раунда
    updateStatsDisplay();

    if (mode === 'vision') {
        visionControls.classList.remove('hidden');
        intentionControls.classList.add('hidden');
        visionRandomizeBtn.disabled = false; // Кнопка перемешивания активна
        visionRandomizeBtn.classList.remove('hidden');
        visionRandomizingText.classList.add('hidden');
    } else { // intention
        visionControls.classList.add('hidden');
        intentionControls.classList.remove('hidden');
        startIntentionRandomizer();
    }
}

// Сброс состояния игры (перед выбором режима)
function resetGameState() {
    currentMode = null;
    targetValue = null;
    stopIntentionRandomizer(); // Остановить интервал, если он был запущен
    intentionCanShow = true;
    // Сброс UI элементов, связанных с режимом и результатом
    resetGameUI();
}

// Сброс UI элементов игры (перед каждым раундом/попыткой)
function resetGameUI() {
    playerChoiceArea.classList.add('hidden');
    resultArea.classList.add('hidden');
    visionRandomizeBtn.disabled = false;
    visionRandomizeBtn.classList.remove('hidden'); // Показать кнопку перемешать (для Видения)
    visionRandomizingText.classList.add('hidden');
    intentionShowBtn.classList.add('hidden'); // Скрыть кнопку Показать (для Намерения)
    intentionRandomizerDisplay.textContent = ''; // Очистить дисплей намерения
    intentionRandomizerDisplay.className = ''; // Сбросить классы цвета
    intentionWaitingText.classList.add('hidden'); // Скрыть текст ожидания
    resultValue.textContent = '';
    resultValue.className = ''; // Сбросить классы цвета
    resultMessage.textContent = '';
    resultMessage.className = '';
}

// Обновление отображения статистики
function updateStatsDisplay() {
    if (!currentGame) return;
    statsAttempts.textContent = stats[currentGame].attempts;
    statsSuccess.textContent = stats[currentGame].success;
    statsFail.textContent = stats[currentGame].fail;
}

// Получение случайного значения для текущей игры
function getRandomValue() {
    const options = gameSettings[currentGame].options;
    const randomIndex = Math.floor(Math.random() * options.length);
    return options[randomIndex];
}

// --- Логика режима "Видение" ---
visionRandomizeBtn.addEventListener('click', () => {
    visionRandomizeBtn.disabled = true;
    visionRandomizeBtn.classList.add('hidden'); // Скрыть кнопку
    visionRandomizingText.classList.remove('hidden'); // Показать "Перемешиваем..."
    playerChoiceArea.classList.add('hidden'); // Скрыть выбор на время перемешивания
    resultArea.classList.add('hidden'); // Скрыть прошлый результат

    setTimeout(() => {
        targetValue = getRandomValue();
        console.log(`Vision Target: ${targetValue}`); // Для отладки
        visionRandomizingText.classList.add('hidden'); // Скрыть "Перемешиваем..."
        showPlayerChoiceButtons(); // Показать кнопки выбора
        // Кнопка "Перемешать" остается скрытой до завершения попытки
    }, 2000); // Задержка 2 секунды
});

// --- Логика режима "Намерение" ---
function startIntentionRandomizer() {
    stopIntentionRandomizer(); // На всякий случай остановить предыдущий
    intentionWaitingText.classList.remove('hidden'); // Показать "Генерация..."
    intentionShowBtn.classList.add('hidden');
    intentionRandomizerDisplay.textContent = '...'; // Начальное состояние
    intentionCanShow = false; // Нельзя нажать "Показать" сразу

    intentionInterval = setInterval(() => {
        const randomValue = getRandomValue();
        intentionRandomizerDisplay.textContent = gameSettings[currentGame].displayNames[randomValue] || randomValue;
        // Добавляем класс для цвета, если это игра "Цвет"
        if (currentGame === 'color') {
            intentionRandomizerDisplay.className = `color-${randomValue}`;
        } else {
            intentionRandomizerDisplay.className = ''; // Сбрасываем классы для других игр
        }
        targetValue = randomValue; // Постоянно обновляем цель до нажатия кнопки
    }, 100); // Интервал обновления случайного значения (можно настроить)

    // Кнопка "Показать" появляется через секунду после старта генерации
    setTimeout(() => {
        if (currentMode === 'intention') { // Проверяем, не сменился ли режим
            intentionWaitingText.classList.add('hidden');
            intentionShowBtn.classList.remove('hidden');
            intentionCanShow = true; // Теперь можно нажать
        }
    }, 1000);
}

function stopIntentionRandomizer() {
    if (intentionInterval) {
        clearInterval(intentionInterval);
        intentionInterval = null;
    }
    intentionRandomizerDisplay.textContent = ''; // Очистить дисплей
    intentionRandomizerDisplay.className = '';
}

intentionShowBtn.addEventListener('click', () => {
    if (!intentionCanShow) return;

    stopIntentionRandomizer(); // Останавливаем генератор в момент нажатия
    console.log(`Intention Target (fixed): ${targetValue}`); // Зафиксированное значение
    intentionShowBtn.classList.add('hidden'); // Скрыть кнопку "Показать"
    intentionCanShow = false; // Нельзя нажать снова сразу

    showPlayerChoiceButtons(); // Показать кнопки выбора игроку

    // Рандомайзер снова запускается сразу, кнопка появится через секунду
    // (перенесено в handlePlayerChoice для режима намерения)
});


// --- Общая логика выбора игрока ---
function showPlayerChoiceButtons() {
    choiceButtonsContainer.innerHTML = ''; // Очистить старые кнопки
    const options = gameSettings[currentGame].options;
    options.forEach(option => {
        const button = document.createElement('button');
        button.textContent = gameSettings[currentGame].displayNames[option] || option;
        button.classList.add('choice-btn');
        button.dataset.choice = option; // Сохраняем значение в data-атрибуте

        // Добавляем data-атрибут для стилизации кнопок цвета
        if (currentGame === 'color') {
            button.dataset.color = option; // Для CSS стилей кнопки
             button.style.backgroundColor = option; // Прямое применение стиля
             // Подбираем цвет текста для контраста
             if (['yellow', 'orange'].includes(option)) {
                 button.style.color = '#333';
             } else {
                 button.style.color = 'white';
             }
        }
         // Добавить иконки или стили для других игр если нужно
         if (currentGame === 'keys') {
             button.textContent = gameSettings[currentGame].displayNames[option]; // Например, "Ключ A"
             // Можно добавить иконки: button.innerHTML = '🔑 A';
         }
         if (currentGame === 'symbols') {
             if(option === 'circle') button.innerHTML = '○'; // Круг
             if(option === 'triangle') button.innerHTML = '△'; // Треугольник
         }


        button.addEventListener('click', handlePlayerChoice);
        choiceButtonsContainer.appendChild(button);
    });
    playerChoiceArea.classList.remove('hidden'); // Показать область выбора
}

function handlePlayerChoice(event) {
    const playerChoice = event.target.dataset.choice;
    console.log(`Player chose: ${playerChoice}`);
    playerChoiceArea.classList.add('hidden'); // Скрыть кнопки выбора после клика

    // Обновляем статистику
    stats[currentGame].attempts++;
    const success = playerChoice == targetValue; // Сравнение (может потребовать приведения типов для кубика)

    if (success) {
        stats[currentGame].success++;
        resultMessage.textContent = 'Успех!';
        resultMessage.className = 'success';
    } else {
        stats[currentGame].fail++;
        resultMessage.textContent = 'Попробуй ещё!';
        resultMessage.className = 'failure';
    }

    // Отображение результата
    displayResult(targetValue);
    updateStatsDisplay(); // Обновить отображение статистики

    // Подготовка к следующему раунду
    if (currentMode === 'vision') {
        // Показать кнопку "Перемешать" снова
        visionRandomizeBtn.disabled = false;
        visionRandomizeBtn.classList.remove('hidden');
    } else { // intention
        // Рандомайзер снова запускается, кнопка "Показать" появится через 1 секунду
        startIntentionRandomizer(); // Запускаем генератор снова
    }
}

// Отображение результата
function displayResult(value) {
    resultValue.textContent = gameSettings[currentGame].displayNames[value] || value;
     // Добавляем класс для стилизации фона результата (особенно для цвета)
    if (currentGame === 'color') {
        resultValue.className = `color-${value}`; // Для CSS стилей фона
        resultValue.style.backgroundColor = value; // Прямое применение стиля фона
         // Подбираем цвет текста для контраста
         if (['yellow', 'orange'].includes(value)) {
             resultValue.style.color = '#333';
         } else {
             resultValue.style.color = 'white';
         }
    } else if (currentGame === 'symbols'){
        if(value === 'circle') resultValue.innerHTML = '○';
        if(value === 'triangle') resultValue.innerHTML = '△';
        resultValue.style.backgroundColor = 'transparent'; // Убрать фон для символов/кубика и т.д.
        resultValue.style.color = 'inherit';
    }
    else {
        resultValue.style.backgroundColor = 'transparent'; // Убрать фон для символов/кубика и т.д.
        resultValue.style.color = 'inherit'; // Наследовать цвет текста
    }


    resultArea.classList.remove('hidden'); // Показать область результата
}

// --- Настройки Цвета ---
changeColorBtn.addEventListener('click', () => {
    colorPicker.classList.toggle('hidden');
});

colorOptionsContainer.addEventListener('click', (event) => {
    if (event.target.classList.contains('color-option')) {
        const selectedColor = event.target.dataset.color;
        const currentSelection = gameSettings.color.options;

        // Логика выбора двух цветов
        if (currentSelection.includes(selectedColor)) {
            // Снять выбор (если выбрано больше 2, иначе нельзя снять)
            if (currentSelection.length > 2) {
                 gameSettings.color.options = currentSelection.filter(c => c !== selectedColor);
                 event.target.classList.remove('selected');
            } else if (currentSelection.length === 2 && !currentSelection.includes(selectedColor)) {
                 // Нельзя снять выбор, если уже выбрано ровно два и это не один из них
            } else if (currentSelection.length === 1 && currentSelection[0] === selectedColor) {
                // Нельзя снять выбор единственного цвета
            } else {
                 // Убираем цвет, если он один из двух
                 gameSettings.color.options = currentSelection.filter(c => c !== selectedColor);
                 event.target.classList.remove('selected');
            }

        } else {
            // Добавить выбор
            if (currentSelection.length < 2) {
                gameSettings.color.options.push(selectedColor);
                event.target.classList.add('selected');
            } else {
                // Заменить первый выбранный цвет новым, если уже выбрано два
                 const removedColor = gameSettings.color.options.shift(); // Удалить первый
                 gameSettings.color.options.push(selectedColor); // Добавить новый
                 // Обновить UI для кнопок
                 updateColorPickerSelection();

                 // Можно добавить уведомление, что цвет заменен
                 tg.HapticFeedback.notificationOccurred('warning'); // Виброотклик
            }
        }

        updateColorPickerSelection(); // Обновить отображение выбранных и кнопки
        // Перезапустить UI игры, если она активна, чтобы отразить новые цвета
        if (currentMode) {
             resetGameUI();
             if (currentMode === 'vision') {
                 visionControls.classList.remove('hidden');
             } else {
                 startIntentionRandomizer();
             }
        }
    }
});

function updateColorPickerSelection() {
    // Обновить выделение кнопок
    document.querySelectorAll('.color-option').forEach(btn => {
        btn.classList.toggle('selected', gameSettings.color.options.includes(btn.dataset.color));
    });
    // Обновить текстовое отображение выбранных цветов
    selectedColorsDisplay.textContent = gameSettings.color.options
        .map(color => gameSettings.color.displayNames[color] || color)
        .join(', ');
}


// --- Обработка кнопок "Назад" ---
backButtons.forEach(button => {
    button.addEventListener('click', () => {
        const targetSection = button.dataset.target;
        if (targetSection === 'main-menu') {
            showSection('main-menu');
            resetGameState(); // Сброс состояния при выходе из игры
        }
        // Можно добавить другие цели для кнопок "назад", если нужно
    });
});

// Кнопка "Назад" внутри игры возвращает к выбору режима
gameBackButton.addEventListener('click', () => {
    stopIntentionRandomizer(); // Остановить генератор при выходе из режима
    gameContent.classList.add('hidden'); // Скрыть игровое поле
    modeSelection.classList.remove('hidden'); // Показать выбор режима
    resetGameUI(); // Сбросить UI текущего режима
    currentMode = null; // Сбросить текущий режим
});

// Инициализация при загрузке
showSection('main-menu'); // Показать главное меню при старте
updateColorPickerSelection(); // Установить начальное состояние для выбора цвета
