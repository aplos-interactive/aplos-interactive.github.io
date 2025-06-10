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
        hasReformedChurch: false,
        // Existing new flags
        hasSurvivedFirstDecade: false,
        hasHighPietyEver: false,
        hasMaxGoldEver: false,
        // Flags for advisor usage (NEW/FIXED)
        usedCardinal: false,
        usedLord: false,
        usedAlchemist: false,
        hasUsedAllAdvisors: false
    },
    turnCount: 0,
    advisorCooldowns: {
        cardinal: 0,
        lord: 0,
        alchemist: 0
    },
    currentCard: null, // Stores the card currently displayed
    unlockedAchievements: [], // Array to store IDs of unlocked achievements
    gameStarted: false // New flag to track if a game is in progress
};

// --- DOM Elements (Declared here, assigned after DOMContentLoaded) ---
let yearDisplay;
let pietyValue;
let goldValue;
let influenceValue;
let papalAuthorityValue;
let stabilityValue;
let gameLog;
let cardTitle;
let cardDescription;
let cardChoices;
let advanceTurnBtn;
let advisorButtons; // This will be a NodeList
let majorEventDeckPlaceholder;
let gameModal;
let modalTitle;
let modalMessage;
let modalRestartBtn;

// New DOM elements for Main Menu and Achievements
let mainMenuBtn;
let mainMenu;
let startGameBtn;
let continueGameBtn;
let viewAchievementsBtn;
let optionsBtn;
let exitGameBtn;

let achievementsList;


