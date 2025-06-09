// script.js

// --- Game State ---
const gameState = {
    year: 1100,
    month: 1, // January
    pope: {
        name: "Pope Clement IV", // Can be randomized or chosen by player
        age: 60,
        wisdom: 70, // Affects theology, influence, event choices
        diplomacy: 65, // Affects relations, curia support, influence
        martial: 40, // Affects crusades, military matters
        healthModifier: 0, // Health can decay based on age, events
    },
    resources: {
        piety: 100,
        wealth: 500,
        influence: 75,
        curiaSupport: 60,
        theology: 50,
        health: 80, // Pope's current health
        prestige: 20,
    },
    cardinals: [],
    currentEvent: null,
    selectedCardinal: null,
    eventLog: [],
    // New persistent world elements
    activeCrises: [], // [{id: 'heresy_cathar', severity: 'medium', progress: 0}]
    worldFlags: {}, // Global flags like 'emperor_excommunicated', 'cathar_crusade_active'
    relations: { // Standing with major European powers (0-100)
        'Holy Roman Empire': 50,
        'France': 60,
        'England': 40,
        'Naples': 70,
        'Byzantine Empire': 30,
        'Muslim Caliphates': 20, // Example of external relation
    },
    reputation: { // How various groups perceive the Papacy (0-100)
        'Royalty': 50, // Respect from kings
        'Clergy': 60, // Support from bishops/abbots
        'Commoners': 70, // Popularity among the populace
        'Merchants': 40 // Trust from wealthy merchant families
    },
    // Game over conditions and flags
    isGameOver: false,
};

// --- DOM Elements ---
const currentYearDisplay = document.getElementById('current-year');
const resourceDisplays = {
    piety: document.getElementById('resource-piety'),
    wealth: document.getElementById('resource-wealth'),
    influence: document.getElementById('resource-influence'),
    curiaSupport: document.getElementById('resource-curia'),
    theology: document.getElementById('resource-theology'),
    health: document.getElementById('resource-health'),
    prestige: document.getElementById('resource-prestige'),
};

// Pope Attributes
const popeAgeDisplay = document.getElementById('pope-age');
const popeWisdomDisplay = document.getElementById('pope-wisdom');
const popeDiplomacyDisplay = document.getElementById('pope-diplomacy');
const popeMartialDisplay = document.getElementById('pope-martial');

const eventTitleDisplay = document.getElementById('event-title');
const eventDescriptionDisplay = document.getElementById('event-description');
const eventChoicesDisplay = document.getElementById('event-choices');
const nextTurnButton = document.getElementById('next-turn-button');
const cardinalListDisplay = document.getElementById('cardinals-display');
const numCardinalsDisplay = document.getElementById('num-cardinals');
const activeCrisesDisplay = document.getElementById('crises-display');

// Panels
const mainGameDisplay = document.getElementById('game-event-display');
const curiaPanel = document.getElementById('curia-panel');
const decreesPanel = document.getElementById('decrees-panel');
const mapPanel = document.getElementById('map-panel');
const ledgerPanel = document.getElementById('ledger-panel');

const openCuriaButton = document.getElementById('open-curia-button');
const openDecreesButton = document.getElementById('open-decrees-button');
const openMapButton = document.getElementById('open-map-button');
const openLedgerButton = document.getElementById('open-ledger-button');
const closePanelButtons = document.querySelectorAll('.close-panel-button');

// Curia Panel Elements
const curiaCardinalListDisplay = document.getElementById('curia-cardinal-list');
const selectedCardinalName = document.getElementById('selected-cardinal-name');
const selectedCardinalDescription = document.getElementById('selected-cardinal-description');
const selectedCardinalLoyalty = document.getElementById('selected-cardinal-loyalty');
const selectedCardinalInfluence = document.getElementById('selected-cardinal-influence');
const selectedCardinalFaction = document.getElementById('selected-cardinal-faction'); // New
const selectedCardinalPersonality = document.getElementById('selected-cardinal-personality'); // New
const selectedCardinalTraits = document.getElementById('selected-cardinal-traits');
const bribeCardinalButton = document.getElementById('bribe-cardinal-button');
const promoteCardinalButton = document.getElementById('promote-cardinal-button'); // New
const investigateCardinalButton = document.getElementById('investigate-cardinal-button'); // New

// Decrees Panel Elements
const decreeOptions = document.getElementById('decree-options');
const decreeDetails = document.getElementById('decree-details');
const decreeTypeName = document.getElementById('decree-type-name');
const decreeCostDisplay = document.getElementById('decree-cost-display'); // New
const decreeTextarea = document.getElementById('decree-text');
const issueDecreeButton = document.getElementById('issue-decree-button');

// Ledger Panel Elements
const ledgerIncomeDisplay = document.getElementById('ledger-income');
const ledgerExpensesDisplay = document.getElementById('ledger-expenses');
const ledgerBalanceDisplay = document.getElementById('ledger-balance');
const ledgerEventLogDisplay = document.getElementById('ledger-event-log');


// --- Game Data ---

