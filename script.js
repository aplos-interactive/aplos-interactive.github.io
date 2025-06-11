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
    flags: { // NEW: Flags for tracking specific game conditions/paths
        hasSecuredNobleSupport: false,
        hasSecuredTheologicalValidation: false,
        hasReformedChurch: false,
        hasSurvivedFirstDecade: false, // For achievement
        hasHighPietyEver: false, // For achievement
        hasMaxGoldEver: false, // For achievement
        usedCardinal: false, // For advisor achievement
        usedLord: false, // For advisor achievement
        usedAlchemist: false, // For advisor achievement
        hasUsedAllAdvisors: false // For advisor achievement
    },
    turnCount: 0,
    advisorCooldowns: { // NEW: Cooldowns for advisors
        cardinal: 0,
        lord: 0,
        alchemist: 0
    },
    currentCard: null, // Stores the currently displayed event card
    unlockedAchievements: [], // Stores IDs of unlocked achievements
    gameStarted: false,
    // --- NEW DECK MANAGEMENT ---
    mainDeck: [], // Main pool of regular event cards
    discardPile: [], // Cards drawn from mainDeck go here
    majorDeck: [],   // Special, high-impact cards with prerequisites
    majorHand: null  // Holds the current major event card if one is active (multi-turn major events)
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
let advisorButtons; // NEW: Advisor buttons NodeList
let eventDeckPlaceholder; // NEW: Deck placeholder
let eventDeckCountDisplay; // NEW: Deck count display
let discardPilePlaceholder; // NEW: Discard pile placeholder
let discardPileCountDisplay; // NEW: Discard pile count display
let majorEventHandPlaceholder; // NEW: Major event hand placeholder
let gameModal;
let modalTitle;
let modalMessage;
let modalRestartBtn;
let mainMenu;
let startGameBtn;
let continueGameBtn;
let achievementsList; // NEW: Left panel achievements list

// --- Game Data: Event Cards (Expanded) ---
// Note: Each card must have a unique 'id'
const allEventCards = [
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
                text: 'Seek alliances with powerful kings to secure the Church\'s political political standing.',
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
// These are more complex, multi-stage events that might lead to win/loss conditions
// 'hasTriggered' property will be added dynamically once the card is drawn/initiated
const allMajorCards = [
    {
        id: 'new_roman_empire_quest',
        title: 'The Roman Dream Revived',
        description: 'The time is ripe! With immense spiritual authority, political sway, and a stable realm, you feel the divine mandate to re-establish the glory of a Holy Roman Empire under direct Papal guidance. But it requires two critical steps.',
        prerequisites: { // Conditions for this major card to appear
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
                condition: (state) => !state.flags.hasSecuredNobleSupport // Only show if not already done
            },
            {
                text: 'Secure Theological Validation: Convene a grand council to formally declare the Papal claim to Empire. (+30 Piety, +30 Papal Authority, -10 Stability)',
                effects: { piety: 30, papalAuthority: 30, stability: -10, setFlag: 'hasSecuredTheologicalValidation' },
                log: 'A grand council affirmed your claim to the Empire through divine right! Theological validation achieved.',
                condition: (state) => !state.flags.hasSecuredTheologicalValidation // Only show if not already done
            }
        ],
        completionCheck: (state) => state.flags.hasSecuredNobleSupport && state.flags.hasSecuredTheologicalValidation, // Win condition if both are met
        winCondition: {
            title: "A New Roman Empire!",
            message: "Under your divine leadership, the Holy Roman Empire is reborn, with the Papacy as its unassailable head! You have forged a new golden age. The history books will forever remember Pope [Your Name] as the unifier of Christendom and the restorer of Rome. You win!"
        }
    },
    {
        id: 'great_schism_path',
        title: 'The Great Schism',
        description: 'Years of theological and political disagreements between Rome and Constantinople have reached a breaking point. A definitive split seems inevitable unless drastic action is taken.',
        prerequisites: {
            piety: 80,
            papalAuthority: 80,
            stability: 50,
            influence: 60,
            turnMin: 20 // This card won't appear until turn 20
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
        outcomeLogic: (state) => { // Custom logic to run once the major card is "completed"
            if (state.flags.hasAssertedRomanPrimacy) {
                addLog('The Great Schism has officially occurred, with Rome asserting its dominance over the splintered East.');
            } else if (state.flags.hasSoughtReconciliation) {
                addLog('You have managed to avert the Great Schism, for now. Christian unity is preserved!');
            }
        }
    }
    // Add more major cards here as the game develops
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
        cooldown: 3 // Cooldown in turns
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
        condition: (state) => state.flags.usedCardinal && state.flags.usedLord && state.flags.usedAlchemist && !state.flags.hasUsedAllAdvisors,
        onUnlock: (state) => { state.flags.hasUsedAllAdvisors = true; addLog('Achievement Unlocked: Advisor Master!'); }
    }
    // Add more achievements here!
    /*
    {
        id: 'example_achieve',
        name: 'Example Achievement',
        description: 'Do something cool.',
        condition: (state) => state.resources.someResource >= 50 && !state.flags.someFlag,
        onUnlock: (state) => { state.flags.someFlag = true; addLog('Achievement Unlocked: Example!'); }
    }
    */
];


