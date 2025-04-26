document.addEventListener('DOMContentLoaded', () => {
    const app = document.getElementById('app');
    const playerInfo = document.getElementById('player-info');
    const modeSelectionScreen = document.getElementById('mode-selection-screen');
    const intentGameScreen = document.getElementById('intent-game-screen');
    const visionGameScreen = document.getElementById('vision-game-screen');

    const selectIntentBtn = document.getElementById('select-intent-mode');
    const selectVisionBtn = document.getElementById('select-vision-mode');

    const intentDisplay = document.getElementById('intent-display');
    const showIntentBtn = document.getElementById('show-intent-btn');

    const shuffleVisionBtn = document.getElementById('shuffle-vision-btn');
    const visionDisplay = document.getElementById('vision-display');
    const choiceButtons = document.querySelectorAll('.choice-btn');
    const statsAttempts = document.getElementById('stats-attempts');
    const statsWins = document.getElementById('stats-wins');
    const statsLosses = document.getElementById('stats-losses');

    const backButtons = document.querySelectorAll('.back-btn');
    const settingButtons = document.querySelectorAll('.setting-btn');

    let currentItemType = 'shape'; // Default setting
    let intentInterval = null;
    let currentIntentItem = null; // The item currently randomizing in Intent mode
    let visionTimeout = null;
    let correctVisionItem = null; // The item the player needs to guess in Vision mode
    let visionStats = { attempts: 0, wins: 0, losses: 0 };

    // SVG definitions
    const svgCircle = '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40"/></svg>';
    const svgTriangle = '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><polygon points="50,10 90,90 10,90"/></svg>';

    // --- Telegram Web Apps Integration ---
    try {
        Telegram.WebApp.ready();
        Telegram.WebApp.expand(); // Expand the app to fill the screen
        const user = Telegram.WebApp.initDataUnsafe.user;
        if (user && user.first_name) {
            playerInfo.innerText = `Игрок: ${user.first_name}`;
        } else {
             playerInfo.innerText = `Игрок: Аноним`;
        }
         // Optional: Show a main button
        Telegram.WebApp.MainButton.setText("Закрыть игру");
        Telegram.WebApp.MainButton.show();
        Telegram.WebApp.MainButton.onClick(Telegram.WebApp.close);

    } catch (e) {
        console.error("Failed to initialize Telegram Web App:", e);
        playerInfo.innerText = `Игрок: Ошибка загрузки данных ТГ`;
        // Handle cases where not in TG Web App environment
         Telegram.WebApp = { // Mock object for development outside TG
             ready: () => console.log("TG Mock: ready"),
             expand: () => console.log("TG Mock: expand"),
             initDataUnsafe: {},
             MainButton: {
                 setText: (t) => console.log("TG Mock: MainButton.setText", t),
                 show: () => console.log("TG Mock: MainButton.show"),
                 hide: () => console.log("TG Mock: MainButton.hide"),
                 onClick: (cb) => { this._onClick = cb; console.log("TG Mock: MainButton.onClick set"); }
             },
             close: () => console.log("TG Mock: close")
         };
           if (playerInfo.innerText.includes("Ошибка")) {
                playerInfo.innerText = `Игрок: (тест)`; // Set a default if TG fails
           }
    }


    // --- Screen Management ---
    function showScreen(screenElement) {
        const screens = [modeSelectionScreen, intentGameScreen, visionGameScreen];
        screens.forEach(screen => screen.classList.add('hidden'));
        screenElement.classList.remove('hidden');
    }

    // --- Randomization ---
    function getRandomItem() {
        if (currentItemType === 'color') {
            return Math.random() < 0.5 ? 'Синий' : 'Красный';
        } else { // shape
            return Math.random() < 0.5 ? 'Круг' : 'Треугольник';
        }
    }

     // --- Rendering ---
     function renderItem(displayElement, item, message = '', messageClass = '') {
         displayElement.innerHTML = ''; // Clear previous content
         displayElement.className = 'game-display'; // Reset classes

         let itemContent = '';
         let isShape = false;

         if (item === 'Синий') {
             displayElement.classList.add('display-color-blue');
             itemContent = 'Синий';
         } else if (item === 'Красный') {
             displayElement.classList.add('display-color-red');
             itemContent = 'Красный';
         } else if (item === 'Круг') {
             itemContent = svgCircle;
             isShape = true;
         } else if (item === 'Треугольник') {
             itemContent = svgTriangle;
             isShape = true;
         }

         if (isShape) {
             displayElement.innerHTML += itemContent;
         } else {
             // Create a span for color text to center it vertically
             const textSpan = document.createElement('span');
             textSpan.textContent = itemContent;
             displayElement.appendChild(textSpan);
         }

         if (message) {
             const msgDiv = document.createElement('div');
             msgDiv.classList.add('display-message');
             if (messageClass) msgDiv.classList.add(messageClass);
             msgDiv.textContent = message;
             displayElement.appendChild(msgDiv);
         }
     }

    // --- Game Mode: Намеренье (Intent) ---
    function startIntentRandomizer() {
        if (intentInterval) {
            clearInterval(intentInterval);
        }
        // Don't update the display, just the internal state
        intentInterval = setInterval(() => {
            currentIntentItem = getRandomItem();
            // Optional: Add a visual hint that it's randomizing, e.g., pulsing border
             intentDisplay.innerHTML = '<span style="color: #aaa;">...</span>'; // Simple placeholder
             intentDisplay.className = 'game-display'; // Reset classes
        }, 50); // Fast interval for constant randomization
    }

    function stopIntentRandomizer() {
        if (intentInterval) {
            clearInterval(intentInterval);
            intentInterval = null;
        }
    }

    selectIntentBtn.addEventListener('click', () => {
        showScreen(intentGameScreen);
        startIntentRandomizer();
        // Ensure settings are correctly reflected on entering the screen
         updateSettingButtonsState('intent', currentItemType);
    });

    showIntentBtn.addEventListener('click', () => {
        stopIntentRandomizer();
        if (currentIntentItem) {
            renderItem(intentDisplay, currentIntentItem);
        } else {
             // In case 'Показать' is clicked before interval runs
             intentDisplay.innerHTML = '<span style="color: #aaa;">Генерация...</span>';
             intentDisplay.className = 'game-display';
        }
    });


    // --- Game Mode: Виденье (Vision) ---
    function updateVisionStats() {
        statsAttempts.textContent = visionStats.attempts;
        statsWins.textContent = visionStats.wins;
        statsLosses.textContent = visionStats.losses;
    }

     function setupVisionChoices() {
         const item1 = currentItemType === 'color' ? 'Синий' : 'Круг';
         const item2 = currentItemType === 'color' ? 'Красный' : 'Треугольник';

         choiceButtons.forEach(btn => btn.innerHTML = ''); // Clear previous content

         renderChoiceButton(choiceButtons[0], item1);
         renderChoiceButton(choiceButtons[1], item2);

         choiceButtons.forEach(btn => btn.disabled = true); // Disable until shuffle
     }

     function renderChoiceButton(button, item) {
         button.setAttribute('data-choice-value', item);
         if (item === 'Синий' || item === 'Красный') {
             button.textContent = item;
         } else if (item === 'Круг') {
              button.innerHTML = svgCircle; // Add SVG for shape
         } else if (item === 'Треугольник') {
             button.innerHTML = svgTriangle; // Add SVG for shape
         }
     }


    selectVisionBtn.addEventListener('click', () => {
        showScreen(visionGameScreen);
        updateVisionStats(); // Show initial stats
        setupVisionChoices(); // Setup choice buttons
         // Ensure settings are correctly reflected on entering the screen
         updateSettingButtonsState('vision', currentItemType);
    });

    shuffleVisionBtn.addEventListener('click', () => {
        shuffleVisionBtn.disabled = true;
        choiceButtons.forEach(btn => btn.disabled = true);
        visionDisplay.innerHTML = '<span style="color: #aaa;">Перемешиваю...</span>'; // Indicate shuffling
        visionDisplay.className = 'game-display'; // Reset classes

        // Generate the item, but don't show it yet
        correctVisionItem = getRandomItem();
        console.log("Vision correct item (for debug):", correctVisionItem); // Keep this for testing

        visionTimeout = setTimeout(() => {
            // After 2-3 seconds, randomization stops internally
            shuffleVisionBtn.disabled = false;
             choiceButtons.forEach(btn => btn.disabled = false);
             visionDisplay.innerHTML = ''; // Clear display, ready for guess result
             visionDisplay.className = 'game-display';
             // Optional: Add a prompt message
              const promptMsg = document.createElement('div');
              promptMsg.classList.add('display-message');
              promptMsg.textContent = 'Ваш ход!';
              visionDisplay.appendChild(promptMsg);


        }, 2500 + Math.random() * 500); // 2.5 to 3 seconds
    });

    choiceButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            if (!correctVisionItem || button.disabled) return; // Don't guess if not shuffled or button disabled

            const playerGuess = event.currentTarget.getAttribute('data-choice-value');
            visionStats.attempts++;

            if (playerGuess === correctVisionItem) {
                visionStats.wins++;
                renderItem(visionDisplay, correctVisionItem, 'Успех!', 'result-success');
            } else {
                visionStats.losses++;
                renderItem(visionDisplay, correctVisionItem, 'Попробуй ещё.', 'result-fail');
            }

            updateVisionStats();
             choiceButtons.forEach(btn => btn.disabled = true); // Disable choices until next shuffle
             correctVisionItem = null; // Reset the item to be guessed
        });
    });


    // --- Settings (Color/Shape) ---
    function updateSettingButtonsState(mode, activeType) {
         settingButtons.forEach(btn => {
             if (btn.getAttribute('data-mode') === mode) {
                 if (btn.getAttribute('data-type') === activeType) {
                     btn.classList.add('active');
                 } else {
                     btn.classList.remove('active');
                 }
             }
         });
     }

    settingButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const newType = event.currentTarget.getAttribute('data-type');
            const mode = event.currentTarget.getAttribute('data-mode');

            if (currentItemType === newType) return; // No change needed

            currentItemType = newType;

            // Update the UI state for the current screen's setting buttons
            updateSettingButtonsState(mode, newType);


            // --- Reset game state based on the new setting ---
            if (mode === 'intent') {
                // Restart the randomizer with the new type
                stopIntentRandomizer();
                intentDisplay.innerHTML = ''; // Clear display
                intentDisplay.className = 'game-display'; // Reset classes
                currentIntentItem = null; // Reset item
                startIntentRandomizer(); // Start again with new type
            } else if (mode === 'vision') {
                // Reset Vision game
                if (visionTimeout) clearTimeout(visionTimeout);
                correctVisionItem = null;
                visionDisplay.innerHTML = ''; // Clear display
                visionDisplay.className = 'game-display'; // Reset classes
                shuffleVisionBtn.disabled = false; // Enable shuffle
                setupVisionChoices(); // Reconfigure choice buttons based on new type
                // Keep stats, as per design, only game state resets
            }
        });
    });

    // --- Back Buttons ---
    backButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Stop any active game processes
            stopIntentRandomizer();
            if (visionTimeout) clearTimeout(visionTimeout);
            correctVisionItem = null; // Reset vision item

            // Hide current screens
            intentGameScreen.classList.add('hidden');
            visionGameScreen.classList.add('hidden');

            // Show mode selection
            showScreen(modeSelectionScreen);

            // Optional: Reset game states entirely when going back?
            // For now, just stopping processes. Stats are persistent until refresh.
        });
    });


    // --- Initial Setup ---
    showScreen(modeSelectionScreen); // Start on mode selection
    // Initially set active button for the default type ('shape') on both screens
     updateSettingButtonsState('intent', currentItemType);
     updateSettingButtonsState('vision', currentItemType);

});
