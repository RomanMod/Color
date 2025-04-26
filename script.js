const gameScreens = document.querySelectorAll('.screen');
const menuScreen = document.getElementById('menu-screen');
const playerNameSpan = document.getElementById('player-name');

const colorGameScreen = document.getElementById('color-game-screen');
const colorGameTitle = document.getElementById('color-game-title');
const colorModeIntention = document.getElementById('color-mode-intention');
const colorModeVision = document.getElementById('color-mode-vision');
const colorModeButtons = colorGameScreen.querySelectorAll('.mode-selection button');
const colorBackButton = colorGameScreen.querySelector('.back-button');

// UI elements for Color Game - Intention
const colorIntentionDisplay = document.getElementById('color-intention-display');
const colorIntentionDisplayColor = colorIntentionDisplay.querySelector('.display-color');
const colorIntentionDisplayText = colorIntentionDisplay.querySelector('.display-text');
const colorShuffleButton = document.getElementById('color-shuffle-button');
const colorChoiceButtonsDiv = document.getElementById('color-choice-buttons');
const colorIntentionAttemptsSpan = document.getElementById('color-intention-attempts');
const colorIntentionWinsSpan = document.getElementById('color-intention-wins');
const colorIntentionLossesSpan = document.getElementById('color-intention-losses');
const colorOptionButtons = colorGameScreen.querySelectorAll('.color-option-button');
const playerSelectedColorsSpan = document.getElementById('player-selected-colors');

// UI elements for Color Game - Vision
const colorVisionDisplay = document.getElementById('color-vision-display');
const colorVisionDisplayColor = colorVisionDisplay.querySelector('.display-color');
const colorShowButton = document.getElementById('color-show-button');
const colorVisionAttemptsSpan = document.getElementById('color-vision-attempts');


let currentGame = null; // Stores the currently active game ('color', 'symbols', etc.)
let currentGameMode = null; // Stores the current mode ('intention', 'vision')

// Game state storage (simple object for demonstration)
const gameState = {
    color: {
        intention: {
            attempts: 0,
            wins: 0,
            losses: 0,
            playerColor1: '#FF0000', // Default Red
            playerColor2: '#0000FF', // Default Blue
            correctColor: null // Color determined by randomizer
        },
        vision: {
            attempts: 0,
            playerColor1: '#FF0000', // Default Red
            playerColor2: '#0000FF' // Default Blue
        }
    },
    // Add state for other games here
    symbols: { intention: { attempts: 0, wins: 0, losses: 0 }, vision: { attempts: 0 } },
    key: { intention: { attempts: 0, wins: 0, losses: 0 }, vision: { attempts: 0 } },
    coins: { intention: { attempts: 0, wins: 0, losses: 0 }, vision: { attempts: 0 } },
    dice: { intention: { attempts: 0, wins: 0, losses: 0 }, vision: { attempts: 0 } },
};

// --- Telegram Web App Initialization ---
Telegram.WebApp.ready();
Telegram.WebApp.expand(); // Expand to full height

if (Telegram.WebApp.initDataUnsafe && Telegram.WebApp.initDataUnsafe.user) {
    const user = Telegram.WebApp.initDataUnsafe.user;
    playerNameSpan.textContent = user.first_name || 'Игрок';
} else {
    playerNameSpan.textContent = 'Игрок (API недоступен)';
}

// --- Navigation ---
function showScreen(id) {
    gameScreens.forEach(screen => {
        screen.classList.add('hidden');
    });
    document.getElementById(id).classList.remove('hidden');
}

function showGameScreen(gameName) {
    currentGame = gameName;
    // Reset mode selection visibility for the new game
    const gameScreen = document.getElementById(`${gameName}-game-screen`);
    gameScreen.querySelectorAll('.game-mode').forEach(modeDiv => modeDiv.classList.add('hidden'));
    gameScreen.querySelector('.mode-selection').classList.remove('hidden');
    showScreen(`${gameName}-game-screen`);
    // Update title
    document.getElementById(`${gameName}-game-title`).textContent = `Игра: ${gameName.charAt(0).toUpperCase() + gameName.slice(1)}`;
}

function showGameMode(gameName, modeName) {
    currentGameMode = modeName;
     const gameScreen = document.getElementById(`${gameName}-game-screen`);
     gameScreen.querySelector('.mode-selection').classList.add('hidden'); // Hide mode selection
     gameScreen.querySelectorAll('.game-mode').forEach(modeDiv => modeDiv.classList.add('hidden')); // Hide all modes
     document.getElementById(`${gameName}-mode-${modeName}`).classList.remove('hidden'); // Show selected mode

     // Specific setup for Color Game modes
     if (gameName === 'color') {
         if (modeName === 'intention') {
             resetColorIntentionGame(); // Setup initial state for Intention
         } else if (modeName === 'vision') {
             resetColorVisionGame(); // Setup initial state for Vision
         }
         updateColorStatsDisplay(modeName);
     }
    // Add similar logic for other games
}


