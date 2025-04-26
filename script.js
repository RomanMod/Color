document.addEventListener('DOMContentLoaded', () => {
    const appContainer = document.querySelector('.app-container');
    const userNameElement = document.getElementById('user-name');
    const gameTitleElement = document.getElementById('game-title');

    // Секции игры
    const mainMenu = document.getElementById('main-menu');
    const namerenieGame = document.getElementById('namerenie-game');
    const videnieGame = document.getElementById('videnie-game');

    // Элементы Намеренье
    const namerenieDisplay = document.getElementById('namerenie-display');
    const btnNamerenieShow = document.getElementById('btn-namerenie-show');
    const namerenieSettingRadios = document.querySelectorAll('input[name="namerenie-setting"]');
    let namerenieRandomizerInterval = null;
    let currentNamerenieChoice = null;
    let namerenieSetting = 'color'; // 'color' или 'shape'

    // Элементы Виденье
    const btnVidenieShuffle = document.getElementById('btn-videnie-shuffle');
    const videnieDisplay = document.getElementById('videnie-display');
    const videnieResultText = document.getElementById('videnie-result-text');
    const videnieGuessButtons = document.getElementById('videnie-guess-buttons');
    const videnieSettingRadios = document.querySelectorAll('input[name="videnie-setting"]');
    const statsAttempts = document.getElementById('stats-attempts');
    const statsSuccessful = document.getElementById('stats-successful');
    const statsUnsuccessful = document.getElementById('stats-unsuccessful');
    let videnieSetting = 'color'; // 'color' или 'shape'
    let videnieTargetChoice = null;
    let stats = { attempts: 0, successful: 0, unsuccessful: 0 };

    // Общие кнопки
    const backButtons = document.querySelectorAll('.btn-back');

    // --- Инициализация Telegram Web Apps API ---
    if (window.Telegram && window.Telegram.WebApp) {
        Telegram.WebApp.ready();
        const user = Telegram.WebApp.initDataUnsafe.user;
        if (user) {
            userNameElement.textContent = `Игрок: ${user.first_name}`;
            // Telegram.WebApp.BackButton.show(); // Можно использовать нативную кнопку "Назад"
            // Telegram.WebApp.onEvent('backButtonClicked', showMainMenu); // Обработчик для нативной кнопки
        } else {
            userNameElement.textContent = 'Игрок: Гость';
        }
    } else {
         userNameElement.textContent = 'Игрок: (Нет Telegram API)';
    }

    // --- Управление секциями ---
    function showSection(section) {
        document.querySelectorAll('.game-section').forEach(sec => {
            sec.classList.remove('active');
        });
        section.classList.add('active');

        // Остановка специфичной логики при переключении
        if (section !== namerenieGame && namerenieRandomizerInterval) {
            clearInterval(namerenieRandomizerInterval);
            namerenieRandomizerInterval = null;
        }
        if (section !== videnieGame) {
           // Дополнительная очистка или сброс для Видения при уходе из секции
        }
         if (section === namerenieGame) {
            gameTitleElement.textContent = 'Намеренье';
            startNamerenieRandomizer(); // Запускаем рандомайзер Намерения сразу
        } else if (section === videnieGame) {
             gameTitleElement.textContent = 'Виденье';
             resetVidenieGame(); // Сброс Видения при входе
             updateVidenieGuessButtons(); // Обновить кнопки угадывания при входе
        } else {
             gameTitleElement.textContent = 'Выберите игру';
        }
    }

    function showMainMenu() {
        showSection(mainMenu);
    }

    // --- Логика Намеренье ---

    // Обновление настройки Намеренье
    namerenieSettingRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            namerenieSetting = e.target.value;
            // При смене настройки, рандомайзер продолжит перемешивать новые типы
        });
    });


    // Функция для генерации случайного выбора (цвет или фигура)
    function getRandomChoice(setting) {
        if (setting === 'color') {
            const colors = ['red', 'blue'];
            return colors[Math.floor(Math.random() * colors.length)];
        } else { // setting === 'shape'
            const shapes = ['circle', 'triangle'];
            return shapes[Math.floor(Math.random() * shapes.length)];
        }
    }

    // Функция для отрисовки результата на дисплее
    function renderResult(displayElement, choice) {
        displayElement.innerHTML = ''; // Очистить дисплей
        const resultItem = document.createElement('div');
        resultItem.classList.add('result-item');

        if (choice === 'red' || choice === 'blue') {
            resultItem.classList.add(choice); // Добавить класс для цвета фона
        } else if (choice === 'circle') {
            resultItem.innerHTML = '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="black"/></svg>';
        } else if (choice === 'triangle') {
             resultItem.innerHTML = '<svg viewBox="0 0 100 100"><polygon points="50,10 90,90 10,90" fill="black"/></svg>';
        }
         displayElement.appendChild(resultItem);
    }

    // Запуск рандомайзера Намеренье (скрыто)
    function startNamerenieRandomizer() {
        if (namerenieRandomizerInterval) {
             clearInterval(namerenieRandomizerInterval);
        }
        namerenieRandomizerInterval = setInterval(() => {
            currentNamerenieChoice = getRandomChoice(namerenieSetting);
            // console.log('Намеренье перемешивает:', currentNamerenieChoice); // Для отладки
        }, 50); // Быстрое перемешивание
         namerenieDisplay.innerHTML = ''; // Очистить дисплей при запуске
         btnNamerenieShow.disabled = false; // Включить кнопку "Показать"
         btnNamerenieShow.style.display = 'block'; // Показать кнопку
    }

    // Остановка рандомайзера Намеренье и показ результата
    btnNamerenieShow.addEventListener('click', () => {
        if (namerenieRandomizerInterval) {
            clearInterval(namerenieRandomizerInterval);
            namerenieRandomizerInterval = null; // Останавливаем перемешивание

            // Показываем результат
            renderResult(namerenieDisplay, currentNamerenieChoice);

            btnNamerenieShow.disabled = true; // Отключаем кнопку
            // btnNamerenieShow.style.display = 'none'; // Скрываем кнопку (или отключаем и ждем 2с)

            // Ждем 2 секунды, затем сбрасываем и запускаем снова
            setTimeout(() => {
                namerenieDisplay.innerHTML = ''; // Очистить дисплей
                startNamerenieRandomizer(); // Запускаем перемешивание снова
            }, 2000);
        }
    });


    // --- Логика Виденье ---

    // Обновление настройки Виденье
    videnieSettingRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            videnieSetting = e.target.value;
            resetVidenieGame(); // Сбросить игру при смене настройки
        });
    });

    // Обновление кнопок угадывания в Видении
    function updateVidenieGuessButtons() {
        videnieGuessButtons.innerHTML = ''; // Очистить предыдущие кнопки
         videnieGuessButtons.style.pointerEvents = 'none'; // Отключить клики пока не перемешали

        if (videnieSetting === 'color') {
            videnieGuessButtons.innerHTML = `
                <button class="color-button blue" data-choice="blue"></button>
                <button class="color-button red" data-choice="red"></button>
            `;
        } else { // shape
             videnieGuessButtons.innerHTML = `
                <button data-choice="circle">
                    <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="black"/></svg>
                </button>
                <button data-choice="triangle">
                     <svg viewBox="0 0 100 100"><polygon points="50,10 90,90 10,90" fill="black"/></svg>
                </button>
            `;
        }

        // Добавить обработчики событий к новым кнопкам
        videnieGuessButtons.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', handleVidenieGuess);
        });
    }

    // Сброс игры Виденье
    function resetVidenieGame() {
        videnieTargetChoice = null;
        videnieDisplay.innerHTML = ''; // Очистить дисплей
        videnieResultText.textContent = ''; // Очистить текст результата
        btnVidenieShuffle.disabled = false; // Включить кнопку "Перемешать"
        videnieGuessButtons.style.pointerEvents = 'none'; // Отключить кнопки угадывания
        updateVidenieGuessButtons(); // Обновить кнопки в соответствии с текущей настройкой
        updateStatsDisplay(); // Обновить отображение статистики (хотя сброс игры не сбрасывает статистику)
    }

    // Обновление отображения статистики
    function updateStatsDisplay() {
        statsAttempts.textContent = stats.attempts;
        statsSuccessful.textContent = stats.successful;
        statsUnsuccessful.textContent = stats.unsuccessful;
    }

    // Обработчик кнопки "Перемешать" для Виденья
    btnVidenieShuffle.addEventListener('click', () => {
        btnVidenieShuffle.disabled = true; // Отключить кнопку "Перемешать"
        videnieGuessButtons.style.pointerEvents = 'none'; // Отключить кнопки угадывания
        videnieDisplay.innerHTML = ''; // Очистить дисплей
        videnieResultText.textContent = 'Перемешиваю...';

        // Генерируем цель на 2-3 секунды
        videnieTargetChoice = getRandomChoice(videnieSetting);
        // console.log('Виденье выбрало:', videnieTargetChoice); // Для отладки

        // Имитация перемешивания
        let shuffleCount = 0;
        const shuffleInterval = setInterval(() => {
             renderResult(videnieDisplay, getRandomChoice(videnieSetting));
             shuffleCount++;
             if (shuffleCount > 15) { // Останавливаем через ~1500ms
                 clearInterval(shuffleInterval);
                 videnieDisplay.innerHTML = ''; // Очищаем дисплей после "перемешивания"
                 videnieResultText.textContent = 'Угадай!';
                 videnieGuessButtons.style.pointerEvents = 'auto'; // Включить кнопки угадывания
                 // btnVidenieShuffle.disabled = false; // Кнопка Перемешать остается выключенной до угадывания/сброса
             }
        }, 100);


        // setTimeout(() => {
        //      videnieDisplay.innerHTML = ''; // Очищаем дисплей
        //      videnieResultText.textContent = 'Угадай!';
        //     videnieGuessButtons.style.pointerEvents = 'auto'; // Включить кнопки угадывания
        //     // btnVidenieShuffle.disabled = false; // Кнопка Перемешать остается выключенной до угадывания/сброса
        // }, 2500); // Время имитации перемешивания
    });

    // Обработчик кнопок угадывания для Виденья
    function handleVidenieGuess(event) {
        const guessedChoice = event.currentTarget.dataset.choice;

        if (!videnieTargetChoice) {
             videnieResultText.textContent = 'Нажмите "Перемешать" сначала!';
             return;
        }

        stats.attempts++;
        videnieGuessButtons.style.pointerEvents = 'none'; // Отключить кнопки угадывания после попытки

        // Показываем результат на дисплее
        renderResult(videnieDisplay, videnieTargetChoice);

        if (guessedChoice === videnieTargetChoice) {
            stats.successful++;
            videnieResultText.textContent = 'Успех!';
        } else {
            stats.unsuccessful++;
            videnieResultText.textContent = 'Попробуй ещё. Было:';
            // Результат (правильный ответ) уже показан на дисплее функцией renderResult
        }

        updateStatsDisplay();

        // Очистить дисплей и подготовиться к следующему раунду через пару секунд
        setTimeout(() => {
            videnieDisplay.innerHTML = '';
            videnieResultText.textContent = '';
            videnieTargetChoice = null; // Сбросить цель
            btnVidenieShuffle.disabled = false; // Включить кнопку "Перемешать" для нового раунда
        }, 3000); // Показать результат 3 секунды
    }


    // --- Обработчики кнопок навигации ---
    document.getElementById('btn-namerenie').addEventListener('click', () => {
        showSection(namerenieGame);
    });

    document.getElementById('btn-videnie').addEventListener('click', () => {
        showSection(videnieGame);
    });

    backButtons.forEach(button => {
        button.addEventListener('click', () => {
             // Остановить любые активные процессы перед возвратом
            if (namerenieRandomizerInterval) {
                clearInterval(namerenieRandomizerInterval);
                namerenieRandomizerInterval = null;
            }
            // Сбросить состояние Видения
            resetVidenieGame();
            // Если есть нативная кнопка Telegram, можно ее спрятать
            // if (window.Telegram && window.Telegram.WebApp && Telegram.WebApp.BackButton) {
            //    Telegram.WebApp.BackButton.hide();
            // }
            showMainMenu();
        });
    });

    // --- Инициализация при загрузке ---
    showMainMenu(); // Показать главное меню при старте
});