// Cardinal structure (expanded significantly)
const CARDINAL_PERSONALITIES = ['Pious', 'Ambitious', 'Loyal', 'Scheming', 'Zealous', 'Cautious', 'Diplomatic', 'Scholarly', 'Martial'];
const CARDINAL_FACTIONS = ['Italian', 'French', 'Imperialist', 'Reformist', 'Old Guard'];

function createCardinal(name, initialTraits = []) {
    const personality = CARDINAL_PERSONALITIES[Math.floor(Math.random() * CARDINAL_PERSONALITIES.length)];
    const faction = CARDINAL_FACTIONS[Math.floor(Math.random() * CARDINAL_FACTIONS.length)];
    const loyalty = Math.floor(Math.random() * 40) + 60; // 60-100
    const influence = Math.floor(Math.random() * 10) + 1; // 1-10
    const age = Math.floor(Math.random() * 30) + 40; // 40-70
    const skills = { // Cardinal specific skills
        theology: Math.floor(Math.random() * 10) + 1,
        diplomacy: Math.floor(Math.random() * 10) + 1,
        intrigue: Math.floor(Math.random() * 10) + 1,
        stewardship: Math.floor(Math.random() * 10) + 1,
    };

    const traits = [...initialTraits];
    if (!traits.includes(personality)) traits.push(personality); // Ensure personality is a trait
    if (!traits.includes(faction)) traits.push(faction); // Ensure faction is a trait

    return {
        id: crypto.randomUUID(),
        name: name,
        age: age,
        loyalty: loyalty,
        influence: influence,
        personality: personality,
        faction: faction,
        traits: traits,
        skills: skills,
        isPromoted: false, // Can hold a higher office
        secret: null, // Placeholder for secrets discovered through investigation
    };
}

// Initial Cardinals
function initializeCardinals() {
    gameState.cardinals = [
        createCardinal("Cardinal Pietro Orsini", ['Orsini Family', 'Roman']),
        createCardinal("Cardinal Guillaume Dubois", ['Royalist', 'French']),
        createCardinal("Cardinal Otto von Braunschweig", ['Imperialist', 'German']),
        createCardinal("Cardinal Rodrigo Díaz", ['Scholarly', 'Spanish']),
        createCardinal("Cardinal Thomas Becket", ['English', 'Austerity']),
        createCardinal("Cardinal Giovanni Colonna", ['Colonna Family', 'Scheming']),
        createCardinal("Cardinal Henry of Blois", ['Wealthy', 'English']),
        createCardinal("Cardinal Peter Damian", ['Reformist', 'Italian']),
        createCardinal("Cardinal Al-Idrisi", ['Arab Scholar', 'Sicilian']), // More diverse cardinals
        createCardinal("Cardinal Olaf Magnusson", ['Nordic', 'Fierce']),
    ];
    updateCardinalList();
}

