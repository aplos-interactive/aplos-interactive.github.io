// --- Game State Object ---
const gameState = {
    year: 1000,
    resources: {
        piety: 500,
        gold: 200,
        influence: 150,
        papalAuthority: 100,
        stability: 75
    },
    gameLog: [], // Stores recent game events
    flags: new Set(), // Stores various game flags (e.g., "Crusade_Launched")

    mainEventDeck: [], // Array of card objects
    discardPile: [],
    majorEventDeck: [], // IDs of major events that have already been *resolved* or *declined*
    majorEventHand: [], // Active major event objects (can have properties like turnsActive)

    advisors: {
        cardinal: { name: "Cardinal", cooldown: 0, maxCooldown: 3, description: "Boosts Piety." },
        lord: { name: "Lord", cooldown: 0, maxCooldown: 4, description: "Boosts Influence." },
        alchemist: { name: "Alchemist", cooldown: 0, maxCooldown: 5, description: "Provides Gold but might have other effects." }
    },
    achievements: new Set(), // Stores IDs of unlocked achievement
    turnCount: 0, // Tracks total turns for some achievements/events

    isGameStarted: false,
    isGameOver: false,
    gameOverReason: "",
};

// --- UI Elements (Caching DOM references) ---
const ui = {
    currentYear: document.getElementById('current-year'),
    resourcePiety: document.getElementById('resource-piety'),
    resourceGold: document.getElementById('resource-gold'),
    resourceInfluence: document.getElementById('resource-influence'),
    resourcePapalAuthority: document.getElementById('resource-papal-authority'),
    resourceStability: document.getElementById('resource-stability'),
    gameLogEntries: document.getElementById('game-log-entries'),
    achievementListPanel: document.getElementById('achievement-list-panel'), // For limited view on left panel
    viewAllAchievementsBtn: document.getElementById('view-all-achievements-btn'),

    eventTitle: document.getElementById('event-title'),
    eventDescription: document.getElementById('event-description'),
    eventChoices: document.getElementById('event-choices'),
    startGameButton: document.getElementById('start-game-button'), // Specific start game button

    majorEventActiveDisplay: document.getElementById('major-event-active-display'),
    activeMajorEventTitle: document.getElementById('active-major-event-title'),
    activeMajorEventDescription: document.getElementById('active-major-event-description'),
    activeMajorEventChoices: document.getElementById('active-major-event-choices'),

    advisorButtons: {
        cardinal: document.querySelector('.advisor-button[data-advisor="cardinal"]'),
        lord: document.querySelector('.advisor-button[data-advisor="lord"]'),
        alchemist: document.querySelector('.advisor-button[data-advisor="alchemist"]'),
    },

    mainDeckCount: document.getElementById('main-deck-count'),
    discardPileCount: document.getElementById('discard-pile-count'),
    majorEventHandCount: document.getElementById('major-event-hand-count'),

    // Modals
    mainMenuModal: document.getElementById('main-menu-modal'),
    gameOverModal: document.getElementById('game-over-modal'),
    gameOverTitle: document.getElementById('game-over-title'),
    gameOverReason: document.getElementById('game-over-reason'),
    achievementsModal: document.getElementById('achievements-modal'),
    achievementsModalList: document.getElementById('achievements-modal-list'),

    // Modal Buttons
    restartGameBtn: document.getElementById('restart-game-btn'),
    modalNewGameBtn: document.getElementById('modal-new-game-btn'),
    modalContinueGameBtn: document.getElementById('modal-continue-game-btn'), // Load last save
    modalAchievementsBtn: document.getElementById('modal-achievements-btn'),
    modalOptionsBtn: document.getElementById('modal-options-btn'),
    modalExitBtn: document.getElementById('modal-exit-btn'),
    closeModalBtns: document.querySelectorAll('.close-modal-btn'), // For all close buttons

    // Top Bar Buttons
    mainMenuTopBtn: document.getElementById('main-menu-btn'),
    saveGameBtn: document.getElementById('save-game-btn'),
    loadGameBtn: document.getElementById('load-game-btn'),
};

// --- Game Content Data ---

