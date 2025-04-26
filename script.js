// Initialize Telegram Web App
Telegram.WebApp.ready();
Telegram.WebApp.expand(); // Expand to full height
const playerName = Telegram.WebApp.initDataUnsafe.user?.first_name || 'Игрок';

// --- DOM Elements ---
const app = document.getElementById('app');
const playerNameElement = document.getElementById('player-name');

// Views
const mainMenu = document.getElementById('main-menu-view');
const intentionGameView = document.getElementById('intention-game-view');
const visionGameView = document.getElementById('vision-game-view');

// Main Menu Buttons
const intentionModeBtn = document.getElementById('intention-mode-btn');
const visionModeBtn = document.getElementById('vision-mode-btn');

// Intention Elements
const intentionDisplay = document.getElementById('intention-display');
const showResultBtn = document.getElementById('show-result-btn');
const intentionSetting = document.getElementById('intention-setting');
const intentionBackBtn = document.getElementById('intention-back-btn');

// Vision Elements
const shuffleBtn = document.getElementById('shuffle-btn');
const visionDisplay = document.getElementById('vision-display');
const visionChoicesContainer = document.getElementById('vision-choices');
const statsTotal = document.getElementById('stats-total');
const statsSuccess = document.getElementById('stats-success');
const statsFail = document.getElementById('stats-fail');
const visionSetting = document.getElementById('vision-setting');
const visionBackBtn = document.getElementById('vision-back-btn');

// --- Game State ---
let currentGameMode = null; // 'intention' or 'vision'
let intentionSettingType = 'color'; // 'color' or 'shape'
let visionSettingType = 'color'; // 'color' or 'shape'

// Intention State
let intentionRandomizerInterval = null;
let currentIntentionResult = null; // Value currently being randomized

// Vision State
let visionRandomizerTimeout = null;
let visionChoiceTimeout = null;
let currentVisionResult = null; // Value randomized for the round
let visionStats = { total: 0, success: 0, fail: 0 };

// --- Game Data ---
const possibleValues = {
    color: ['blue', 'red'],
    shape: ['circle', 'triangle']
};

// SVG Definitions (Simple black circle and triangle)
const svgCircle = `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40"/></svg>`;
const svgTriangle = `<svg viewBox="0 0 100 100"><path d="M50 10 L90 90 L10 90 Z"/></svg>`;

// --- Utility Functions ---

// Show a specific game view
function showView(viewElement) {
    const views = app.querySelectorAll('.game-view');
    views.forEach(view => view.classList.remove('active'));
    viewElement.classList.add('active');
}

// Get a random value based on current setting
function getRandomValue(type) {
    const values = possibleValues[type];
    const randomIndex = Math.floor(Math.random() * values.length);
    return values[randomIndex];
}

// Display result (color swatch or SVG) on the display area
function displayResult(displayElement, value, text = '') {
    const resultDiv = document.createElement('div');
    resultDiv.classList.add('result-display');

    if (intentionSettingType === 'color' || visionSettingType === 'color') {
        const colorSwatch = document.createElement('div');
        colorSwatch.classList.add('result-color-swatch');
        colorSwatch.style.backgroundColor = value; // 'blue' or 'red'
        resultDiv.appendChild(colorSwatch);
    } else { // shape
        const svgHtml = value === 'circle' ? svgCircle : svgTriangle;
        resultDiv.innerHTML = svgHtml; // Directly set SVG HTML
    }

     if (text) {
        const textElement = document.createElement('p');
        textElement.textContent = text;
        // Add success/fail class if text indicates it
        if (text.toLowerCase().includes('успех')) {
            textElement.classList.add('result-text', 'success');
        } else if (text.toLowerCase().includes('попробуй ещё') || text.toLowerCase().includes('неверно')) { // Add more failure conditions if needed
             textElement.classList.add('result-text', 'fail');
        } else {
             textElement.classList.add('result-text');
        }
        resultDiv.appendChild(textElement);
    }


    // Clear previous results
    displayElement.innerHTML = '';
    displayElement.appendChild(resultDiv);
}

// Clear the display area
function clearDisplay(displayElement) {
     displayElement.innerHTML = '';
     // Ensure it goes back to black background
     displayElement.classList.add('black-bg');
}


// --- Intention Mode Logic ---

