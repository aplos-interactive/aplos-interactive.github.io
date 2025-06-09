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
        curiaSupport: 60, // Represents support from the College of Cardinals
        theology: 50, // Knowledge and understanding of doctrine
        health: 80, // Pope's current health
        prestige: 20, // General standing and reputation
    },
    cardinals: [],
    currentEvent: null,
    selectedCardinal: null,
    eventLog: [], // Renamed from gameLog for clarity in Ledger

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

    // Conclave specific state (NEW)
    conclave: {
        isActive: false,
        round: 0,
        candidates: [], // {id: cardinalId, votes: 0, piety: 0, influence: 0}
        votesRequired: 0,
        cardinalVotes: {}, // {cardinalId: candidateId}
    },

    // Crusade specific state (NEW)
    crusade: {
        isActive: false,
        target: null, // e.g., 'Jerusalem', 'Albigensian Heresy'
        name: null,
        phase: 'Preparation', // 'Preparation', 'March', 'Campaign', 'Return'
        progress: 0, // Percentage
        armyStrength: 0,
        supplies: 0,
        morale: 100,
        leaderCardinalId: null, // Cardinal appointed as Legate
        eventLog: [],
    },

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

// Reputation Displays
const reputationDisplays = {
    royalty: document.getElementById('reputation-royalty'),
    clergy: document.getElementById('reputation-clergy'),
    commoners: document.getElementById('reputation-commoners'),
    merchants: document.getElementById('reputation-merchants'),
};


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
const conclavePanel = document.getElementById('conclave-panel'); // NEW
const crusadePanel = document.getElementById('crusade-panel'); // NEW

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
const selectedCardinalFaction = document.getElementById('selected-cardinal-faction');
const selectedCardinalPersonality = document.getElementById('selected-cardinal-personality');
const selectedCardinalTraits = document.getElementById('selected-cardinal-traits');
const selectedCardinalSkills = document.getElementById('selected-cardinal-skills'); // NEW
const selectedCardinalSecretDisplay = document.getElementById('selected-cardinal-secret-display'); // NEW
const selectedCardinalSecret = document.getElementById('selected-cardinal-secret'); // NEW

const bribeCardinalButton = document.getElementById('bribe-cardinal-button');
const promoteCardinalButton = document.getElementById('promote-cardinal-button');
const investigateCardinalButton = document.getElementById('investigate-cardinal-button');

// Decrees Panel Elements
const decreeOptions = document.getElementById('decree-options');
const decreeDetails = document.getElementById('decree-details');
const decreeTypeName = document.getElementById('decree-type-name');
const decreeCostDisplay = document.getElementById('decree-cost-display');
const decreeTargetSelection = document.getElementById('decree-target-selection'); // NEW
const decreeTargetSelect = document.getElementById('decree-target'); // NEW
const decreeTextarea = document.getElementById('decree-text');
const issueDecreeButton = document.getElementById('issue-decree-button');

// Ledger Panel Elements
const ledgerIncomeDisplay = document.getElementById('ledger-income');
const ledgerExpensesDisplay = document.getElementById('ledger-expenses');
const ledgerBalanceDisplay = document.getElementById('ledger-balance');
const ledgerEventLogDisplay = document.getElementById('ledger-event-log');

// Conclave Panel Elements (NEW)
const conclaveRoundDisplay = document.getElementById('conclave-round');
const candidate1VotesDisplay = document.getElementById('candidate1-votes');
const candidate2VotesDisplay = document.getElementById('candidate2-votes');
const conclaveRequiredVotesDisplay = document.getElementById('conclave-required-votes');
const conclaveCardinalsDisplay = document.getElementById('conclave-cardinals-display');
const conclaveLobbyButton = document.getElementById('conclave-lobby-button');
const conclaveIntrigueButton = document.getElementById('conclave-intrigue-button');
const conclaveVoteButton = document.getElementById('conclave-vote-button');

// Crusade Panel Elements (NEW)
const crusadeNameDisplay = document.getElementById('crusade-name-display');
const crusadePhaseDisplay = document.getElementById('crusade-phase');
const crusadeProgressDisplay = document.getElementById('crusade-progress');
const crusadeArmyStrengthDisplay = document.getElementById('crusade-army-strength');
const crusadeSuppliesDisplay = document.getElementById('crusade-supplies');
const crusadeMoraleDisplay = document.getElementById('crusade-morale');
const crusadeEventLogDisplay = document.getElementById('crusade-event-log');
const crusadeRaiseFundsButton = document.getElementById('crusade-raise-funds');
const crusadeRecruitTroopsButton = document.getElementById('crusade-recruit-troops');
const crusadeEmbarkButton = document.getElementById('crusade-embark');
const crusadeActionsDiv = document.getElementById('crusade-actions');


// --- Game Data ---

// Cardinal structure (expanded significantly)
const CARDINAL_PERSONALITIES = ['Pious', 'Ambitious', 'Loyal', 'Scheming', 'Zealous', 'Cautious', 'Diplomatic', 'Scholarly', 'Martial', 'Greedy', 'Honorable'];
const CARDINAL_FACTIONS = ['Italian', 'French', 'Imperialist', 'Reformist', 'Old Guard', 'Spanish', 'English'];
const CARDINAL_NAMES = [
    "Pietro Orsini", "Guillaume Dubois", "Otto von Braunschweig", "Rodrigo Díaz",
    "Thomas Becket", "Giovanni Colonna", "Henry of Blois", "Peter Damian",
    "Al-Idrisi", "Olaf Magnusson", "Stefano Conti", "Robert de Courtenay",
    "Dietrich von Wettin", "Jaime de Aragon", "William of York", "Riccardo Annibaldi"
];

const REALMS_FOR_TARGETING = ['Holy Roman Empire', 'France', 'England', 'Naples', 'Castile', 'Aragon', 'Portugal', 'Byzantine Empire', 'Poland', 'Hungary'];
const HERESIES_FOR_TARGETING = ['Catharism', 'Waldensianism', 'Bogomilism', 'Lollardy']; // Can add more as game progresses