// Event Cards (main deck)
const eventCards = [
    {
        id: "intro_event",
        title: "A New Reign Begins",
        description: "As the newly elected Pope, your first task is to establish your presence. Will you focus on spiritual matters or immediate temporal needs?",
        choices: [
            {
                text: "Focus on spiritual guidance (+20 Piety, -5 Gold)",
                effects: { piety: 20, gold: -5 },
                flags: ["spiritual_focus"]
            },
            {
                text: "Secure the Papal coffers (+15 Gold, +5 Papal Authority, -5 Piety)",
                effects: { gold: 15, papalAuthority: 5, piety: -5 },
                flags: ["temporal_focus"]
            }
        ],
        type: "main"
    },
    {
        id: "church_renovation",
        title: "Church Renovation",
        description: "An old, revered church in Rome requires significant repairs. Undertaking this project would boost your piety and stability, but at a cost.",
        choices: [
            {
                text: "Invest heavily in renovations (-20 Gold, +30 Piety, +10 Stability)",
                effects: { gold: -20, piety: 30, stability: 10 },
                flags: ["church_renovated"],
                conditions: { resources: { gold: 20 } }
            },
            {
                text: "Delay repairs, save gold (+5 Gold, -5 Piety)",
                effects: { gold: 5, piety: -5 },
                flags: ["church_neglected"]
            }
        ],
        type: "main"
    },
    {
        id: "feudal_dispute",
        title: "Feudal Lord Dispute",
        description: "Two powerful lords in your territory are feuding, disrupting trade and stability. You must intervene to maintain order.",
        choices: [
            {
                text: "Mediating a peaceful resolution (+15 Influence, +10 Stability, -5 Gold)",
                effects: { influence: 15, stability: 10, gold: -5 },
                flags: ["peace_negotiated"]
            },
            {
                text: "Support one lord over the other (+25 Influence, -15 Stability, -10 Piety)",
                effects: { influence: 25, stability: -15, piety: -10 },
                flags: ["supported_feudal_lord"]
            },
            {
                text: "Send Papal Legates to enforce peace (Requires high Papal Authority)",
                effects: { papalAuthority: -10, stability: 20, influence: 5 },
                flags: ["papal_enforcement"],
                conditions: { resources: { papalAuthority: 80 } }
            }
        ],
        type: "main"
    },
    {
        id: "heresy_inquiry",
        title: "Whispers of Heresy",
        description: "Reports arrive of a growing heresy in a northern diocese, challenging Church doctrine. How will you respond?",
        choices: [
            {
                text: "Dispatch inquisitors to root out heresy (-10 Gold, +20 Piety, +10 Papal Authority)",
                effects: { gold: -10, piety: 20, papalAuthority: 10 },
                flags: ["inquisition_begun"]
            },
            {
                text: "Send a diplomatic mission to re-educate them (+10 Piety, -5 Gold, +5 Influence)",
                effects: { piety: 10, gold: -5, influence: 5 }
            },
            {
                text: "Ignore it for now (-15 Piety, -5 Stability)",
                effects: { piety: -15, stability: -5 },
                flags: ["heresy_ignored"]
            }
        ],
        type: "main"
    },
    {
        id: "schism_threat",
        title: "Threat of Eastern Schism",
        description: "Tensions with the Eastern Church are at an all-time high. A misstep could lead to a permanent schism.",
        choices: [
            {
                text: "Send an olive branch, emphasizing unity (+10 Piety, +5 Influence, -5 Papal Authority)",
                effects: { piety: 10, influence: 5, papalAuthority: -5 },
                flags: ["attempted_unity"]
            },
            {
                text: "Reassert Papal Supremacy (-10 Piety, +15 Papal Authority, -10 Influence)",
                effects: { piety: -10, papalAuthority: 15, influence: -10 },
                flags: ["asserted_supremacy"]
            },
            {
                text: "Consult Cardinal (Requires Cardinal Advisor ready)",
                effects: { piety: 30, gold: -10 },
                flags: ["cardinal_consulted_schism"],
                conditions: { advisorReady: "cardinal" }
            }
        ],
        type: "main"
    },
    {
        id: "black_death_precursor",
        title: "Unusual Illnesses",
        description: "Reports of a strange, virulent illness are emerging from the East. It causes rapid death and fear spreads.",
        choices: [
            {
                text: "Issue Papal prayers and call for fasting (+10 Piety, +5 Stability)",
                effects: { piety: 10, stability: 5 },
                flags: ["prayers_for_illness"]
            },
            {
                text: "Dispatch physicians and alchemists to study the plague (Requires Alchemist Advisor ready)",
                effects: { gold: -20, stability: 15, influence: 5 },
                flags: ["plague_studied"],
                conditions: { advisorReady: "alchemist" }
            },
            {
                text: "Close borders to infected regions (Risks Stability)",
                effects: { stability: -5, gold: -5, piety: 5 },
                flags: ["borders_closed"]
            }
        ],
        type: "main"
    },
    {
        id: "found_university",
        title: "Establishing a University",
        description: "A scholar proposes establishing a new university. This could boost learning and papal prestige, but it is expensive.",
        choices: [
            {
                text: "Fund the university generously (-30 Gold, +10 Piety, +10 Influence)",
                effects: { gold: -30, piety: 10, influence: 10 },
                flags: ["university_founded_generously"],
                conditions: { resources: { gold: 30 } }
            },
            {
                text: "Offer meager support, seeking other patrons (-10 Gold, +5 Piety)",
                effects: { gold: -10, piety: 5 },
                flags: ["university_founded_meagerly"]
            },
             {
                text: "Decline to fund it (No cost, -5 Influence)",
                effects: { influence: -5 },
                flags: ["university_declined"]
            }
        ],
        type: "main"
    },
    {
        id: "papal_library",
        title: "Expand the Papal Library",
        description: "A vast collection of ancient texts awaits transcription and study. Expanding the Papal Library would be a monumental spiritual and intellectual undertaking.",
        choices: [
            {
                text: "Invest heavily in transcribing and collecting scrolls (-25 Gold, +20 Piety)",
                effects: { gold: -25, piety: 20 },
                flags: ["library_expanded_large"],
                conditions: { resources: { gold: 25 } }
            },
            {
                text: "Fund a modest expansion (-10 Gold, +10 Piety)",
                effects: { gold: -10, piety: 10 },
                flags: ["library_expanded_small"],
                conditions: { resources: { gold: 10 } }
            }
        ],
        type: "main"
    }
    // Add more regular event cards here!
];

