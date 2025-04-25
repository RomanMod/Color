document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;
    tg.ready(); // Сообщаем Telegram, что приложение готово

    // --- Элементы DOM ---
    const screens = document.querySelectorAll('.screen');
    const welcomeScreen = document.getElementById('welcome');
    const visionChoiceScreen = document.getElementById('vision-choice');
    const colorGameSetupScreen = document.getElementById('color-game-setup');
    const colorGamePlayScreen = document.getElementById('color-game-play');
    const intentionGameScreen = document.getElementById('intention-game'); // Экран для "Намерения"

    const userNameSpan = document.getElementById('user-name');

    // Кнопки навигации
    const btnIntention = document.getElementById('btn-intention');
    const btnVision = document.getElementById('btn-vision');
    const btnVisionColor = document.getElementById('btn-vision-color');
    const btnBackToMain = document.getElementById('btn-back-to-main');
    const btnBackToVision = document.getElementById('btn-back-to-vision');
    const btnStartColorGame = document.getElementById('btn-start-color-game');
    const btnBackToColorSetup = document.getElementById('btn-back-to-color-setup');
    const btnBackToMainFromIntention = document.getElementById('btn-back-to-main-from-intention');

    // Элементы игры "Цвет"
    const colorSelectorDiv = document.getElementById('color-selector');
    const selectedColor1Span = document.getElementById('selected-color-1');
    const selectedColor2Span = document.getElementById('selected-color-2');
    const randomizerDisplay = document.getElementById('randomizer-display');
    const showColorButton = document.getElementById('btn-show-color');
    const resultArea = document.getElementById('result-area'); // Область для показа пойманного цвета

    // Элементы игры "Намерение" (пример)
    const btnIntentionAction = document.getElementById('btn-intention-action');
    const intentionResultSpan = document.getElementById('intention-result');

    // --- Переменные состояния игры ---
    const rainbowColors = {
        red: 'Красный',
        orange: 'Оранжевый',
        yellow: 'Желтый',
        green: 'Зеленый',
        blue: 'Синий',
        indigo: 'Индиго',
        violet: 'Фиолетовый'
    };
    let selectedColors = ['red', 'blue']; // Цвета по умолчанию
    let colorIntervalId = null; // ID таймера для рандомайзера
    let currentColorIndex = 0; // Индекс текущего цвета в рандомайзере
    const randomizerSpeed = 100; // ms - скорость смены цвета
    let isShowingResult = false; // Флаг, что результат показывается

    // --- Функции ---

    // Показать нужный экран, скрыть остальные
    function showScreen(screenId) {
        screens.forEach(screen => {
            screen.classList.remove('active');
        });
        const activeScreen = document.getElementById(screenId);
        if (activeScreen) {
            activeScreen.classList.add('active');
        }
        // При изменении экрана говорим Telegram изменить размер окна, если нужно
        tg.expand();
    }

    // Обновить отображение выбранных цветов в настройке
    function updateSelectedColorDisplay() {
        selectedColor1Span.className = `color-swatch color-${selectedColors[0] || 'default'}`;
        selectedColor2Span.className = `color-swatch color-${selectedColors[1] || 'default'}`;
        // Обновляем data-атрибуты кнопок выбора, если нужно
        const buttons = colorSelectorDiv.querySelectorAll('button');
        buttons.forEach(button => {
            const color = button.dataset.color;
            if (selectedColors.includes(color)) {
                button.classList.add('selected');
            } else {
                button.classList.remove('selected');
            }
        });
        // Активировать кнопку старта, если выбрано 2 цвета
        btnStartColorGame.disabled = selectedColors.length !== 2;
    }

    // Создать кнопки выбора цвета
    function populateColorSelector() {
        colorSelectorDiv.innerHTML = ''; // Очистить предыдущие
        for (const color in rainbowColors) {
            const button = document.createElement('button');
            button.dataset.color = color;
            button.className = `color-${color}`;
            button.title = rainbowColors[color]; // Подсказка
            button.addEventListener('click', handleColorSelection);
            colorSelectorDiv.appendChild(button);
        }
        updateSelectedColorDisplay(); // Отметить выбранные по умолчанию
    }

    // Обработчик выбора цвета
    function handleColorSelection(event) {
        const selectedColor = event.target.dataset.color;
        const index = selectedColors.indexOf(selectedColor);

        if (index > -1) {
            // Цвет уже выбран, убираем его
            selectedColors.splice(index, 1);
        } else {
            // Добавляем цвет, если выбрано меньше двух
            if (selectedColors.length < 2) {
                selectedColors.push(selectedColor);
            } else {
                // Если уже выбрано два, заменяем первый выбранный новым
                selectedColors.shift(); // Удаляем первый
                selectedColors.push(selectedColor); // Добавляем новый
            }
        }
        updateSelectedColorDisplay();
    }

    // Запуск рандомайзера (циклическая смена цвета)
    function startColorRandomizer() {
        if (colorIntervalId) clearInterval(colorIntervalId); // Остановить предыдущий, если есть
        if (selectedColors.length < 2) return; // Не запускать, если не выбраны 2 цвета

        showColorButton.style.display = 'block'; // Показать кнопку "Показать цвет"
        resultArea.textContent = ''; // Очистить результат
        randomizerDisplay.textContent = ''; // Убрать текст с дисплея
        randomizerDisplay.style.fontSize = 'initial'; // Сбросить размер шрифта
        isShowingResult = false;

        colorIntervalId = setInterval(() => {
             if (isShowingResult) return; // Не менять цвет, пока показывается результат
            currentColorIndex = (currentColorIndex + 1) % selectedColors.length;
            const nextColor = selectedColors[currentColorIndex];
            randomizerDisplay.className = `color-${nextColor}`; // Меняем фон через класс
            // Можно добавить плавности сменой класса с transition в CSS
        }, randomizerSpeed);
         // Установить начальный цвет сразу
         randomizerDisplay.className = `color-${selectedColors[currentColorIndex]}`;
    }

    // Остановка рандомайзера и показ результата
    function stopAndShowColor() {
         if (isShowingResult || !colorIntervalId) return; // Не реагировать, если уже показываем или таймер не запущен

         isShowingResult = true; // Ставим флаг
         const finalColor = selectedColors[currentColorIndex];
         const finalColorName = rainbowColors[finalColor];

         if (colorIntervalId) {
             clearInterval(colorIntervalId);
             colorIntervalId = null;
         }

         // Показываем результат в большом блоке
         randomizerDisplay.className = `color-${finalColor}`;
         randomizerDisplay.textContent = finalColorName; // Показываем название цвета
         randomizerDisplay.style.fontSize = '28px'; // Крупнее шрифт

         showColorButton.style.display = 'none'; // Спрятать кнопку на время показа

         // Через N секунд снова запустить рандомайзер
         setTimeout(() => {
             isShowingResult = false; // Снимаем флаг
             startColorRandomizer(); // Перезапускаем
         }, 2000); // Пауза в 2 секунды перед новым запуском
    }

     // --- Логика игры "Намерение" (Пример) ---
     let intentionValue = 0;
     let intentionInterval = null;

     function startIntentionGenerator() {
         if (intentionInterval) clearInterval(intentionInterval);
         intentionInterval = setInterval(() => {
             intentionValue = Math.floor(Math.random() * 100); // Генерируем число от 0 до 99
             // Можно отображать текущее значение где-то для динамики, если нужно
             // console.log("Текущее намерение (не зафиксировано):", intentionValue);
         }, 50); // Генерируем очень быстро
     }

     function fixIntention() {
         if (intentionInterval) {
             clearInterval(intentionInterval); // Останавливаем генератор
             intentionInterval = null;
         }
         // Показываем зафиксированное значение
         intentionResultSpan.textContent = intentionValue;
         // Через некоторое время можно снова запустить генератор
         // setTimeout(startIntentionGenerator, 1500);
     }


    // --- Инициализация ---

    // Получаем имя пользователя
    try {
        // Пытаемся получить имя пользователя из Telegram API
        // initDataUnsafe безопасен для получения данных пользователя в контексте Mini App
        const user = tg.initDataUnsafe?.user;
        if (user?.first_name) {
            userNameSpan.textContent = user.first_name;
        } else {
             userNameSpan.textContent = 'Игрок'; // Запасной вариант
        }
    } catch (error) {
        console.error("Ошибка получения данных пользователя Telegram:", error);
        userNameSpan.textContent = 'Игрок'; // Запасной вариант при ошибке
    }

    populateColorSelector(); // Создаем кнопки выбора цвета
    showScreen('welcome'); // Показываем первый экран

    // --- Обработчики событий ---

    // Главное меню
    btnIntention.addEventListener('click', () => {
        showScreen('intention-game');
        startIntentionGenerator(); // Запускаем генератор для Намерения
    });
    btnVision.addEventListener('click', () => showScreen('vision-choice'));

    // Выбор игры "Видение"
    btnVisionColor.addEventListener('click', () => {
        populateColorSelector(); // Обновить селектор на случай возврата
        showScreen('color-game-setup');
    });
    btnBackToMain.addEventListener('click', () => showScreen('welcome'));

    // Настройка игры "Цвет"
    btnStartColorGame.addEventListener('click', () => {
        showScreen('color-game-play');
        currentColorIndex = 0; // Сбросить индекс
        startColorRandomizer(); // Запустить игру
    });
    btnBackToVision.addEventListener('click', () => showScreen('vision-choice'));

    // Игра "Цвет"
    showColorButton.addEventListener('click', stopAndShowColor);
    btnBackToColorSetup.addEventListener('click', () => {
        if (colorIntervalId) clearInterval(colorIntervalId); // Остановить таймер при выходе
        colorIntervalId = null;
        randomizerDisplay.className = ''; // Сбросить цвет дисплея
        randomizerDisplay.textContent = '';
        showScreen('color-game-setup');
    });

     // Игра "Намерение"
    btnIntentionAction.addEventListener('click', fixIntention); // Клик фиксирует значение
    btnBackToMainFromIntention.addEventListener('click', () => {
         if (intentionInterval) clearInterval(intentionInterval); // Остановить генератор при выходе
         intentionInterval = null;
         intentionResultSpan.textContent = '-'; // Сбросить результат
        showScreen('welcome');
    });


}); // Конец DOMContentLoaded