function createCardinal(name, initialTraits = []) {
    const personality = CARDINAL_PERSONALITIES[Math.floor(Math.random() * CARDINAL_PERSONALITIES.length)];
    const faction = CARDINAL_FACTIONS[Math.floor(Math.random() * CARDINAL_FACTIONS.length)];
    const loyalty = Math.floor(Math.random() * 40) + 60; // 60-100
    const influence = Math.floor(Math.random() * 10) + 1; // 1-10 (personal influence)
    const age = Math.floor(Math.random() * 30) + 40; // 40-70
    const skills = { // Cardinal specific skills
        theology: Math.floor(Math.random() * 10) + 1,
        diplomacy: Math.floor(Math.random() * 10) + 1,
        intrigue: Math.floor(Math.random() * 10) + 1,
        stewardship: Math.floor(Math.random() * 10) + 1,
        martial: Math.floor(Math.random() * 10) + 1, // For legates leading armies
    };

    const traits = [...initialTraits];
    if (!traits.includes(personality)) traits.push(personality); // Ensure personality is a trait
    if (!traits.includes(faction)) traits.push(faction); // Ensure faction is a trait

    return {
        id: crypto.randomUUID(),
        name: name,
        age: age,
        loyalty: loyalty, // Towards the current Pope
        influence: influence, // Personal influence (votes, actions)
        personality: personality,
        faction: faction,
        traits: traits,
        skills: skills,
        isPromoted: false, // Can hold a higher office (e.g., Cardinal-Dean)
        secret: null, // Placeholder for secrets discovered through investigation
        popeCandidateScore: 0, // For Conclave
    };
}