// --- Helper Functions ---

/**
 * Shuffles an array in place (Fisher-Yates algorithm).
 * @param {Array} array - The array to shuffle.
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

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
    gameLog.prepend(newLogEntry); // Add to top
    // Limit log length
    if (gameLog.children.length > 50) {
        gameLog.removeChild(gameLog.lastChild);
    }
}

/**
 * Updates the display of unlocked achievements.
 */
function updateAchievementDisplay() {
    achievementsList.innerHTML = '';
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
 * Updates the visual display of the decks and hand.
 */
function updateDeckDisplay() {
    eventDeckCountDisplay.textContent = gameState.mainDeck.length;
    discardPileCountDisplay.textContent = gameState.discardPile.length;

    if (gameState.majorHand) {
        majorEventHandPlaceholder.textContent = `Major Event: ${gameState.majorHand.title}`;
        // You might add a class here for visual flair: majorEventHandPlaceholder.classList.add('active-major-card');
    } else {
        majorEventHandPlaceholder.textContent = 'No Major Event in Hand';
        // majorEventHandPlaceholder.classList.remove('active-major-card');
    }
}


/**
 * Checks for game over conditions.
 * @returns {boolean} True if game is over.
 */
function checkGameOver() {
    let gameOverMessage = '';
    let gameOverTitle = 'Game Over!';

    // Loss Conditions
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
    // Example "Too Powerful" Loss Condition
    else if (gameState.resources.piety >= 250 && gameState.resources.gold >= 250 && gameState.resources.papalAuthority >= 250) {
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
    advanceTurnBtn.disabled = true;
    cardChoices.innerHTML = ''; // Clear choices
    advisorButtons.forEach(btn => btn.disabled = true); // Disable advisors
    gameState.gameStarted = false; // Prevent further turns
    updateMainMenuButtons(); // Update main menu buttons
    addLog(`Game Over: ${title}`);
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
    gameState.flags = { // Reset all flags
        hasSecuredNobleSupport: false,
        hasSecuredTheologicalValidation: false,
        hasReformedChurch: false,
        hasSurvivedFirstDecade: false,
        hasHighPietyEver: false,
        hasMaxGoldEver: false,
        usedCardinal: false,
        usedLord: false,
        usedAlchemist: false,
        hasUsedAllAdvisors: false
    };
    gameState.turnCount = 0;
    gameState.advisorCooldowns = { // Reset cooldowns
        cardinal: 0,
        lord: 0,
        alchemist: 0
    };
    gameState.currentCard = null;
    gameState.unlockedAchievements = []; // Clear achievements for a new game
    gameLog.innerHTML = '<p>Welcome to Habeus Papam!</p>'; // Clear log

    // --- DECK RESET ---
    gameState.mainDeck = [];
    gameState.discardPile = [];
    gameState.majorDeck = [];
    gameState.majorHand = null;

    // Re-populate and shuffle decks
    setupDecks();

    gameModal.classList.add('hidden'); // Hide game over modal
    initGame(true); // Re-initialize, showing the main menu
}

// --- Achievement Logic ---
/**
 * Checks all achievements and unlocks any that meet their conditions.
 */
function checkAchievements() {
    achievements.forEach(ach => {
        if (!gameState.unlockedAchievements.includes(ach.id)) { // Only check if not already unlocked
            if (ach.condition(gameState)) {
                gameState.unlockedAchievements.push(ach.id);
                if (ach.onUnlock) ach.onUnlock(gameState); // Run onUnlock logic
                updateAchievementDisplay(); // Update display immediately
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
                // Ensure resources don't go below 0 (unless specifically designed for that)
                gameState.resources[key] = Math.max(0, gameState.resources[key] + effects[key]);
            } else if (key === 'setFlag') {
                gameState.flags[effects[key]] = true; // Set a flag to true
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
    gameState.currentCard = card; // Store the current card in state
    cardTitle.textContent = card.title;
    cardDescription.textContent = card.description;
    cardChoices.innerHTML = ''; // Clear previous choices

    card.choices.forEach((choice, index) => {
        // NEW: Allow choices to have conditions
        if (choice.condition && !choice.condition(gameState)) {
            return; // Skip this choice if condition not met
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
    // Find the card, either from main events or major events
    const card = allEventCards.find(c => c.id === cardId) || allMajorCards.find(c => c.id === cardId);
    if (!card) {
        console.error('Card not found:', cardId);
        return;
    }

    const choice = card.choices[choiceIndex];
    if (!choice) {
        console.error('Choice not found for card:', cardId, 'index:', choiceIndex);
        return;
    }

    addLog(choice.log);
    applyEffects(choice.effects);

    // If it was a major card, handle its completion logic and remove from hand
    if (gameState.majorHand && gameState.majorHand.id === card.id) {
        // Check if all prerequisites for this major card's 'completion' are met
        if (card.completionCheck && card.completionCheck(gameState)) {
            if (card.winCondition) { // Check for a win condition
                endGame(card.winCondition.title, card.winCondition.message);
                return; // Stop game flow if won
            }
            if (card.outcomeLogic) { // Run any custom outcome logic for the major card
                card.outcomeLogic(gameState);
            }
            addLog(`Major goal accomplished: ${card.title} requirements met!`);
            // Mark major card as triggered/resolved so it doesn't appear again
            allMajorCards.find(mc => mc.id === card.id).hasTriggered = true;
        }
        // If not completed, it stays in hand for the next turn.
        // If completed, remove it from hand.
        if (card.completionCheck && card.completionCheck(gameState)) {
             gameState.majorHand = null; // Remove from hand if goal completed
        }
        updateDeckDisplay(); // Update visual immediately
    } else {
        // If it's a regular card, move it to the discard pile
        gameState.discardPile.push(gameState.currentCard);
    }


    advanceTurnBtn.disabled = false; // Re-enable advance turn button
    cardChoices.innerHTML = ''; // Clear choices after selection
    cardTitle.textContent = 'Decision Made';
    cardDescription.textContent = 'Advance the turn to continue.';

    checkAchievements(); // Check for new achievements after every choice
    if (checkGameOver()) { // Check for game over after every choice
        return;
    }
}

/**
 * Draws a card from the main deck or reshuffles if empty.
 * @returns {object|null} The drawn card, or null if no cards.
 */
function drawEventCard() {
    if (gameState.mainDeck.length === 0) {
        if (gameState.discardPile.length > 0) {
            addLog("Main event deck empty. Reshuffling discard pile.");
            gameState.mainDeck = [...gameState.discardPile]; // Move all from discard to main
            gameState.discardPile = []; // Clear discard
            shuffleArray(gameState.mainDeck); // Shuffle new main deck
        } else {
            addLog("No more event cards to draw!");
            return null; // No cards left at all
        }
    }
    return gameState.mainDeck.pop(); // Draw from the top
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
    updateAdvisorButtonStates(); // Update advisor buttons visibility/text

    // Apply minor passive effects or random events here
    gameState.resources.stability = Math.max(0, gameState.resources.stability - 1); // Slight stability decay
    gameState.resources.gold = Math.max(0, gameState.resources.gold - 2); // Gold upkeep
    updateResourceDisplay();

    // --- DECK LOGIC FOR DRAWING CARDS ---
    let cardToDisplay = null;

    // 1. Check if a major card is currently in hand and needs to be resolved
    if (gameState.majorHand) {
        cardToDisplay = gameState.majorHand;
        addLog(`Continuing Major Event: ${cardToDisplay.title}`);
    } else {
        // 2. Check for new major path triggers from majorDeck
        // Filter out cards already triggered or whose prerequisites aren't met
        const eligibleMajorCards = gameState.majorDeck.filter(majorCard => {
            // Check if card has already been handled (e.g., via win condition or outcomeLogic)
            if (majorCard.hasTriggered) return false;

            const prereqsMet = Object.keys(majorCard.prerequisites).every(key => {
                if (key === 'turnMin') { // Special check for minimum turn number
                    return gameState.turnCount >= majorCard.prerequisites[key];
                }
                return gameState.resources[key] >= majorCard.prerequisites[key];
            });
            return prereqsMet;
        });

        if (eligibleMajorCards.length > 0) {
            // If multiple major cards are eligible, pick one randomly (or based on priority if implemented)
            cardToDisplay = eligibleMajorCards[Math.floor(Math.random() * eligibleMajorCards.length)];
            gameState.majorHand = cardToDisplay; // Move to hand
            // Remove from majorDeck so it's not considered again until resolved
            gameState.majorDeck = gameState.majorDeck.filter(card => card.id !== cardToDisplay.id);
            addLog(`A major historical path has opened: "${cardToDisplay.title}"!`);
        } else {
            // 3. If no major card triggered or in hand, draw from mainDeck
            cardToDisplay = drawEventCard();
        }
    }


    if (cardToDisplay) {
        displayCard(cardToDisplay);
    } else {
        addLog("No more cards to draw. Game might be stagnant or awaiting specific conditions.");
        // Potentially handle this as a soft "end game" or victory condition if all major paths are done
        cardTitle.textContent = "Peace reigns (for now)";
        cardDescription.textContent = "The decks are empty. You have guided the Papacy through many trials. What comes next?";
        cardChoices.innerHTML = ''; // No choices for empty deck
        advanceTurnBtn.disabled = true; // No more turns if no cards
    }

    updateDeckDisplay(); // Update deck counts after draw
    advanceTurnBtn.disabled = true; // Disable until a choice is made

    checkAchievements(); // Check for achievements after each turn
    if (checkGameOver()) {
        return; // Stop if game is over
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

/**
 * Hides the main menu and initializes the game UI.
 */
function hideMainMenu() {
    mainMenu.classList.add('hidden');
    document.querySelector('.game-container').classList.remove('hidden');
}

/**
 * Shows the main menu and hides the game UI.
 */
function showMainMenu() {
    mainMenu.classList.remove('hidden');
    document.querySelector('.game-container').classList.add('hidden');
}

/**
 * Updates the disabled state of the continue game button.
 */
function updateMainMenuButtons() {
    if (gameState.gameStarted) { // Only enable continue if a game is in progress
        continueGameBtn.classList.remove('disabled');
        continueGameBtn.disabled = false;
    } else {
        continueGameBtn.classList.add('disabled');
        continueGameBtn.disabled = true;
    }
}

/**
 * Sets up the initial game decks (main and major).
 */
function setupDecks() {
    // Clone all event cards for the main deck, excluding the initial one
    gameState.mainDeck = [...allEventCards.filter(card => card.id !== 'initial_decree')];
    shuffleArray(gameState.mainDeck);
    gameState.discardPile = []; // Ensure discard pile is empty

    // Clone all major cards for the major deck
    gameState.majorDeck = [...allMajorCards];
    shuffleArray(gameState.majorDeck); // Shuffle major deck too
    gameState.majorHand = null; // No major card in hand at start

    updateDeckDisplay(); // Update UI immediately
}

/**
 * Initialises the game state and displays the first card.
 * @param {boolean} showMenu - If true, shows the main menu initially.
 */
function initGame(showMenu = true) {
    if (showMenu) {
        showMainMenu();
        updateMainMenuButtons(); // Ensure continue button state is correct
        return;
    }

    hideMainMenu();
    gameState.gameStarted = true;
    updateResourceDisplay();
    updateAdvisorButtonStates();
    updateAchievementDisplay(); // Populate achievements list

    // Set up decks only if starting a NEW game, not continuing from a saved one
    if (gameState.turnCount === 0 && !gameState.currentCard) { // This implies a fresh start
        setupDecks();
        // Set the initial card here (it's not in the main deck)
        gameState.currentCard = allEventCards.find(card => card.id === 'initial_decree');
    }

    displayCard(gameState.currentCard); // Display initial card
    advanceTurnBtn.disabled = true; // Disable until initial choice is made
    updateDeckDisplay(); // Ensure deck counts are correct after init
}


// --- Initialization Function (Executes after DOM is loaded) ---
document.addEventListener('DOMContentLoaded', () => {
    // Assign DOM elements
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
    advisorButtons = document.querySelectorAll('.advisor-btn'); // Select all advisor buttons

    eventDeckPlaceholder = document.getElementById('event-deck-placeholder');
    eventDeckCountDisplay = document.getElementById('event-deck-count');
    discardPilePlaceholder = document.getElementById('discard-pile-placeholder');
    discardPileCountDisplay = document.getElementById('discard-pile-count');
    majorEventHandPlaceholder = document.getElementById('major-event-hand-placeholder');

    gameModal = document.getElementById('game-modal');
    modalTitle = document.getElementById('modal-title');
    modalMessage = document.getElementById('modal-message');
    modalRestartBtn = document.getElementById('modal-restart-btn');

    mainMenu = document.getElementById('main-menu');
    startGameBtn = document.getElementById('start-game-btn');
    continueGameBtn = document.getElementById('continue-game-btn');
    achievementsList = document.getElementById('achievements-list'); // Get the achievements list element

    // --- Event Listeners ---
    if (advanceTurnBtn) advanceTurnBtn.addEventListener('click', advanceTurn);
    if (modalRestartBtn) modalRestartBtn.addEventListener('click', resetGame);

    // Main Menu Event Listeners
    if (document.getElementById('main-menu-btn')) document.getElementById('main-menu-btn').addEventListener('click', showMainMenu);
    if (startGameBtn) startGameBtn.addEventListener('click', () => {
        resetGame(); // Always reset on new game start
    });
    if (continueGameBtn) continueGameBtn.addEventListener('click', () => {
        if (gameState.gameStarted) { // Only allow continuing if a game is already in progress
            hideMainMenu();
        } else {
            addLog("No game in progress to continue. Start a New Game.");
        }
    });
    if (document.getElementById('view-achievements-btn')) document.getElementById('view-achievements-btn').addEventListener('click', () => {
        addLog("Achievements viewer not implemented yet."); // Placeholder
    });
    if (document.getElementById('options-btn')) document.getElementById('options-btn').addEventListener('click', () => {
        addLog("Options menu not implemented yet."); // Placeholder
    });
    if (document.getElementById('exit-game-btn')) document.getElementById('exit-game-btn').addEventListener('click', () => {
        if (confirm("Are you sure you want to exit? Your unsaved progress will be lost.")) {
             window.close(); // Note: Browser security might prevent this in some cases.
        }
    });

    // Top Bar Menu Option Listeners (placeholders for now)
    if (document.getElementById('library-btn')) document.getElementById('library-btn').addEventListener('click', () => addLog("Library not implemented yet."));
    if (document.getElementById('save-load-btn')) document.getElementById('save-load-btn').addEventListener('click', () => addLog("Save/Load not implemented yet."));
    if (document.getElementById('options-top-btn')) document.getElementById('options-top-btn').addEventListener('click', () => addLog("Options not implemented yet."));
    if (document.getElementById('exit-top-btn')) document.getElementById('exit-top-btn').addEventListener('click', () => {
        if (confirm("Are you sure you want to exit? Your unsaved progress will be lost.")) {
             window.close();
        }
    });


    // Advisor buttons loop
    if (advisorButtons && advisorButtons.length > 0) {
        advisorButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                const advisorId = event.target.dataset.advisor;
                if (advisorId && !event.target.disabled) { // Check if button is not disabled
                    advisors[advisorId].ability(gameState);
                    gameState.advisorCooldowns[advisorId] = advisors[advisorId].cooldown; // Set cooldown
                    // Set flags for achievement
                    if (advisorId === 'cardinal') gameState.flags.usedCardinal = true;
                    if (advisorId === 'lord') gameState.flags.usedLord = true;
                    if (advisorId === 'alchemist') gameState.flags.usedAlchemist = true;
                    updateAdvisorButtonStates(); // Update advisor buttons immediately
                    updateResourceDisplay(); // Update resource display
                    addLog(`You consulted ${advisors[advisorId].name}.`);
                    checkAchievements(); // Check for achievements after advisor use
                    // Optional: Advancing turn after advisor use can be a design choice.
                    // For now, let's keep it separate from the main card advance logic.
                    // If you want advisor use to consume a turn, call advanceTurn(); here
                }
            });
        });
    }

    // --- Initial Game Setup ---
    initGame(true); // Call initGame to display the main menu on page load
});