// Major Event Data
const majorEvents = [
    {
        id: "first_crusade_prompt",
        title: "The Call to Crusade!",
        description: "Reports of atrocities against pilgrims in the Holy Land and the persecution of Christians by Seljuk Turks reach Rome. There is a growing clamor across Christendom for action. Will you answer the call?",
        prerequisites: {
            minYear: 1050,
            minPiety: 120,
            minInfluence: 100,
            requiredFlags: ["spiritual_focus"]
        },
        type: "major",
        initialChoice: {
            text: "Launch the First Crusade! (-50 Gold, -20 Piety, +30 Papal Authority, +40 Influence, -10 Stability)",
            effects: { gold: -50, piety: -20, papalAuthority: 30, influence: 40, stability: -10 },
            flags: ["crusade_launched_prompt"],
            nextEventId: "first_crusade_active"
        },
        failureChoice: {
             text: "Decline to call a Crusade (-50 Piety, -30 Influence, -10 Stability)",
             effects: { piety: -50, influence: -30, stability: -10 },
             flags: ["crusade_declined"]
        }
    },
    {
        id: "first_crusade_active",
        title: "The First Crusade: Onward to Jerusalem!",
        description: "Armies of Christendom march towards the Holy Land. This long and arduous journey will test the faith and resolve of your leadership. You must decide how to support them and manage the Papacy at home. (Lasts 5 turns)",
        type: "active_major",
        activeChoices: [
            {
                text: "Send Papal funds to support the crusader armies (-30 Gold, +10 Piety)",
                effects: { gold: -30, piety: 10 },
                flags: ["crusade_funded_instance"] // Unique flag for this instance of funding
            },
            {
                text: "Call for more spiritual devotion at home (+15 Piety, -5 Gold)",
                effects: { piety: 15, gold: -5 }
            },
            {
                text: "Demand tribute from Italian cities for the war effort (+20 Gold, -10 Influence) (Requires high Papal Authority)",
                effects: { gold: 20, influence: -10 },
                conditions: { resources: { papalAuthority: 60 } }
            }
        ],
        resolutionConditions: {
            minTurnsActive: 5, // Must be active for at least 5 turns
            fundingTimes: 2 // Must have funded the crusade at least 2 times
        },
        // We'll calculate success/failure dynamically in resolveMajorEvent
        resolutionEffects: {
            success: {
                title: "Crusade Victorious!",
                description: "Jerusalem has fallen! The Holy Land is reclaimed under Christian rule. Your Piety, Influence, and Papal Authority soar!",
                effects: { piety: 100, influence: 80, papalAuthority: 50, gold: 20, stability: 30 },
                flags: ["jerusalem_reclaimed", "crusade_victory"]
            },
            failure: {
                title: "Crusade Failed!",
                description: "The Crusade falters and fails to reach its objectives. A dark cloud hangs over Christendom. Your authority is questioned.",
                effects: { piety: -70, influence: -60, papalAuthority: -40, gold: -30, stability: -20 },
                flags: ["crusade_failure"]
            }
        }
    },
    {
        id: "papal_supremacy_prompt",
        title: "Challenge to Papal Supremacy",
        description: "A powerful Emperor or King challenges the Pope's authority over appointments of bishops and other Church matters. This conflict could define your legacy.",
        prerequisites: {
            minYear: 1075,
            minPapalAuthority: 150,
            forbiddenFlags: ["crusade_active"] // Don't trigger during a crusade
        },
        type: "major",
        initialChoice: {
            text: "Assert Papal Supremacy! (High risk, high reward)",
            effects: { papalAuthority: 50, influence: -20, stability: -10 },
            flags: ["supremacy_asserted_prompt"],
            nextEventId: "investiture_controversy_active"
        },
        failureChoice: {
            text: "Seek compromise (-30 Papal Authority, +10 Influence, +10 Stability)",
            effects: { papalAuthority: -30, influence: 10, stability: 10 },
            flags: ["supremacy_compromised"]
        }
    },
    {
        id: "investiture_controversy_active",
        title: "The Investiture Controversy Rages",
        description: "Your assertion of Papal authority has sparked a major conflict with secular powers. This will be a protracted struggle. (Lasts 4 turns)",
        type: "active_major",
        activeChoices: [
            {
                text: "Excommunicate the challenging ruler (-20 Influence, +30 Piety, +20 Papal Authority)",
                effects: { influence: -20, piety: 30, papalAuthority: 20 },
                flags: ["ruler_excommunicated"]
            },
            {
                text: "Call upon loyal nobles for support (-15 Gold, +20 Influence, -10 Stability)",
                effects: { gold: -15, influence: 20, stability: -10 },
                conditions: { advisorReady: "lord" } // Example: Lord advisor can help here
            },
            {
                text: "Issue a new Papal Bull reinforcing doctrines (+10 Piety, +10 Papal Authority)",
                effects: { piety: 10, papalAuthority: 10 }
            }
        ],
        resolutionConditions: {
            minTurnsActive: 4,
            requiredFlags: ["ruler_excommunicated"]
        },
        resolutionEffects: {
            success: {
                title: "Papal Authority Triumphs!",
                description: "Through your unwavering resolve, the challenging ruler submits, solidifying Papal supremacy for generations.",
                effects: { papalAuthority: 80, influence: 30, piety: 40, gold: 10, stability: 20 },
                flags: ["papal_supremacy_secured"]
            },
            failure: {
                title: "Compromise Forced!",
                description: "The conflict drags on, forcing a compromise that weakens Papal authority in the long run.",
                effects: { papalAuthority: -50, influence: -20, piety: -30, stability: -10 },
                flags: ["papal_supremacy_weakened"]
            }
        }
    }
];

// --- Achievement Data ---
const achievements = {
    "first_blood": {
        name: "First Blood",
        description: "Survive 5 years as Pope.",
        check: () => gameState.year >= 1005
    },
    "long_reign": {
        name: "Long Reign",
        description: "Survive 25 years as Pope.",
        check: () => gameState.year >= 1025
    },
    "pious_pontiff": {
        name: "Pious Pontiff",
        description: "Reach 600 Piety.",
        check: () => gameState.resources.piety >= 600
    },
    "golden_age": {
        name: "Golden Age",
        description: "Amass 300 Gold.",
        check: () => gameState.resources.gold >= 300
    },
    "master_diplomat": {
        name: "Master Diplomat",
        description: "Reach 200 Influence.",
        check: () => gameState.resources.influence >= 200
    },
    "iron_fist": {
        name: "Iron Fist",
        description: "Reach 150 Papal Authority.",
        check: () => gameState.resources.papalAuthority >= 150
    },
    "rock_of_st_peter": {
        name: "Rock of St. Peter",
        description: "Maintain 90 Stability.",
        check: () => gameState.resources.stability >= 90
    },
    "spiritual_guide": {
        name: "Spiritual Guide",
        description: "Successfully complete a spiritual-focused event (e.g., inquisition, church renovation).",
        check: () => gameState.flags.has("inquisition_begun") || gameState.flags.has("church_renovated") || gameState.flags.has("library_expanded_large")
    },
    "crusader_king_maker": {
        name: "Crusader King-Maker",
        description: "Successfully launch and complete the First Crusade.",
        check: () => gameState.flags.has("crusade_victory")
    },
    "decline_crusade": {
        name: "Peacemaker (or Coward?)",
        description: "Decline to call the First Crusade.",
        check: () => gameState.flags.has("crusade_declined")
    }
    // Add more achievements here!
};

// --- Core Game Functions ---

/**
 * Updates the UI elements to reflect the current game state.
 */
