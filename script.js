let telegramUser = null;
let currentGameMode = 'menu'; // 'menu', 'intention', 'vision'

// Intention Game State
let intentionRandomizerInterval = null;
let intentionCurrentResult = null; // Stores the random value picked by the interval
let intentionMode = 'color'; // 'color' or 'shape'

// Vision Game State
let visionRandomizerTimeout = null;
let visionCurrentResult = null; // Stores the random value picked after shuffle
let visionMode = 'color'; // 'color' or 'shape'
let visionStats = {
    attempts: 0,
    successes: 0,
    failures: 0
};

// --- Element References ---
const appDiv = document.getElementById('app');
const userNameSpan = document.getElementById('telegram-user-name');

const menuScreen = document.getElementById('menu-screen');
const btnStartIntention = document.getElementById('btn-start-intention');
const btnStartVision = document.getElementById('btn-start-vision');

// Intention Game Elements
const gameIntention = document.getElementById('game-intention');
const intentionDisplay = document.getElementById('intention-display');
const intentionResultDisplay = document.getElementById('intention-result');
const intentionShowBtn = document.getElementById('intention-show-btn');
const intentionModeRadios = document.querySelectorAll('input[name="intention-mode"]');

// Vision Game Elements
const gameVision = document.getElementById('game-vision');
const visionShuffleBtn = document.getElementById('vision-shuffle-btn');
const visionDisplay = document.getElementById('vision-display');
const visionResultDisplay = document.getElementById('vision-result');
const visionChoicesDiv = document.getElementById('vision-choices');
const visionColorChoiceBtns = document.querySelectorAll('#vision-choices .color-btn');
const visionShapeChoiceBtns = document.querySelectorAll('#vision-choices .shape-btn');
const visionStatsSpanAttempts = document.getElementById('stats-attempts');
const visionStatsSpanSuccesses = document.getElementById('stats-successes');
const visionStatsSpanFailures = document.getElementById('stats-failures');
const visionModeRadios = document.querySelectorAll('input[name="vision-mode"]');

// Common Elements
const backButtons = document.querySelectorAll('.back-btn');


// --- Utility Functions ---

// Show a specific game screen
function showScreen(screenId) {
    const screens = document.querySelectorAll('.game-screen');
    screens.forEach(screen => screen.classList.add('hidden'));

    // Stop any running game timers/intervals before switching
    stopIntentionGame();
    stopVisionGame(); // Stop any active shuffle timeout

    if (screenId === 'menu-screen') {
        menuScreen.classList.remove('hidden');
        currentGameMode = 'menu';
    } else if (screenId === 'game-intention') {
        gameIntention.classList.remove('hidden');
        currentGameMode = 'intention';
        startIntentionGame(); // Start the intention randomizer
    } else if (screenId === 'game-vision') {
        gameVision.classList.remove('hidden');
        currentGameMode = 'vision';
        // Vision game starts waiting for 'Shuffle' click
        updateVisionChoicesDisplay(); // Ensure correct choice buttons are visible
        updateVisionStatsDisplay(); // Show current stats
    }
}

// Get a random result based on the current mode
function getRandomResult(mode) {
    if (mode === 'color') {
        return Math.random() > 0.5 ? 'red' : 'blue';
    } else { // shape
        return Math.random() > 0.5 ? 'circle' : 'triangle';
    }
}

// Create SVG for a shape
function createSvgShape(type) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "100");
    svg.setAttribute("height", "100");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("fill", "black"); // Shapes should be black

    if (type === 'circle') {
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", "50");
        circle.setAttribute("cy", "50");
        circle.setAttribute("r", "40");
        svg.appendChild(circle);
    } else if (type === 'triangle') {
        const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        polygon.setAttribute("points", "50,10 90,90 10,90");
         svg.appendChild(polygon);
    }
    return svg;
}

// Display a result (color block or shape) on the result display area
function displayResult(resultValue, mode) {
    intentionResultDisplay.innerHTML = ''; // Clear previous content
    visionResultDisplay.innerHTML = ''; // Clear previous content

    const targetDisplay = currentGameMode === 'intention' ? intentionResultDisplay : visionResultDisplay;

    if (mode === 'color') {
        targetDisplay.style.backgroundColor = resultValue; // 'red' or 'blue'
        targetDisplay.textContent = ''; // No text for color block
    } else { // shape
        targetDisplay.style.backgroundColor = 'white'; // White background for shape
        targetDisplay.textContent = ''; // No text initially
        targetDisplay.appendChild(createSvgShape(resultValue));
    }
     targetDisplay.classList.remove('hidden');
}

// --- Intention Game Logic ---

function startIntentionGame() {
    // Start the continuous randomizer hidden in the background
    intentionCurrentResult = getRandomResult(intentionMode); // Initial result
    intentionRandomizerInterval = setInterval(() => {
        intentionCurrentResult = getRandomResult(intentionMode);
        // console.log('Intention randomizing...', intentionCurrentResult); // Optional: for debugging
    }, 100); // Update result every 100ms

    intentionShowBtn.classList.remove('hidden');
    intentionResultDisplay.classList.add('hidden');
    intentionDisplay.style.backgroundColor = 'black'; // Ensure display is black initially
}