// Initial Cardinals
function initializeCardinals() {
    gameState.cardinals = [];
    for (let i = 0; i < 15; i++) { // Start with a decent number of cardinals
        gameState.cardinals.push(createCardinal(CARDINAL_NAMES[i % CARDINAL_NAMES.length]));
    }
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
            { type: 'resource', resource: 'theology', operator: '<', value: 60, chance: 0.1 },
            { type: 'flag', flag: 'cathar_heresy_active', exists: false, chance: 1.0 } // Only trigger if not already active
        ],
        choices: [
            {
                text: "Declare a Crusade against the Cathars.",
                effects: { piety: 20, curiaSupport: 10, influence: 15, wealth: -50, 'relations.France': -5, prestige: 20 },
                consequence: "A Holy War is declared against the Cathars. Many knights flock to the banners, but the conflict will be long and bloody.",
                onChoose: () => {
                    startCrusade('Albigensian Crusade', 'Albigensian Heresy'); // Trigger Crusade mini-game
                    gameState.worldFlags['cathar_heresy_active'] = true;
                }
            },
            {
                text: "Send a delegation of learned monks to preach and debate.",
                effects: { theology: 15, piety: -5, influence: 5, wealth: -20, 'relations.France': 5, 'reputation.Clergy': 10 },
                consequence: "The monks engage in fierce debates, winning some over, but the heresy persists. It will take time.",
                onChoose: () => {
                    addCrisis('Cathar Heresy', 'low', 3, 'Heresy'); // Add a less severe crisis
                    gameState.worldFlags['cathar_heresy_active'] = true;
                }
            },
            {
                text: "Ignore it for now; local bishops should handle it.",
                effects: { piety: -15, curiaSupport: -10, influence: -10, 'relations.France': -5, 'reputation.Commoners': -10 },
                consequence: "The heresy spreads further, and your authority is questioned. It may become a major threat.",
                onChoose: () => {
                    addCrisis('Cathar Heresy', 'high', 10, 'Heresy');
                    gameState.worldFlags['cathar_heresy_active'] = true;
                }
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
            { type: 'flag', flag: 'emperor_excommunicated', exists: false, chance: 0.3 },
            { type: 'flag', flag: 'louis_marriage_resolved', exists: false, chance: 1.0 }
        ],
        choices: [
            {
                text: "Grant the annulment to maintain French loyalty.",
                effects: { influence: 20, piety: -15, curiaSupport: -10, 'relations.France': 30, 'relations.England': -10, 'reputation.Royalty': 15, 'reputation.Clergy': -10 },
                consequence: "Louis is pleased, but other rulers and devout cardinals are scandalized. You have bought a king's favor at a moral cost.",
                triggerFlags: { 'louis_marriage_resolved': true, 'france_loyal': true }
            },
            {
                text: "Deny the annulment, upholding the sanctity of marriage.",
                effects: { piety: 20, influence: -15, curiaSupport: 5, 'relations.France': -40, prestige: 10, 'reputation.Clergy': 15, 'reputation.Royalty': -10 },
                consequence: "The Church's moral standing is reinforced, but France becomes openly hostile. Prepare for potential conflict.",
                triggerFlags: { 'louis_marriage_resolved': true, 'france_hostile': true }
            },
            {
                text: "Delegate the decision to a special council, buying time.",
                effects: { curiaSupport: 10, wealth: -20, theology: 5, 'reputation.Clergy': 5 },
                consequence: "The decision is delayed, but Louis grows impatient. The council's decision is uncertain, and you've spent resources for the debate.",
                triggerFlags: { 'louis_marriage_resolved': false, 'louis_impatient': true } // Could lead to another event later
            }
        ]
    },
    {
        id: 'empty_treasury',
        type: 'crisis',
        title: "The Coffers are Empty",
        description: "Decades of lavish spending and expensive wars have left the Holy See's treasury depleted. Urgent action is needed to secure funds.",
        conditions: [
            { type: 'resource', resource: 'wealth', operator: '<', value: 100, chance: 1.0 },
            { type: 'hasCrisis', crisisId: 'Empty Treasury', exists: false, chance: 1.0 }
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
        ],
        onChoose: () => addCrisis('Empty Treasury', 'medium', 6, 'Financial') // Add as a crisis so it doesn't repeat immediately
    },
    {
        id: 'papal_library_fire',
        type: 'crisis',
        title: "Fire in the Apostolic Library!",
        description: "A section of the Vatican library has caught fire! Priceless manuscripts are at risk.",
        conditions: [{ type: 'randomChance', value: 0.03 }], // Reduced chance for rarity
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
        conditions: [{ type: 'randomChance', value: 0.08, yearMin: 1120 }], // Appears later
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
    {
        id: 'papal_election_conclave', // This is no longer a normal event, but a trigger for the Conclave system
        type: 'system_trigger',
        title: "Habemus Papam!",
        description: "The Sacred College has elected a new Vicar of Christ!",
        choices: [
            {
                text: "Begin your pontificate.",
                effects: {},
                consequence: "A new era for the Church begins."
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

    // Update Resources
    for (const resource in gameState.resources) {
        if (resourceDisplays[resource]) {
            resourceDisplays[resource].textContent = gameState.resources[resource];
        }
    }

    // Update Reputation
    for (const group in gameState.reputation) {
        if (reputationDisplays[group]) {
            reputationDisplays[group].textContent = gameState.reputation[group];
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
        li.textContent = `${cardinal.name} (${cardinal.loyalty})`;
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
            li.textContent = `${crisis.name} (Severity: ${crisis.severity.charAt(0).toUpperCase() + crisis.severity.slice(1)})`;
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

    addGameLog(choice.consequence || `Chose: "${choice.text}" from "${event.title}"`);

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
            case 'crusadeActive': // Check if a crusade is active
                return gameState.crusade.isActive === condition.value;
            default:
                return false;
        }
    });
}

function selectRandomEvent() {
    const availableEvents = gameEvents.filter(event => {
        // Exclude the welcome event and currently displayed event, and system triggers
        if (event.id === 'pontificate_begins' || event.id === gameState.currentEvent?.id || event.type === 'system_trigger') {
            return false;
        }
        // Only trigger random events if type is 'random', 'crisis_trigger', or 'opportunity' for monthly events
        if (!['random', 'crisis_trigger', 'opportunity', 'diplomatic', 'crisis'].includes(event.type)) {
             return false;
        }
        return checkEventConditions(event);
    });

    if (availableEvents.length > 0) {
        // Prioritize crisis triggers if conditions are met
        const crisisTriggers = availableEvents.filter(e => e.type === 'crisis_trigger');
        if (crisisTriggers.length > 0) {
            return crisisTriggers[Math.floor(Math.random() * crisisTriggers.length)];
        }
        // Then opportunities
        const opportunityEvents = availableEvents.filter(e => e.type === 'opportunity');
        if (opportunityEvents.length > 0 && Math.random() < 0.4) { // 40% chance for opportunity over random
            return opportunityEvents[Math.floor(Math.random() * opportunityEvents.length)];
        }
        // Then existing crisis events (if they repeat from conditions, like Empty Treasury)
        const crisisEvents = availableEvents.filter(e => e.type === 'crisis');
        if (crisisEvents.length > 0 && Math.random() < 0.6) { // 60% chance for existing crisis
            return crisisEvents[Math.floor(Math.random() * crisisEvents.length)];
        }

        // Fallback to general random/diplomatic events
        const generalEvents = availableEvents.filter(e => ['random', 'diplomatic'].includes(e.type));
        if (generalEvents.length > 0) {
            return generalEvents[Math.floor(Math.random() * generalEvents.length)];
        }
    }
    return null;
}

function endMonth() {
    if (gameState.isGameOver || gameState.conclave.isActive || gameState.crusade.isActive) {
        // Disable next turn button if conclave or crusade is active
        // Conclave and Crusade will have their own progression buttons
        return;
    }

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

    // Cardinal loyalty changes
    gameState.cardinals.forEach(c => {
        let loyaltyChange = Math.floor(Math.random() * 5) - 2; // +/- 2
        if (c.personality === 'Ambitious') loyaltyChange -= Math.floor(Math.random() * 2); // Ambitious cardinals decay faster
        if (c.personality === 'Loyal') loyaltyChange += Math.floor(Math.random() * 2); // Loyal cardinals maintain loyalty
        if (gameState.resources.curiaSupport < 50) loyaltyChange -= 1; // General curia discontent
        if (c.faction === 'Reformist' && gameState.resources.piety < 70) loyaltyChange -= 1; // Reformists unhappy with low piety
        if (c.faction === 'Imperialist' && gameState.relations['Holy Roman Empire'] < 50) loyaltyChange -= 1; // Imperialists unhappy with bad imperial relations

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
    addGameLog(`The year ${gameState.year} concludes. Your Holiness is ${gameState.pope.age} years old. Your health is ${gameState.resources.health}.`);

    // Check for game over (Pope dies)
    if (gameState.resources.health <= 0) {
        triggerConclave("Your Holiness has passed away! The Holy See is vacant.");
        return;
    }
}

function triggerConclave(message) {
    if (gameState.conclave.isActive) return;

    addGameLog(message);
    addGameLog("A Papal Conclave has been called to elect a new Pope.");

    gameState.isGameOver = true; // Pause normal game progression
    gameState.conclave.isActive = true;
    gameState.conclave.round = 0;
    gameState.conclave.candidates = [];
    gameState.conclave.cardinalVotes = {};

    // Select potential candidates (e.g., influential cardinals)
    const eligibleCardinals = gameState.cardinals.filter(c => c.age < 70 && c.loyalty > 50 && c.influence > 3);
    if (eligibleCardinals.length < 2) { // Fallback if not enough cardinals
        alert("Not enough suitable cardinals for a conclave! Game over due to lack of succession.");
        location.reload(); // Simple restart for now
        return;
    }

    // Pick 2-3 prominent candidates
    eligibleCardinals.sort((a, b) => (b.loyalty + b.influence + b.skills.theology) - (a.loyalty + a.influence + a.skills.theology));
    gameState.conclave.candidates = eligibleCardinals.slice(0, Math.min(eligibleCardinals.length, 3)).map(c => ({
        id: c.id,
        name: c.name,
        votes: 0,
        piety: c.loyalty, // Using loyalty as a proxy for 'pious' for voting
        influence: c.influence, // Using influence as direct influence on other cardinals
        personality: c.personality,
        faction: c.faction,
    }));

    // Minimum votes for election (e.g., 2/3 of cardinals + 1)
    gameState.conclave.votesRequired = Math.ceil((gameState.cardinals.length * 2 / 3) + 1);
    if (gameState.conclave.votesRequired > gameState.cardinals.length) { // Ensure it's not more than total cardinals
        gameState.conclave.votesRequired = gameState.cardinals.length;
    }

    showPanel(conclavePanel);
    startConclaveRound();
}

function startConclaveRound() {
    gameState.conclave.round++;
    addGameLog(`Conclave Round ${gameState.conclave.round} begins.`);

    conclaveRoundDisplay.textContent = gameState.conclave.round;
    conclaveRequiredVotesDisplay.textContent = gameState.conclave.votesRequired;

    // Reset votes for new round
    gameState.conclave.candidates.forEach(c => c.votes = 0);
    gameState.conclave.cardinalVotes = {}; // Clear previous round's votes

    // Update cardinal list in conclave panel and enable actions
    populateConclaveCardinals();

    candidate1VotesDisplay.textContent = '0'; // Clear for simplicity
    candidate2VotesDisplay.textContent = '0'; // Clear for simplicity
    // More complex UI would show all candidates

    conclaveLobbyButton.disabled = false;
    conclaveIntrigueButton.disabled = false;
    conclaveVoteButton.disabled = false;

    conclaveLobbyButton.textContent = `Lobby Cardinals (👑-${Math.ceil(gameState.conclave.round * 0.5)})`;
    conclaveIntrigueButton.textContent = `Engage in Intrigue (💰-${Math.ceil(gameState.conclave.round * 0.5)})`;
    if (gameState.resources.influence < Math.ceil(gameState.conclave.round * 0.5)) conclaveLobbyButton.disabled = true;
    if (gameState.resources.wealth < Math.ceil(gameState.conclave.round * 0.5)) conclaveIntrigueButton.disabled = true;

    displayEvent({ // Custom event display for Conclave state
        title: `The Conclave: Round ${gameState.conclave.round}`,
        description: `The cardinals are assembled to elect a new Pope. You must influence their votes. There are ${gameState.cardinals.length} Cardinals present. A candidate needs ${gameState.conclave.votesRequired} votes to be elected.`,
        choices: [] // No choices on main screen during conclave
    });
}

function populateConclaveCardinals() {
    conclaveCardinalsDisplay.innerHTML = '';
    gameState.cardinals.forEach(cardinal => {
        const li = document.createElement('li');
        li.dataset.cardinalId = cardinal.id;
        let voteText = gameState.conclave.cardinalVotes[cardinal.id] ? `(Voted for ${gameState.conclave.candidates.find(c => c.id === gameState.conclave.cardinalVotes[cardinal.id])?.name || 'Unknown'})` : '(Undecided)';
        li.innerHTML = `<span>${cardinal.name} (${cardinal.loyalty} Loyalty, ${cardinal.influence} Influence)</span> <span>${voteText}</span>`;
        if (gameState.conclave.candidates.some(c => c.id === cardinal.id)) {
            li.classList.add('candidate');
        }
        conclaveCardinalsDisplay.appendChild(li);
    });
}

function conductConclaveVote() {
    conclaveVoteButton.disabled = true; // Disable until next round or election
    conclaveLobbyButton.disabled = true;
    conclaveIntrigueButton.disabled = true;

    // Simulate cardinal voting
    gameState.cardinals.forEach(cardinal => {
        // Simple voting logic: cardinals lean towards candidates based on loyalty, faction, and their own attributes
        let bestCandidate = null;
        let bestScore = -Infinity;

        gameState.conclave.candidates.forEach(candidate => {
            let score = candidate.influence * 2; // Candidates own influence
            score += candidate.piety; // Candidates piety
            score += cardinal.loyalty / 10; // Cardinal's loyalty to previous pope might carry over
            score += (cardinal.faction === candidate.faction) ? 20 : 0; // Strong faction bonus
            score += (cardinal.personality === candidate.personality) ? 10 : 0; // Shared personality bonus

            // Random variance
            score += Math.random() * 20 - 10; // +/- 10 random

            if (score > bestScore) {
                bestScore = score;
                bestCandidate = candidate.id;
            }
        });
        if (bestCandidate) {
            gameState.conclave.cardinalVotes[cardinal.id] = bestCandidate;
            gameState.conclave.candidates.find(c => c.id === bestCandidate).votes++;
        }
    });

    let electedPope = null;
    gameState.conclave.candidates.forEach(candidate => {
        if (candidate.votes >= gameState.conclave.votesRequired) {
            electedPope = candidate;
        }
    });

    updateConclaveUI();

    if (electedPope) {
        endConclave(electedPope);
    } else {
        addGameLog(`No Pope elected in Round ${gameState.conclave.round}. A new round will begin.`);
        setTimeout(startConclaveRound, 2000); // Start next round after a delay
    }
}

function updateConclaveUI() {
    gameState.conclave.candidates.forEach((candidate, index) => {
        if (index === 0) candidate1VotesDisplay.textContent = `${candidate.name}: ${candidate.votes}`;
        if (index === 1) candidate2VotesDisplay.textContent = `${candidate.name}: ${candidate.votes}`; // Assuming max 2 for display simplicity
        // Extend for more candidates if needed
    });
    populateConclaveCardinals(); // Update cardinal vote display
}

function lobbyConclaveCardinals() {
    const cost = Math.ceil(gameState.conclave.round * 0.5);
    if (gameState.resources.influence < cost) {
        alert("Not enough Influence to lobby effectively!");
        return;
    }
    gameState.resources.influence -= cost;
    addGameLog(`You spent ${cost} Influence lobbying cardinals.`);

    // Effect of lobbying: increase loyalty for a random subset of cardinals
    const cardinalsToInfluence = gameState.cardinals.filter(c => Math.random() < 0.5); // 50% chance
    cardinalsToInfluence.forEach(c => {
        c.loyalty = Math.min(100, c.loyalty + (Math.floor(Math.random() * 10) + 5)); // +5 to +14 loyalty
        addGameLog(`Cardinal ${c.name}'s loyalty increased.`);
    });
    updateUI();
    updateConclaveUI();
}

function intrigueConclave() {
    const cost = Math.ceil(gameState.conclave.round * 0.5);
    if (gameState.resources.wealth < cost) {
        alert("Not enough Wealth for intrigue!");
        return;
    }
    gameState.resources.wealth -= cost;
    addGameLog(`You spent ${cost} Wealth on clandestine intrigue during the Conclave.`);

    // Effect of intrigue: can reveal secrets, or shift votes slightly
    if (Math.random() < 0.3) { // Chance to reveal a secret
        const unrevealedCardinals = gameState.cardinals.filter(c => !c.secret);
        if (unrevealedCardinals.length > 0) {
            const cardinalWithSecret = unrevealedCardinals[Math.floor(Math.random() * unrevealedCardinals.length)];
            const secrets = ["a hidden mistress", "secret ties to the Holy Roman Emperor", "embezzling Church funds", "a gambling addiction"];
            cardinalWithSecret.secret = secrets[Math.floor(Math.random() * secrets.length)];
            addGameLog(`Through covert means, you uncovered Cardinal ${cardinalWithSecret.name}'s secret: ${cardinalWithSecret.secret}.`);
        }
    } else if (Math.random() < 0.7) { // Chance to shift a vote
        const targetCandidate = gameState.conclave.candidates[Math.floor(Math.random() * gameState.conclave.candidates.length)];
        const shiftedCardinal = gameState.cardinals[Math.floor(Math.random() * gameState.cardinals.length)];
        gameState.conclave.cardinalVotes[shiftedCardinal.id] = targetCandidate.id;
        addGameLog(`A slight shift in sentiment was observed regarding Cardinal ${shiftedCardinal.name}'s leanings towards ${targetCandidate.name}.`);
    } else {
        addGameLog(`Your intrigue efforts were subtle, yielding no immediate public results.`);
    }
    updateUI();
    updateConclaveUI();
}


function endConclave(electedPope) {
    gameState.isGameOver = false; // Game continues with new Pope
    gameState.conclave.isActive = false;

    // Reset Pope state to new Pope
    const newPopeCardinal = gameState.cardinals.find(c => c.id === electedPope.id);
    gameState.pope.name = `Pope ${newPopeCardinal.name.split(' ').slice(1).join(' ')} ${generateRomanNumeral(gameState.year % 100)}`; // Simple way to generate a regnal name
    gameState.pope.age = newPopeCardinal.age;
    gameState.pope.wisdom = newPopeCardinal.skills.theology + newPopeCardinal.skills.stewardship;
    gameState.pope.diplomacy = newPopeCardinal.skills.diplomacy;
    gameState.pope.martial = newPopeCardinal.skills.martial;
    gameState.resources.health = 100; // New Pope is healthy!
    gameState.resources.piety = Math.min(100, gameState.resources.piety + 20); // Boost from election
    gameState.resources.influence = Math.min(100, gameState.resources.influence + 20);
    gameState.resources.curiaSupport = electedPope.votes / gameState.cardinals.length * 100; // Support based on votes received

    // Remove the elected cardinal from the pool of cardinals (or make him the Pope character)
    gameState.cardinals = gameState.cardinals.filter(c => c.id !== electedPope.id);
    addGameLog(`**Habemus Papam! Cardinal ${newPopeCardinal.name} is elected as ${gameState.pope.name}!**`);

    hideAllPanelsAndShowMain();
    displayEvent(gameEvents.find(e => e.id === 'papal_election_conclave')); // Display generic election message
    updateUI();
    nextTurnButton.disabled = false;
}

function generateRomanNumeral(num) {
    if (isNaN(num)) return num;
    var digits = String(+num).split(""),
        key = ["","C","CC","CCC","CD","D","DC","DCC","DCCC","CM",
               "","X","XX","XXX","XL","L","LX","LXX","LXXX","XC",
               "","I","II","III","IV","V","VI","VII","VIII","IX"],
        roman = "",
        i = 3;
    while (i--)
        roman = (key[+digits.pop() + (i * 10)] || "") + roman;
    return Array(+digits.join("") + 1).join("M") + roman;
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
        currentStage: 1, // For multi-stage crises
    });
    updateActiveCrisesDisplay();
    addGameLog(`A new crisis has emerged: ${id} (${severity} severity).`);
}

function resolveCrisis(crisisId, outcome) {
    gameState.activeCrises = gameState.activeCrises.filter(c => c.id !== crisisId);
    addGameLog(`The crisis of ${crisisId} has resolved. Outcome: ${outcome}.`);
    updateActiveCrisesDisplay();
    // Potentially add effects based on outcome
}

function progressCrises() {
    const resolvedCrises = [];
    gameState.activeCrises.forEach(crisis => {
        crisis.duration--;
        crisis.escalationCounter++;

        // Example: Penalties for unaddressed crises
        if (crisis.escalationCounter % 3 === 0) { // Every 3 months
            if (crisis.severity === 'medium') {
                gameState.resources.wealth = Math.max(0, gameState.resources.wealth - 5);
                gameState.resources.piety = Math.max(0, gameState.resources.piety - 2);
                addGameLog(`${crisis.name} continues to fester. (-5 Wealth, -2 Piety)`);
            } else if (crisis.severity === 'high') {
                gameState.resources.wealth = Math.max(0, gameState.resources.wealth - 15);
                gameState.resources.piety = Math.max(0, gameState.resources.piety - 5);
                gameState.resources.influence = Math.max(0, gameState.resources.influence - 5);
                addGameLog(`${crisis.name} worsens! (-15 Wealth, -5 Piety, -5 Influence)`);
            }
        }

        if (crisis.duration <= 0) {
            resolvedCrises.push(crisis.id);
            // Default resolution if not handled
            addGameLog(`${crisis.name} has concluded, fading without major intervention.`);
            if (crisis.type === 'Heresy' && crisis.initialSeverity === 'high') {
                gameState.resources.piety = Math.max(0, gameState.resources.piety - 30);
                gameState.resources.influence = Math.max(0, gameState.resources.influence - 20);
                addGameLog(`The ${crisis.name} heresy spread significantly due to neglect!`);
            }
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
    conclavePanel.classList.add('hidden');
    crusadePanel.classList.add('hidden');

    panelElement.classList.remove('hidden');

    // Update specific panels when shown
    if (panelElement === curiaPanel) {
        populateCuriaPanel();
    } else if (panelElement === ledgerPanel) {
        populateLedgerPanel();
    } else if (panelElement === decreesPanel) {
        resetDecreePanel();
    }
    // Conclave and Crusade have their own start functions
}

function hideAllPanelsAndShowMain() {
    curiaPanel.classList.add('hidden');
    decreesPanel.classList.add('hidden');
    mapPanel.classList.add('hidden');
    ledgerPanel.classList.add('hidden');
    conclavePanel.classList.add('hidden');
    crusadePanel.classList.add('hidden');
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
    selectedCardinalDescription.textContent = `Age: ${cardinal.age}.`;
    selectedCardinalLoyalty.textContent = cardinal.loyalty;
    selectedCardinalInfluence.textContent = cardinal.influence;
    selectedCardinalFaction.textContent = cardinal.faction;
    selectedCardinalPersonality.textContent = cardinal.personality;
    selectedCardinalTraits.textContent = cardinal.traits.join(', ') || 'None';
    selectedCardinalSkills.textContent = `Th: ${cardinal.skills.theology}, Dip: ${cardinal.skills.diplomacy}, Int: ${cardinal.skills.intrigue}, Ste: ${cardinal.skills.stewardship}, Mar: ${cardinal.skills.martial}`;


    if (cardinal.secret) {
        selectedCardinalSecret.textContent = cardinal.secret;
        selectedCardinalSecretDisplay.classList.remove('hidden');
    } else {
        selectedCardinalSecretDisplay.classList.add('hidden');
    }

    document.querySelectorAll('#curia-cardinal-list li').forEach(li => {
        li.classList.remove('selected');
    });
    document.querySelector(`#curia-cardinal-list li[data-cardinal-id="${cardinalId}"]`).classList.add('selected');

    // Show/hide cardinal actions based on conditions
    bribeCardinalButton.classList.remove('hidden');
    promoteCardinalButton.classList.remove('hidden');
    investigateCardinalButton.classList.remove('hidden');

    bribeCardinalButton.disabled = (gameState.resources.wealth < 20);
    promoteCardinalButton.disabled = (gameState.resources.influence < 10 || cardinal.isPromoted);
    investigateCardinalButton.disabled = (gameState.resources.theology < 5);
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
    selectedCardinalSkills.textContent = "--";
    selectedCardinalSecretDisplay.classList.add('hidden');

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
        if (Math.random() * 100 < (50 + gameState.pope.wisdom / 2)) { // Better chance with higher Pope Wisdom
            const secrets = ["a hidden mistress", "secret ties to the Holy Roman Emperor", "embezzling Church funds", "a gambling addiction"];
            const discoveredSecret = secrets[Math.floor(Math.random() * secrets.length)];
            gameState.selectedCardinal.secret = discoveredSecret;
            addGameLog(`You discovered Cardinal ${gameState.selectedCardinal.name}'s secret: ${discoveredSecret}. This could be useful.`);
        } else {
            addGameLog(`Your investigation into Cardinal ${gameState.selectedCardinal.name} yielded no significant findings.`);
        }
        updateUI();
        selectCardinal(gameState.selectedCardinal.id);
    } else {
        alert("Not enough theology/wisdom to conduct a thorough investigation!");
    }
}

// --- Decrees Panel Logic ---
let currentDecreeType = null;
const DECREE_COSTS = {
    'doctrine': { wealth: 50, curiaSupport: 5, theology: 10 },
    'condemn': { wealth: 70, piety: 10, influence: 5 },
    'excommunicate': { wealth: 100, influence: 10, curiaSupport: -10, prestige: 10 },
    'crusade': { wealth: 150, piety: 20, influence: 20, prestige: 30 }
};

const DECREE_TARGET_TYPES = {
    'doctrine': [], // No specific target
    'condemn': ['heresy'],
    'excommunicate': ['realm'],
    'crusade': ['heresy_or_realm']
};

function resetDecreePanel() {
    decreeOptions.classList.remove('hidden');
    decreeDetails.classList.add('hidden');
    decreeTextarea.value = '';
    currentDecreeType = null;
    decreeCostDisplay.textContent = 'Cost: --';
    decreeTargetSelection.classList.add('hidden');
    decreeTargetSelect.innerHTML = '';
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
        decreeCostDisplay.textContent = `Costs: ${costText.slice(0, -2)}.`;

        // Populate target selection if needed
        const targetTypes = DECREE_TARGET_TYPES[currentDecreeType];
        if (targetTypes && targetTypes.length > 0) {
            decreeTargetSelection.classList.remove('hidden');
            decreeTargetSelect.innerHTML = '';
            let defaultOption = document.createElement('option');
            defaultOption.value = "";
            defaultOption.textContent = "Select a target...";
            decreeTargetSelect.appendChild(defaultOption);

            targetTypes.forEach(targetType => {
                if (targetType === 'realm' || targetType === 'heresy_or_realm') {
                    REALMS_FOR_TARGETING.forEach(realm => {
                        let option = document.createElement('option');
                        option.value = realm;
                        option.textContent = realm;
                        decreeTargetSelect.appendChild(option);
                    });
                }
                if (targetType === 'heresy' || targetType === 'heresy_or_realm') {
                    HERESIES_FOR_TARGETING.forEach(heresy => {
                        let option = document.createElement('option');
                        option.value = heresy;
                        option.textContent = heresy;
                        decreeTargetSelect.appendChild(option);
                    });
                }
            });
        } else {
            decreeTargetSelection.classList.add('hidden');
        }


        decreeOptions.classList.add('hidden');
        decreeDetails.classList.remove('hidden');
        issueDecreeButton.disabled = false;
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

    let target = decreeTargetSelect.value;
    if (DECREE_TARGET_TYPES[currentDecreeType].length > 0 && !target) {
        alert("Please select a target for this decree!");
        return;
    }


    let effects = {};
    let consequence = `You issued a new decree regarding ${currentDecreeType}: "${decreeContent.substring(0, Math.min(decreceContent.length, 50))}..."`;

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
            consequence += ` The heresy of ${target} is officially condemned!`;
            // Add crisis if not already present
            if (!gameState.activeCrises.some(c => c.id === target)) {
                addCrisis(target, 'medium', 6, 'Heresy'); // Condemnation can escalate crisis
            } else {
                // If crisis exists, condemnation might improve its progress
                const existingCrisis = gameState.activeCrises.find(c => c.id === target);
                if (existingCrisis) existingCrisis.progress += 20; // 20% progress
            }
            break;
        case 'excommunicate':
            effects = { influence: 30 + Math.floor(gameState.pope.diplomacy / 5), prestige: 20, curiaSupport: -15, wealth: -50, 'reputation.Royalty': -20 };
            consequence += ` The ruler of ${target} has been cast out of the Church! This is a bold move.`;
            gameState.relations[target] = Math.max(0, gameState.relations[target] - 50); // Severe relation drop
            gameState.worldFlags[`${target.toLowerCase().replace(/\s/g, '_')}_excommunicated`] = true;
            addCrisis(`${target} Excommunication`, 'high', 12, 'Political'); // Major political crisis
            break;
        case 'crusade':
            if (gameState.crusade.isActive) {
                alert("A Crusade is already active! You can only call one at a time.");
                // Refund costs
                for (const res in costs) { gameState.resources[res] += costs[res]; }
                return;
            }
            effects = { piety: 40, influence: 25, curiaSupport: 10, wealth: -100, prestige: 30, 'reputation.Commoners': 20 };
            consequence += ` The call for a new Crusade against ${target} echoes across Europe! God wills it!`;
            startCrusade(`The Crusade Against ${target}`, target); // Start the Crusade mini-game
            break;
    }

    applyEventEffects(effects);
    addGameLog(consequence);
    hideAllPanelsAndShowMain();
    updateUI();
});


// --- Ledger Panel Logic ---
function populateLedgerPanel() {
    ledgerIncomeDisplay.textContent = 10; // Base income
    ledgerExpensesDisplay.textContent = 5; // Base expenses (can be dynamic later)
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

// --- Crusade Mini-Game Logic ---
const CRUSADE_PHASES = {
    'Preparation': { name: 'Preparation', description: 'Gathering funds and armies.', actions: ['raise_funds', 'recruit_troops'] },
    'March': { name: 'The March', description: 'Armies are moving towards the target.', actions: ['manage_supplies', 'resolve_disputes'] },
    'Campaign': { name: 'The Campaign', description: 'Engaging the enemy, besieging strongholds.', actions: ['assault_city', 'forage', 'negotiate'] },
    'Return': { name: 'The Return', description: 'Crusaders are returning home.', actions: [] }
};

function startCrusade(crusadeName, target) {
    gameState.crusade.isActive = true;
    gameState.crusade.target = target;
    gameState.crusade.name = crusadeName;
    gameState.crusade.phase = 'Preparation';
    gameState.crusade.progress = 0;
    gameState.crusade.armyStrength = 0;
    gameState.crusade.supplies = 50; // Starting supplies
    gameState.crusade.morale = 100;
    gameState.crusade.leaderCardinalId = null; // Can assign a Cardinal later
    gameState.crusade.eventLog = []; // Clear crusade-specific log

    crusadeNameDisplay.textContent = crusadeName;
    addCrusadeLog(`The Holy Crusade for ${target} has been declared!`);
    addCrusadeLog(`Phase: ${CRUSADE_PHASES[gameState.crusade.phase].description}`);

    showPanel(crusadePanel);
    updateCrusadeUI();
    nextTurnButton.disabled = true; // Crusade takes over monthly turn
}

function updateCrusadeUI() {
    crusadeNameDisplay.textContent = gameState.crusade.name;
    crusadePhaseDisplay.textContent = CRUSADE_PHASES[gameState.crusade.phase].name;
    crusadeProgressDisplay.textContent = `${gameState.crusade.progress}%`;
    crusadeArmyStrengthDisplay.textContent = gameState.crusade.armyStrength;
    crusadeSuppliesDisplay.textContent = gameState.crusade.supplies;
    crusadeMoraleDisplay.textContent = gameState.crusade.morale;

    crusadeEventLogDisplay.innerHTML = '';
    gameState.crusade.eventLog.slice().reverse().forEach(log => {
        const li = document.createElement('li');
        li.textContent = log;
        crusadeEventLogDisplay.appendChild(li);
    });

    // Clear existing dynamic actions
    crusadeRaiseFundsButton.classList.add('hidden');
    crusadeRecruitTroopsButton.classList.add('hidden');
    crusadeEmbarkButton.classList.add('hidden');

    // Show actions based on phase
    const actions = CRUSADE_PHASES[gameState.crusade.phase].actions;
    if (actions.includes('raise_funds')) crusadeRaiseFundsButton.classList.remove('hidden');
    if (actions.includes('recruit_troops')) crusadeRecruitTroopsButton.classList.remove('hidden');
    if (gameState.crusade.phase === 'Preparation' && gameState.crusade.armyStrength > 50 && gameState.crusade.supplies > 30) {
        crusadeEmbarkButton.classList.remove('hidden');
    }
    // Add more dynamic actions for other phases here
}

function addCrusadeLog(message) {
    gameState.crusade.eventLog.push(`[${getMonthName(gameState.month)} ${gameState.year}] ${message}`);
    // Keep log from getting too long
    if (gameState.crusade.eventLog.length > 20) {
        gameState.crusade.eventLog.shift();
    }
}

function endCrusadeTurn() {
    if (!gameState.crusade.isActive) return;

    gameState.month++;
    if (gameState.month > 12) {
        gameState.month = 1;
        gameState.year++;
    }
    currentYearDisplay.textContent = `${getMonthName(gameState.month)} ${gameState.year} AD`;

    // Crusader maintenance costs
    gameState.resources.wealth -= Math.ceil(gameState.crusade.armyStrength / 10);
    gameState.crusade.supplies -= Math.ceil(gameState.crusade.armyStrength / 20); // Consume supplies

    // Morale decay if supplies low
    if (gameState.crusade.supplies < 20) {
        gameState.crusade.morale = Math.max(0, gameState.crusade.morale - 5);
        addCrusadeLog("Supplies are running low, morale is dropping!");
    }
    if (gameState.crusade.morale <= 0) {
        endCrusade("The Crusade has collapsed due to low morale and desertion!");
        return;
    }

    // Progress crusade based on phase
    if (gameState.crusade.phase === 'March') {
        gameState.crusade.progress += Math.floor(Math.random() * 5) + 2; // Progress 2-7% per month
        if (gameState.crusade.progress >= 100) {
            gameState.crusade.phase = 'Campaign';
            gameState.crusade.progress = 0; // Reset for campaign progress
            addCrusadeLog("The Crusade has reached its target region. The campaign begins!");
        } else {
            addCrusadeLog(`The army continues its march. Progress: ${gameState.crusade.progress}%`);
        }
    } else if (gameState.crusade.phase === 'Campaign') {
        // Complex campaign logic: battles, sieges, random events
        const campaignEventRoll = Math.random();
        if (campaignEventRoll < 0.3) {
            addCrusadeLog("A minor skirmish occurred, the crusaders held their ground.");
            gameState.crusade.morale = Math.min(100, gameState.crusade.morale + 2);
            gameState.crusade.armyStrength = Math.max(0, gameState.crusade.armyStrength - Math.floor(Math.random() * 5));
        } else if (campaignEventRoll < 0.6) {
            addCrusadeLog("A key fortress is under siege. It will take time and lives.");
            gameState.crusade.progress += 5; // Slow progress
            gameState.crusade.supplies = Math.max(0, gameState.crusade.supplies - 10);
            gameState.crusade.armyStrength = Math.max(0, gameState.crusade.armyStrength - Math.floor(Math.random() * 10));
        } else {
            addCrusadeLog("The enemy gathers their forces. A major battle may be imminent.");
            // No direct effect, but foreshadows challenge
        }

        gameState.crusade.progress += Math.floor(Math.random() * 3) + 1; // Base progress
        if (gameState.crusade.progress >= 100) {
            endCrusade("The Crusade has achieved its objectives! Victory for Christendom!");
            return;
        }

    }

    updateCrusadeUI();
}

function endCrusade(outcomeMessage) {
    gameState.crusade.isActive = false;
    addGameLog(`Crusade for ${gameState.crusade.target} has ended: ${outcomeMessage}`);
    crusadeNameDisplay.textContent = "No Active Crusade"; // Reset display
    hideAllPanelsAndShowMain(); // Return to main game

    // Apply final effects based on success/failure
    if (outcomeMessage.includes("Victory")) {
        applyEventEffects({ piety: 50, prestige: 50, influence: 30, wealth: 200, 'reputation.Commoners': 30, 'reputation.Royalty': 20 });
        if (gameState.crusade.target === 'Jerusalem') {
            gameState.worldFlags['jerusalem_reclaimed'] = true;
        }
    } else {
        applyEventEffects({ piety: -30, prestige: -20, influence: -15, wealth: -100, 'reputation.Commoners': -15, 'reputation.Royalty': -10 });
        addCrisis(`Crusade Failure: ${gameState.crusade.target}`, 'high', 12, 'Political');
    }
    updateUI();
    nextTurnButton.disabled = false; // Re-enable normal turns
}

// Crusade Actions
crusadeRaiseFundsButton.addEventListener('click', () => {
    const fundsGained = 50 + Math.floor(gameState.pope.diplomacy / 2);
    const costPiety = 10;
    if (gameState.resources.piety < costPiety) {
        addCrusadeLog("Not enough Piety to appeal for more funds!");
        return;
    }
    gameState.resources.piety -= costPiety;
    gameState.resources.wealth += fundsGained;
    addCrusadeLog(`You appealed to the faithful for funds, gaining ${fundsGained} Wealth.`);
    updateCrusadeUI();
    updateUI(); // Update main resource display
});

crusadeRecruitTroopsButton.addEventListener('click', () => {
    const troopsGained = 20 + Math.floor(gameState.pope.martial / 2);
    const costInfluence = 15;
    if (gameState.resources.influence < costInfluence) {
        addCrusadeLog("Not enough Influence to recruit more troops!");
        return;
    }
    gameState.resources.influence -= costInfluence;
    gameState.crusade.armyStrength += troopsGained;
    addCrusadeLog(`You called for more warriors, gaining ${troopsGained} Army Strength.`);
    updateCrusadeUI();
    updateUI(); // Update main resource display
});

crusadeEmbarkButton.addEventListener('click', () => {
    if (gameState.crusade.armyStrength < 50 || gameState.crusade.supplies < 30) {
        alert("You need at least 50 Army Strength and 30 Supplies to embark!");
        return;
    }
    gameState.crusade.phase = 'March';
    addCrusadeLog("The Crusade has embarked! May God guide their journey.");
    updateCrusadeUI();
});


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

// Conclave specific listeners
conclaveLobbyButton.addEventListener('click', lobbyConclaveCardinals);
conclaveIntrigueButton.addEventListener('click', intrigueConclave);
conclaveVoteButton.addEventListener('click', conductConclaveVote);


// --- Initialization ---
function initializeGame() {
    initializeCardinals();
    addGameLog("Welcome to Habeas Papam! Your reign begins.");
    updateUI();
    displayEvent(gameEvents.find(e => e.id === 'pontificate_begins'));
    nextTurnButton.disabled = true; // Disable until initial event is handled
    nextTurnButton.textContent = "Awaiting Choice...";
}

// Run the game initialization when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeGame);

// Helper for month names
function getMonthName(monthNum) {
    const months = ["January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"];
    return months[monthNum - 1];
}