function updateUI() {
    ui.currentYear.textContent = `${gameState.year} AD`;

    // Update resources
    ui.resourcePiety.textContent = gameState.resources.piety;
    ui.resourceGold.textContent = gameState.resources.gold;
    ui.resourceInfluence.textContent = gameState.resources.influence;
    ui.resourcePapalAuthority.textContent = gameState.resources.papalAuthority;
    ui.resourceStability.textContent = gameState.resources.stability;

    // Update game log (display newest first)
    ui.gameLogEntries.innerHTML = '';
    gameState.gameLog.slice().reverse().forEach(entry => {
        const p = document.createElement('p');
        p.textContent = entry;
        ui.gameLogEntries.appendChild(p);
    });

    // Update advisor button states and cooldowns
    for (const advisorKey in gameState.advisors) {
        const advisor = gameState.advisors[advisorKey];
        const button = ui.advisorButtons[advisorKey];
        if (button) {
            if (advisor.cooldown > 0) {
                button.textContent = `${advisor.name} (${advisor.cooldown})`;
                button.classList.add('on-cooldown');
                button.disabled = true;
            } else {
                button.textContent = `${advisor.name} (Ready)`;
                button.classList.remove('on-cooldown');
                button.disabled = false;
            }
        }
    }

    // Update deck counts
    ui.mainDeckCount.textContent = gameState.mainEventDeck.length;
    ui.discardPileCount.textContent = gameState.discardPile.length;
    ui.majorEventHandCount.textContent = gameState.majorEventHand.length;

    // Show/hide major event active display
    if (gameState.majorEventHand.length > 0) {
        ui.majorEventActiveDisplay.style.display = 'block';
        ui.eventCard.style.display = 'none'; // Hide regular event card
    } else {
        ui.majorEventActiveDisplay.style.display = 'none';
        ui.eventCard.style.display = 'block'; // Show regular event card
    }

    // Update achievements on the left panel (limited view)
    ui.achievementListPanel.innerHTML = '';
    let displayedAchievements = 0;
    for (const achievementId of gameState.achievements) {
        if (displayedAchievements < 3) { // Show max 3 recent achievements
            const li = document.createElement('li');
            li.textContent = achievements[achievementId].name;
            ui.achievementListPanel.appendChild(li);
            displayedAchievements++;
        } else {
            break;
        }
    }
     if (gameState.achievements.size > 0 && displayedAchievements === 0) {
        // This case should ideally not happen if achievements are always populated
        const li = document.createElement('li');
        li.textContent = "No achievements displayed...";
        ui.achievementListPanel.appendChild(li);
    }
    ui.viewAllAchievementsBtn.style.display = gameState.achievements.size > 0 ? 'block' : 'none';

}

/**
 * Adds an entry to the game log and updates the UI.
 * @param {string} entry - The text to add to the log.
 */
function addLogEntry(entry) {
    // Keep log length manageable (e.g., last 20 entries)
    if (gameState.gameLog.length >= 20) {
        gameState.gameLog.shift(); // Remove oldest entry
    }
    gameState.gameLog.push(`Year ${gameState.year}: ${entry}`);
    // No direct updateUI call here; it will be called by nextTurn or handleChoice
}

/**
 * Updates resource values and checks for loss conditions.
 * @param {object} changes - Object with resource changes (e.g., {piety: 10, gold: -5}).
 */
function updateResources(changes) {
    for (const resource in changes) {
        if (gameState.resources.hasOwnProperty(resource)) {
            gameState.resources[resource] = Math.max(0, gameState.resources[resource] + changes[resource]);
        }
    }
    checkLossConditions();
    // No direct updateUI call here; it will be called by nextTurn or handleChoice
}

/**
 * Checks if any resource has dropped to zero, triggering game over.
 */
function checkLossConditions() {
    for (const resource in gameState.resources) {
        if (gameState.resources[resource] <= 0) {
            gameState.isGameOver = true;
            gameState.gameOverReason = `The Papacy has fallen! Your ${resource} dropped to zero.`;
            addLogEntry(gameState.gameOverReason);
            displayGameOver();
            return;
        }
    }
}

/**
 * Displays the game over modal.
 */
function displayGameOver() {
    ui.gameOverTitle.textContent = "Game Over!";
    ui.gameOverReason.textContent = gameState.gameOverReason;
    ui.gameOverModal.style.display = 'flex'; // Show the modal
    gameState.isGameStarted = false; // Game is no longer active
    saveGame(); // Save game state on game over
}

/**
 * Renders an event card on the right panel.
 * Now dynamically hides/shows choices based on conditions.
 * @param {object} card - The card object to display.
 */
function renderEventCard(card) {
    ui.eventTitle.textContent = card.title;
    ui.eventDescription.textContent = card.description;
    ui.eventChoices.innerHTML = ''; // Clear previous choices

    card.choices.forEach(choice => {
        const button = document.createElement('button');
        button.classList.add('choice-button');
        button.textContent = choice.text;

        // Check if the choice's conditions are met
        let conditionsMet = true;
        if (choice.conditions) {
            // Check resource conditions
            if (choice.conditions.resources) {
                for (const res in choice.conditions.resources) {
                    if (gameState.resources[res] < choice.conditions.resources[res]) {
                        conditionsMet = false;
                        button.title = `Requires ${choice.conditions.resources[res]} ${res.charAt(0).toUpperCase() + res.slice(1)}`; // Tooltip
                        button.disabled = true;
                        break;
                    }
                }
            }
            // Check flag conditions
            if (conditionsMet && choice.conditions.flags) {
                for (const flag of choice.conditions.flags) {
                    if (!gameState.flags.has(flag)) {
                        conditionsMet = false;
                        button.title = `Requires flag: ${flag}`;
                        button.disabled = true;
                        break;
                    }
                }
            }
            // Check advisor ready conditions
            if (conditionsMet && choice.conditions.advisorReady) {
                 const advisorKey = choice.conditions.advisorReady;
                 if (!gameState.advisors[advisorKey] || gameState.advisors[advisorKey].cooldown > 0) {
                     conditionsMet = false;
                     button.title = `${gameState.advisors[advisorKey].name} is not ready.`;
                     button.disabled = true;
                 }
            }
        }

        if (conditionsMet) {
            button.addEventListener('click', () => handleChoice(choice, card)); // Pass card to know what to discard
        }

        ui.eventChoices.appendChild(button);
    });
}

/**
 * Handles player choice for a regular event card.
 * @param {object} choice - The chosen option from the event card.
 * @param {object} card - The card object that was chosen from.
 */
function handleChoice(choice, card) {
    addLogEntry(`You chose: "${choice.text}".`);
    updateResources(choice.effects);

    // Apply flags from choice
    if (choice.flags) {
        choice.flags.forEach(flag => gameState.flags.add(flag));
    }

    // Move the chosen card to the discard pile
    gameState.discardPile.push(card);

    // Check for game over after all effects and flags
    if (gameState.isGameOver) return;

    // Check achievements
    checkAchievements();

    // For regular cards, if a choice leads to a major event prompt, handle it
    if (choice.nextEventId) {
        const nextMajorEvent = majorEvents.find(me => me.id === choice.nextEventId);
        if (nextMajorEvent) {
             addLogEntry(`A major event begins: ${nextMajorEvent.title}`);
             renderMajorEventPrompt(nextMajorEvent); // Display the major event prompt
             updateUI(); // Ensure UI is updated
             return; // Don't draw another card, stay on this major event prompt
        }
    }

    nextTurn(); // Automatically advance turn after choice, unless a major event is triggered
    saveGame(); // Save game after every choice
}

/**
 * Advances the game by one turn (one year).
 */
