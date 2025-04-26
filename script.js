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
         Telegram.WebApp.MainButton.hide(); // Hide Telegram main button if visible
    } else if (screenId === 'game-intention') {
        gameIntention.classList.remove('hidden');
        currentGameMode = 'intention';
        startIntentionGame(); // Start the intention randomizer
         Telegram.WebApp.MainButton.hide(); // Hide Telegram main button if visible
    } else if (screenId === 'game-vision') {
        gameVision.classList.remove('hidden');
        currentGameMode = 'vision';
        // Vision game starts waiting for 'Shuffle' click
        updateVisionChoicesDisplay(); // Ensure correct choice buttons are visible
        updateVisionStatsDisplay(); // Show current stats
         visionShuffleBtn.disabled = false; // Ensure shuffle button is enabled
         setVisionChoiceButtonsEnabled(false); // Ensure choice buttons are disabled initially
         visionResultDisplay.classList.add('hidden'); // Hide result display
         visionDisplay.style.backgroundColor = 'black'; // Set vision display black
         visionResultDisplay.style.backgroundColor = 'transparent'; // Reset result display background
         visionCurrentResult = null; // Clear any pending result

         // Optionally show a Telegram Main Button for Shuffle?
         // Telegram.WebApp.MainButton.setText('Перемешать');
         // Telegram.WebApp.MainButton.show();
         // Telegram.WebApp.onEvent('mainButtonClicked', startVisionShuffle);
         // Note: Using a standard HTML button is usually fine and gives more control over styling/disabling.
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

// Create SVG for a shape (used for display)
function createSvgShape(type) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "100"); // Base size, will be scaled by CSS
    svg.setAttribute("height", "100");
    svg.setAttribute("viewBox", "0 0 100 100");
    // Fill color handled by CSS for display contexts
    // svg.setAttribute("fill", "black"); // Don't set fill here, let CSS handle it

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


// --- Intention Game Logic ---

function startIntentionGame() {
    // Start the continuous randomizer hidden in the background
    intentionCurrentResult = getRandomResult(intentionMode); // Initial result
    intentionRandomizerInterval = setInterval(() => {
        intentionCurrentResult = getRandomResult(intentionMode);
        // console.log('Intention randomizing...', intentionCurrentResult); // Optional: for debugging
    }, 50); // Update result more frequently for smoother "feel"

    intentionShowBtn.classList.remove('hidden');
    intentionResultDisplay.classList.add('hidden');
    intentionDisplay.style.backgroundColor = 'black'; // Ensure display is black initially
    intentionResultDisplay.style.backgroundColor = 'white'; // Ensure result background is white for Intention
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
     intentionResultDisplay.style.backgroundColor = 'white'; // Reset result background
}

function showIntentionResult() {
    if (intentionRandomizerInterval === null) return; // Don't show if not running

    // Stop randomizer
    clearInterval(intentionRandomizerInterval);
    intentionRandomizerInterval = null;

    // Display the result inside intentionResultDisplay (which is on white background)
    intentionResultDisplay.innerHTML = ''; // Clear previous content
    intentionResultDisplay.style.backgroundColor = 'white'; // Ensure white background for intention result

    if (intentionMode === 'color') {
        // For color, show the color block itself
         const colorBlock = document.createElement('div');
         colorBlock.style.width = '100%'; // Fill the result display area
         colorBlock.style.height = '100%';
         colorBlock.style.backgroundColor = intentionCurrentResult;
         intentionResultDisplay.appendChild(colorBlock);
         // Ensure Intention result display is centered for color block
         intentionResultDisplay.style.flexDirection = 'row'; // Use row or column, doesn't matter for one block
         intentionResultDisplay.style.gap = '0';

    } else { // shape
        // For shape, show the shape on the white background
        intentionResultDisplay.appendChild(createSvgShape(intentionCurrentResult));
        // Ensure Intention result display is centered for shape
         intentionResultDisplay.style.flexDirection = 'column'; // Flex properties from CSS are enough here
         intentionResultDisplay.style.gap = '0';
    }

    intentionResultDisplay.classList.remove('hidden');
    intentionDisplay.style.backgroundColor = 'transparent'; // Show result area by making display transparent

    // Hide the show button
    intentionShowBtn.classList.add('hidden');

    // After 3 seconds, hide the result and restart
    setTimeout(() => {
        intentionResultDisplay.classList.add('hidden');
        intentionDisplay.style.backgroundColor = 'black'; // Reset display color
        intentionResultDisplay.style.backgroundColor = 'white'; // Reset result background
        intentionShowBtn.classList.remove('hidden');
        startIntentionGame(); // Restart the randomizer
    }, 3000); // 3 seconds
}

// --- Vision Game Logic ---