// Event structure (further expanded)
const gameEvents = [
    {
        id: 'pontificate_begins',
        type: 'narrative',
        title: "The Weight of the Tiara",
        description: "You have been elected Pope! The medieval world is a complex tapestry of faith, power, and intrigue. Your actions will shape the destiny of the Church and Europe. Click 'End Month' to begin your reign.",
        choices: [
            {
                text: "Deliver a sermon on piety and moral rectitude.",
                effects: { piety: 10, 'reputation.Commoners': 5, 'reputation.Clergy': 5 },
                consequence: "Your words resonate with the faithful, reinforcing the Church's spiritual authority."
            },
            {
                text: "Focus on administrative reforms to bolster the Holy See's finances.",
                effects: { wealth: 50, theology: -5, 'reputation.Merchants': 10 },
                consequence: "Your pragmatic approach pleases the merchants, but some traditionalists are uneasy."
            },
            {
                text: "Send legates to reconcile warring monarchs, asserting papal influence.",
                effects: { influence: 15, 'reputation.Royalty': 10, curiaSupport: -5 },
                consequence: "Your diplomatic efforts are noted, but intervention in secular affairs can be risky."
            }
        ]
    },
    {
        id: 'heresy_in_south',
        type: 'crisis_trigger', // This event starts a persistent crisis
        title: "Whispers of Heresy: The Cathar Threat",
        description: "Reports arrive from Southern France of a new heresy, the 'Cathars', gaining traction. They reject many Church doctrines, preach asceticism, and are converting local nobles.",
        conditions: [
            { type: 'resource', resource: 'piety', operator: '<', value: 120, chance: 0.2 }, // Higher chance if piety low
            { type: 'resource', resource: 'theology', operator: '<', value: 60, chance: 0.1 }
        ],
        choices: [
            {
                text: "Declare a Crusade against the Cathars.",
                effects: { piety: 20, curiaSupport: 10, influence: 15, wealth: -100, 'relations.France': 10, prestige: 20 },
                consequence: "A Holy War is declared. Many knights flock to the banners, but the conflict will be long and bloody.",
                onChoose: () => {
                    addCrisis('Cathar Heresy', 'medium', 5, 'Crusade'); // Add a new crisis
                    gameState.worldFlags['cathar_crusade_active'] = true;
                }
            },
            {
                text: "Send a delegation of learned monks to preach and debate.",
                effects: { theology: 15, piety: -5, influence: 5, wealth: -20, 'relations.France': 5, 'reputation.Clergy': 10 },
                consequence: "The monks engage in fierce debates, winning some over, but the heresy persists. It will take time.",
                onChoose: () => {
                    addCrisis('Cathar Heresy', 'low', 3, 'Debate'); // Add a less severe crisis
                    gameState.worldFlags['cathar_debate_active'] = true;
                }
            },
            {
                text: "Ignore it for now; local bishops should handle it.",
                effects: { piety: -15, curiaSupport: -10, influence: -10, 'relations.France': -5, 'reputation.Commoners': -10 },
                consequence: "The heresy spreads further, and your authority is questioned. It may become a major threat.",
                onChoose: () => { addCrisis('Cathar Heresy', 'high', 10, 'Ignored'); }
            }
        ]
    },
    {
        id: 'royal_dispute_marriage',
        type: 'diplomatic',
        title: "King Louis's Troublesome Marriage",
        description: "King Louis of France seeks an annulment from his wife, Queen Eleanor, on flimsy grounds. He threatens to withdraw French support from the Church if you deny him. This will have major political ramifications.",
        conditions: [
            { type: 'resource', resource: 'influence', operator: '>', value: 50, chance: 0.5 },
            { type: 'flag', flag: 'emperor_excommunicated', exists: false, chance: 0.3 } // Less likely if already dealing with Emperor
        ],
        choices: [
            {
                text: "Grant the annulment to maintain French loyalty.",
                effects: { influence: 20, piety: -15, curiaSupport: -10, 'relations.France': 30, 'relations.England': -10, 'reputation.Royalty': 15, 'reputation.Clergy': -10 },
                consequence: "Louis is pleased, but other rulers and devout cardinals are scandalized. You have bought a king's favor at a moral cost."
            },
            {
                text: "Deny the annulment, upholding the sanctity of marriage.",
                effects: { piety: 20, influence: -15, curiaSupport: 5, 'relations.France': -40, prestige: 10, 'reputation.Clergy': 15, 'reputation.Royalty': -10 },
                consequence: "The Church's moral standing is reinforced, but France becomes openly hostile. Prepare for potential conflict."
            },
            {
                text: "Delegate the decision to a special council, buying time.",
                effects: { curiaSupport: 10, wealth: -20, theology: 5, 'reputation.Clergy': 5 },
                consequence: "The decision is delayed, but Louis grows impatient. The council's decision is uncertain, and you've spent resources for the debate."
            }
        ]
    },
    {
        id: 'empty_treasury',
        type: 'crisis',
        title: "The Coffers are Empty",
        description: "Decades of lavish spending and expensive wars have left the Holy See's treasury depleted. Urgent action is needed to secure funds.",
        conditions: [
            { type: 'resource', resource: 'wealth', operator: '<', value: 100, chance: 1.0 } // High chance if wealth is low
        ],
        choices: [
            {
                text: "Impose a new tax on all Church lands.",
                effects: { wealth: 100, curiaSupport: -15, piety: -5, 'reputation.Clergy': -20, 'reputation.Commoners': -10 },
                consequence: "Funds are raised, but resentment among bishops and abbots grows. The people grumble."
            },
            {
                text: "Seek a large loan from the wealthy Italian banking families.",
                effects: { wealth: 150, influence: -10, piety: -5, 'reputation.Merchants': 20 },
                consequence: "You secure funds, but become beholden to powerful merchants. They will expect favors."
            },
            {
                text: "Issue indulgences to raise money for a 'holy cause'.",
                effects: { wealth: 200, piety: -20, theology: -10, 'reputation.Clergy': -15, 'reputation.Commoners': -10 },
                consequence: "A substantial amount of gold flows in, but the practice is widely criticized as simony. Your spiritual standing is damaged."
            }
        ]
    },
    {
        id: 'papal_library_fire',
        type: 'crisis',
        title: "Fire in the Apostolic Library!",
        description: "A section of the Vatican library has caught fire! Priceless manuscripts are at risk.",
        conditions: [{ type: 'randomChance', value: 0.05 }],
        choices: [
            {
                text: "Direct fire-fighting efforts, prioritizing rare manuscripts.",
                effects: { wealth: -50, theology: -10, 'reputation.Clergy': 5 },
                consequence: "Many manuscripts are saved, but some invaluable texts are lost. The Curia is grateful for your swift action."
            },
            {
                text: "Focus on saving the building structure, let the books burn.",
                effects: { wealth: -20, theology: -30, 'reputation.Clergy': -20, 'reputation.Merchants': 5 },
                consequence: "The building is mostly intact, but a vast collection of knowledge is utterly destroyed. Scholars are distraught."
            }
        ]
    },
    {
        id: 'new_trade_route',
        type: 'opportunity',
        title: "A New Trade Route",
        description: "Merchants from Venice have discovered a new, profitable trade route to the East, promising great wealth.",
        conditions: [{ type: 'randomChance', value: 0.1, yearMin: 1120 }], // Appears later
        choices: [
            {
                text: "Invest papal funds in the venture.",
                effects: { wealth: -100, 'reputation.Merchants': 15, 'relations.Venice': 10 },
                consequence: "Your investment grows the Church's wealth and influence with the Venetians, but it's a risky gambit."
            },
            {
                text: "Bless the route and encourage Christian merchants to participate.",
                effects: { piety: 10, influence: 5, 'reputation.Merchants': 5 },
                consequence: "The venture thrives, but you gain only indirect benefit. Your moral standing is enhanced."
            },
            {
                text: "Condemn the route as distracting from spiritual pursuits.",
                effects: { piety: 20, 'reputation.Merchants': -20 },
                consequence: "Your condemnation costs you wealth, but reinforces the Church's commitment to spiritual purity. Merchants are displeased."
            }
        ]
    },
    // Add more events of different types
];