function nextTurn() {
    if (gameState.isGameOver || !gameState.isGameStarted) return; // Prevent turn advance if game over or not started

    gameState.year++;
    gameState.turnCount++; // Increment turn counter
    addLogEntry(`The year progresses to ${gameState.year} AD.`);

    // Apply passive decay
    updateResources({
        gold: -5,
        stability: -2,
        influence: -1
    });

    // Decrease advisor cooldowns
    for (const advisorKey in gameState.advisors) {
        const advisor = gameState.advisors[advisorKey];
        if (advisor.cooldown > 0) {
            advisor.cooldown--;
        }
    }
    updateUI(); // Update advisor buttons immediately after cooldowns

    // Check for game over after all passive effects and cooldowns
    if (gameState.isGameOver) return;

    // Check achievements at the start of each turn
    checkAchievements();

    // --- Major Event Handling ---
    // First, check if any major events in hand are active and need resolution or choices
    if (gameState.majorEventHand.length > 0) {
        const activeMajorEvent = gameState.majorEventHand[0]; // Assuming one active major event at a time for simplicity
        activeMajorEvent.turnsActive = (activeMajorEvent.turnsActive || 0) + 1; // Increment turns active
        addLogEntry(`Currently dealing with Major Event: ${activeMajorEvent.title} (Turn ${activeMajorEvent.turnsActive})`);

        // Check if the active major event should resolve this turn
        if (checkMajorEventResolution(activeMajorEvent)) {
            resolveMajorEvent(activeMajorEvent);
            // After resolution, nextTurn() will be called again to draw a regular card or new major event
            return;
        }

        renderMajorEvent(activeMajorEvent); // Re-render the active major event each turn
        updateUI(); // Ensure UI is updated
        return; // Don't draw a regular event card if a major event is active
    }

    // Then, check if new major events are eligible to be drawn
    const eligibleMajorEvents = majorEvents.filter(me =>
        me.type === "major" && !gameState.majorEventDeck.includes(me.id) && // Not already resolved/declined
        !gameState.mainEventDeck.some(card => card.id === me.id) && // Not already in main deck
        !gameState.discardPile.some(card => card.id === me.id) && // Not already in discard
        checkMajorEventPrerequisites(me)
    );

    // Small chance to draw an eligible major event instead of a regular one
    if (eligibleMajorEvents.length > 0 && Math.random() < 0.2) { // 20% chance
        const majorEventToDraw = eligibleMajorEvents[Math.floor(Math.random() * eligibleMajorEvents.length)];
        addLogEntry(`A major event card appears: ${majorEventToDraw.title}`);
        renderMajorEventPrompt(majorEventToDraw);
        updateUI(); // Ensure UI is updated
        return; // Don't draw a regular event card this turn
    }

    // If no major events are active or drawn, draw a regular event card
    drawEventCard();
    saveGame(); // Save game after every turn
}

/**
 * Resets the game state to its initial values.
 * Called for a new game or if a loaded game is invalid.
 */
function resetGame() {
    gameState.year = 1000;
    gameState.resources = {
        piety: 500,
        gold: 200,
        influence: 150,
        papalAuthority: 100,
        stability: 75
    };
    gameState.gameLog = [];
    gameState.flags = new Set();
    gameState.mainEventDeck = [];
    gameState.discardPile = [];
    gameState.majorEventDeck = [];
    gameState.majorEventHand = [];
    gameState.achievements = new Set();
    gameState.turnCount = 0;

    for (const advisorKey in gameState.advisors) {
        gameState.advisors[advisorKey].cooldown = 0;
    }

    gameState.isGameStarted = false; // Game hasn't started yet (waiting for "Start Game")
    gameState.isGameOver = false;
    gameState.gameOverReason = "";

    addLogEntry("Welcome to Habeus Papam! Click 'Start Game' to begin your pontificate.");
    populateEventDecks(); // Re-populate decks
    renderEventCard(eventCards.find(card => card.id === "intro_event")); // Show intro card
    updateUI(); // Update UI to reflect reset
}

/**
 * Initializes the game for a new playthrough.
 */
function initializeGame() {
    resetGame(); // Reset everything
    gameState.isGameStarted = true; // Mark as started now
    ui.mainMenuModal.style.display = 'none';
    ui.gameOverModal.style.display = 'none';
    addLogEntry("Your reign as Pope begins!");
    drawEventCard(); // Draw the very first card
    updateUI();
    saveGame(); // Initial save
}

/**
 * Populates the main event deck with all defined event cards.
 * Shuffles the deck.
 */
function populateEventDecks() {
    // Clone cards to ensure each game starts with fresh copies
    gameState.mainEventDeck = JSON.parse(JSON.stringify(eventCards.filter(card => card.type === "main")));
    gameState.mainEventDeck.sort(() => Math.random() - 0.5); // Shuffle main deck
    gameState.discardPile = [];
    // majorEventDeck holds IDs of resolved/declined major events
}

/**
 * Draws an event card from the main deck and displays it.
 * If the main deck is empty, shuffles the discard pile back in.
 */
function drawEventCard() {
    if (gameState.isGameOver) return;

    if (gameState.mainEventDeck.length === 0) {
        if (gameState.discardPile.length > 0) {
            addLogEntry("Main deck empty. Shuffling discard pile back into main deck.");
            gameState.mainEventDeck = [...gameState.discardPile];
            gameState.discardPile = [];
            gameState.mainEventDeck.sort(() => Math.random() - 0.5); // Reshuffle
        } else {
            addLogEntry("No cards left in main deck or discard pile. The Papacy enters a period of quiet.");
            ui.eventTitle.textContent = "Peaceful Years";
            ui.eventDescription.textContent = "The Papacy enjoys a rare period of calm. No major events or pressing dilemmas.";
            ui.eventChoices.innerHTML = `<button class="choice-button" onclick="nextTurn()">Continue Reign</button>`;
            return;
        }
    }

    const drawnCard = gameState.mainEventDeck.shift(); // Remove first card
    renderEventCard(drawnCard);
    addLogEntry(`A new event: "${drawnCard.title}"`);
    updateUI(); // Update deck counts
}


// --- Major Event Specific Functions ---

/**
 * Checks if a major event meets its prerequisites to be considered for drawing.
 * @param {object} majorEvent - The major event object.
 * @returns {boolean} True if eligible, false otherwise.
 */