function stopIntentionGame() {
    if (intentionRandomizerInterval !== null) {
        clearInterval(intentionRandomizerInterval);
        intentionRandomizerInterval = null;
         // console.log('Intention randomizer stopped.');
    }
    intentionShowBtn.classList.remove('hidden'); // Ensure button is visible if game stops unexpectedly
    intentionResultDisplay.classList.add('hidden');
    intentionDisplay.style.backgroundColor = 'black'; // Reset display color
}

function showIntentionResult() {
    if (intentionRandomizerInterval === null) return; // Don't show if not running

    // Stop randomizer
    clearInterval(intentionRandomizerInterval);
    intentionRandomizerInterval = null;

    // Display the result
    displayResult(intentionCurrentResult, intentionMode);
    intentionDisplay.style.backgroundColor = 'transparent'; // Show result area

    // Hide the show button
    intentionShowBtn.classList.add('hidden');

    // After 3 seconds, hide the result and restart
    setTimeout(() => {
        intentionResultDisplay.classList.add('hidden');
        intentionDisplay.style.backgroundColor = 'black'; // Reset display color
        intentionShowBtn.classList.remove('hidden');
        startIntentionGame(); // Restart the randomizer
    }, 3000); // 3 seconds
}

// --- Vision Game Logic ---

function startVisionShuffle() {
    // Disable shuffle button and choice buttons
    visionShuffleBtn.disabled = true;
    setVisionChoiceButtonsEnabled(false);

    // Hide any previous result/message
    visionResultDisplay.classList.add('hidden');
    visionDisplay.style.backgroundColor = 'black'; // Ensure display is black

    // The randomizer is active but hidden for 3 seconds
    visionRandomizerTimeout = setTimeout(() => {
        // Randomization finishes, store the result
        visionCurrentResult = getRandomResult(visionMode);
        // console.log('Vision result generated:', visionCurrentResult);

        // Enable buttons for player to guess
        visionShuffleBtn.disabled = false;
        setVisionChoiceButtonsEnabled(true);

    }, 3000); // Shuffle duration: 3 seconds
}

function stopVisionGame() {
    if (visionRandomizerTimeout !== null) {
        clearTimeout(visionRandomizerTimeout);
        visionRandomizerTimeout = null;
         // console.log('Vision shuffle stopped.');
    }
    visionShuffleBtn.disabled = false; // Ensure button is enabled if game stops
    setVisionChoiceButtonsEnabled(false); // Ensure choice buttons are disabled
     visionResultDisplay.classList.add('hidden');
     visionDisplay.style.backgroundColor = 'black'; // Reset display color
}


function setVisionChoiceButtonsEnabled(enabled) {
    const buttons = visionChoicesDiv.querySelectorAll('.choice-btn');
    buttons.forEach(button => {
        // Only enable visible buttons
        if (!button.classList.contains('hidden')) {
             button.disabled = !enabled;
        } else {
             button.disabled = true; // Keep hidden buttons disabled
        }
    });
}

function handleVisionChoice(choice) {
    if (visionCurrentResult === null) {
        // Player clicked before shuffle finished or after guess
        return;
    }

    // Disable choice buttons immediately after a guess
    setVisionChoiceButtonsEnabled(false);
    visionShuffleBtn.disabled = true; // Also disable shuffle until display clears

    visionStats.attempts++;

    visionResultDisplay.classList.remove('hidden'); // Show the result area
    visionDisplay.style.backgroundColor = 'transparent'; // Show result area

    // Clear previous result/message content
    visionResultDisplay.innerHTML = '';
    visionResultDisplay.style.backgroundColor = 'white'; // White background for feedback

    let messageText = document.createElement('p');
    messageText.style.fontSize = '1em'; // Smaller font for text feedback
    messageText.style.fontWeight = 'normal';
    messageText.style.color = 'black';

    if (choice === visionCurrentResult) {
        // Correct guess
        visionStats.successes++;
        messageText.textContent = 'Успех!';
         // Display the guessed (correct) item
        if (visionMode === 'color') {
             const colorBlock = document.createElement('div');
             colorBlock.style.width = '80%';
             colorBlock.style.height = '80%';
             colorBlock.style.backgroundColor = visionCurrentResult;
             visionResultDisplay.appendChild(colorBlock);
        } else { // shape
             visionResultDisplay.appendChild(createSvgShape(visionCurrentResult));
        }
         visionResultDisplay.appendChild(messageText); // Add message below
         visionResultDisplay.style.flexDirection = 'column'; // Stack elements
         visionResultDisplay.style.gap = '10px'; // Space between item and text

    } else {
        // Incorrect guess
        visionStats.failures++;
        messageText.textContent = 'Попробуй ещё!';
        const correctItemLabel = document.createElement('p');
        correctItemLabel.textContent = 'Надо было угадать:';
        correctItemLabel.style.fontSize = '0.8em';
        correctItemLabel.style.fontWeight = 'normal';
        correctItemLabel.style.color = 'black';
         visionResultDisplay.appendChild(correctItemLabel);

        // Display the *correct* item
        if (visionMode === 'color') {
             const colorBlock = document.createElement('div');
             colorBlock.style.width = '80%';
             colorBlock.style.height = '80%';
             colorBlock.style.backgroundColor = visionCurrentResult;
             visionResultDisplay.appendChild(colorBlock);
        } else { // shape
             visionResultDisplay.appendChild(createSvgShape(visionCurrentResult));
        }
        visionResultDisplay.appendChild(messageText); // Add message below
        visionResultDisplay.style.flexDirection = 'column'; // Stack elements
        visionResultDisplay.style.gap = '10px'; // Space between item and text

    }

    updateVisionStatsDisplay();

    // Reset state after a delay
    visionCurrentResult = null; // Reset the result after guess
    setTimeout(() => {
        visionResultDisplay.classList.add('hidden'); // Hide feedback
        visionDisplay.style.backgroundColor = 'black'; // Reset display
        visionShuffleBtn.disabled = false; // Enable shuffle button again
        // Choice buttons remain disabled until next shuffle
    }, 2500); // Show feedback for 2.5 seconds
}