function goToMenu() {
     currentGame = null;
     currentGameMode = null;
     // Hide any active game mode specific UI
     document.querySelectorAll('.game-mode').forEach(modeDiv => modeDiv.classList.add('hidden'));
     showScreen('menu-screen');
}

// --- Menu Button Listeners ---
document.querySelectorAll('.menu-button').forEach(button => {
    button.addEventListener('click', (event) => {
        const game = event.target.dataset.game;
        showGameScreen(game);
    });
});

// --- Mode Selection Button Listeners (Generic) ---
document.querySelectorAll('.mode-selection button').forEach(button => {
    button.addEventListener('click', (event) => {
         const mode = event.target.dataset.mode;
         if (currentGame) {
              showGameMode(currentGame, mode);
         }
    });
});

// --- Back Button Listeners (Generic) ---
document.querySelectorAll('.back-button').forEach(button => {
    button.addEventListener('click', goToMenu);
});


// --- Color Game Logic ---

// Helper to update color stats display
function updateColorStatsDisplay(mode) {
    if (mode === 'intention') {
        const stats = gameState.color.intention;
        colorIntentionAttemptsSpan.textContent = stats.attempts;
        colorIntentionWinsSpan.textContent = stats.wins;
        colorIntentionLossesSpan.textContent = stats.losses;
    } else if (mode === 'vision') {
        const stats = gameState.color.vision;
         colorVisionAttemptsSpan.textContent = stats.attempts;
         // No wins/losses shown for Vision mode based on description
    }
}

// Reset/Initial state for Color Intention
function resetColorIntentionGame() {
    // Hide choice buttons initially
    colorChoiceButtonsDiv.classList.add('hidden');
    // Reset display
    colorIntentionDisplayColor.style.backgroundColor = 'transparent';
    colorIntentionDisplayText.textContent = '';
    // Enable shuffle button
    colorShuffleButton.disabled = false;
    // Ensure player colors are set on buttons (or update text)
     // For now, hardcode Red/Blue text, use CSS for colors
     const choiceButtons = colorChoiceButtonsDiv.querySelectorAll('.choice-button');
     choiceButtons[0].dataset.choiceColor = gameState.color.intention.playerColor1;
     choiceButtons[0].style.backgroundColor = gameState.color.intention.playerColor1;
     choiceButtons[0].textContent = getColorName(gameState.color.intention.playerColor1);

     choiceButtons[1].dataset.choiceColor = gameState.color.intention.playerColor2;
     choiceButtons[1].style.backgroundColor = gameState.color.intention.playerColor2;
     choiceButtons[1].textContent = getColorName(gameState.color.intention.playerColor2);

    // Show player selected colors text
    playerSelectedColorsSpan.textContent = `${getColorName(gameState.color.intention.playerColor1)}, ${getColorName(gameState.color.intention.playerColor2)}`;

}

// Reset/Initial state for Color Vision
function resetColorVisionGame() {
     // Reset display
     colorVisionDisplayColor.style.backgroundColor = 'transparent';
     // Enable show button
     colorShowButton.disabled = false;
}


// Color Shuffle Button Handler (Intention Mode)
colorShuffleButton.addEventListener('click', () => {
    colorShuffleButton.disabled = true; // Disable shuffle during randomization
    colorIntentionDisplayColor.style.backgroundColor = 'transparent'; // Clear display
    colorIntentionDisplayText.textContent = 'Перемешиваем...';

    // Simulate randomization delay
    setTimeout(() => {
        // Randomly select one of the two player colors
        const playerColors = [gameState.color.intention.playerColor1, gameState.color.intention.playerColor2];
        const randomIndex = Math.floor(Math.random() * playerColors.length);
        gameState.color.intention.correctColor = playerColors[randomIndex];

        // Hide display result for now as per requirements
        colorIntentionDisplayColor.style.backgroundColor = 'transparent';
        colorIntentionDisplayText.textContent = 'Выберите цвет'; // Prompt player

        // Show choice buttons
        colorChoiceButtonsDiv.classList.remove('hidden');

    }, 2000); // 2 second delay
});

// Color Choice Button Handlers (Intention Mode)
colorChoiceButtonsDiv.querySelectorAll('.choice-button').forEach(button => {
    button.addEventListener('click', (event) => {
        const playerChoice = event.target.dataset.choiceColor;
        const correctColor = gameState.color.intention.correctColor;
        const stats = gameState.color.intention;

        stats.attempts++; // Increment attempt

        // Update display with result
        colorIntentionDisplayColor.style.backgroundColor = correctColor;
        colorIntentionDisplayText.style.color = '#ffffff'; // Ensure text is visible on colored background

        if (playerChoice === correctColor) {
            stats.wins++;
            colorIntentionDisplayText.textContent = 'Успех!';
        } else {
            stats.losses++;
            colorIntentionDisplayText.textContent = 'Попробуй ещё';
        }

        updateColorStatsDisplay('intention'); // Update stats display

        // Disable choice buttons and re-enable shuffle button
        colorChoiceButtonsDiv.classList.add('hidden');
        colorShuffleButton.disabled = false;

        // Reset correct color for next round
        gameState.color.intention.correctColor = null;
    });
});