// --- Core Game Functions ---

function updateUI() {
    // Update Date
    currentYearDisplay.textContent = `${getMonthName(gameState.month)} ${gameState.year} AD`;

    // Update Pope Attributes
    popeAgeDisplay.textContent = gameState.pope.age;
    popeWisdomDisplay.textContent = gameState.pope.wisdom;
    popeDiplomacyDisplay.textContent = gameState.pope.diplomacy;
    popeMartialDisplay.textContent = gameState.pope.martial;
    resourceDisplays.health.textContent = gameState.resources.health; // Ensure health is updated here too

    // Update Resources
    for (const resource in gameState.resources) {
        if (resourceDisplays[resource]) {
            resourceDisplays[resource].textContent = gameState.resources[resource];
        }
    }
    updateCardinalList(); // Update sidebar cardinal list
    updateActiveCrisesDisplay(); // Update crisis list
}

function updateCardinalList() {
    cardinalListDisplay.innerHTML = '';
    numCardinalsDisplay.textContent = gameState.cardinals.length;
    gameState.cardinals.forEach(cardinal => {
        const li = document.createElement('li');
        li.textContent = `${cardinal.name} (${cardinal.loyalty} Loyalty)`;
        cardinalListDisplay.appendChild(li);
    });
}

function updateActiveCrisesDisplay() {
    activeCrisesDisplay.innerHTML = '';
    if (gameState.activeCrises.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'No active crises.';
        activeCrisesDisplay.appendChild(li);
    } else {
        gameState.activeCrises.forEach(crisis => {
            const li = document.createElement('li');
            li.textContent = `${crisis.name} (Severity: ${crisis.severity})`;
            li.classList.add(`crisis-${crisis.severity}`); // Add class for styling
            activeCrisesDisplay.appendChild(li);
        });
    }
}

function applyEventEffects(effects) {
    for (const key in effects) {
        if (key.startsWith('relations.')) {
            const [_, realm] = key.split('.');
            if (gameState.relations[realm] !== undefined) {
                gameState.relations[realm] += effects[key];
                gameState.relations[realm] = Math.max(0, Math.min(100, gameState.relations[realm]));
            }
        } else if (key.startsWith('reputation.')) {
            const [_, group] = key.split('.');
            if (gameState.reputation[group] !== undefined) {
                gameState.reputation[group] += effects[key];
                gameState.reputation[group] = Math.max(0, Math.min(100, gameState.reputation[group]));
            }
        } else if (gameState.resources.hasOwnProperty(key)) {
            gameState.resources[key] += effects[key];
            gameState.resources[key] = Math.max(0, gameState.resources[key]); // Clamp at 0
        } else if (key.startsWith('pope.')) { // Apply effects to Pope attributes
            const [_, attr] = key.split('.');
            if (gameState.pope[attr] !== undefined) {
                gameState.pope[attr] += effects[key];
                gameState.pope[attr] = Math.max(0, Math.min(100, gameState.pope[attr])); // Clamp Pope attributes
            }
        }
    }
    updateUI();
}

function displayEvent(event) {
    if (!event) {
        eventTitleDisplay.textContent = "A Quiet Month in Rome";
        eventDescriptionDisplay.textContent = "The Eternal City enjoys a period of calm. No major crises or opportunities present themselves this month. Focus on internal matters or await the next turn.";
        eventChoicesDisplay.innerHTML = '<p>Click "End Month" to continue.</p>';
        nextTurnButton.disabled = false;
        nextTurnButton.textContent = "End Month";
        gameState.currentEvent = null;
        return;
    }

    gameState.currentEvent = event;
    eventTitleDisplay.textContent = event.title;
    eventDescriptionDisplay.textContent = event.description;
    eventChoicesDisplay.innerHTML = '';

    event.choices.forEach((choice, index) => {
        const button = document.createElement('button');
        button.classList.add('choice-button');
        button.textContent = choice.text;
        button.addEventListener('click', () => handleChoice(event, choice));
        eventChoicesDisplay.appendChild(button);
    });
    nextTurnButton.disabled = true;
    nextTurnButton.textContent = "Awaiting Choice...";
}