function startVisionShuffle() {
    // Ignore click if already shuffling or buttons disabled
     if (visionShuffleBtn.disabled) return;

    // Disable shuffle button and choice buttons
    visionShuffleBtn.disabled = true;
    setVisionChoiceButtonsEnabled(false);

    // Hide any previous result/message
    visionResultDisplay.classList.add('hidden');
    visionDisplay.style.backgroundColor = 'black'; // Ensure display is black
    visionResultDisplay.style.backgroundColor = 'transparent'; // Reset result background

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
     visionResultDisplay.style.backgroundColor = 'transparent'; // Reset result background
     visionCurrentResult = null; // Clear current result
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

function handleVisionChoice(event) { // Accept event object
    // Check if a valid, enabled choice button was clicked
    const targetBtn = event.target.closest('.choice-btn');
    if (visionCurrentResult === null || !targetBtn || targetBtn.disabled) {
        // Player clicked before shuffle finished, after guess, or on a disabled button
        return;
    }

    const choice = targetBtn.dataset.choice; // Get choice from data attribute

    // Disable choice buttons immediately after a guess
    setVisionChoiceButtonsEnabled(false);
    visionShuffleBtn.disabled = true; // Also disable shuffle until display clears

    visionStats.attempts++;
    // console.log("Attempt:", visionStats.attempts); // Debug log

    visionResultDisplay.classList.remove('hidden'); // Show the result area
    visionDisplay.style.backgroundColor = 'transparent'; // Show result area by making display transparent

    // Clear previous result/message content
    visionResultDisplay.innerHTML = '';
    visionResultDisplay.style.backgroundColor = 'transparent'; // Reset background

    let messageText = document.createElement('p');
    messageText.classList.add('feedback-text'); // Add class for styling

    // Determine feedback text
    const isCorrect = (choice === visionCurrentResult);
    messageText.textContent = isCorrect ? 'Успех!' : 'Попробуй ещё!';

    if (isCorrect) {
        visionStats.successes++;
         // console.log("Success:", visionStats.successes); // Debug log
    } else {
        visionStats.failures++;
        // console.log("Failure:", visionStats.failures); // Debug log
    }


    if (visionMode === 'color') {
        // In color mode, the correct color fills the background of visionResultDisplay
        visionResultDisplay.style.backgroundColor = visionCurrentResult; // 'red' or 'blue'
        // Set text color for visibility on the colored background
        messageText.style.color = 'white';
        messageText.style.textShadow = '1px 1px 3px rgba(0,0,0,0.5)'; // Add shadow for contrast

        // Append just the text to visionResultDisplay
        visionResultDisplay.appendChild(messageText);

        // Ensure visionResultDisplay is set up for centering just the text (flex properties already in CSS)
         visionResultDisplay.style.flexDirection = 'column'; // Flex properties from CSS are enough here
         visionResultDisplay.style.gap = '0';


    } else { // shape mode
        // In shape mode, display shape on white background + text overlaid
        const feedbackContent = document.createElement('div');
        feedbackContent.classList.add('vision-feedback-content'); // Container for shape + white background
        feedbackContent.style.backgroundColor = 'white'; // White background specifically for this content block

        // Create and append the correct shape SVG
        feedbackContent.appendChild(createSvgShape(visionCurrentResult));

        // Set text color for visibility on the white background
        messageText.style.color = 'black';
        messageText.style.textShadow = 'none'; // No shadow needed on white

        // Append *both* the background/shape container AND the text directly to visionResultDisplay
        visionResultDisplay.appendChild(feedbackContent);
        visionResultDisplay.appendChild(messageText); // Text is layered on top via absolute positioning

         // Ensure visionResultDisplay allows for layering (flex properties already in CSS)
         // No specific flex-direction or gap needed here as text is absolute
         visionResultDisplay.style.flexDirection = 'row'; // Reset or keep default
         visionResultDisplay.style.gap = '0';
    }

    updateVisionStatsDisplay(); // Update the displayed stats

    // Reset state after a delay
    visionCurrentResult = null; // Reset the result after guess
    setTimeout(() => {
        visionResultDisplay.classList.add('hidden'); // Hide feedback
        visionResultDisplay.style.backgroundColor = 'transparent'; // Reset background explicitely
        visionDisplay.style.backgroundColor = 'black'; // Reset display background
        visionShuffleBtn.disabled = false; // Enable shuffle button again
        // Choice buttons remain disabled until next shuffle
    }, 2500); // Show feedback for 2.5 seconds
}

function updateVisionStatsDisplay() {
    // console.log("Updating stats display:", visionStats); // Debug log
    visionStatsSpanAttempts.textContent = visionStats.attempts;
    visionStatsSpanSuccesses.textContent = visionStats.successes;
    visionStatsSpanFailures.textContent = visionStats.failures;
}

function updateVisionChoicesDisplay() {
     // Hide all choice buttons first
    visionColorChoiceBtns.forEach(btn => btn.classList.add('hidden'));
    visionShapeChoiceBtns.forEach(btn => btn.classList.add('hidden'));
    // Reset button state (disabled until shuffle, re-enabled in startVisionShuffle)
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
    if (!intentionShowBtn.classList.contains('hidden') && !intentionShowBtn.disabled && currentGameMode === 'intention') {
        intentionShowBtn.click();
    }
});
// Intention mode change
intentionModeRadios.forEach(radio => {
    radio.addEventListener('change', (event) => {
        intentionMode = event.target.value;
         // Restarting ensures the first result after change respects the mode
         stopIntentionGame(); // Stop current
         startIntentionGame(); // Start new
    });
});

// Vision Game Listeners
visionShuffleBtn.addEventListener('click', startVisionShuffle);
// Duplicate button click on display click (if shuffle button is enabled)
visionDisplay.addEventListener('click', () => {
    if (!visionShuffleBtn.disabled && currentGameMode === 'vision') {
        visionShuffleBtn.click();
    }
});

// Vision choice button listeners (using event delegation on the container)
visionChoicesDiv.addEventListener('click', handleVisionChoice); // Call handler directly

// Vision mode change
visionModeRadios.forEach(radio => {
    radio.addEventListener('change', (event) => {
        visionMode = event.target.value;
        updateVisionChoicesDisplay();
        // Ensure choice buttons are disabled and shuffle is enabled for the new mode
        setVisionChoiceButtonsEnabled(false);
        visionShuffleBtn.disabled = false;
        visionResultDisplay.classList.add('hidden'); // Hide previous result if any
        visionDisplay.style.backgroundColor = 'black'; // Reset display
         visionResultDisplay.style.backgroundColor = 'transparent'; // Reset result background
         visionCurrentResult = null; // Clear any pending result from previous mode
         // Optionally reset stats when mode changes? Let's keep them for now.
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
