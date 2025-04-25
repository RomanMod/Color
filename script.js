document.addEventListener('DOMContentLoaded', () => {
    // Инициализация Telegram Web App
    const tg = window.Telegram.WebApp;
    tg.expand(); // Расширяем приложение на весь экран

    // --- Получение элементов DOM ---
    const appContainer = document.getElementById('app');
    const usernameSpan = document.getElementById('username');

    const welcomeScreen = document.getElementById('welcome');
    const chooseIntentionBtn = document.getElementById('chooseIntentionBtn');
    const chooseVisionBtn = document.getElementById('chooseVisionBtn');

    const intentionGameScreen = document.getElementById('intentionGame');
    const showIntentionColorBtn = document.getElementById('showIntentionColorBtn');
    const intentionColorResultDiv = document.getElementById('intentionColorResult');

    const visionGameScreen = document.getElementById('visionGame');
    const shuffleVisionColorBtn = document.getElementById('shuffleVisionColorBtn');
    const visionShufflingDiv = document.getElementById('visionShuffling');
    const visionChoiceDiv = document.getElementById('visionChoice');
    const chooseRedBtn = document.getElementById('chooseRedBtn');
    const chooseBlueBtn = document.getElementById('chooseBlueBtn');
    const visionResultDiv = document.getElementById('visionResult');
    const visionWinsSpan = document.getElementById('visionWins');
    const visionAttemptsSpan = document.getElementById('visionAttempts');

    const backBtns = document.querySelectorAll('.back-btn');

    // --- Переменные состояния игры ---
    let visionTargetColor = null;
    let visionShuffleTimeout = null;
    let visionWins = 0;
    let visionAttempts = 0;
    let isShuffling = false;

    // --- Функции ---

    // Отображение имени пользователя
    function displayUsername() {
        if (tg.initDataUnsafe && tg.initDataUnsafe.user && tg.initDataUnsafe.user.first_name) {
            usernameSpan.textContent = tg.initDataUnsafe.user.first_name;
        } else {
            usernameSpan.textContent = 'Игрок'; // Запасной вариант
            console.warn('Не удалось получить данные пользователя Telegram.');
        }
         // Устанавливаем цвета темы при загрузке
        setThemeColors();
    }

    // Установка цветов темы Telegram
    function setThemeColors() {
        document.body.style.backgroundColor = tg.themeParams.bg_color || '#ffffff';
        document.body.style.color = tg.themeParams.text_color || '#000000';
        // Можно также применить цвета к кнопкам и другим элементам, если нужно
        // document.querySelectorAll('button').forEach(btn => {
        //     btn.style.backgroundColor = tg.themeParams.button_color || '#007bff';
        //     btn.style.color = tg.themeParams.button_text_color || '#ffffff';
        // });
    }

    // Переключение экранов
    function showScreen(screenToShow) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });
        screenToShow.classList.remove('hidden');
        // Сброс состояний при переходе на новый экран
        resetGameStates();
    }

     // Сброс состояния для игры Намерение и Видение
    function resetGameStates() {
        // Сброс Намерения
        intentionColorResultDiv.classList.remove('intention-red', 'intention-blue');
        intentionColorResultDiv.textContent = ''; // Очищаем текст
        intentionColorResultDiv.style.backgroundColor = '#eee'; // Возвращаем серый фон

        // Сброс Видения
        visionResultDiv.textContent = '';
        visionResultDiv.className = ''; // Сбрасываем классы success/failure
        visionShufflingDiv.classList.add('hidden');
        visionChoiceDiv.classList.add('hidden');
        shuffleVisionColorBtn.disabled = false; // Убедимся, что кнопка доступна
        isShuffling = false;
        clearTimeout(visionShuffleTimeout); // Останавливаем возможное перемешивание
        visionTargetColor = null; // Сбрасываем загаданный цвет

        // Убедимся, что основные цвета темы применены
        setThemeColors();
    }


    // --- Логика игры "Намерение" ---
    function handleIntention() {
        const randomNumber = Math.floor(Math.random() * 1000);
        const isEven = randomNumber % 2 === 0;

        // Сбрасываем предыдущий цвет и текст ТОЛЬКО для блока результата
        intentionColorResultDiv.classList.remove('intention-red', 'intention-blue');
        intentionColorResultDiv.style.backgroundColor = '#eee'; // Сначала сброс на серый
        intentionColorResultDiv.textContent = '';

        // Небольшая задержка для визуального эффекта сброса (опционально)
        setTimeout(() => {
            if (isEven) {
                // Четное -> Красный
                intentionColorResultDiv.classList.add('intention-red');
                intentionColorResultDiv.textContent = 'Красный';
            } else {
                // Нечетное -> Синий
                intentionColorResultDiv.classList.add('intention-blue');
                intentionColorResultDiv.textContent = 'Синий';
            }
        }, 50); // Короткая задержка в 50мс
    }

    // --- Логика игры "Видение" ---
    function startVisionShuffle() {
        if (isShuffling) return; // Не запускать, если уже перемешивается

        isShuffling = true;
        visionResultDiv.textContent = ''; // Очистить предыдущий результат
        visionResultDiv.className = ''; // Сбросить классы результата
        visionChoiceDiv.classList.add('hidden'); // Скрыть кнопки выбора
        visionShufflingDiv.classList.remove('hidden'); // Показать "Перемешиваем..."
        shuffleVisionColorBtn.disabled = true; // Отключить кнопку перемешивания

        clearTimeout(visionShuffleTimeout); // Очистить предыдущий таймаут, если есть

        visionShuffleTimeout = setTimeout(() => {
            // Определяем целевой цвет через 3 секунды
            visionTargetColor = Math.random() < 0.5 ? 'red' : 'blue';
            // console.log('Загадан цвет:', visionTargetColor); // Для отладки

            visionShufflingDiv.classList.add('hidden'); // Скрыть "Перемешиваем..."
            visionChoiceDiv.classList.remove('hidden'); // Показать блок с кнопками выбора
            // Кнопку "Перемешать" снова включим после выбора игрока

            isShuffling = false;
        }, 3000); // 3 секунды
    }

    function handleVisionChoice(chosenColor) {
        if (!visionTargetColor || isShuffling) return; // Не обрабатывать, если цвет не загадан или идет перемешивание

        visionAttempts++;
        let success = false;

        if (chosenColor === visionTargetColor) {
            visionResultDiv.textContent = '✅ Успех!';
            visionResultDiv.className = 'success'; // Добавляем класс для зеленого цвета
            visionWins++;
            success = true;
            // Вибрация при успехе (если поддерживается)
            if (tg.HapticFeedback) {
                 tg.HapticFeedback.notificationOccurred('success');
            }
        } else {
            visionResultDiv.textContent = `❌ Неверно. Был ${visionTargetColor === 'red' ? 'Красный' : 'Синий'}. Попробуй еще!`;
             visionResultDiv.className = 'failure'; // Добавляем класс для красного цвета
             // Вибрация при ошибке
            if (tg.HapticFeedback) {
                 tg.HapticFeedback.notificationOccurred('error');
            }
        }

        // Обновляем статистику
        visionWinsSpan.textContent = visionWins;
        visionAttemptsSpan.textContent = visionAttempts;

        // Скрываем кнопки выбора и снова включаем кнопку "Перемешать"
        visionChoiceDiv.classList.add('hidden');
        shuffleVisionColorBtn.disabled = false;
        visionTargetColor = null; // Сбрасываем загаданный цвет
    }

    // --- Обработчики событий ---

    // Выбор игры
    chooseIntentionBtn.addEventListener('click', () => {
        showScreen(intentionGameScreen);
    });

    chooseVisionBtn.addEventListener('click', () => {
        showScreen(visionGameScreen);
    });

    // Кнопка "Показать цвет" (Намерение)
    showIntentionColorBtn.addEventListener('click', () => {
        handleIntention();
        // Легкая вибрация при нажатии
        if (tg.HapticFeedback) {
            tg.HapticFeedback.impactOccurred('light');
        }
    });

    // Кнопка "Перемешать" (Видение)
    shuffleVisionColorBtn.addEventListener('click', () => {
         startVisionShuffle();
         // Средняя вибрация при нажатии
        if (tg.HapticFeedback) {
            tg.HapticFeedback.impactOccurred('medium');
        }
    });

    // Кнопки выбора цвета (Видение)
    chooseRedBtn.addEventListener('click', () => {
        handleVisionChoice('red');
        // Легкая вибрация при выборе
        if (tg.HapticFeedback) {
            tg.HapticFeedback.impactOccurred('light');
        }
        });
    chooseBlueBtn.addEventListener('click', () => {
        handleVisionChoice('blue');
         // Легкая вибрация при выборе
        if (tg.HapticFeedback) {
            tg.HapticFeedback.impactOccurred('light');
        }
        });

    // Кнопки "Назад"
    backBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            showScreen(welcomeScreen);
            // Вибрация при возврате
            if (tg.HapticFeedback) {
                tg.HapticFeedback.selectionChanged();
            }
        });
    });

    // --- Инициализация при загрузке ---
    displayUsername(); // Получаем имя и ставим тему
    showScreen(welcomeScreen); // Показываем начальный экран
    // resetGameStates() вызывается внутри showScreen, так что здесь не нужен
    tg.ready(); // Сообщаем Telegram, что приложение готово

    // Добавляем обработчик изменения темы Telegram (если пользователь сменит тему во время работы)
    tg.onEvent('themeChanged', setThemeColors);

});
