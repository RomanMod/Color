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
    let intentionInterval = null; // Не используется для генерации, только для примера если бы нужно было
    let visionTargetColor = null;
    let visionShuffleTimeout = null;
    let visionWins = 0;
    let visionAttempts = 0;
    let isShuffling = false;

    // --- Функции ---

    // Отображение имени пользователя
    function displayUsername() {
        if (tg.initDataUnsafe && tg.initDataUnsafe.user && tg.initDataUnsafe.user.first_name) {
            // Используем имя пользователя из Telegram
            // Примечание: initDataUnsafe не верифицированы на клиенте, но для отображения имени это нормально
            usernameSpan.textContent = tg.initDataUnsafe.user.first_name;
        } else {
            usernameSpan.textContent = 'Игрок'; // Запасной вариант
            console.warn('Не удалось получить данные пользователя Telegram.');
        }
    }

    // Переключение экранов
    function showScreen(screenToShow) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });
        screenToShow.classList.remove('hidden');
        // Сброс фонового цвета при переходе между экранами
        resetBackgroundColor();
    }

    // Сброс фонового цвета приложения
    function resetBackgroundColor() {
        appContainer.classList.remove('red-bg', 'blue-bg');
        // Восстанавливаем стандартные цвета темы
        document.body.style.backgroundColor = tg.themeParams.bg_color || '#ffffff';
        document.body.style.color = tg.themeParams.text_color || '#000000';
         // Сбрасываем цвет блока намерения
        intentionColorResultDiv.classList.remove('intention-red', 'intention-blue');
        intentionColorResultDiv.textContent = ''; // Очищаем текст
        intentionColorResultDiv.style.backgroundColor = '#eee'; // Возвращаем серый фон
    }

    // --- Логика игры "Намерение" ---
    function handleIntention() {
        // Генератор останавливается *в момент нажатия* и определяется цвет
        const randomNumber = Math.floor(Math.random() * 1000); // Генерируем число
        const isEven = randomNumber % 2 === 0;

        resetBackgroundColor(); // Сбрасываем предыдущий цвет перед установкой нового

        if (isEven) {
            // Четное -> Красный
            // intentionColorResultDiv.classList.add('intention-red');
            // intentionColorResultDiv.textContent = 'Красный';
            appContainer.classList.add('red-bg'); // Красный фон для всего приложения
            intentionColorResultDiv.textContent = '🔴'; // Эмодзи или текст

        } else {
            // Нечетное -> Синий
            // intentionColorResultDiv.classList.add('intention-blue');
            // intentionColorResultDiv.textContent = 'Синий';
            appContainer.classList.add('blue-bg'); // Синий фон для всего приложения
            intentionColorResultDiv.textContent = '🔵'; // Эмодзи или текст
        }
         // Можно добавить небольшую задержку перед повторным запуском, если нужно
         // showIntentionColorBtn.disabled = true;
         // setTimeout(() => { showIntentionColorBtn.disabled = false; }, 500); // Пауза 0.5 сек
    }

    // --- Логика игры "Видение" ---
    function startVisionShuffle() {
        if (isShuffling) return; // Не запускать, если уже перемешивается

        isShuffling = true;
        visionResultDiv.textContent = ''; // Очистить предыдущий результат
        visionChoiceDiv.classList.add('hidden'); // Скрыть кнопки выбора
        visionShufflingDiv.classList.remove('hidden'); // Показать "Перемешиваем..."
        shuffleVisionColorBtn.disabled = true; // Отключить кнопку перемешивания

        clearTimeout(visionShuffleTimeout); // Очистить предыдущий таймаут, если есть

        visionShuffleTimeout = setTimeout(() => {
            // Определяем целевой цвет через 3 секунды
            visionTargetColor = Math.random() < 0.5 ? 'red' : 'blue';
            console.log('Загадан цвет:', visionTargetColor); // Для отладки

            visionShufflingDiv.classList.add('hidden'); // Скрыть "Перемешиваем..."
            visionChoiceDiv.classList.remove('hidden'); // Показать кнопки выбора
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
            visionResultDiv.style.color = 'green';
            visionWins++;
            success = true;
        } else {
            visionResultDiv.textContent = `❌ Неверно. Был ${visionTargetColor === 'red' ? 'Красный' : 'Синий'}. Попробуй еще!`;
            visionResultDiv.style.color = 'red';
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
        resetBackgroundColor(); // Убедимся, что фон сброшен
        intentionColorResultDiv.textContent = ''; // Очищаем результат
        intentionColorResultDiv.style.backgroundColor = '#eee'; // Возвращаем серый фон
    });

    chooseVisionBtn.addEventListener('click', () => {
        showScreen(visionGameScreen);
        visionResultDiv.textContent = ''; // Очищаем результат
        visionShufflingDiv.classList.add('hidden'); // Скрываем "перемешиваем"
        visionChoiceDiv.classList.add('hidden'); // Скрываем кнопки выбора
        shuffleVisionColorBtn.disabled = false; // Убедимся, что кнопка доступна
        isShuffling = false; // Сбрасываем флаг перемешивания
        clearTimeout(visionShuffleTimeout); // Останавливаем перемешивание, если оно шло
    });

    // Кнопка "Показать цвет" (Намерение)
    showIntentionColorBtn.addEventListener('click', handleIntention);

    // Кнопка "Перемешать" (Видение)
    shuffleVisionColorBtn.addEventListener('click', startVisionShuffle);

    // Кнопки выбора цвета (Видение)
    chooseRedBtn.addEventListener('click', () => handleVisionChoice('red'));
    chooseBlueBtn.addEventListener('click', () => handleVisionChoice('blue'));

    // Кнопки "Назад"
    backBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            showScreen(welcomeScreen);
            // Сброс специфичных состояний игр при возврате
            clearTimeout(visionShuffleTimeout);
            isShuffling = false;
            visionTargetColor = null;
            resetBackgroundColor(); // Сбросить фон
        });
    });

    // --- Инициализация при загрузке ---
    displayUsername();
    showScreen(welcomeScreen); // Показываем начальный экран
    tg.ready(); // Сообщаем Telegram, что приложение готово
});
