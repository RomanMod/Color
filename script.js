document.addEventListener('DOMContentLoaded', () => {
    const telegramWebApp = window.Telegram?.WebApp;

    const playerNameElement = document.getElementById('player-name');
    const modeSelectionDiv = document.getElementById('mode-selection');
    const gameAreaDiv = document.getElementById('game-area');
    const intentionModeDiv = document.getElementById('intention-mode');
    const visionModeDiv = document.getElementById('vision-mode');

    const selectIntentionBtn = document.getElementById('select-intention');
    const selectVisionBtn = document.getElementById('select-vision');
    const backButton = document.getElementById('back-to-modes');
    const toggleGameTypeBtn = document.getElementById('toggle-game-type');

    // Intention mode elements
    const intentionDisplay = document.getElementById('intention-display');
    const intentionShowBtn = document.getElementById('intention-show-btn');

    // Vision mode elements
    const visionShuffleBtn = document.getElementById('vision-shuffle-btn');
    const visionDisplay = document.getElementById('vision-display');
    const visionGuessBtn1 = document.getElementById('vision-guess-btn-1');
    const visionGuessBtn2 = document.getElementById('vision-guess-btn-2');
    const visionResultMessage = document.getElementById('vision-result-message');
    const statsAttempts = document.getElementById('stats-attempts');
    const statsWins = document.getElementById('stats-wins');
    const statsLosses = document.getElementById('stats-losses');

    let currentGameMode = null; // 'intention' or 'vision'
    let currentGameType = 'color'; // 'color' or 'shape'
    let intentionInterval = null;
    let visionTimeout = null;
    let visionRapidInterval = null;
    let visionResult = null;
    let visionStats = { attempts: 0, wins: 0, losses: 0 };

    // --- Configuration ---
    const rainbowColors = ['#FF0000', '#FFA500', '#FFFF00', '#008000', '#0000FF', '#4B0082', '#EE82EE']; // Red, Orange, Yellow, Green, Blue, Indigo, Violet
    const defaultVisionGuessColors = ['#0000FF', '#FF0000']; // Blue, Red
    const shapes = {
        circle: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="45" fill="#ffffff"/></svg>',
        triangle: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><polygon points="50,5 95,95 5,95" fill="#ffffff"/></svg>'
    };
    const visionShuffleDuration = 2500; // 2.5 seconds
    const visionRapidDisplayInterval = 50; // Update every 50ms during shuffle

    // --- Telegram Web Apps API ---
    if (telegramWebApp) {
        telegramWebApp.ready();
        telegramWebApp.expand(); // Expand the app to fill the screen

        if (telegramWebApp.initDataUnsafe && telegramWebApp.initDataUnsafe.user) {
            const user = telegramWebApp.initDataUnsafe.user;
            playerNameElement.textContent = user.first_name || user.username || 'Игрок';
        } else {
            playerNameElement.textContent = 'Игрок (API недоступно)';
        }
    } else {
        playerNameElement.textContent = 'Игрок (вне Telegram)';
        console.warn("Telegram Web Apps API not found.");
    }

    // --- Helper Functions ---
    function showElement(element) { element.classList.remove('hidden'); }
    function hideElement(element) { element.classList.add('hidden'); }

    function getRandomColor() {
        const randomIndex = Math.floor(Math.random() * rainbowColors.length);
        return rainbowColors[randomIndex];
    }

    function getRandomShape() {
        const shapeKeys = Object.keys(shapes);
        const randomIndex = Math.floor(Math.random() * shapeKeys.length);
        return shapeKeys[randomIndex];
    }

     function getRandomValue(type) {
        if (type === 'color') {
            // For Vision guess buttons, we only pick from defaultGuessColors
            if (currentGameMode === 'vision' && visionGuessBtn1.dataset.value && visionGuessBtn2.dataset.value) {
                 // If guess buttons are set, pick one of the values they represent
                 const options = [visionGuessBtn1.dataset.value, visionGuessBtn2.dataset.value];
                 return options[Math.floor(Math.random() * options.length)];
            }
             // Otherwise (Intention mode or Vision before shuffle), use all rainbow colors
             return getRandomColor();
        } else if (type === 'shape') {
            return getRandomShape();
        }
        return null;
    }


    function updateDisplay(element, value, type) {
        element.innerHTML = ''; // Clear previous content
        element.style.backgroundColor = ''; // Clear previous background color

        if (type === 'color') {
            element.style.backgroundColor = value;
            element.textContent = ''; // Remove any text message
        } else if (type === 'shape') {
            element.innerHTML = shapes[value] || ''; // Insert SVG
            element.textContent = ''; // Remove any text message
             // Set SVG fill color to white (handled in SVG string, but good practice)
             const svg = element.querySelector('svg');
             if(svg) {
                 const pathOrShape = svg.querySelector('circle, polygon, rect, path'); // Add other potential shapes
                 if(pathOrShape) {
                     pathOrShape.setAttribute('fill', '#ffffff');
                 }
             }
        } else {
             element.textContent = value; // Display text message like "Success"
             element.style.backgroundColor = 'transparent';
             element.style.color = '#ffffff'; // Ensure text is visible
        }
         // Reset text color for subsequent text messages if display was showing shape/color
         if(type !== 'text') {
              element.style.color = '#ffffff';
         }
    }

    function updateStatsDisplay() {
        statsAttempts.textContent = visionStats.attempts;
        statsWins.textContent = visionStats.wins;
        statsLosses.textContent = visionStats.losses;
    }

    function resetGameArea() {
        clearInterval(intentionInterval);
        clearTimeout(visionTimeout);
        clearInterval(visionRapidInterval);

        intentionInterval = null;
        visionTimeout = null;
        visionRapidInterval = null;
        visionResult = null;

        intentionDisplay.innerHTML = '';
        intentionDisplay.style.backgroundColor = '';

        visionDisplay.innerHTML = '';
        visionDisplay.style.backgroundColor = '';
        visionResultMessage.textContent = '';

        // Reset guess buttons
        visionGuessBtn1.innerHTML = '';
        visionGuessBtn1.style.backgroundColor = '';
        visionGuessBtn1.dataset.value = '';
        visionGuessBtn1.disabled = true;
        visionGuessBtn1.className = 'guess-button'; // Reset classes

        visionGuessBtn2.innerHTML = '';
        visionGuessBtn2.style.backgroundColor = '';
        visionGuessBtn2.dataset.value = '';
        visionGuessBtn2.disabled = true;
         visionGuessBtn2.className = 'guess-button'; // Reset classes

        visionShuffleBtn.disabled = false; // Enable shuffle for next game

        hideElement(intentionModeDiv);
        hideElement(visionModeDiv);
        hideElement(gameAreaDiv);

        // Keep stats visible in Vision mode, but reset them if switching modes entirely?
        // Let's keep stats persistent until the page reloads for simplicity.
    }

    function setupIntentionMode() {
        resetGameArea();
        currentGameMode = 'intention';
        showElement(gameAreaDiv);
        showElement(intentionModeDiv);
        hideElement(visionModeDiv);
        toggleGameTypeBtn.textContent = `Тип: ${currentGameType === 'color' ? 'Цвет' : 'Фигура'}`;

        // Start randomization loop
        intentionInterval = setInterval(() => {
            const value = getRandomValue(currentGameType);
            updateDisplay(intentionDisplay, value, currentGameType);
        }, 100); // Update display every 100ms
    }

    function stopIntention() {
        clearInterval(intentionInterval);
        intentionInterval = null;
        intentionShowBtn.textContent = 'Начать заново'; // Optional: change button text
        // The last displayed value remains visible
    }

     function setupVisionMode() {
        resetGameArea();
        currentGameMode = 'vision';
        showElement(gameAreaDiv);
        hideElement(intentionModeDiv);
        showElement(visionModeDiv);
        toggleGameTypeBtn.textContent = `Тип: ${currentGameType === 'color' ? 'Цвет' : 'Фигура'}`;
        updateStatsDisplay();
        enableGuessButtons(false); // Disable guess buttons initially
        visionShuffleBtn.disabled = false;
        visionResultMessage.textContent = 'Нажмите "Перемешать"';

        // Determine and display guess options based on game type
        if (currentGameType === 'color') {
            const [color1, color2] = defaultVisionGuessColors; // Default to Blue/Red
            updateGuessButton(visionGuessBtn1, color1, 'color');
            updateGuessButton(visionGuessBtn2, color2, 'color');
        } else if (currentGameType === 'shape') {
            updateGuessButton(visionGuessBtn1, 'circle', 'shape');
            updateGuessButton(visionGuessBtn2, 'triangle', 'shape');
        }
    }

    function updateGuessButton(button, value, type) {
         button.innerHTML = ''; // Clear previous content
         button.style.backgroundColor = ''; // Clear color class/style
         button.className = 'guess-button'; // Reset base class
         button.dataset.value = value; // Store the actual value

         if (type === 'color') {
             button.style.backgroundColor = value; // Set background color directly
             // Add specific class for styling if needed, e.g., for border or text color
             // button.classList.add(`color-${value.replace('#', '')}`); // Example class: color-0000FF
             button.textContent = ''; // No text on color buttons
         } else if (type === 'shape') {
             button.innerHTML = shapes[value] || ''; // Insert SVG
             button.textContent = ''; // No text on shape buttons
              // Set SVG fill color to white
             const svg = button.querySelector('svg');
             if(svg) {
                 const pathOrShape = svg.querySelector('circle, polygon, rect, path');
                  if(pathOrShape) {
                      pathOrShape.setAttribute('fill', '#ffffff');
                  }
             }
         }
         // Button text can be added here if needed, e.g., button.textContent = value;
    }


    function enableGuessButtons(enabled) {
         visionGuessBtn1.disabled = !enabled;
         visionGuessBtn2.disabled = !enabled;
    }


    function startVisionShuffle() {
        visionShuffleBtn.disabled = true;
        enableGuessButtons(false);
        visionResultMessage.textContent = 'Перемешивание...';
        visionDisplay.innerHTML = '';
        visionDisplay.style.backgroundColor = ''; // Clear previous result display

        // Determine the two possible results the randomizer will pick from
        let possibleResults;
        if (currentGameType === 'color') {
            possibleResults = defaultVisionGuessColors; // Use default Blue/Red for choices
        } else if (currentGameType === 'shape') {
            possibleResults = ['circle', 'triangle'];
        }

        // Pick the actual result from the possibilities
        visionResult = possibleResults[Math.floor(Math.random() * possibleResults.length)];

        // Start rapid visual random display
        visionRapidInterval = setInterval(() => {
             // Show *any* random value for visual effect, not necessarily from possibleResults
            const randomVisualValue = currentGameType === 'color' ? getRandomColor() : getRandomShape();
            updateDisplay(visionDisplay, randomVisualValue, currentGameType);
        }, visionRapidDisplayInterval);

        // Stop rapid display and show the actual result after duration
        visionTimeout = setTimeout(() => {
            clearInterval(visionRapidInterval);
            visionRapidInterval = null;

            // Display the actual result clearly
            updateDisplay(visionDisplay, visionResult, currentGameType);
            visionResultMessage.textContent = 'Теперь угадайте!';

            // Enable guess buttons (they are already set up with the options)
            enableGuessButtons(true);
             visionShuffleBtn.disabled = false; // Re-enable shuffle for next round

        }, visionShuffleDuration);
    }

    function handleVisionGuess(event) {
        if (event.target.classList.contains('guess-button') && !event.target.disabled) {
            enableGuessButtons(false); // Disable buttons after guess
            visionShuffleBtn.disabled = true; // Disable shuffle until result is shown

            const playerGuess = event.target.dataset.value;
            visionStats.attempts++;

            visionResultMessage.style.color = '#ffffff'; // Reset message color

            if (playerGuess === visionResult) {
                visionStats.wins++;
                visionResultMessage.textContent = 'Успех!';
                 visionResultMessage.style.color = '#28a745'; // Green color for success
                // Display the guessed value again (which is the correct one)
                updateDisplay(visionDisplay, visionResult, currentGameType);

            } else {
                visionStats.losses++;
                visionResultMessage.textContent = 'Попробуйте ещё.';
                visionResultMessage.style.color = '#dc3545'; // Red color for failure
                // Display the correct value that was missed
                 updateDisplay(visionDisplay, visionResult, currentGameType);
            }

            updateStatsDisplay();

             // Keep result/message visible for a few seconds before allowing next shuffle
             setTimeout(() => {
                  visionResultMessage.textContent = 'Нажмите "Перемешать" для новой игры.';
                  visionResultMessage.style.color = '#ffffff'; // Reset message color
                  visionShuffleBtn.disabled = false;
                   // Clear display or keep it? Let's clear for a fresh start.
                  visionDisplay.innerHTML = '';
                  visionDisplay.style.backgroundColor = '';
             }, 3000); // Show result/message for 3 seconds
        }
    }


    // --- Event Listeners ---
    selectIntentionBtn.addEventListener('click', setupIntentionMode);
    selectVisionBtn.addEventListener('click', setupVisionMode);

    backButton.addEventListener('click', () => {
        resetGameArea();
        currentGameMode = null;
        showElement(modeSelectionDiv);
    });

    toggleGameTypeBtn.addEventListener('click', () => {
        // Stop current game state gracefully before changing type
        if (currentGameMode === 'intention') {
            clearInterval(intentionInterval);
            intentionInterval = null;
            intentionDisplay.innerHTML = '';
            intentionDisplay.style.backgroundColor = '';
        } else if (currentGameMode === 'vision') {
             resetGameArea(); // Vision is more complex, fully reset its state
        }


        currentGameType = currentGameType === 'color' ? 'shape' : 'color';
        toggleGameTypeBtn.textContent = `Тип: ${currentGameType === 'color' ? 'Цвет' : 'Фигура'}`;

        // Restart the current game mode with the new type
        if (currentGameMode === 'intention') {
             setupIntentionMode(); // Re-initialize intention loop
        } else if (currentGameMode === 'vision') {
             setupVisionMode(); // Re-initialize vision setup with new type
        }
        // If no mode was active, just the button text changes.
    });

    intentionShowBtn.addEventListener('click', () => {
        if (intentionInterval) {
            stopIntention();
        } else {
            // If interval is null, it means it was stopped, start again
            setupIntentionMode();
        }
    });

    visionShuffleBtn.addEventListener('click', startVisionShuffle);

    // Use event delegation for guess buttons
    visionGuessButtons.addEventListener('click', handleVisionGuess);

    // Initial setup: show mode selection
    showElement(modeSelectionDiv);
    hideElement(gameAreaDiv); // Ensure game area is hidden initially
});