// Color Show Button Handler (Vision Mode)
colorShowButton.addEventListener('click', () => {
     colorShowButton.disabled = true; // Disable button
     colorVisionDisplayColor.style.backgroundColor = 'transparent'; // Clear display initially
     const stats = gameState.color.vision;
     stats.attempts++; // Increment attempt
     updateColorStatsDisplay('vision');

     // Randomly select one of the two player colors immediately
     const playerColors = [gameState.color.vision.playerColor1, gameState.color.vision.playerColor2];
     const randomIndex = Math.floor(Math.random() * playerColors.length);
     const colorToShow = playerColors[randomIndex];

     // Show the color
     colorVisionDisplayColor.style.backgroundColor = colorToShow;

     // Set timeout to clear color and re-enable button
     setTimeout(() => {
         colorVisionDisplayColor.style.backgroundColor = 'transparent'; // Clear color
         colorShowButton.disabled = false; // Re-enable button
     }, 1000); // 1 second delay as requested
});


// Color Picker Logic (Simple - select 2 colors)
let selectedColors = [];
colorOptionButtons.forEach(button => {
    button.addEventListener('click', (event) => {
        const color = event.target.dataset.color;

        if (selectedColors.includes(color)) {
            // Deselect
            selectedColors = selectedColors.filter(c => c !== color);
            event.target.classList.remove('selected');
        } else {
            // Select (max 2)
            if (selectedColors.length < 2) {
                selectedColors.push(color);
                event.target.classList.add('selected');
            } else {
                // If already 2 selected, replace the oldest one (or just do nothing)
                 // Simple replacement: replace the first selected one
                 const oldColor = selectedColors.shift();
                 selectedColors.push(color);
                 // Find the button for the old color and deselect it
                 colorOptionButtons.forEach(btn => {
                     if (btn.dataset.color === oldColor) {
                         btn.classList.remove('selected');
                     }
                 });
                 event.target.classList.add('selected');

            }
        }

        // Update game state and display
        if (selectedColors.length === 2) {
            gameState.color.intention.playerColor1 = selectedColors[0];
            gameState.color.intention.playerColor2 = selectedColors[1];
            gameState.color.vision.playerColor1 = selectedColors[0];
            gameState.color.vision.playerColor2 = selectedColors[1];
            playerSelectedColorsSpan.textContent = `${getColorName(selectedColors[0])}, ${getColorName(selectedColors[1])}`;

             // Update buttons if in Intention mode
             if (currentGame === 'color' && currentGameMode === 'intention') {
                 const choiceButtons = colorChoiceButtonsDiv.querySelectorAll('.choice-button');
                 // Ensure we have exactly 2 buttons, then update them
                 if (choiceButtons.length >= 2) {
                     choiceButtons[0].dataset.choiceColor = selectedColors[0];
                     choiceButtons[0].style.backgroundColor = selectedColors[0];
                     choiceButtons[0].textContent = getColorName(selectedColors[0]);

                     choiceButtons[1].dataset.choiceColor = selectedColors[1];
                     choiceButtons[1].style.backgroundColor = selectedColors[1];
                     choiceButtons[1].textContent = getColorName(selectedColors[1]);
                 }
            }


        } else {
             // Handle case where less than 2 colors are selected?
             // Maybe disable game start or default back to red/blue?
             // For now, keep the last valid pair if less than 2 are selected.
             playerSelectedColorsSpan.textContent = selectedColors.map(getColorName).join(', ') || 'Выберите 2 цвета';

        }
    });
});

// Initial selection for color picker (Red and Blue)
const initialColors = ['#FF0000', '#0000FF'];
colorOptionButtons.forEach(button => {
    if (initialColors.includes(button.dataset.color)) {
        button.click(); // Simulate click to select
    }
});


// Helper function to get a human-readable color name
function getColorName(hex) {
    const names = {
        '#FF0000': 'Красный',
        '#FFA500': 'Оранжевый',
        '#FFFF00': 'Желтый',
        '#008000': 'Зеленый',
        '#0000FF': 'Синий',
        '#4B0082': 'Индиго',
        '#EE82EE': 'Фиолетовый'
    };
    return names[hex] || hex; // Return name if found, otherwise hex
}


// --- Initial Screen ---
showScreen('menu-screen');