function startIntentionRandomizer() {
    if (intentionRandomizerInterval) return; // Already running

    intentionRandomizerInterval = setInterval(() => {
        // Generate a new value every interval, but don't display it yet
        currentIntentionResult = getRandomValue(intentionSettingType);
        // console.log('Intention randomizing:', currentIntentionResult); // Optional: for debugging
    }, 50); // Fast interval for "constant" randomization
}

function stopIntentionRandomizer() {
    if (intentionRandomizerInterval) {
        clearInterval(intentionRandomizerInterval);
        intentionRandomizerInterval = null;
        // console.log('Intention randomizer stopped');
    }
}

function showIntentionResult() {
    if (!currentIntentionResult) return; // Nothing generated yet

    stopIntentionRandomizer(); // Stop the randomizer
    showResultBtn.disabled = true; // Disable the button

    // Display the result that was active when button was pressed
    displayResult(intentionDisplay, currentIntentionResult);
    intentionDisplay.classList.remove('black-bg'); // Change display background for result

    // Wait 3 seconds
    setTimeout(() => {
        clearDisplay(intentionDisplay); // Clear the result display
        showResultBtn.disabled = false; // Re-enable the button
        startIntentionRandomizer(); // Start randomizer again
    }, 3000);
}

function setupIntentionGame() {
    currentGameMode = 'intention';
    showView(intentionGameView);
    startIntentionRandomizer();
    showResultBtn.disabled = false; // Ensure button is enabled on entry
    clearDisplay(intentionDisplay); // Start with a clear display
}

// --- Vision Mode Logic ---

function updateVisionChoices() {
    visionChoicesContainer.innerHTML = ''; // Clear existing buttons
    const values = possibleValues[visionSettingType];

    values.forEach(value => {
        const choiceButton = document.createElement('div');
        choiceButton.classList.add('choice-button');
        choiceButton.dataset.value = value; // Store the value on the button

        if (visionSettingType === 'color') {
            choiceButton.classList.add(`color-${value}`); // Add specific color class
        } else { // shape
            const svgHtml = value === 'circle' ? svgCircle : svgTriangle;
             choiceButton.innerHTML = svgHtml;
             // Add a background color for shape buttons to match space gray theme
             choiceButton.style.backgroundColor = 'var(--choice-button-bg)';
        }

        choiceButton.addEventListener('click', handleVisionGuess);
        visionChoicesContainer.appendChild(choiceButton);
    });
     // Ensure buttons are enabled initially
    setVisionChoiceButtonsState(false);
}

function setVisionChoiceButtonsState(disabled) {
    const buttons = visionChoicesContainer.querySelectorAll('.choice-button');
    buttons.forEach(button => {
        button.disabled = disabled; // Using disabled property on a div doesn't work for click, but visually indicates
        // For actual click disabling, we can manage event listeners or use a class
        if (disabled) {
             button.classList.add('disabled'); // Add class for visual indication
             button.style.pointerEvents = 'none'; // Disable clicks
        } else {
             button.classList.remove('disabled');
             button.style.pointerEvents = 'auto'; // Enable clicks
        }
    });
}


function updateVisionStats() {
    statsTotal.textContent = visionStats.total;
    statsSuccess.textContent = visionStats.success;
    statsFail.textContent = visionStats.fail;
}

function startVisionRandomizer() {
    if (visionRandomizerTimeout) return; // Already running

    shuffleBtn.disabled = true; // Disable shuffle button
     setVisionChoiceButtonsState(true); // Disable choice buttons during shuffle

    clearDisplay(visionDisplay); // Clear display

    // Generate and store the result (hidden from player)
    currentVisionResult = getRandomValue(visionSettingType);
    // console.log('Vision randomizing... Result is:', currentVisionResult); // Optional: for debugging

    // Randomizer runs for 3 seconds
    visionRandomizerTimeout = setTimeout(() => {
        // Result is now "locked in"
        visionRandomizerTimeout = null;
        // console.log('Vision randomizer finished. Result locked.');
        // Now player can make a choice
        setVisionChoiceButtonsState(false); // Enable choice buttons
    }, 3000); // 3 seconds
}