function handleChoice(event, choice) {
    applyEventEffects(choice.effects);

    if (choice.onChoose && typeof choice.onChoose === 'function') {
        choice.onChoose();
    }

    if (choice.triggerFlags) {
        for (const flag in choice.triggerFlags) {
            gameState.worldFlags[flag] = choice.triggerFlags[flag];
        }
    }

    gameState.eventLog.push({
        year: gameState.year,
        month: getMonthName(gameState.month),
        description: choice.consequence || `Chose: "${choice.text}" from "${event.title}"`
    });

    eventDescriptionDisplay.textContent = choice.consequence || `You chose: "${choice.text}".`;
    eventChoicesDisplay.innerHTML = '<p>Click "End Month" to continue.</p>';
    nextTurnButton.disabled = false;
    nextTurnButton.textContent = "End Month";

    // Trigger chained events
    if (choice.nextEvent) {
        const nextLinkedEvent = gameEvents.find(e => e.id === choice.nextEvent);
        if (nextLinkedEvent) {
            setTimeout(() => displayEvent(nextLinkedEvent), 500);
            return;
        }
    }
}

function checkEventConditions(event) {
    if (!event.conditions || event.conditions.length === 0) {
        return true;
    }

    return event.conditions.every(condition => {
        switch (condition.type) {
            case 'resource':
                const currentResource = gameState.resources[condition.resource];
                if (currentResource === undefined) return false;
                const resourceCheck = eval(`${currentResource} ${condition.operator} ${condition.value}`);
                return condition.chance ? resourceCheck && Math.random() < condition.chance : resourceCheck;
            case 'flag':
                const flagExists = gameState.worldFlags[condition.flag];
                const flagCheck = condition.exists ? flagExists : !flagExists;
                return condition.chance ? flagCheck && Math.random() < condition.chance : flagCheck;
            case 'randomChance':
                return Math.random() < condition.value;
            case 'yearMin':
                return gameState.year >= condition.value;
            case 'yearMax':
                return gameState.year <= condition.value;
            case 'popeAttribute': // Check Pope's attributes
                const popeAttr = gameState.pope[condition.attribute];
                if (popeAttr === undefined) return false;
                const popeAttrCheck = eval(`${popeAttr} ${condition.operator} ${condition.value}`);
                return condition.chance ? popeAttrCheck && Math.random() < condition.chance : popeAttrCheck;
            case 'hasCrisis': // Check for a specific active crisis
                const hasCrisis = gameState.activeCrises.some(c => c.id === condition.crisisId);
                return condition.exists ? hasCrisis : !hasCrisis;
            default:
                return false;
        }
    });
}

function selectRandomEvent() {
    const availableEvents = gameEvents.filter(event => {
        // Exclude the welcome event and currently displayed event
        if (event.id === 'pontificate_begins' || event.id === gameState.currentEvent?.id) {
            return false;
        }
        // Only trigger random events if type is 'random', 'crisis_trigger', or 'opportunity' for monthly events
        if (!['random', 'crisis_trigger', 'opportunity', 'diplomatic'].includes(event.type)) {
             return false;
        }
        return checkEventConditions(event);
    });

    if (availableEvents.length > 0) {
        // Prioritize crisis triggers if conditions are met
        const crisisEvents = availableEvents.filter(e => e.type === 'crisis_trigger');
        if (crisisEvents.length > 0) {
            return crisisEvents[Math.floor(Math.random() * crisisEvents.length)];
        }
        // Then opportunities
        const opportunityEvents = availableEvents.filter(e => e.type === 'opportunity');
        if (opportunityEvents.length > 0 && Math.random() < 0.5) { // 50% chance for opportunity over random
            return opportunityEvents[Math.floor(Math.random() * opportunityEvents.length)];
        }

        // Fallback to general random events
        return availableEvents[Math.floor(Math.random() * availableEvents.length)];
    }
    return null;
}

function endMonth() {
    if (gameState.isGameOver) return; // Prevent playing after game over

    // Advance time
    gameState.month++;
    if (gameState.month > 12) {
        gameState.month = 1;
        gameState.year++;
        handleYearlyEvents();
    }

    // Apply passive changes (monthly)
    gameState.resources.wealth += 10; // Base income
    gameState.resources.piety = Math.max(0, gameState.resources.piety - 1); // Slight decay
    gameState.resources.influence = Math.max(0, gameState.resources.influence - 1); // Slight decay

    // Update and progress active crises
    progressCrises();

    // Random cardinal loyalty changes
    gameState.cardinals.forEach(c => {
        // Loyalty changes based on personality, faction, and curia support
        let loyaltyChange = Math.floor(Math.random() * 5) - 2; // +/- 2
        if (c.personality === 'Ambitious') loyaltyChange -= 1; // Ambitious cardinals decay faster without attention
        if (gameState.resources.curiaSupport < 50) loyaltyChange -= 1; // General curia discontent
        if (c.faction === 'Reformist' && gameState.resources.piety < 70) loyaltyChange += 1; // Pleased by piety
        if (c.faction === 'Imperialist' && gameState.relations['Holy Roman Empire'] < 50) loyaltyChange -= 1; // Displeased by bad imperial relations

        c.loyalty = Math.max(0, Math.min(100, c.loyalty + loyaltyChange));
    });

    // Trigger next event
    const nextEvent = selectRandomEvent();
    displayEvent(nextEvent);
    updateUI();
}