// --- Game Data: Event Cards (Expanded) ---
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
        title: 'Local Lord\'s Conflict',
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
    },
    // --- NEW CARDS ---
    {
        id: 'plague_outbreak',
        title: 'The Black Death Approaches',
        description: 'A terrifying plague sweeps across Europe, devastating populations. How does the Church respond?',
        choices: [
            {
                text: 'Organize mass prayers and processions, emphasizing divine intervention.',
                effects: { piety: 25, stability: -20, gold: -10 },
                log: 'Mass prayers were organized. Piety soared amidst the terror, but fear still gripped the populace, affecting stability.'
            },
            {
                text: 'Fund medical research and quarantine efforts, even if it conflicts with some beliefs.',
                effects: { gold: -30, stability: 15, piety: -10 },
                log: 'You funded early medical efforts. Stability improved due to tangible actions, but some faithful questioned the focus on earthly solutions.'
            },
            {
                text: 'Blame sinful populaces and call for harsh repentance.',
                effects: { piety: 10, stability: -30, papalAuthority: 5 },
                log: 'You blamed the people for the plague. While papal authority was asserted, widespread fear and instability followed.'
            }
        ]
    },
    {
        id: 'new_trade_route',
        title: 'Discovery of New Trade Routes',
        description: 'Merchants report the discovery of new, lucrative trade routes. This promises wealth, but also new influences.',
        choices: [
            {
                text: 'Encourage Papal investment in the new trade, seeking direct profit.',
                effects: { gold: 30, influence: 10, piety: -5 },
                log: 'The Papacy invested in new trade routes. Gold and influence increased, but some saw it as too worldly.'
            },
            {
                text: 'Tax the new trade heavily to fund Church expansion and charitable works.',
                effects: { gold: 20, piety: 10, stability: -5 },
                log: 'You taxed the new trade to fund the Church. Piety increased, but heavy taxes caused minor stability issues.'
            },
            {
                text: 'Bless the routes and promote fair trade, relying on spiritual guidance.',
                effects: { piety: 15, stability: 10, gold: 5 },
                log: 'You blessed the new trade, promoting fairness. Piety and stability increased, with a small gold gain.'
            }
        ]
    },
    {
        id: 'scholarly_debate',
        title: 'A Scholarly Debate on Doctrine',
        description: 'Renowned scholars are engaged in a heated debate over a complex theological doctrine. Your intervention is sought.',
        choices: [
            {
                text: 'Endorse the traditional interpretation, asserting dogma.',
                effects: { papalAuthority: 20, piety: 10, influence: -5 },
                log: 'You firmly upheld tradition. Papal authority and piety were strengthened, but some intellectual dissent emerged.'
            },
            {
                text: 'Encourage open academic discourse, valuing intellectual freedom.',
                effects: { influence: 10, stability: 5, papalAuthority: -5 },
                log: 'You promoted scholarly freedom. Influence and stability increased, but it slightly diluted the Papacy\'s absolute doctrinal control.'
            },
            {
                text: 'Condemn both sides for divisiveness and enforce silence.',
                effects: { stability: -10, piety: -5, papalAuthority: 10 },
                log: 'You silenced the debate. Papal authority was asserted, but it bred resentment and lowered both piety and stability.'
            }
        ]
    },
    {
        id: 'imperial_election',
        title: 'Imperial Election Looms',
        description: 'The Holy Roman Emperor has died, and a new election is at hand. Various factions vie for your endorsement.',
        choices: [
            {
                text: 'Endorse Prince Frederick, a devout and militarily strong candidate.',
                effects: { influence: 25, papalAuthority: 10, stability: -5 },
                log: 'You backed Prince Frederick. Your influence and papal authority soared, but some rivals were displeased.'
            },
            {
                text: 'Support Duke Leopold, a more moderate ruler who promises non-interference in Church affairs.',
                effects: { stability: 15, piety: 5, influence: -10 },
                log: 'You chose Duke Leopold. Stability and piety rose, but your influence in imperial politics waned.'
            },
            {
                text: 'Remain neutral, allowing the secular powers to decide amongst themselves.',
                effects: { influence: -15, papalAuthority: -10, stability: 5 },
                log: 'You remained neutral. Stability improved from avoiding conflict, but your influence and papal authority diminished.'
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
                text: 'Secure Noble Support: Negotiate with powerful secular rulers for their recognition. (-50 Gold, +30 Influence, -10 Stability)',
                effects: { gold: -50, influence: 30, stability: -10, setFlag: 'hasSecuredNobleSupport' },
                log: 'You secured the backing of key noble houses, a crucial step for the new Empire!',
                condition: (state) => !state.flags.hasSecuredNobleSupport // Can only do this if flag isn't set
            },
            {
                text: 'Secure Theological Validation: Convene a grand council to formally declare the Papal claim to Empire. (+30 Piety, +30 Papal Authority, -10 Stability)',
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
    },
    // --- NEW MAJOR PATH: The Great Schism ---
    {
        id: 'great_schism_path',
        title: 'The Great Schism',
        description: 'Years of theological and political disagreements between Rome and Constantinople have reached a breaking point. A definitive split seems inevitable unless drastic action is taken.',
        prerequisites: {
            piety: 80, // Needs reasonable piety
            papalAuthority: 80, // Needs reasonable authority
            stability: 50, // Not too unstable
            influence: 60, // Some influence to mediate
            turnMin: 20 // Only after 20 turns
        },
        choices: [
            {
                text: 'Assert Roman Primacy: Demand Constantinople submit to Rome\'s spiritual authority. (+40 Papal Authority, -20 Piety, -20 Influence, -10 Stability)',
                effects: { papalAuthority: 40, piety: -20, influence: -20, stability: -10, setFlag: 'hasAssertedRomanPrimacy' },
                log: 'You forcefully asserted Roman primacy. Papal Authority surged, but at a heavy cost to Piety, Influence, and Stability in the East.'
            },
            {
                text: 'Seek Reconciliation: Offer concessions for the sake of Christian unity. (-30 Papal Authority, +20 Piety, +15 Influence, +15 Stability)',
                effects: { papalAuthority: -30, piety: 20, influence: 15, stability: 15, setFlag: 'hasSoughtReconciliation' },
                log: 'You sought reconciliation, making concessions. Papal Authority dipped, but Piety, Influence, and Stability saw significant gains for unity.'
            }
        ],
        completionCheck: (state) => state.flags.hasAssertedRomanPrimacy || state.flags.hasSoughtReconciliation,
        outcomeLogic: (state) => {
            if (state.flags.hasAssertedRomanPrimacy) {
                addLog('The Great Schism has officially occurred, with Rome asserting its dominance over the splintered East.');
                // Potentially new cards or challenges related to Eastern Church
                // You could add a flag like `isEasternSchismActive: true`
            } else if (state.flags.hasSoughtReconciliation) {
                addLog('You have managed to avert the Great Schism, for now. Christian unity is preserved!');
                // Potentially boost specific resources in the long term or prevent negative events
            }
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

// --- Game Data: Achievements ---
const achievements = [
    {
        id: 'first_decade',
        name: 'Seasoned Pontiff',
        description: 'Survive your first 10 years as Pope.',
        condition: (state) => state.currentYear >= 1010 && !state.flags.hasSurvivedFirstDecade,
        onUnlock: (state) => { state.flags.hasSurvivedFirstDecade = true; addLog('Achievement Unlocked: Seasoned Pontiff!'); }
    },
    {
        id: 'golden_hand',
        name: 'Golden Hand',
        description: 'Reach 200 Gold.',
        condition: (state) => state.resources.gold >= 200 && !state.flags.hasMaxGoldEver,
        onUnlock: (state) => { state.flags.hasMaxGoldEver = true; addLog('Achievement Unlocked: Golden Hand!'); }
    },
    {
        id: 'pillar_of_faith',
        name: 'Pillar of Faith',
        description: 'Reach 180 Piety.',
        condition: (state) => state.resources.piety >= 180 && !state.flags.hasHighPietyEver,
        onUnlock: (state) => { state.flags.hasHighPietyEver = true; addLog('Achievement Unlocked: Pillar of Faith!'); }
    },
    {
        id: 'advisor_master',
        name: 'Advisor Master',
        description: 'Use all three advisors at least once.',
        condition: (state) => {
            // FIXED: Now relies on individual advisor usage flags
            return state.flags.usedCardinal && state.flags.usedLord && state.flags.usedAlchemist && !state.flags.hasUsedAllAdvisors;
        },
        onUnlock: (state) => { state.flags.hasUsedAllAdvisors = true; addLog('Achievement Unlocked: Advisor Master!'); }
    }
];

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
 * Updates the display of unlocked achievements.
 */
function updateAchievementDisplay() {
    achievementsList.innerHTML = ''; // Clear current list
    if (gameState.unlockedAchievements.length === 0) {
        const noAchievementsMsg = document.createElement('p');
        noAchievementsMsg.classList.add('no-achievements');
        noAchievementsMsg.textContent = 'No achievements yet. Keep playing!';
        achievementsList.appendChild(noAchievementsMsg);
        return;
    }
    gameState.unlockedAchievements.forEach(achId => {
        const achievement = achievements.find(a => a.id === achId);
        if (achievement) {
            const achItem = document.createElement('div');
            achItem.classList.add('achievement-item');
            achItem.innerHTML = `<strong>${achievement.name}</strong><span>${achievement.description}</span>`;
            achievementsList.appendChild(achItem);
        }
    });
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

    // Add a check for resources getting excessively high
    if (gameState.resources.piety >= 250 && gameState.resources.gold >= 250 && gameState.resources.papalAuthority >= 250) {
        gameOverMessage = "Your immense power and wealth have drawn the envy of all. Kings conspire against you, and the Church itself is seen as a secular empire, leading to universal revolt against your overwhelming authority.";
        gameOverTitle = "Overwhelmed by Power!";
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
    gameState.gameStarted = false; // Mark game as not in progress
    updateMainMenuButtons();
}

/**
 * Resets the game to its initial state.
 */
function resetGame() {
    // Reset all game state variables
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
        hasReformedChurch: false,
        hasSurvivedFirstDecade: false,
        hasHighPietyEver: false,
        hasMaxGoldEver: false,
        hasUsedAllAdvisors: false,
        // FIX: Ensure new advisor flags are reset
        usedCardinal: false,
        usedLord: false,
        usedAlchemist: false
    };
    gameState.turnCount = 0;
    gameState.advisorCooldowns = {
        cardinal: 0,
        lord: 0,
        alchemist: 0
    };
    gameState.currentCard = null;
    // Keep achievements unlocked between games if desired. Uncomment to clear:
    // gameState.unlockedAchievements = [];
    gameLog.innerHTML = '<p>Welcome to Habeus Papam!</p>'; // Clear and reset log

    gameModal.classList.add('hidden'); // Hide modal
    initGame(true); // Re-initialize the game, showing the main menu
}

// --- Achievement Logic ---
/**
 * Checks all achievements and unlocks any that meet their conditions.
 */
function checkAchievements() {
    achievements.forEach(ach => {
        if (!gameState.unlockedAchievements.includes(ach.id)) {
            if (ach.condition(gameState)) {
                gameState.unlockedAchievements.push(ach.id);
                if (ach.onUnlock) ach.onUnlock(gameState); // Run specific unlock logic
                updateAchievementDisplay();
            }
        }
    });
}

// --- Game Logic ---

/**
 * Applies the effects of a choice to the game state.
 * @param {object} effects - An object containing resource changes and flags.
 */
function applyEffects(effects) {
    if (effects) {
        for (const key in effects) {
            if (gameState.resources.hasOwnProperty(key)) {
                gameState.resources[key] = Math.max(0, gameState.resources[key] + effects[key]); // Ensure resources don't go below 0
            } else if (key === 'setFlag') {
                gameState.flags[effects[key]] = true;
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
            return; // If condition not met, skip choice
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
        if (card.outcomeLogic) { // Handle outcomes for major paths that don't end the game
            card.outcomeLogic(gameState);
        }
        addLog(`Major goal accomplished: ${card.title} requirements met!`);
        // Potentially remove this major card or replace with follow-up
        majorEventDeckPlaceholder.classList.add('hidden'); // Visual indication that a major path was triggered
        // Remove the triggered major card from future checks in advanceTurn
        majorEventCards.find(mc => mc.id === card.id).hasTriggered = true;
    }

    // After a choice, enable advance turn button and disable choices
    advanceTurnBtn.disabled = false;
    cardChoices.innerHTML = ''; // Clear choices
    cardTitle.textContent = 'Decision Made';
    cardDescription.textContent = 'Advance the turn to continue.';

    checkAchievements(); // Check achievements after every choice
    // Check for game over after effects are applied
    if (checkGameOver()) {
        return;
    }
}


/**
 * Randomly draws a card from the available event cards.
 * @returns {object} The chosen event card.
 */
function drawEventCard() {
    // Basic drawing: exclude the current card, for variety
    const availableCards = eventCards.filter(card => card.id !== gameState.currentCard?.id);
    if (availableCards.length === 0) {
        return eventCards[Math.floor(Math.random() * eventCards.length)]; // Fallback
    }
    const randomIndex = Math.floor(Math.random() * availableCards.length);
    return availableCards[randomIndex];
}

/**
 * Handles the progression of a game turn.
 */
function advanceTurn() {
    if (!gameState.gameStarted) {
        addLog("Please start a new game from the main menu.");
        return;
    }
    gameState.turnCount++;
    gameState.currentYear++;
    yearDisplay.textContent = `Year: ${gameState.currentYear} AD`;
    addLog(`Turn ${gameState.turnCount}: Year ${gameState.currentYear} AD`);

    // Decrease advisor cooldowns
    for (const advisorId in gameState.advisorCooldowns) {
        if (gameState.advisorCooldowns[advisorId] > 0) {
            gameState.advisorCooldowns[advisorId]--;
        }
    }
    updateAdvisorButtonStates(); // Update button enable/disable

    // Apply minor passive effects or random events here if desired
    gameState.resources.stability = Math.max(0, gameState.resources.stability - 1); // Small stability decay
    gameState.resources.gold = Math.max(0, gameState.resources.gold - 2); // Small gold upkeep
    updateResourceDisplay();

    // Check for major path triggers
    let majorPathTriggered = false;
    for (const majorCard of majorEventCards) {
        // Check if card has already been triggered or its outcome logic completed
        if (majorCard.hasTriggered) continue;

        const prereqsMet = Object.keys(majorCard.prerequisites).every(key => {
            if (key === 'turnMin') {
                return gameState.turnCount >= majorCard.prerequisites[key];
            }
            return gameState.resources[key] >= majorCard.prerequisites[key];
        });

        if (prereqsMet) {
            displayCard(majorCard);
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

    checkAchievements(); // Check achievements after every turn
    // Check for game over after all turn effects
    if (checkGameOver()) {
        return;
    }
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

// --- Main Menu Functions ---
function showMainMenu() {
    mainMenu.classList.remove('hidden');
    // Ensure game container is hidden if it was visible
    const gameContainer = document.querySelector('.game-container');
    if (gameContainer) gameContainer.classList.add('hidden');
    updateMainMenuButtons();
}

function hideMainMenu() {
    mainMenu.classList.add('hidden');
    // Ensure game container is visible
    const gameContainer = document.querySelector('.game-container');
    if (gameContainer) gameContainer.classList.remove('hidden');
}

function updateMainMenuButtons() {
    if (gameState.gameStarted) {
        continueGameBtn.classList.remove('disabled');
        continueGameBtn.disabled = false;
    } else {
        continueGameBtn.classList.add('disabled');
        continueGameBtn.disabled = true;
    }
}

/**
 * Initialises the game state and displays the first card.
 * @param {boolean} showMenu - If true, shows the main menu initially.
 */
function initGame(showMenu = true) {
    if (showMenu) {
        showMainMenu();
        return; // Don't start game logic until 'Start New Game' is clicked
    }

    // If starting a new game, reset game state and hide menu
    hideMainMenu();
    gameState.gameStarted = true; // Mark game as in progress
    updateResourceDisplay();
    updateAdvisorButtonStates();
    updateAchievementDisplay(); // Initial display of achievements (might be empty)

    // Display the very first card on game start or reset
    displayCard(eventCards.find(card => card.id === 'initial_decree'));
    advanceTurnBtn.disabled = true; // Disable advance turn until initial choice is made
}


// --- Initialization Function (Executes after DOM is loaded) ---
document.addEventListener('DOMContentLoaded', () => {
    // Assign DOM elements AFTER the DOM is fully loaded
    yearDisplay = document.getElementById('current-year');
    pietyValue = document.getElementById('piety-value');
    goldValue = document.getElementById('gold-value');
    influenceValue = document.getElementById('influence-value');
    papalAuthorityValue = document.getElementById('papal-authority-value');
    stabilityValue = document.getElementById('stability-value');
    gameLog = document.getElementById('game-log');
    cardTitle = document.getElementById('card-title');
    cardDescription = document.getElementById('card-description');
    cardChoices = document.getElementById('card-choices');
    advanceTurnBtn = document.getElementById('advance-turn-btn');
    advisorButtons = document.querySelectorAll('.advisor-btn'); // Now correctly assigned here
    majorEventDeckPlaceholder = document.getElementById('major-event-deck-placeholder');
    gameModal = document.getElementById('game-modal');
    modalTitle = document.getElementById('modal-title');
    modalMessage = document.getElementById('modal-message');
    modalRestartBtn = document.getElementById('modal-restart-btn');

    // New DOM elements for Main Menu and Achievements
    mainMenuBtn = document.getElementById('main-menu-btn');
    mainMenu = document.getElementById('main-menu');
    startGameBtn = document.getElementById('start-game-btn');
    continueGameBtn = document.getElementById('continue-game-btn');
    viewAchievementsBtn = document.getElementById('view-achievements-btn');
    optionsBtn = document.getElementById('options-btn');
    exitGameBtn = document.getElementById('exit-game-btn');

    achievementsList = document.getElementById('achievements-list');


    // --- Event Listeners (Now attached after DOM elements are defined) ---
    if (advanceTurnBtn) advanceTurnBtn.addEventListener('click', advanceTurn);
    if (modalRestartBtn) modalRestartBtn.addEventListener('click', resetGame);
    if (mainMenuBtn) mainMenuBtn.addEventListener('click', showMainMenu);
    if (startGameBtn) startGameBtn.addEventListener('click', () => {
        if (gameState.gameStarted) {
            resetGame();
        } else {
            initGame(false);
        }
    });
    if (continueGameBtn) continueGameBtn.addEventListener('click', () => {
        if (gameState.gameStarted) {
            hideMainMenu();
        } else {
            addLog("No game in progress to continue. Start a New Game.");
        }
    });
    if (viewAchievementsBtn) viewAchievementsBtn.addEventListener('click', () => {
        hideMainMenu();
        addLog("Viewing Achievements.");
    });
    if (optionsBtn) optionsBtn.addEventListener('click', () => {
        addLog("Options not yet implemented.");
    });
    if (exitGameBtn) exitGameBtn.addEventListener('click', () => {
        addLog("Exiting game... (in a browser, this would close the tab/window)");
        // window.close(); // This might not work in all browsers due to security restrictions.
    });

    // Advisor buttons loop for event listeners
    // Ensure advisorButtons is a NodeList and not empty before iterating
    if (advisorButtons && advisorButtons.length > 0) {
        advisorButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                const advisorId = event.target.dataset.advisor;
                if (advisorId && !event.target.disabled) {
                    advisors[advisorId].ability(gameState);
                    gameState.advisorCooldowns[advisorId] = advisors[advisorId].cooldown; // Set cooldown

                    // Set the specific advisor usage flag (FIXED for advisor_master achievement)
                    if (advisorId === 'cardinal') gameState.flags.usedCardinal = true;
                    if (advisorId === 'lord') gameState.flags.usedLord = true;
                    if (advisorId === 'alchemist') gameState.flags.usedAlchemist = true;

                    updateAdvisorButtonStates();
                    updateResourceDisplay();
                    addLog(`You consulted ${advisors[advisorId].name}.`);

                    checkAchievements(); // Check achievements after advisor use

                    advanceTurn();
                }
            });
        });
    }

    // --- Initial Game Setup ---
    initGame(true); // Call initGame to display the main menu on page load
});
