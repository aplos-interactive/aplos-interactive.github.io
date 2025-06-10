// --- Game State Variables ---
const gameState = {
    currentYear: 1000,
    resources: {
        piety: 100,
        gold: 100,
        influence: 50,
        papalAuthority: 50,
        stability: 75
    },
    flags: {
        hasSecuredNobleSupport: false,
        hasSecuredTheologicalValidation: false,
        hasReformedChurch: false
    },
    turnCount: 0,
    advisorCooldowns: {
        cardinal: 0,
        lord: 0,
        alchemist: 0
    },
    currentCard: null // Stores the card currently displayed
};

// --- DOM Elements ---
const yearDisplay = document.getElementById('current-year');
const pietyValue = document.getElementById('piety-value');
const goldValue = document.getElementById('gold-value');
const influenceValue = document.getElementById('influence-value');
const papalAuthorityValue = document.getElementById('papal-authority-value');
const stabilityValue = document.getElementById('stability-value');
const gameLog = document.getElementById('game-log');
const cardTitle = document.getElementById('card-title');
const cardDescription = document.getElementById('card-description');
const cardChoices = document.getElementById('card-choices');
const advanceTurnBtn = document.getElementById('advance-turn-btn');
const advisorButtons = document.querySelectorAll('.advisor-btn');
const majorEventDeckPlaceholder = document.getElementById('major-event-deck-placeholder');
const gameModal = document.getElementById('game-modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalRestartBtn = document.getElementById('modal-restart-btn');

// --- Game Data: Event Cards ---
// Each card has an ID, title, description, and an array of choices.
// Each choice has text, effects (resource changes), and a log message.
const eventCards = [
    {
        id: 'initial_decree',
        title: 'A New Beginning',
        description: 'As the newly elected Pope, you face a continent brimming with challenges and opportunities. What is your first decree?',
        choices: [
            {
                text: 'Focus on monastic reforms to strengthen faith.',
                effects: { piety: 15, stability: 5, gold: -5 },
                log: 'You initiated monastic reforms, increasing piety and stability, but costing some gold.'
            },
            {
                text: 'Seek alliances with powerful kings to secure the Church\'s political standing.',
                effects: { influence: 15, papalAuthority: 5, piety: -5 },
                log: 'You forged new alliances, boosting influence and papal authority at the cost of some piety.'
            },
            {
                text: 'Fund infrastructure projects to improve trade and the well-being of your flock.',
                effects: { gold: 20, stability: 10, piety: -10 },
                log: 'You invested in infrastructure, gaining gold and stability, but slightly diminishing spiritual focus.'
            }
        ]
    },
    {
        id: 'local_dispute',
        title: 'Local Lord's Conflict',
        description: 'Two minor lords are locked in a territorial dispute, threatening peace in the region. They seek your arbitration.',
        choices: [
            {
                text: 'Side with Lord Varian, who has pledged loyalty to the Church.',
                effects: { influence: 10, piety: -5, stability: -5 },
                log: 'You sided with Lord Varian, gaining influence, but unsettling some in the region.'
            },
            {
                text: 'Demand they cease hostilities, threatening excommunication.',
                effects: { papalAuthority: 15, influence: -5, stability: -10 },
                log: 'Your threat of excommunication halted the conflict, asserting papal authority, but straining some political ties.'
            },
            {
                text: 'Offer mediation and seek a peaceful resolution through diplomacy.',
                effects: { stability: 10, influence: 5, gold: -10 },
                log: 'You successfully mediated the dispute, improving stability and influence, but costing some gold.'
            }
        ]
    },
    {
        id: 'heresy_spreads',
        title: 'Whispers of Heresy',
        description: 'Reports arrive of a new heretical sect gaining followers in a distant province. How do you respond?',
        choices: [
            {
                text: 'Dispatch inquisitors to root out the heresy by force.',
                effects: { piety: 20, stability: -15, gold: -10 },
                log: 'Inquisitors were sent, suppressing heresy and boosting piety, but causing unrest.'
            },
            {
                text: 'Send learned theologians to debate and peacefully convert the heretics.',
                effects: { piety: 10, gold: -5, stability: 5 },
                log: 'Theologians were dispatched, leading to some conversions and improved stability, at a cost.'
            },
            {
                text: 'Ignore it for now, focusing on more pressing matters.',
                effects: { piety: -15, stability: -5 },
                log: 'You ignored the heresy. Piety and stability suffered.'
            }
        ]
    },
    {
        id: 'crusade_call',
        title: 'A Call for Crusade',
        description: 'Emissaries from the East plead for a holy war against infidels occupying sacred lands. Do you heed their call?',
        choices: [
            {
                text: 'Call for a grand crusade, uniting Christian kingdoms.',
                effects: { piety: 30, influence: 20, gold: -30, stability: -10, papalAuthority: 10 },
                log: 'You called for a grand crusade! Piety, influence, and papal authority surged, but at great cost and instability.'
            },
            {
                text: 'Offer spiritual blessings and diplomatic support, but no direct military aid.',
                effects: { piety: 10, influence: 5, gold: -5 },
                log: 'You offered spiritual and diplomatic support, a modest gain in piety and influence.'
            },
            {
                text: 'Decline the request, citing internal Church matters.',
                effects: { piety: -10, influence: -5, stability: 5 },
                log: 'You declined the crusade. Piety and influence suffered, but stability increased.'
            }
        ]
    }
];

// --- Game Data: Major Choice Paths (Triggered by flags/resources) ---
const majorEventCards = [
    {
        id: 'new_roman_empire_quest',
        title: 'The Roman Dream Revived',
        description: 'The time is ripe! With immense spiritual authority, political sway, and a stable realm, you feel the divine mandate to re-establish the glory of a Holy Roman Empire under direct Papal guidance. But it requires two critical steps.',
        prerequisites: {
            piety: 150,
            papalAuthority: 120,
            influence: 120,
            stability: 70
        },
        choices: [
            {
                text: 'Secure Noble Support: Negotiate with powerful secular rulers for their recognition.',
                effects: { gold: -50, influence: 30, stability: -10, setFlag: 'hasSecuredNobleSupport' },
                log: 'You secured the backing of key noble houses, a crucial step for the new Empire!',
                condition: (state) => !state.flags.hasSecuredNobleSupport // Can only do this if flag isn't set
            },
            {
                text: 'Secure Theological Validation: Convene a grand council to formally declare the Papal claim to Empire.',
                effects: { piety: 30, papalAuthority: 30, stability: -10, setFlag: 'hasSecuredTheologicalValidation' },
                log: 'A grand council affirmed your claim to the Empire through divine right! Theological validation achieved.',
                condition: (state) => !state.flags.hasSecuredTheologicalValidation // Can only do this if flag isn't set
            }
        ],
        // Logic to check for completion after choices are made
        completionCheck: (state) => state.flags.hasSecuredNobleSupport && state.flags.hasSecuredTheologicalValidation,
        winCondition: {
            title: "A New Roman Empire!",
            message: "Under your divine leadership, the Holy Roman Empire is reborn, with the Papacy as its unassailable head! You have forged a new golden age. The history books will forever remember Pope [Your Name] as the unifier of Christendom and the restorer of Rome. You win!"
        }
    }
];

// --- Game Data: Advisors ---
const advisors = {
    cardinal: {
        name: 'Cardinal Bellini',
        description: 'Focuses on spiritual matters and internal Church affairs.',
        ability: (state) => {
            state.resources.piety += 20;
            state.resources.papalAuthority += 5;
            state.resources.gold -= 5;
            addLog('You consulted Cardinal Bellini. Piety increased significantly, Papal Authority slightly, but at some cost.');
        },
        cooldown: 3 // Turns before reusable
    },
    lord: {
        name: 'Lord Valerius',
        description: 'A shrewd diplomat and military strategist, advising on secular power.',
        ability: (state) => {
            state.resources.influence += 20;
            state.resources.stability -= 5;
            state.resources.gold -= 10;
            addLog('You consulted Lord Valerius. Influence surged, but stability took a minor hit and gold was spent.');
        },
        cooldown: 4
    },
    alchemist: {
        name: 'Master Alchemist',
        description: 'Offers unconventional solutions, sometimes with unpredictable results.',
        ability: (state) => {
            // Random positive or negative effect
            const effectChoice = Math.random();
            if (effectChoice < 0.3) {
                state.resources.gold += 30;
                addLog('You consulted the Master Alchemist, who found a hidden cache of gold! Gold increased significantly.');
            } else if (effectChoice < 0.6) {
                state.resources.stability += 15;
                addLog('You consulted the Master Alchemist, whose insights brought unforeseen stability to the realm!');
            } else {
                state.resources.piety -= 10;
                state.resources.stability -= 10;
                addLog('You consulted the Master Alchemist, but their experiment backfired, causing a drop in piety and stability.');
            }
        },
        cooldown: 5
    }
};

// --- Helper Functions ---

/**
 * Updates the display of all resource values.
 */
function updateResourceDisplay() {
    pietyValue.textContent = gameState.resources.piety;
    goldValue.textContent = gameState.resources.gold;
    influenceValue.textContent = gameState.resources.influence;
    papalAuthorityValue.textContent = gameState.resources.papalAuthority;
    stabilityValue.textContent = gameState.resources.stability;
}

/**
 * Adds a new message to the game log.
 * @param {string} message - The message to add.
 */
function addLog(message) {
    const newLogEntry = document.createElement('p');
    newLogEntry.textContent = `- ${message}`;
    gameLog.prepend(newLogEntry); // Add to the top for chronological order
    // Optional: Limit log entries to prevent excessive build-up
    if (gameLog.children.length > 50) {
        gameLog.removeChild(gameLog.lastChild);
    }
}

/**
 * Checks for game over conditions.
 * @returns {boolean} True if game is over.
 */
function checkGameOver() {
    let gameOverMessage = '';
    let gameOverTitle = 'Game Over!';

    if (gameState.resources.piety <= 0) {
        gameOverMessage = "Your spiritual authority has completely eroded. The faithful have abandoned you, and the Church crumbles. The Papacy is no more.";
    } else if (gameState.resources.gold <= 0) {
        gameOverMessage = "Your coffers are empty, and your debts are insurmountable. The Papacy is bankrupt, unable to maintain its influence or even its own guards.";
    } else if (gameState.resources.stability <= 0) {
        gameOverMessage = "Widespread rebellion and chaos consume the lands. Your authority is ignored, and the realm descends into anarchy.";
    } else if (gameState.resources.papalAuthority <= 0) {
        gameOverMessage = "Your direct control over the Church has vanished. Cardinals ignore your decrees, and schisms erupt across Europe.";
    } else if (gameState.resources.influence <= 0) {
        gameOverMessage = "Secular powers no longer heed your words. You are a Pope without political sway, a figurehead ignored by kings and emperors.";
    }

    if (gameOverMessage) {
        endGame(gameOverTitle, gameOverMessage);
        return true;
    }
    return false;
}

/**
 * Displays the game over/win modal and stops game interaction.
 * @param {string} title - Title for the modal.
 * @param {string} message - Message for the modal.
 */
function endGame(title, message) {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    gameModal.classList.remove('hidden');
    // Disable game interaction
    advanceTurnBtn.disabled = true;
    cardChoices.innerHTML = ''; // Clear card choices
    advisorButtons.forEach(btn => btn.disabled = true);
}

/**
 * Resets the game to its initial state.
 */
function resetGame() {
    gameState.currentYear = 1000;
    gameState.resources = {
        piety: 100,
        gold: 100,
        influence: 50,
        papalAuthority: 50,
        stability: 75
    };
    gameState.flags = {
        hasSecuredNobleSupport: false,
        hasSecuredTheologicalValidation: false,
        hasReformedChurch: false
    };
    gameState.turnCount = 0;
    gameState.advisorCooldowns = {
        cardinal: 0,
        lord: 0,
        alchemist: 0
    };
    gameState.currentCard = null;
    gameLog.innerHTML = '<p>Welcome to Habeus Papam!</p>'; // Clear and reset log

    gameModal.classList.add('hidden'); // Hide modal
    advanceTurnBtn.disabled = false; // Re-enable turn button
    advisorButtons.forEach(btn => btn.disabled = false); // Re-enable advisor buttons
    initGame(); // Re-initialize the game (draw first card etc.)
}

// --- Game Logic ---

/**
 * Applies the effects of a choice to the game state.
 * @param {object} effects - An object containing resource changes and flags.
 */
function applyEffects(effects) {
    if (effects) {
        for (const resource in effects) {
            if (gameState.resources.hasOwnProperty(resource)) {
                gameState.resources[resource] += effects[resource];
            } else if (resource === 'setFlag') {
                gameState.flags[effects[resource]] = true;
            }
        }
        updateResourceDisplay();
    }
}

/**
 * Displays a given event card to the player.
 * @param {object} card - The card object to display.
 */
function displayCard(card) {
    gameState.currentCard = card; // Store the current card
    cardTitle.textContent = card.title;
    cardDescription.textContent = card.description;
    cardChoices.innerHTML = ''; // Clear previous choices

    card.choices.forEach((choice, index) => {
        // Check if the choice has a specific condition that needs to be met
        if (choice.condition && !choice.condition(gameState)) {
            // If condition not met, skip or disable choice (here, we skip)
            return;
        }

        const choiceBtn = document.createElement('button');
        choiceBtn.classList.add('card-choice-btn');
        choiceBtn.textContent = choice.text;
        choiceBtn.addEventListener('click', () => handleChoice(card.id, index));
        cardChoices.appendChild(choiceBtn);
    });
}

/**
 * Handles the player's choice on an event card.
 * @param {string} cardId - The ID of the card chosen.
 * @param {number} choiceIndex - The index of the chosen option.
 */
function handleChoice(cardId, choiceIndex) {
    const card = eventCards.find(c => c.id === cardId) || majorEventCards.find(c => c.id === cardId);
    if (!card) return; // Should not happen

    const choice = card.choices[choiceIndex];
    if (!choice) return; // Should not happen

    addLog(choice.log);
    applyEffects(choice.effects);

    // Specific logic for major choice path completion
    if (card.completionCheck && card.completionCheck(gameState)) {
        if (card.winCondition) {
            endGame(card.winCondition.title, card.winCondition.message);
            return; // Game ends
        }
        addLog(`Major goal accomplished: ${card.title} requirements met!`);
        // Potentially remove this major card or replace with follow-up
        majorEventDeckPlaceholder.classList.add('hidden'); // Visual indication
    }

    // After a choice, enable advance turn button and disable choices
    advanceTurnBtn.disabled = false;
    cardChoices.innerHTML = ''; // Clear choices
    cardTitle.textContent = 'Decision Made';
    cardDescription.textContent = 'Advance the turn to continue.';

    // Check for game over after effects are applied
    if (checkGameOver()) {
        return;
    }
}


/**
 * Randomly draws a card from the available event cards, ensuring no duplicates recently.
 * For simplicity, we'll just pick a random one for now.
 * In a real game, you'd manage a deck with drawing/discarding.
 * @returns {object} The chosen event card.
 */
function drawEventCard() {
    const availableCards = eventCards.filter(card => card.id !== gameState.currentCard?.id); // Don't redraw current card immediately
    if (availableCards.length === 0) {
        // If all cards have been drawn, perhaps shuffle discard pile back into deck
        addLog('All normal event cards drawn. Reshuffling minor events.');
        return eventCards[Math.floor(Math.random() * eventCards.length)];
    }
    const randomIndex = Math.floor(Math.random() * availableCards.length);
    return availableCards[randomIndex];
}

/**
 * Handles the progression of a game turn.
 */
function advanceTurn() {
    gameState.turnCount++;
    gameState.currentYear++;
    yearDisplay.textContent = `Year: ${gameState.currentYear} AD`;
    addLog(`Turn ${gameState.turnCount}: Year ${gameState.currentYear} AD`);

    // Decrease advisor cooldowns
    for (const advisor in gameState.advisorCooldowns) {
        if (gameState.advisorCooldowns[advisor] > 0) {
            gameState.advisorCooldowns[advisor]--;
        }
    }
    updateAdvisorButtonStates(); // Update button enable/disable

    // Check for major path triggers
    let majorPathTriggered = false;
    for (const majorCard of majorEventCards) {
        const prereqsMet = Object.keys(majorCard.prerequisites).every(res => {
            return gameState.resources[res] >= majorCard.prerequisites[res];
        });

        if (prereqsMet && !majorCard.hasTriggered) { // Only trigger once
            // For this simple version, we'll just display it if triggered.
            // In a more complex game, it might be added to a special "hand" or deck.
            displayCard(majorCard);
            majorCard.hasTriggered = true; // Mark as triggered so it doesn't keep appearing
            majorEventDeckPlaceholder.classList.remove('hidden'); // Visual indication
            addLog(`A major historical path has opened: "${majorCard.title}"!`);
            majorPathTriggered = true;
            break; // Only trigger one major path per turn for simplicity
        }
    }

    if (!majorPathTriggered) {
        // If no major path, draw a regular event card
        const newCard = drawEventCard();
        displayCard(newCard);
    }

    // Disable advance turn button until a choice is made
    advanceTurnBtn.disabled = true;

    // Apply minor passive effects or random events here if desired
    // Example: small stability decay per turn
    gameState.resources.stability = Math.max(0, gameState.resources.stability - 1);
    updateResourceDisplay();

    // Check for game over after all turn effects
    checkGameOver();
}

/**
 * Updates the disabled state of advisor buttons based on cooldowns.
 */
function updateAdvisorButtonStates() {
    advisorButtons.forEach(button => {
        const advisorId = button.dataset.advisor;
        button.disabled = gameState.advisorCooldowns[advisorId] > 0;
        if (gameState.advisorCooldowns[advisorId] > 0) {
            button.textContent = `${advisors[advisorId].name} (${gameState.advisorCooldowns[advisorId]} turns)`;
        } else {
            button.textContent = advisors[advisorId].name;
        }
    });
}

// --- Event Listeners ---
advanceTurnBtn.addEventListener('click', advanceTurn);
modalRestartBtn.addEventListener('click', resetGame);

advisorButtons.forEach(button => {
    button.addEventListener('click', (event) => {
        const advisorId = event.target.dataset.advisor;
        if (advisorId && !event.target.disabled) {
            advisors[advisorId].ability(gameState);
            gameState.advisorCooldowns[advisorId] = advisors[advisorId].cooldown; // Set cooldown
            updateAdvisorButtonStates(); // Update button state immediately
            updateResourceDisplay(); // Ensure resources update after advisor
            addLog(`You consulted ${advisors[advisorId].name}.`);
            
            // Advisors advance a turn too
            advanceTurn();
        }
    });
});

// --- Initialization ---
function initGame() {
    updateResourceDisplay();
    updateAdvisorButtonStates();
    // Display the very first card on game start
    displayCard(eventCards.find(card => card.id === 'initial_decree'));
    // Disable advance turn until the initial choice is made
    advanceTurnBtn.disabled = true;
}

// Start the game!
initGame();