function handleYearlyEvents() {
    // Pope ages
    gameState.pope.age++;
    // Pope health decay based on age and health modifier
    let ageHealthDecay = Math.floor(gameState.pope.age / 10) - 5; // e.g., 60yr = 1 decay, 70yr = 2 decay
    gameState.resources.health = Math.max(0, gameState.resources.health - ageHealthDecay - gameState.pope.healthModifier);

    // Add yearly summary to ledger
    gameState.eventLog.push({
        year: gameState.year,
        month: 'Annual Summary',
        description: `The year ${gameState.year} concludes. Your Holiness is ${gameState.pope.age} years old. Your health is ${gameState.resources.health}.`
    });

    // Check for game over (Pope dies)
    if (gameState.resources.health <= 0) {
        gameOver("Your Holiness has passed away! A new conclave awaits...");
        return;
    }
}

function gameOver(message) {
    if (gameState.isGameOver) return; // Prevent multiple game over triggers
    gameState.isGameOver = true;
    alert(`Game Over! ${message}`);
    // Here you would implement the Conclave screen or a final score screen
    // For now, we'll just reload the page to simulate a new game
    location.reload();
}

function getMonthName(monthNum) {
    const months = ["January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"];
    return months[monthNum - 1];
}

// --- Crisis System Logic ---
function addCrisis(id, severity, durationMonths, type) {
    // Severity: 'low', 'medium', 'high'
    // Duration: How many months until it resolves (or escalates if not handled)
    gameState.activeCrises.push({
        id: id,
        name: id, // For now, use ID as name, but could be specific text
        severity: severity,
        initialSeverity: severity, // Keep track of original
        duration: durationMonths,
        progress: 0, // How much has it been addressed
        type: type, // e.g., 'Heresy', 'War', 'Plague', 'Financial'
        escalationCounter: 0, // How many turns it's gone unaddressed
    });
    updateActiveCrisesDisplay();
    addGameLog(`A new crisis has emerged: ${id} (${severity} severity).`);
}

function progressCrises() {
    const resolvedCrises = [];
    gameState.activeCrises.forEach(crisis => {
        // Crises decay naturally over time if not addressed
        crisis.duration--;
        crisis.escalationCounter++;

        // Example: Penalties for unaddressed crises
        if (crisis.escalationCounter % 3 === 0) { // Every 3 months
            if (crisis.severity === 'medium') {
                gameState.resources.wealth -= 5;
                gameState.resources.piety -= 2;
                addGameLog(`${crisis.name} continues to fester. (-5 Wealth, -2 Piety)`);
            } else if (crisis.severity === 'high') {
                gameState.resources.wealth -= 15;
                gameState.resources.piety -= 5;
                gameState.resources.influence -= 5;
                addGameLog(`${crisis.name} worsens! (-15 Wealth, -5 Piety, -5 Influence)`);
            }
        }

        if (crisis.duration <= 0) {
            resolvedCrises.push(crisis.id);
            addGameLog(`${crisis.name} has resolved (or faded).`);
            // Add specific outcomes based on how it was handled or its final severity
        }
    });

    gameState.activeCrises = gameState.activeCrises.filter(crisis => !resolvedCrises.includes(crisis.id));
    updateActiveCrisesDisplay();
}

// --- Panel Management Functions ---

function showPanel(panelElement) {
    mainGameDisplay.classList.add('hidden');
    curiaPanel.classList.add('hidden');
    decreesPanel.classList.add('hidden');
    mapPanel.classList.add('hidden');
    ledgerPanel.classList.add('hidden');

    panelElement.classList.remove('hidden');

    if (panelElement === curiaPanel) {
        populateCuriaPanel();
    } else if (panelElement === ledgerPanel) {
        populateLedgerPanel();
    } else if (panelElement === decreesPanel) {
        resetDecreePanel();
    }
    // Map panel or others could have their own init
}

function hideAllPanelsAndShowMain() {
    curiaPanel.classList.add('hidden');
    decreesPanel.classList.add('hidden');
    mapPanel.classList.add('hidden');
    ledgerPanel.classList.add('hidden');
    mainGameDisplay.classList.remove('hidden');
}

// --- Curia Panel Logic ---
function populateCuriaPanel() {
    curiaCardinalListDisplay.innerHTML = '';
    gameState.cardinals.forEach(cardinal => {
        const li = document.createElement('li');
        li.dataset.cardinalId = cardinal.id;
        li.textContent = `${cardinal.name} (${cardinal.loyalty} Loyalty, ${cardinal.faction})`;
        li.addEventListener('click', () => selectCardinal(cardinal.id));
        curiaCardinalListDisplay.appendChild(li);
    });
    clearSelectedCardinal(); // Clear detail view when opening panel
}

