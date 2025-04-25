document.addEventListener('DOMContentLoaded', () => {
    // --- Инициализация Telegram ---
    const tg = window.Telegram.WebApp;
    tg.expand();

    // --- Константы ---
    const ALL_COLORS = {
        red: { name: 'Красный', value: '#e74c3c' },
        orange: { name: 'Оранж.', value: '#e67e22' },
        yellow: { name: 'Желтый', value: '#f1c40f' },
        green: { name: 'Зеленый', value: '#2ecc71' },
        lightblue: { name: 'Голубой', value: '#3498db' }, // Renamed from blue
        blue: { name: 'Синий', value: '#2980b9' },     // Added a darker blue
        violet: { name: 'Фиолет.', value: '#9b59b6' }
    };
    const DEFAULT_COLORS = ['red', 'blue']; // Используем ключи из ALL_COLORS
    const MIN_COLORS = 2;
    const MAX_COLORS = 7;

    const ALL_SYMBOLS = ['circle', 'triangle', 'square', 'empty']; // Используем ключи
    const SYMBOL_MAP = { // Отображение ключей на то, что показывать
        circle: '⚪',
        triangle: '🔺',
        square: '⬜️',
        empty: ' ' // Пустое место
    };

    // --- Получение элементов DOM ---
    const appContainer = document.getElementById('app');
    const usernameSpan = document.getElementById('username');

    // Экраны
    const screens = {
        welcome: document.getElementById('welcome'),
        intentionGame: document.getElementById('intentionGame'),
        visionTypeSelection: document.getElementById('visionTypeSelection'),
        colorSetup: document.getElementById('colorSetupScreen'),
        colorGame: document.getElementById('colorGameScreen'),
        symbolsSetup: document.getElementById('symbolsSetupScreen'),
        symbolsGame: document.getElementById('symbolsGameScreen'),
    };

    // Кнопки навигации
    const chooseIntentionBtn = document.getElementById('chooseIntentionBtn');
    const chooseVisionBtn = document.getElementById('chooseVisionBtn');
    const selectVisionColorBtn = document.getElementById('selectVisionColorBtn');
    const selectVisionSymbolBtn = document.getElementById('selectVisionSymbolBtn');
    const startColorGameBtn = document.getElementById('startColorGameBtn');
    const changeColorsBtn = document.getElementById('changeColorsBtn');
    const changeSymbolsBtn = document.getElementById('changeSymbolsBtn');

    // Элементы игры "Намерение"
    const showIntentionColorBtn = document.getElementById('showIntentionColorBtn');
    const intentionColorResultDiv = document.getElementById('intentionColorResult');

    // Элементы настройки "Цвета"
    const colorSelectionContainer = document.getElementById('colorSelection');
    const colorSelectionError = document.getElementById('colorSelectionError');

    // Элементы игры "Цвета"
    const shuffleColorBtn = document.getElementById('shuffleColorBtn');
    const colorShufflingDiv = document.getElementById('colorShuffling');
    const colorChoiceDiv = document.getElementById('colorChoice');
    const colorChoiceButtonsDiv = document.getElementById('colorChoiceButtons');
    const colorResultDiv = document.getElementById('colorResult');
    const colorWinsSpan = document.getElementById('colorWins');
    const colorAttemptsSpan = document.getElementById('colorAttempts');

    // Элементы настройки "Символы"
    const symbolCountButtons = document.querySelectorAll('.symbol-count-btn');

    // Элементы игры "Символы"
    const shuffleSymbolBtn = document.getElementById('shuffleSymbolBtn');
    const symbolShufflingDiv = document.getElementById('symbolShuffling');
    const symbolChoiceDiv = document.getElementById('symbolChoice');
    const symbolChoiceButtonsDiv = document.getElementById('symbolChoiceButtons');
    const symbolResultDiv = document.getElementById('symbolResult');
    const symbolWinsSpan = document.getElementById('symbolWins');
    const symbolAttemptsSpan = document.getElementById('symbolAttempts');

    // Кнопки "Назад"
    const backBtns = document.querySelectorAll('.back-btn');

    // --- Переменные состояния игры ---
    let currentScreen = 'welcome';
    let activeColors = [...DEFAULT_COLORS]; // Цвета, используемые в текущей игре "Цвета"
    let colorTarget = null;
    let isColorShuffling = false;
    let colorShuffleTimeout = null;
    let colorWins = 0;
    let colorAttempts = 0;

    let activeSymbols = []; // Символы, используемые в текущей игре "Символы"
    let numSymbols = 0; // Выбранное количество символов
    let symbolTarget = null;
    let isSymbolShuffling = false;
    let symbolShuffleTimeout = null;
    let symbolWins = 0;
    let symbolAttempts = 0;

    // --- Функции ---

    // Отображение имени пользователя и установка темы
    function initializeUserInterface() {
        if (tg.initDataUnsafe?.user?.first_name) {
            usernameSpan.textContent = tg.initDataUnsafe.user.first_name;
        } else {
            usernameSpan.textContent = 'Игрок';
            console.warn('Не удалось получить данные пользователя Telegram.');
        }
        setThemeColors();
        tg.onEvent('themeChanged', setThemeColors); // Слушаем изменения темы
        populateColorSelection(); // Заполняем выбор цветов при загрузке
        showScreen('welcome');    // Показываем начальный экран
        tg.ready();
    }

    // Установка цветов темы Telegram
    function setThemeColors() {
        document.body.style.backgroundColor = tg.themeParams.bg_color || '#ffffff';
        document.body.style.color = tg.themeParams.text_color || '#000000';
    }

    // Переключение экранов
    function showScreen(screenId) {
        console.log(`Switching to screen: ${screenId}`);
        currentScreen = screenId;
        for (const id in screens) {
            if (screens[id]) { // Убедимся, что элемент существует
                 screens[id].classList.toggle('active', id === screenId);
            } else {
                console.error(`Screen element not found: ${id}`);
            }
        }
        // Сброс состояний игр при переходе на некоторые экраны
        if (screenId === 'welcome' || screenId === 'visionTypeSelection') {
            resetColorGameState(false); // Не сбрасывать счетчики
            resetSymbolGameState(false);
        }
        // Скролл вверх при смене экрана
         window.scrollTo(0, 0);
    }

    // --- Логика игры "Намерение" ---
    function handleIntention() {
        const randomNumber = Math.floor(Math.random() * 1000);
        const isEven = randomNumber % 2 === 0;
        intentionColorResultDiv.classList.remove('intention-red', 'intention-blue');
        intentionColorResultDiv.style.backgroundColor = '#eee';
        intentionColorResultDiv.textContent = '';
        setTimeout(() => {
            if (isEven) {
                intentionColorResultDiv.classList.add('intention-red');
                intentionColorResultDiv.textContent = 'Красный';
            } else {
                intentionColorResultDiv.classList.add('intention-blue');
                intentionColorResultDiv.textContent = 'Синий';
            }
        }, 50);
        hapticFeedback('light');
    }

    // --- Настройка игры "Цвета" ---
    function populateColorSelection() {
        colorSelectionContainer.innerHTML = ''; // Очищаем
        Object.keys(ALL_COLORS).forEach(key => {
            const color = ALL_COLORS[key];
            const label = document.createElement('label');
            label.classList.add('color-checkbox-label');
            label.dataset.color = key;
            label.style.backgroundColor = color.value;
             // Устанавливаем цвет текста для лучшей читаемости (пример для желтого)
            if (key === 'yellow') {
                 label.style.color = '#333';
                 label.style.textShadow = 'none';
            }

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = key;
            checkbox.checked = activeColors.includes(key); // Отмечаем текущие активные цвета
            if (checkbox.checked) {
                 label.classList.add('selected'); // Сразу добавляем класс, если выбрано
            }

            checkbox.addEventListener('change', (e) => {
                 label.classList.toggle('selected', e.target.checked);
                 updateSelectedColors();
            });

            label.appendChild(checkbox);
             // Создаем span для текста, чтобы применить text-shadow только к нему
            const textSpan = document.createElement('span');
            textSpan.textContent = color.name;
            label.appendChild(textSpan);

            colorSelectionContainer.appendChild(label);
        });
         updateSelectedColors(); // Обновляем состояние кнопки и ошибки сразу
    }

    function updateSelectedColors() {
        const selectedCheckboxes = colorSelectionContainer.querySelectorAll('input[type="checkbox"]:checked');
        const currentSelection = Array.from(selectedCheckboxes).map(cb => cb.value);

        const isValid = currentSelection.length >= MIN_COLORS && currentSelection.length <= MAX_COLORS;
        startColorGameBtn.disabled = !isValid;
        colorSelectionError.classList.toggle('hidden', isValid);

        // Не обновляем activeColors здесь, только при нажатии "Начать игру"
        return currentSelection; // Возвращаем текущий выбор для кнопки старта
    }

    function startGameWithSelectedColors() {
        const selected = updateSelectedColors();
        if (selected.length >= MIN_COLORS && selected.length <= MAX_COLORS) {
            activeColors = selected; // Обновляем активные цвета
            resetColorGameState(true); // Сбрасываем состояние игры (со счетчиками)
            showScreen('colorGame');
        } else {
            colorSelectionError.classList.remove('hidden');
        }
    }

     // Сброс состояния игры "Цвета"
    function resetColorGameState(resetStats = false) {
        clearTimeout(colorShuffleTimeout);
        isColorShuffling = false;
        colorTarget = null;
        shuffleColorBtn.disabled = false;
        colorShufflingDiv.classList.add('hidden');
        colorChoiceDiv.classList.add('hidden');
        colorResultDiv.textContent = '';
        colorResultDiv.className = 'result-message'; // Сброс классов success/failure
        if (resetStats) {
            colorWins = 0;
            colorAttempts = 0;
            updateColorStats();
        }
    }

    // --- Логика игры "Цвета" ---
     function startColorShuffle() {
        if (isColorShuffling || activeColors.length < MIN_COLORS) return;

        isColorShuffling = true;
        resetColorGameState(false); // Сбросить текущее состояние, но не статистику
        shuffleColorBtn.disabled = true;
        colorShufflingDiv.classList.remove('hidden');
        hapticFeedback('medium');

        clearTimeout(colorShuffleTimeout);
        colorShuffleTimeout = setTimeout(() => {
            colorTarget = activeColors[Math.floor(Math.random() * activeColors.length)];
            // console.log('Загадан цвет:', colorTarget);

            colorShufflingDiv.classList.add('hidden');
            renderColorChoiceButtons(); // Создаем кнопки выбора
            colorChoiceDiv.classList.remove('hidden');
            isColorShuffling = false;
            // Кнопку shuffleColorBtn оставим выключенной до выбора игрока
        }, 3000);
    }

     function renderColorChoiceButtons() {
        colorChoiceButtonsDiv.innerHTML = ''; // Очищаем предыдущие кнопки
        // Перемешиваем активные цвета для случайного порядка кнопок
        const shuffledColors = [...activeColors].sort(() => Math.random() - 0.5);

        shuffledColors.forEach(colorKey => {
            const button = document.createElement('button');
            button.classList.add('choice-btn', 'color-btn');
            button.dataset.color = colorKey;
            button.style.backgroundColor = ALL_COLORS[colorKey].value;
             // Устанавливаем цвет текста для лучшей читаемости
            if (colorKey === 'yellow') {
                 button.style.color = '#333';
                 button.style.textShadow = 'none';
            }
             // Добавляем текстовое название цвета внутрь кнопки
             const colorNameSpan = document.createElement('span');
             colorNameSpan.textContent = ALL_COLORS[colorKey].name;
             button.appendChild(colorNameSpan);


            button.addEventListener('click', () => handleColorChoice(colorKey));
            colorChoiceButtonsDiv.appendChild(button);
        });
    }

    function handleColorChoice(chosenColorKey) {
        if (!colorTarget || isColorShuffling) return;

        colorAttempts++;
        let success = false;
        hapticFeedback('light');

        if (chosenColorKey === colorTarget) {
            colorResultDiv.textContent = '✅ Успех!';
            colorResultDiv.className = 'result-message success';
            colorWins++;
            success = true;
            hapticFeedback('success');
        } else {
            colorResultDiv.textContent = `❌ Неверно. Был ${ALL_COLORS[colorTarget].name}. Попробуй еще!`;
            colorResultDiv.className = 'result-message failure';
            hapticFeedback('error');
        }

        updateColorStats();
        colorChoiceDiv.classList.add('hidden'); // Скрываем кнопки
        shuffleColorBtn.disabled = false;   // Включаем кнопку "Перемешать"
        colorTarget = null;                 // Сбрасываем цель
    }

    function updateColorStats() {
        colorWinsSpan.textContent = colorWins;
        colorAttemptsSpan.textContent = colorAttempts;
    }


    // --- Настройка игры "Символы" ---
    function setupSymbolGame(count) {
        numSymbols = count;
        // Выбираем первые 'count' символов из ALL_SYMBOLS
        activeSymbols = ALL_SYMBOLS.slice(0, numSymbols);
        resetSymbolGameState(true); // Сбросить состояние и статистику для новой игры
        showScreen('symbolsGame');
    }

     // Сброс состояния игры "Символы"
    function resetSymbolGameState(resetStats = false) {
        clearTimeout(symbolShuffleTimeout);
        isSymbolShuffling = false;
        symbolTarget = null;
        shuffleSymbolBtn.disabled = false;
        symbolShufflingDiv.classList.add('hidden');
        symbolChoiceDiv.classList.add('hidden');
        symbolResultDiv.textContent = '';
        symbolResultDiv.className = 'result-message';
        if (resetStats) {
            symbolWins = 0;
            symbolAttempts = 0;
            updateSymbolStats();
        }
    }

    // --- Логика игры "Символы" ---
    function startSymbolShuffle() {
        if (isSymbolShuffling || activeSymbols.length < 2) return; // Минимум 2 символа

        isSymbolShuffling = true;
        resetSymbolGameState(false);
        shuffleSymbolBtn.disabled = true;
        symbolShufflingDiv.classList.remove('hidden');
        hapticFeedback('medium');

        clearTimeout(symbolShuffleTimeout);
        symbolShuffleTimeout = setTimeout(() => {
            symbolTarget = activeSymbols[Math.floor(Math.random() * activeSymbols.length)];
            // console.log('Загадан символ:', symbolTarget);

            symbolShufflingDiv.classList.add('hidden');
            renderSymbolChoiceButtons(); // Создаем кнопки выбора
            symbolChoiceDiv.classList.remove('hidden');
            isSymbolShuffling = false;
        }, 3000);
    }

     function renderSymbolChoiceButtons() {
        symbolChoiceButtonsDiv.innerHTML = '';
        const shuffledSymbols = [...activeSymbols].sort(() => Math.random() - 0.5);

        shuffledSymbols.forEach(symbolKey => {
            const button = document.createElement('button');
            button.classList.add('choice-btn', 'symbol-btn');
            button.dataset.symbol = symbolKey;
            // button.textContent = SYMBOL_MAP[symbolKey] || symbolKey; // Отображаем символ

            // Добавляем стилизацию через data-атрибут (CSS сделает остальное)
             if (symbolKey === 'empty') {
                 button.style.border = '2px dashed var(--tg-theme-hint-color)';
                 button.style.backgroundColor = 'transparent';
             }

            button.addEventListener('click', () => handleSymbolChoice(symbolKey));
            symbolChoiceButtonsDiv.appendChild(button);
        });
    }

    function handleSymbolChoice(chosenSymbolKey) {
         if (!symbolTarget || isSymbolShuffling) return;

        symbolAttempts++;
        let success = false;
        hapticFeedback('light');

        if (chosenSymbolKey === symbolTarget) {
            symbolResultDiv.textContent = '✅ Успех!';
             symbolResultDiv.className = 'result-message success';
            symbolWins++;
            success = true;
            hapticFeedback('success');
        } else {
            // Получаем видимое представление символа для сообщения
            const targetDisplay = SYMBOL_MAP[symbolTarget] ? `${SYMBOL_MAP[symbolTarget]} (${symbolTarget})` : symbolTarget;
             symbolResultDiv.textContent = `❌ Неверно. Был ${targetDisplay}. Попробуй еще!`;
             symbolResultDiv.className = 'result-message failure';
             hapticFeedback('error');
        }

        updateSymbolStats();
        symbolChoiceDiv.classList.add('hidden');
        shuffleSymbolBtn.disabled = false;
        symbolTarget = null;
    }

     function updateSymbolStats() {
        symbolWinsSpan.textContent = symbolWins;
        symbolAttemptsSpan.textContent = symbolAttempts;
    }

    // --- Вспомогательные функции ---
    function hapticFeedback(type) {
        if (tg.HapticFeedback) {
            try { // Добавим try-catch на случай, если метод не поддерживается
                switch (type) {
                    case 'light': tg.HapticFeedback.impactOccurred('light'); break;
                    case 'medium': tg.HapticFeedback.impactOccurred('medium'); break;
                    case 'heavy': tg.HapticFeedback.impactOccurred('heavy'); break;
                    case 'success': tg.HapticFeedback.notificationOccurred('success'); break;
                    case 'warning': tg.HapticFeedback.notificationOccurred('warning'); break;
                    case 'error': tg.HapticFeedback.notificationOccurred('error'); break;
                    case 'selection': tg.HapticFeedback.selectionChanged(); break;
                    default: console.warn('Unknown haptic feedback type:', type);
                }
            } catch (e) {
                console.error("Haptic feedback error:", e);
            }
        }
    }


    // --- Обработчики событий ---

    // Основная навигация
    chooseIntentionBtn.addEventListener('click', () => showScreen('intentionGame'));
    chooseVisionBtn.addEventListener('click', () => showScreen('visionTypeSelection'));

    // Выбор типа Видения
    selectVisionColorBtn.addEventListener('click', () => {
        populateColorSelection(); // Обновляем чекбоксы согласно activeColors
        showScreen('colorSetup');
        });
    selectVisionSymbolBtn.addEventListener('click', () => showScreen('symbolsSetup'));

    // Назад
    backBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetScreen = btn.dataset.target || 'welcome'; // По умолчанию на главный
            showScreen(targetScreen);
            hapticFeedback('selection');
        });
    });

    // Игра "Намерение"
    showIntentionColorBtn.addEventListener('click', handleIntention);

    // Настройка "Цвета"
    startColorGameBtn.addEventListener('click', startGameWithSelectedColors);

    // Игра "Цвета"
    shuffleColorBtn.addEventListener('click', startColorShuffle);
    changeColorsBtn.addEventListener('click', () => showScreen('colorSetup')); // Кнопка смены цветов

    // Настройка "Символы"
    symbolCountButtons.forEach(button => {
        button.addEventListener('click', () => {
            const count = parseInt(button.dataset.count, 10);
            setupSymbolGame(count);
        });
    });

    // Игра "Символы"
    shuffleSymbolBtn.addEventListener('click', startSymbolShuffle);
     changeSymbolsBtn.addEventListener('click', () => showScreen('symbolsSetup')); // Кнопка смены кол-ва

    // --- Инициализация ---
    initializeUserInterface();

});