function updateVisionStatsDisplay() {
    visionStatsSpanAttempts.textContent = visionStats.attempts;
    visionStatsSpanSuccesses.textContent = visionStats.successes;
    visionStatsSpanFailures.textContent = visionStats.failures;
}

function updateVisionChoicesDisplay() {
     // Hide all choice buttons first
    visionColorChoiceBtns.forEach(btn => btn.classList.add('hidden'));
    visionShapeChoiceBtns.forEach(btn => btn.classList.add('hidden'));
    // Reset button state (disabled until shuffle)
     setVisionChoiceButtonsEnabled(false);


    // Show the relevant buttons
    if (visionMode === 'color') {
        visionColorChoiceBtns.forEach(btn => btn.classList.remove('hidden'));
    } else { // shape
        visionShapeChoiceBtns.forEach(btn => btn.classList.remove('hidden'));
    }
}


// --- Event Listeners ---

// Menu buttons
btnStartIntention.addEventListener('click', () => showScreen('game-intention'));
btnStartVision.addEventListener('click', () => showScreen('game-vision'));

// Back buttons (in games)
backButtons.forEach(button => {
    button.addEventListener('click', () => showScreen('menu-screen'));
});

// Intention Game Listeners
intentionShowBtn.addEventListener('click', showIntentionResult);
// Duplicate button click on display click
intentionDisplay.addEventListener('click', () => {
    if (!intentionShowBtn.classList.contains('hidden') && !intentionShowBtn.disabled) {
        intentionShowBtn.click();
    }
});
// Intention mode change
intentionModeRadios.forEach(radio => {
    radio.addEventListener('change', (event) => {
        intentionMode = event.target.value;
        // Restart randomizer with new mode immediately?
        // Or just let the *next* result picked by the interval use the new mode?
        // The latter is simpler and fine for this hidden randomizer.
         // Restarting ensures the first result after change respects the mode
         stopIntentionGame();
         startIntentionGame();
    });
});

// Vision Game Listeners
visionShuffleBtn.addEventListener('click', startVisionShuffle);
// Duplicate button click on display click (if shuffle button is enabled)
visionDisplay.addEventListener('click', () => {
    if (!visionShuffleBtn.disabled) {
        visionShuffleBtn.click();
    }
});

// Vision choice button listeners (using event delegation on the container)
visionChoicesDiv.addEventListener('click', (event) => {
    const targetBtn = event.target.closest('.choice-btn');
    if (targetBtn && !targetBtn.disabled) {
        const choice = targetBtn.dataset.choice;
        handleVisionChoice(choice);
    }
});
// Vision mode change
visionModeRadios.forEach(radio => {
    radio.addEventListener('change', (event) => {
        visionMode = event.target.value;
        updateVisionChoicesDisplay();
        // Optionally reset stats or just keep them? Let's keep them for now.
        // visionStats = { attempts: 0, successes: 0, failures: 0 };
        // updateVisionStatsDisplay();
    });
});


// --- Telegram Web Apps Initialization ---

Telegram.WebApp.ready(); // Notify Telegram that the app is ready

// Show user name if available
if (Telegram.WebApp.initDataUnsafe && Telegram.WebApp.initDataUnsafe.user) {
    telegramUser = Telegram.WebApp.initDataUnsafe.user;
    userNameSpan.textContent = telegramUser.first_name || 'Игрок';
}

// Expand the app to full height
Telegram.WebApp.expand();

// Initial screen display
showScreen('menu-screen');