function handleVisionGuess(event) {
    if (visionRandomizerTimeout !== null) {
        // Should not happen if buttons are disabled correctly, but safety check
        console.warn('Guess made before randomizer finished!');
        return;
    }

    const guessedValue = event.currentTarget.dataset.value;
    const correctValue = currentVisionResult;
    let resultText = '';

    visionStats.total++;

    if (guessedValue === correctValue) {
        visionStats.success++;
        resultText = 'Успех!';
    } else {
        visionStats.fail++;
        resultText = 'Неверно! Попробуй ещё.';
    }

    updateVisionStats();
    setVisionChoiceButtonsState(true); // Disable choice buttons after guessing

    // Display the correct result and outcome text
    displayResult(visionDisplay, correctValue, resultText);
     visionDisplay.classList.remove('black-bg'); // Change display background for result


    // After showing result, wait a few seconds before resetting
    visionChoiceTimeout = setTimeout(() => {
        clearDisplay(visionDisplay); // Clear the result display
        shuffleBtn.disabled = false; // Re-enable shuffle button for the next round
        currentVisionResult = null; // Reset stored result
        // Choice buttons remain disabled until next shuffle is initiated
    }, 4000); // Wait 4 seconds before allowing next round
}

function setupVisionGame() {
    currentGameMode = 'vision';
    showView(visionGameView);
    // Reset stats on entering
    visionStats = { total: 0, success: 0, fail: 0 };
    updateVisionStats();
    // Setup initial choice buttons based on default setting
    updateVisionChoices();
    // Ensure buttons are in correct initial state
    shuffleBtn.disabled = false;
    setVisionChoiceButtonsState(true); // Choice buttons disabled until shuffle
    clearDisplay(visionDisplay); // Start with a clear display
}

// --- Event Listeners ---

// Main Menu
intentionModeBtn.addEventListener('click', setupIntentionGame);
visionModeBtn.addEventListener('click', setupVisionGame);

// Intention Game
showResultBtn.addEventListener('click', showIntentionResult);
intentionDisplay.addEventListener('click', showIntentionResult); // Click on display duplicates show button
intentionSetting.addEventListener('change', (event) => {
    intentionSettingType = event.target.value;
    stopIntentionRandomizer(); // Stop current randomizer
    clearDisplay(intentionDisplay); // Clear display if anything was shown
    startIntentionRandomizer(); // Start new randomizer with new type
    showResultBtn.disabled = false; // Ensure button is active
});
intentionBackBtn.addEventListener('click', () => {
    stopIntentionRandomizer(); // Clean up interval
    clearDisplay(intentionDisplay); // Clean up display
    currentIntentionResult = null; // Reset state
    currentGameMode = null;
    showView(mainMenu);
});

// Vision Game
shuffleBtn.addEventListener('click', startVisionRandomizer);
visionDisplay.addEventListener('click', startVisionRandomizer); // Click on display duplicates shuffle button
visionSetting.addEventListener('change', (event) => {
    visionSettingType = event.target.value;
    // Reset game state and update choices when setting changes
    clearTimeout(visionRandomizerTimeout); // Clear any pending shuffle
    clearTimeout(visionChoiceTimeout); // Clear any pending result display timeout
    visionRandomizerTimeout = null;
    visionChoiceTimeout = null;
    currentVisionResult = null; // Reset result
    visionStats = { total: 0, success: 0, fail: 0 }; // Reset stats
    updateVisionStats();
    updateVisionChoices(); // Recreate choice buttons
    shuffleBtn.disabled = false; // Enable shuffle
    setVisionChoiceButtonsState(true); // Disable choices until shuffle
    clearDisplay(visionDisplay); // Clear display
});
visionBackBtn.addEventListener('click', () => {
    clearTimeout(visionRandomizerTimeout); // Clean up timeout
    clearTimeout(visionChoiceTimeout); // Clean up timeout
     visionRandomizerTimeout = null;
    visionChoiceTimeout = null;
    currentVisionResult = null; // Reset state
    clearDisplay(visionDisplay); // Clean up display
     visionChoicesContainer.innerHTML = ''; // Remove choice buttons
    currentGameMode = null;
    showView(mainMenu);
});


// --- Initialization ---
function init() {
    // Display player name
    playerNameElement.textContent = `Привет, ${playerName}!`;

    // Show the main menu initially
    showView(mainMenu);

    // Optional: Close button for Mini App (appears in header)
    // Telegram.WebApp.BackButton.hide(); // Hide default back button if not needed
    // Telegram.WebApp.MainButton.hide(); // Hide main button if not needed
}

init();