function checkMajorEventPrerequisites(majorEvent) {
    if (majorEvent.prerequisites) {
        // Check year
        if (majorEvent.prerequisites.minYear && gameState.year < majorEvent.prerequisites.minYear) {
            return false;
        }
        // Check resources
        if (majorEvent.prerequisites.resources) {
            for (const res in majorEvent.prerequisites.resources) {
                if (gameState.resources[res] < majorEvent.prerequisites.resources[res]) {
                    return false;
                }
            }
        }
        // Check required flags
        if (majorEvent.prerequisites.requiredFlags) {
            for (const flag of majorEvent.prerequisites.requiredFlags) {
                if (!gameState.flags.has(flag)) {
                    return false;
                }
            }
        }
        // Check forbidden flags
        if (majorEvent.prerequisites.forbiddenFlags) {
            for (const flag of majorEvent.prerequisites.forbiddenFlags) {
                if (gameState.flags.has(flag)) {
                    return false;
                }
            }
        }
    }
    return true;
}

/**
 * Renders a major event prompt (its initial choice) on the right panel.
 * @param {object} majorEvent - The major event object to prompt for.
 */
function renderMajorEventPrompt(majorEvent) {
    ui.eventCard.style.display = 'block'; // Ensure event card is visible for prompt
    ui.majorEventActiveDisplay.style.display = 'none'; // Hide active major event display

    ui.eventTitle.textContent = majorEvent.title;
    ui.eventDescription.textContent = majorEvent.description;
    ui.eventChoices.innerHTML = ''; // Clear previous choices

    // Option to launch the major event
    const initiateButton = document.createElement('button');
    initiateButton.classList.add('choice-button');
    initiateButton.textContent = majorEvent.initialChoice.text;
    initiateButton.addEventListener('click', () => handleMajorEventInitiation(majorEvent, majorEvent.initialChoice));
    ui.eventChoices.appendChild(initiateButton);

    // Option to decline the major event
    if (majorEvent.failureChoice) {
        const declineButton = document.createElement('button');
        declineButton.classList.add('choice-button', 'decline-button');
        declineButton.textContent = majorEvent.failureChoice.text;
        declineButton.addEventListener('click', () => handleMajorEventInitiation(majorEvent, majorEvent.failureChoice));
        ui.eventChoices.appendChild(declineButton);
    }
    updateUI(); // Update display for current view
}

/**
 * Handles the player's decision on whether to initiate/decline a major event.
 * @param {object} majorEvent - The major event being decided upon.
 * @param {object} chosenOption - The initialChoice or failureChoice made by the player.
 */
function handleMajorEventInitiation(majorEvent, chosenOption) {
    addLogEntry(`You decide on Major Event "${majorEvent.title}": "${chosenOption.text}".`);
    updateResources(chosenOption.effects);

    if (chosenOption.flags) {
        chosenOption.flags.forEach(flag => gameState.flags.add(flag));
    }

    // If the chosen option leads to an active major event, add it to hand
    if (chosenOption.nextEventId) {
        const nextActiveEvent = JSON.parse(JSON.stringify(majorEvents.find(me => me.id === chosenOption.nextEventId))); // Deep copy
        if (nextActiveEvent && nextActiveEvent.type === "active_major") {
            nextActiveEvent.turnsActive = 0; // Initialize turns active for the specific instance
            nextActiveEvent.fundingCount = 0; // Initialize specific counters for Crusade
            gameState.majorEventHand.push(nextActiveEvent);
            addLogEntry(`Major Event "${nextActiveEvent.title}" is now active.`);
            gameState.flags.add("crusade_active"); // Set a flag indicating a crusade is active
        }
    }

    // Mark this major event prompt as 'dealt with' so it doesn't reappear in the future
    gameState.majorEventDeck.push(majorEvent.id);

    // Check for game over after effects
    if (gameState.isGameOver) return;

    checkAchievements(); // Check achievements after this significant choice

    nextTurn(); // Advance turn, which will either draw a new card or activate the major event
    saveGame();
}

/**
 * Renders the active choices for an ongoing major event.
 * @param {object} majorEvent - The active major event object.
 */
function renderMajorEvent(majorEvent) {
    ui.majorEventActiveDisplay.style.display = 'block';
    ui.eventCard.style.display = 'none'; // Hide regular event card

    ui.activeMajorEventTitle.textContent = `Major Event: ${majorEvent.title} (Turn ${majorEvent.turnsActive})`;
    ui.activeMajorEventDescription.textContent = majorEvent.description;
    ui.activeMajorEventChoices.innerHTML = '';

    // Render active choices for this major event
    majorEvent.activeChoices.forEach(choice => {
        const button = document.createElement('button');
        button.classList.add('choice-button');
        button.textContent = choice.text;

        let conditionsMet = true;
        if (choice.conditions) {
            if (choice.conditions.resources) {
                for (const res in choice.conditions.resources) {
                    if (gameState.resources[res] < choice.conditions.resources[res]) {
                        conditionsMet = false;
                        button.title = `Requires ${choice.conditions.resources[res]} ${res.charAt(0).toUpperCase() + res.slice(1)}`;
                        button.disabled = true;
                        break;
                    }
                }
            }
             if (conditionsMet && choice.conditions.flags) {
                for (const flag of choice.conditions.flags) {
                    if (!gameState.flags.has(flag)) {
                        conditionsMet = false;
                        button.title = `Requires flag: ${flag}`;
                        button.disabled = true;
                        break;
                    }
                }
            }
            if (conditionsMet && choice.conditions.advisorReady) {
                 const advisorKey = choice.conditions.advisorReady;
                 if (!gameState.advisors[advisorKey] || gameState.advisors[advisorKey].cooldown > 0) {
                     conditionsMet = false;
                     button.title = `${gameState.advisors[advisorKey].name} is not ready.`;
                     button.disabled = true;
                 }
            }
        }

        if (conditionsMet) {
            button.addEventListener('click', () => handleActiveMajorEventChoice(majorEvent, choice));
        }

        ui.activeMajorEventChoices.appendChild(button);
    });

    // Option to skip turn or similar for major events if needed (e.g., if no choices are available)
    if (majorEvent.activeChoices.every(choice => {
        // Check if all choices are disabled
        let tempConditionsMet = true;
        if (choice.conditions) {
            if (choice.conditions.resources) {
                for (const res in choice.conditions.resources) {
                    if (gameState.resources[res] < choice.conditions.resources[res]) { tempConditionsMet = false; break; }
                }
            }
            if (tempConditionsMet && choice.conditions.flags) {
                for (const flag of choice.conditions.flags) {
                    if (!gameState.flags.has(flag)) { tempConditionsMet = false; break; }
                }
            }
            if (tempConditionsMet && choice.conditions.advisorReady) {
                const advisorKey = choice.conditions.advisorReady;
                if (!gameState.advisors[advisorKey] || gameState.advisors[advisorKey].cooldown > 0) { tempConditionsMet = false; }
            }
        }
        return !tempConditionsMet;
    })) {
        const skipButton = document.createElement('button');
        skipButton.classList.add('choice-button');
        skipButton.textContent = "Continue (No viable actions this turn)";
        skipButton.addEventListener('click', () => nextTurn());
        ui.activeMajorEventChoices.appendChild(skipButton);
    }
}