function selectCardinal(cardinalId) {
    const cardinal = gameState.cardinals.find(c => c.id === cardinalId);
    if (!cardinal) return;

    gameState.selectedCardinal = cardinal;
    selectedCardinalName.textContent = cardinal.name;
    selectedCardinalDescription.textContent = `Age: ${cardinal.age}. ${cardinal.personality} personality.`;
    selectedCardinalLoyalty.textContent = cardinal.loyalty;
    selectedCardinalInfluence.textContent = cardinal.influence;
    selectedCardinalFaction.textContent = cardinal.faction;
    selectedCardinalPersonality.textContent = cardinal.personality;
    selectedCardinalTraits.textContent = cardinal.traits.join(', ') || 'None';

    document.querySelectorAll('#curia-cardinal-list li').forEach(li => {
        li.classList.remove('selected');
    });
    document.querySelector(`#curia-cardinal-list li[data-cardinal-id="${cardinalId}"]`).classList.add('selected');

    // Show/hide cardinal actions based on conditions
    bribeCardinalButton.classList.remove('hidden');
    promoteCardinalButton.classList.remove('hidden');
    investigateCardinalButton.classList.remove('hidden');

    // Example condition for actions:
    bribeCardinalButton.disabled = (gameState.resources.wealth < 20);
    promoteCardinalButton.disabled = (gameState.resources.influence < 10);
    investigateCardinalButton.disabled = (gameState.resources.theology < 5); // Or require a 'secret' stat
}

function clearSelectedCardinal() {
    gameState.selectedCardinal = null;
    selectedCardinalName.textContent = "Select a Cardinal";
    selectedCardinalDescription.textContent = "Click on a cardinal in the list to see their details.";
    selectedCardinalLoyalty.textContent = "--";
    selectedCardinalInfluence.textContent = "--";
    selectedCardinalFaction.textContent = "--";
    selectedCardinalPersonality.textContent = "--";
    selectedCardinalTraits.textContent = "--";
    bribeCardinalButton.classList.add('hidden');
    promoteCardinalButton.classList.add('hidden');
    investigateCardinalButton.classList.add('hidden');
    document.querySelectorAll('#curia-cardinal-list li').forEach(li => {
        li.classList.remove('selected');
    });
}

function bribeCardinal() {
    if (!gameState.selectedCardinal) return;
    const cost = 20;
    if (gameState.resources.wealth >= cost) {
        gameState.resources.wealth -= cost;
        const loyaltyGain = 15 + Math.floor(gameState.pope.diplomacy / 10); // Pope's diplomacy helps
        gameState.selectedCardinal.loyalty = Math.min(100, gameState.selectedCardinal.loyalty + loyaltyGain);
        addGameLog(`You discreetly sent funds to Cardinal ${gameState.selectedCardinal.name}, increasing his loyalty.`);
        updateUI();
        selectCardinal(gameState.selectedCardinal.id);
    } else {
        alert("Not enough wealth to bribe this cardinal!");
    }
}

function promoteCardinal() {
    if (!gameState.selectedCardinal) return;
    const cost = 10; // Influence cost
    if (gameState.resources.influence >= cost) {
        if (gameState.selectedCardinal.isPromoted) {
            alert("This cardinal is already promoted!");
            return;
        }
        gameState.resources.influence -= cost;
        gameState.selectedCardinal.isPromoted = true;
        gameState.selectedCardinal.loyalty = Math.min(100, gameState.selectedCardinal.loyalty + 20);
        gameState.resources.curiaSupport = Math.min(100, gameState.resources.curiaSupport + 5); // General curia support from promoting a good cardinal
        addGameLog(`Cardinal ${gameState.selectedCardinal.name} has been promoted within the Curia, bolstering his loyalty.`);
        updateUI();
        selectCardinal(gameState.selectedCardinal.id);
    } else {
        alert("Not enough influence to promote this cardinal!");
    }
}

function investigateCardinal() {
    if (!gameState.selectedCardinal) return;
    const cost = 5; // Theology/Wisdom cost
    if (gameState.resources.theology >= cost) {
        gameState.resources.theology -= cost;
        addGameLog(`You initiated an investigation into Cardinal ${gameState.selectedCardinal.name}'s affairs.`);
        // Simulate finding a secret or not
        if (Math.random() < 0.5) { // 50% chance to find a secret
            const secrets = ["a hidden mistress", "secret ties to the Holy Roman Emperor", "embezzling Church funds", "a gambling addiction"];
            gameState.selectedCardinal.secret = secrets[Math.floor(Math.random() * secrets.length)];
            addGameLog(`You discovered Cardinal ${gameState.selectedCardinal.name}'s secret: ${gameState.selectedCardinal.secret}. This could be useful.`);
            // Finding a secret could unlock new actions or give leverage
        } else {
            addGameLog(`Your investigation into Cardinal ${gameState.selectedCardinal.name} yielded no significant findings.`);
        }
        updateUI();
        selectCardinal(gameState.selectedCardinal.id); // Refresh view to show potential secret
    } else {
        alert("Not enough theology/wisdom to conduct a thorough investigation!");
    }
}

// --- Decrees Panel Logic ---
let currentDecreeType = null;
const DECREE_COSTS = {
    'doctrine': { wealth: 50, curiaSupport: 5 }, // Curia supports doctrinal clarity
    'condemn': { wealth: 70, piety: 10 },
    'excommunicate': { wealth: 100, influence: 10, curiaSupport: -10 }, // Cardinals might object
    'crusade': { wealth: 150, piety: 20, influence: 20 }
};

function resetDecreePanel() {
    decreeOptions.classList.remove('hidden');
    decreeDetails.classList.add('hidden');
    decreeTextarea.value = '';
    currentDecreeType = null;
    decreeCostDisplay.textContent = 'Cost: --';
    issueDecreeButton.disabled = true;
}