/**
 * Handles choices made during an active major event.
 * @param {object} majorEvent - The major event being interacted with.
 * @param {object} choice - The chosen option.
 */
function handleActiveMajorEventChoice(majorEvent, choice) {
    addLogEntry(`During ${majorEvent.title}, you chose: "${choice.text}".`);
    updateResources(choice.effects);
    if (choice.flags) {
        choice.flags.forEach(flag => gameState.flags.add(flag));
    }

    // Specific logic for Crusade funding
    if (majorEvent.id === "first_crusade_active" && choice.flags && choice.flags.includes("crusade_funded_instance")) {
        majorEvent.fundingCount = (majorEvent.fundingCount || 0) + 1;
        addLogEntry(`Crusade funded ${majorEvent.fundingCount} time(s).`);
    }

    if (gameState.isGameOver) return; // Check game over immediately after choice effects

    checkAchievements(); // Check achievements after this significant choice

    nextTurn(); // Advance turn
    saveGame();
}

/**
 * Checks if an active major event's resolution conditions are met.
 * @param {object} majorEvent - The active major event object.
 * @returns {boolean} True if resolution conditions are met, false otherwise.
 */
function checkMajorEventResolution(majorEvent) {
    if (!majorEvent.resolutionConditions) return false;

    let conditionsMet = true;

    if (majorEvent.resolutionConditions.minTurnsActive && majorEvent.turnsActive < majorEvent.resolutionConditions.minTurnsActive) {
        conditionsMet = false;
    }
    if (conditionsMet && majorEvent.resolutionConditions.requiredFlags) {
        for (const flag of majorEvent.resolutionConditions.requiredFlags) {
            if (!gameState.flags.has(flag)) {
                conditionsMet = false;
                break;
            }
        }
    }
    // Specific conditions for crusade
    if (conditionsMet && majorEvent.id === "first_crusade_active" && majorEvent.resolutionConditions.fundingTimes) {
        if ((majorEvent.fundingCount || 0) < majorEvent.resolutionConditions.fundingTimes) {
            conditionsMet = false;
        }
    }

    return conditionsMet;
}


/**
 * Resolves a major event, applying success or failure effects.
 * This function is typically called automatically when resolution conditions are met.
 * @param {object} majorEvent - The major event to resolve.
 */
function resolveMajorEvent(majorEvent) {
    addLogEntry(`Resolving Major Event: "${majorEvent.title}"`);
    let finalResolution = null;

    // Determine success or failure for "first_crusade_active"
    if (majorEvent.id === "first_crusade_active") {
        if (majorEvent.fundingCount >= majorEvent.resolutionConditions.fundingTimes) {
            finalResolution = majorEvent.resolutionEffects.success;
        } else {
            finalResolution = majorEvent.resolutionEffects.failure;
        }
    }
    // Add logic for other major events here
    else if (majorEvent.id === "investiture_controversy_active") {
        if (gameState.flags.has("ruler_excommunicated") && majorEvent.turnsActive >= majorEvent.resolutionConditions.minTurnsActive) {
            finalResolution = majorEvent.resolutionEffects.success;
        } else {
            finalResolution = majorEvent.resolutionEffects.failure;
        }
    }


    if (finalResolution) {
        addLogEntry(`${finalResolution.title}`);
        addLogEntry(`${finalResolution.description}`);
        updateResources(finalResolution.effects);
        if (finalResolution.flags) {
            finalResolution.flags.forEach(flag => gameState.flags.add(flag));
        }
    } else {
        // Fallback if no specific resolution is found (shouldn't happen with proper logic)
        addLogEntry("Major event resolved with no specific outcome defined.");
    }

    // Remove the major event from the hand as it's resolved
    gameState.majorEventHand = gameState.majorEventHand.filter(me => me.id !== majorEvent.id);

    // Remove the 'crusade_active' flag if it was set
    if (majorEvent.id === "first_crusade_active") {
        gameState.flags.delete("crusade_active");
    }

    // Mark this major event as 'dealt with' in the main `majorEventDeck` array
    gameState.majorEventDeck.push(majorEvent.id);

    if (!gameState.isGameOver) {
        checkAchievements(); // Check achievements after resolution
        nextTurn(); // Immediately advance turn after resolution
    }
}

/**
 * Handles the activation of an advisor.
 * @param {string} advisorKey - The key of the advisor (e.g., 'cardinal').
 */
function activateAdvisor(advisorKey) {
    const advisor = gameState.advisors[advisorKey];
    if (advisor && advisor.cooldown === 0) {
        addLogEntry(`You consult with the ${advisor.name}.`);
        advisor.cooldown = advisor.maxCooldown; // Set cooldown

        // Apply advisor-specific effects
        switch (advisorKey) {
            case 'cardinal':
                updateResources({ piety: 25, gold: -5 });
                addLogEntry("Your Piety increases, but at a minor cost.");
                break;
            case 'lord':
                updateResources({ influence: 20, stability: -3 });
                addLogEntry("Your Influence grows, but local stability slightly wanes.");
                break;
            case 'alchemist':
                const goldGain = Math.floor(Math.random() * 30) + 10; // 10-40 gold
                updateResources({ gold: goldGain, piety: -5 });
                addLogEntry(`The Alchemist provides ${goldGain} Gold, but his methods displease some.`);
                break;
        }
        updateUI(); // Update advisor button state
        checkAchievements(); // Check for achievements after advisor use
        saveGame();
    } else {
        addLogEntry(`${advisor.name} is on cooldown. Try again in ${advisor.cooldown} turns.`);
        updateUI(); // Ensure log updates even if no action
    }
}


// --- Save/Load Functions ---

/**
 * Saves the current game state to localStorage.
 */
function saveGame() {
    try {
        // Convert Set to Array for flags and achievements for JSON serialization
        const stateToSave = {
            ...gameState,
            flags: Array.from(gameState.flags),
            achievements: Array.from(gameState.achievements)
        };
        localStorage.setItem('habeusPapamSave', JSON.stringify(stateToSave));
        addLogEntry("Game saved successfully!");
    } catch (e) {
        addLogEntry("Error saving game: " + e);
        console.error("Error saving game:", e);
    }
    updateUI();
}

/**
 * Loads game state from localStorage.
 */
function loadGame() {
    try {
        const savedState = localStorage.getItem('habeusPapamSave');
        if (savedState) {
            const loadedState = JSON.parse(savedState);

            // Reconstruct Sets from Arrays
            loadedState.flags = new Set(loadedState.flags || []);
            loadedState.achievements = new Set(loadedState.achievements || []);

            // Deep copy objects to avoid reference issues
            gameState.year = loadedState.year;
            gameState.resources = JSON.parse(JSON.stringify(loadedState.resources));
            gameState.gameLog = loadedState.gameLog; // Array is fine
            gameState.flags = loadedState.flags; // Already converted to Set
            gameState.mainEventDeck = JSON.parse(JSON.stringify(loadedState.mainEventDeck));
            gameState.discardPile = JSON.parse(JSON.stringify(loadedState.discardPile));
            gameState.majorEventDeck = loadedState.majorEventDeck; // Array of IDs is fine
            gameState.majorEventHand = JSON.parse(JSON.stringify(loadedState.majorEventHand)); // Array of objects
            gameState.advisors = JSON.parse(JSON.stringify(loadedState.advisors));
            gameState.achievements = loadedState.achievements; // Already converted to Set
            gameState.turnCount = loadedState.turnCount || 0;


            gameState.isGameStarted = true; // Assume game is started if loaded
            gameState.isGameOver = false;
            gameState.gameOverReason = "";

            addLogEntry("Game loaded successfully!");
            // Determine what to render based on majorEventHand
            if (gameState.majorEventHand.length > 0) {
                renderMajorEvent(gameState.majorEventHand[0]);
            } else {
                // If game is loaded mid-turn, we might need to re-render the last event card.
                // A better approach would be to save/load the current card ID too.
                // For now, we'll just draw a new card.
                drawEventCard();
            }
            ui.mainMenuModal.style.display = 'none'; // Hide main menu
            updateUI(); // Update all UI elements
        } else {
            addLogEntry("No saved game found.");
            alert("No saved game found!");
        }
    } catch (e) {
        addLogEntry("Error loading game: " + e);
        console.error("Error loading game:", e);
        alert("Error loading game. Starting a new game.");
        resetGame(); // Start a new game if load fails
    }
}

// --- Achievement Functions ---

/**
 * Checks all achievements and unlocks them if conditions are met.
 */
function checkAchievements() {
    for (const id in achievements) {
        if (!gameState.achievements.has(id)) { // Only check if not already unlocked
            const achievement = achievements[id];
            if (achievement.check()) {
                gameState.achievements.add(id);
                addLogEntry(`Achievement Unlocked: "${achievement.name}"!`);
                updateUI(); // Update UI to show new achievement
                // Potentially show a modal for the achievement here
            }
        }
    }
}

/**
 * Renders all achievements (unlocked and locked) in the achievements modal.
 */
function renderAchievementsModal() {
    ui.achievementsModalList.innerHTML = '';
    for (const id in achievements) {
        const achievement = achievements[id];
        const li = document.createElement('li');
        li.classList.add('achievement-item');

        const title = document.createElement('h4');
        title.textContent = achievement.name;
        li.appendChild(title);

        const description = document.createElement('p');
        description.textContent = achievement.description;
        li.appendChild(description);

        if (gameState.achievements.has(id)) {
            li.classList.add('unlocked');
        } else {
            li.classList.add('locked');
            title.textContent += " (Locked)"; // Indicate locked status
        }
        ui.achievementsModalList.appendChild(li);
    }
    ui.achievementsModal.style.display = 'flex'; // Show the modal
}

// --- Event Listeners ---

// Top Bar Buttons
ui.mainMenuTopBtn.addEventListener('click', () => {
    ui.mainMenuModal.style.display = 'flex';
});

ui.saveGameBtn.addEventListener('click', saveGame);
ui.loadGameBtn.addEventListener('click', loadGame);

ui.exitBtn.addEventListener('click', () => {
    if (confirm("Are you sure you want to exit? Your current unsaved progress will be lost.")) {
        window.location.reload(); // Simple reload for exit
    }
});

// Main Menu Modal Buttons
ui.modalNewGameBtn.addEventListener('click', () => {
    if (gameState.isGameStarted && !confirm("Are you sure you want to start a new game? Your current progress will be lost.")) {
        return; // User cancelled
    }
    initializeGame();
});

ui.modalContinueGameBtn.addEventListener('click', () => {
    loadGame();
});

ui.modalAchievementsBtn.addEventListener('click', () => {
    ui.mainMenuModal.style.display = 'none'; // Hide main menu first
    renderAchievementsModal();
});

ui.modalOptionsBtn.addEventListener('click', () => {
    alert("Options are coming soon!");
});

ui.modalExitBtn.addEventListener('click', () => {
    if (confirm("Are you sure you want to exit? Your current unsaved progress will be lost.")) {
        window.location.reload();
    }
});

// Game Over "Play Again" button
ui.restartGameBtn.addEventListener('click', () => {
    initializeGame();
});

// Start Game from welcome card
ui.startGameButton.addEventListener('click', () => {
    initializeGame();
});

// View All Achievements button on left panel
ui.viewAllAchievementsBtn.addEventListener('click', renderAchievementsModal);

// Close Modal Buttons (for all modals)
ui.closeModalBtns.forEach(button => {
    button.addEventListener('click', (event) => {
        event.target.closest('.modal').style.display = 'none';
    });
});

// Advisor button event listeners
for (const advisorKey in ui.advisorButtons) {
    const button = ui.advisorButtons[advisorKey];
    if (button) {
        button.addEventListener('click', () => activateAdvisor(advisorKey));
    }
}


// --- Initial Setup ---
document.addEventListener('DOMContentLoaded', () => {
    // Show the main menu modal initially
    ui.mainMenuModal.style.display = 'flex';
    // Load game if there's a save (optional, can be done via button only)
    // loadGame(); // Uncomment if you want to automatically try loading on page load
    resetGame(); // Ensure a clean initial state, showing the intro card
    updateUI(); // Initial UI update to show default state/resources
});