decreeOptions.querySelectorAll('.game-button').forEach(button => {
    button.addEventListener('click', (e) => {
        currentDecreeType = e.target.dataset.decreeType;
        decreeTypeName.textContent = currentDecreeType.charAt(0).toUpperCase() + currentDecreeType.slice(1);

        const costs = DECREE_COSTS[currentDecreeType];
        let costText = "";
        for (const res in costs) {
            costText += `${costs[res]} ${res.charAt(0).toUpperCase() + res.slice(1)}, `;
        }
        decreeCostDisplay.textContent = `Costs: ${costText.slice(0, -2)}.`; // Remove trailing comma and space

        decreeOptions.classList.add('hidden');
        decreeDetails.classList.remove('hidden');
        issueDecreeButton.disabled = false; // Enable issue button once type is selected
    });
});

issueDecreeButton.addEventListener('click', () => {
    const decreeContent = decreeTextarea.value.trim();
    if (!decreeContent) {
        alert("Please write your decree!");
        return;
    }
    if (!currentDecreeType) {
        alert("Please select a decree type first.");
        return;
    }

    const costs = DECREE_COSTS[currentDecreeType];
    let canAfford = true;
    for (const res in costs) {
        if (gameState.resources[res] === undefined || gameState.resources[res] < costs[res]) {
            canAfford = false;
            break;
        }
    }

    if (!canAfford) {
        alert("You cannot afford this decree based on current resources!");
        return;
    }

    let effects = {};
    let consequence = `You issued a new decree regarding ${currentDecreeType}: "${decreeContent.substring(0, Math.min(decreeContent.length, 50))}..."`;

    // Apply costs
    for (const res in costs) {
        gameState.resources[res] -= costs[res];
    }

    switch (currentDecreeType) {
        case 'doctrine':
            effects = { theology: 20 + Math.floor(gameState.pope.wisdom / 5), piety: 10, prestige: 10 };
            consequence += " It will shape the future of Church theology.";
            break;
        case 'condemn':
            effects = { piety: 25, influence: 10, curiaSupport: 5, wealth: -30, prestige: 15 };
            consequence += " Heretics across Christendom tremble!";
            break;
        case 'excommunicate':
            effects = { influence: 30 + Math.floor(gameState.pope.diplomacy / 5), prestige: 20, curiaSupport: -15, wealth: -50, 'reputation.Royalty': -10 };
            consequence += " A powerful ruler has been cast out of the Church. This is a bold move!";
            // In a full game, would need to select who to excommunicate and impact relations
            break;
        case 'crusade':
            effects = { piety: 40, influence: 25, curiaSupport: 10, wealth: -150, prestige: 30, 'reputation.Commoners': 20 };
            consequence += " The call for a new Crusade echoes across Europe! God wills it!";
            // This would trigger a complex Crusade mini-game/series of events
            addCrisis('Crusade for Jerusalem', 'high', 12, 'Military'); // Example: Starts a year-long military crisis
            break;
    }

    applyEventEffects(effects);
    addGameLog(consequence);
    hideAllPanelsAndShowMain();
    updateUI();
});


// --- Ledger Panel Logic ---
function populateLedgerPanel() {
    ledgerIncomeDisplay.textContent = 10;
    ledgerExpensesDisplay.textContent = 5;
    ledgerBalanceDisplay.textContent = gameState.resources.wealth;

    ledgerEventLogDisplay.innerHTML = '';
    gameState.eventLog.slice().reverse().forEach(log => { // Reverse to show newest at top
        const li = document.createElement('li');
        li.textContent = `${log.month} ${log.year}: ${log.description}`;
        ledgerEventLogDisplay.appendChild(li);
    });
}

// Utility for game log
function addGameLog(description) {
    gameState.eventLog.push({
        year: gameState.year,
        month: getMonthName(gameState.month),
        description: description
    });
}


// --- Event Listeners ---
nextTurnButton.addEventListener('click', endMonth);
openCuriaButton.addEventListener('click', () => showPanel(curiaPanel));
openDecreesButton.addEventListener('click', () => showPanel(decreesPanel));
openMapButton.addEventListener('click', () => showPanel(mapPanel));
openLedgerButton.addEventListener('click', () => showPanel(ledgerPanel));

closePanelButtons.forEach(button => {
    button.addEventListener('click', hideAllPanelsAndShowMain);
});

// Specific action listeners for Curia Panel
bribeCardinalButton.addEventListener('click', bribeCardinal);
promoteCardinalButton.addEventListener('click', promoteCardinal);
investigateCardinalButton.addEventListener('click', investigateCardinal);


// --- Initialization ---
function initializeGame() {
    initializeCardinals();
    gameState.eventLog.push({
        year: gameState.year,
        month: getMonthName(gameState.month),
        description: "Welcome to Habeas Papam! Your reign begins."
    });
    updateUI();
    displayEvent(gameEvents.find(e => e.id === 'pontificate_begins'));
    nextTurnButton.disabled = true;
    nextTurnButton.textContent = "Awaiting Choice...";
}

// Run the game initialization when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeGame);
