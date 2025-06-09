// script.js

// --- Game State ---
const gameState = {
    year: 1100,
    month: 1, // January
    resources: {
        piety: 100,
        wealth: 500,
        influence: 75,
        curiaSupport: 60,
        theology: 50,
        health: 80,
        prestige: 20, // New resource
    },
    cardinals: [],
    currentEvent: null,
    selectedCardinal: null, // For Curia panel
    eventLog: [], // To track past events for the Ledger
    // Add more global flags/variables as needed (e.g., active heresies, current crusades)
    activeHeresies: [],
    relations: { // Example relations with major powers
        'Holy Roman Empire': 50,
        'France': 60,
        'England': 40,
        'Naples': 70,
        'Byzantine Empire': 30
    }
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
    prestige: document.getElementById('resource-prestige'), // New resource
};
const eventTitleDisplay = document.getElementById('event-title');
const eventDescriptionDisplay = document.getElementById('event-description');
const eventChoicesDisplay = document.getElementById('event-choices');
const nextTurnButton = document.getElementById('next-turn-button');
const cardinalListDisplay = document.getElementById('cardinals-display');
const numCardinalsDisplay = document.getElementById('num-cardinals');

// Panels
const mainGameDisplay = document.getElementById('game-event-display');
const curiaPanel = document.getElementById('curia-panel');
const decreesPanel = document.getElementById('decrees-panel');
const mapPanel = document.getElementById('map-panel');
const ledgerPanel = document.getElementById('ledger-panel'); // New panel

const openCuriaButton = document.getElementById('open-curia-button');
const openDecreesButton = document.getElementById('open-decrees-button');
const openMapButton = document.getElementById('open-map-button');
const openLedgerButton = document.getElementById('open-ledger-button'); // New button
const closePanelButtons = document.querySelectorAll('.close-panel-button');

// Curia Panel Elements
const curiaCardinalListDisplay = document.getElementById('curia-cardinal-list');
const selectedCardinalName = document.getElementById('selected-cardinal-name');
const selectedCardinalDescription = document.getElementById('selected-cardinal-description');
const selectedCardinalLoyalty = document.getElementById('selected-cardinal-loyalty');
const selectedCardinalInfluence = document.getElementById('selected-cardinal-influence');
const selectedCardinalTraits = document.getElementById('selected-cardinal-traits');
const cardinalActions = document.getElementById('cardinal-actions');
const bribeCardinalButton = document.getElementById('bribe-cardinal-button');

// Decrees Panel Elements
const decreeOptions = document.getElementById('decree-options');
const decreeDetails = document.getElementById('decree-details');
const decreeTypeName = document.getElementById('decree-type-name');
const decreeTextarea = document.getElementById('decree-text');
const issueDecreeButton = document.getElementById('issue-decree-button');

// Ledger Panel Elements
const ledgerIncomeDisplay = document.getElementById('ledger-income');
const ledgerExpensesDisplay = document.getElementById('ledger-expenses');
const ledgerBalanceDisplay = document.getElementById('ledger-balance');
const ledgerEventLogDisplay = document.getElementById('ledger-event-log');


// --- Game Data ---

// Cardinal structure (expanded)
function createCardinal(name, traits = [], loyalty = null, influence = null) {
    return {
        id: crypto.randomUUID(), // Unique ID for selecting
        name: name,
        loyalty: loyalty || Math.floor(Math.random() * 40) + 60, // 60-100 initial loyalty
        influence: influence || Math.floor(Math.random() * 10) + 1, // 1-10 influence
        traits: traits // e.g., ['Ambitious', 'Pious', 'French', 'Scholar']
    };
}

// Initial Cardinals
function initializeCardinals() {
    gameState.cardinals = [
        createCardinal("Cardinal Pietro Orsini", ['Pious', 'Italian', 'Orsini Family']),
        createCardinal("Cardinal Guillaume Dubois", ['Ambitious', 'French', 'Royalist']),
        createCardinal("Cardinal Otto von Braunschweig", ['Imperial Supporter', 'German', 'Noble']),
        createCardinal("Cardinal Rodrigo Díaz", ['Scholar', 'Spanish', 'Zealous']),
        createCardinal("Cardinal Thomas Becket", ['Loyal', 'English', 'Austerity']),
        createCardinal("Cardinal Giovanni Colonna", ['Scheming', 'Italian', 'Colonna Family']),
        createCardinal("Cardinal Henry of Blois", ['Wealthy', 'English', 'Builder']),
        createCardinal("Cardinal Peter Damian", ['Reformist', 'Italian', 'Theologian']),
    ];
    updateCardinalList();
}

// Events (expanded and more structured)
const gameEvents = [
    {
        id: 'pontificate_begins',
        type: 'narrative', // Narrative, Crisis, Opportunity, Diplomatic, Theological
        title: "The Weight of the Tiara",
        description: "You have been elected Pope! The Church is at a crossroads. Kings vie for power, heresies threaten the flock, and the Holy Land cries for aid. What will be the first decree of your pontificate?",
        choices: [
            {
                text: "Call for a grand Council to address doctrinal issues.",
                effects: { piety: 10, theology: 15, curiaSupport: -5, prestige: 5 },
                consequence: "The cardinals debate fiercely, but your authority is affirmed. The whispers of heresy are momentarily silenced.",
                nextEvent: 'heresy_in_south', // Example of chained event
                modifiers: { 'curia_council_experience': true } // Example of a global modifier
            },
            {
                text: "Excommunicate the Holy Roman Emperor for defiance.",
                effects: { influence: 20, curiaSupport: -10, wealth: -50, prestige: 10, 'relations.Holy Roman Empire': -30 },
                consequence: "The Emperor's power is challenged, but many rulers are uneasy. Expect retaliation.",
                triggerFlags: { 'emperor_excommunicated': true } // Set a flag for future events
            },
            {
                text: "Launch a fundraising drive for a new cathedral.",
                effects: { wealth: 100, piety: 5, influence: 5, prestige: 5 },
                consequence: "Donations pour in, and the people praise your vision. Your treasury is bolstered.",
                nextEvent: null // No immediate chained event
            }
        ]
    },
    {
        id: 'heresy_in_south',
        type: 'crisis',
        title: "Whispers of Heresy: The Cathar Threat",
        description: "Reports arrive from Southern France of a new heresy, the 'Cathars', gaining traction. They reject many Church doctrines, preach asceticism, and are converting local nobles.",
        conditions: [ // Event only appears if conditions are met
            { type: 'resource', resource: 'piety', operator: '<', value: 120 },
            { type: 'flag', flag: 'curia_council_experience', exists: true } // If previous choice was council
        ],
        choices: [
            {
                text: "Declare a Crusade against the Cathars.",
                effects: { piety: 20, curiaSupport: 10, influence: 15, wealth: -100, 'relations.France': 10 },
                consequence: "A Holy War is declared. Many knights flock to the banners, but the conflict will be long and bloody.",
                triggerFlags: { 'cathar_crusade_active': true },
                onChoose: () => { gameState.activeHeresies.push('Cathar'); } // Add to active heresies
            },
            {
                text: "Send a delegation of learned monks to preach against their errors.",
                effects: { theology: 15, piety: -5, influence: 5, wealth: -20, 'relations.France': 5 },
                consequence: "The monks engage in fierce debates, winning some over, but the heresy persists. It will take time.",
                nextEvent: 'cathar_debate_outcome' // Another chained event possibility
            },
            {
                text: "Ignore it for now; local bishops should handle it.",
                effects: { piety: -15, curiaSupport: -10, influence: -10, 'relations.France': -5 },
                consequence: "The heresy spreads further, and your authority is questioned. It may become a major threat.",
                onChoose: () => { gameState.activeHeresies.push('Cathar'); },
                triggerFlags: { 'cathar_spreading': true }
            }
        ]
    },
    {
        id: 'cathar_debate_outcome',
        type: 'narrative',
        title: "The Seeds of Persuasion",
        description: "Your monastic delegation returns. After months of debate, they've swayed some minor lords and commoners, but the core of the Cathar movement remains defiant.",
        conditions: [
            { type: 'flag', flag: 'cathar_spreading', exists: false }, // Only if not ignored
            { type: 'eventTrigger', eventId: 'heresy_in_south', choiceIndex: 1 } // Triggered by specific choice
        ],
        choices: [
            {
                text: "Send more resources to the missionary effort.",
                effects: { theology: 10, wealth: -30, piety: 5 },
                consequence: "More resources allocated. The fight for souls continues."
            },
            {
                text: "It's time for more drastic measures. Prepare the Inquisition.",
                effects: { piety: 10, influence: -5, curiaSupport: -5 },
                consequence: "The Holy Office of the Inquisition is established. A dark chapter begins."
            }
        ]
    },
    {
        id: 'royal_dispute',
        type: 'diplomatic',
        title: "A King's Annulment",
        description: "King Louis of France seeks an annulment from his wife, Queen Eleanor, on flimsy grounds. He threatens to withdraw French support from the Church if you deny him. This will have major political ramifications.",
        conditions: [
            { type: 'resource', resource: 'influence', operator: '>', value: 50 }
        ],
        choices: [
            {
                text: "Grant the annulment to maintain French loyalty.",
                effects: { influence: 20, piety: -15, curiaSupport: -10, 'relations.France': 30, 'relations.England': -10 },
                consequence: "Louis is pleased, but other rulers and devout cardinals are scandalized. You have bought a king's favor at a moral cost."
            },
            {
                text: "Deny the annulment, upholding the sanctity of marriage.",
                effects: { piety: 20, influence: -15, curiaSupport: 5, 'relations.France': -40, prestige: 10 },
                consequence: "The Church's moral standing is reinforced, but France becomes openly hostile. Prepare for conflict."
            },
            {
                text: "Delegate the decision to a special council, buying time.",
                effects: { curiaSupport: 10, wealth: -20, theology: 5 },
                consequence: "The decision is delayed, but Louis grows impatient. The council may side with him or not, and you've spent resources for the debate."
            }
        ]
    },
    // Add many, many more events here!
    // Example: yearly events, specific crisis events, random minor events
    {
        id: 'harvest_bountiful',
        type: 'random',
        title: "Bountiful Harvest!",
        description: "A mild winter and a sunny spring have led to an exceptionally rich harvest across your lands.",
        conditions: [{ type: 'randomChance', value: 0.3 }], // 30% chance each turn
        choices: [{
            text: "Give thanks to God.",
            effects: { wealth: 30, piety: 5 },
            consequence: "Your coffers swell, and the faithful rejoice."
        }]
    },
    {
        id: 'outbreak_of_plague',
        type: 'random',
        title: "Pestilence Strikes!",
        description: "A virulent plague begins to spread in a nearby city, threatening to decimate populations across Europe.",
        conditions: [{ type: 'randomChance', value: 0.1, yearMin: 1340 }], // Example: Later game event
        choices: [
            {
                text: "Organize prayer vigils and provide spiritual comfort.",
                effects: { piety: 20, health: -10, wealth: -20, 'relations.Holy Roman Empire': 5 },
                consequence: "The faithful find solace, but the plague continues its grim work. You risked your own health."
            },
            {
                text: "Quarantine affected areas and close borders to pilgrims.",
                effects: { wealth: -50, influence: -15, piety: -10 },
                consequence: "Strict measures may stem the tide, but trade suffers and many accuse you of lacking faith."
            }
        ]
    }
];

// --- Game Functions ---

function updateUI() {
    // Update Date
    currentYearDisplay.textContent = `${getMonthName(gameState.month)} ${gameState.year} AD`;

    // Update Resources
    for (const resource in gameState.resources) {
        if (resourceDisplays[resource]) { // Ensure the element exists
            resourceDisplays[resource].textContent = gameState.resources[resource];
        }
    }
    updateCardinalList(); // Update sidebar cardinal list
}

function updateCardinalList() {
    cardinalListDisplay.innerHTML = '';
    numCardinalsDisplay.textContent = gameState.cardinals.length;
    gameState.cardinals.forEach(cardinal => {
        const li = document.createElement('li');
        li.textContent = `${cardinal.name}`; // Simpler display in sidebar
        // Add a tooltip or more info on hover later if desired
        cardinalListDisplay.appendChild(li);
    });
}

function applyEventEffects(effects) {
    for (const key in effects) {
        if (key.startsWith('relations.')) {
            const [_, realm] = key.split('.');
            if (gameState.relations[realm] !== undefined) {
                gameState.relations[realm] += effects[key];
                gameState.relations[realm] = Math.max(0, Math.min(100, gameState.relations[realm])); // Clamp between 0-100
            }
        } else if (gameState.resources.hasOwnProperty(key)) {
            gameState.resources[key] += effects[key];
            // Basic clamping for resources (e.g., no negative piety)
            if (gameState.resources[key] < 0) {
                gameState.resources[key] = 0;
            }
        }
    }
    updateUI();
}

function displayEvent(event) {
    if (!event) {
        // No event triggered, display a generic peaceful message
        eventTitleDisplay.textContent = "A Quiet Month in Rome";
        eventDescriptionDisplay.textContent = "The Eternal City enjoys a period of calm. No major crises or opportunities present themselves this month. Focus on internal matters or await the next turn.";
        eventChoicesDisplay.innerHTML = '<p>Click "End Month" to continue.</p>';
        nextTurnButton.disabled = false;
        nextTurnButton.textContent = "End Month";
        gameState.currentEvent = null; // Clear current event
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
    nextTurnButton.disabled = true; // Disable next turn until choice is made
    nextTurnButton.textContent = "Awaiting Choice...";
}

function handleChoice(event, choice) {
    applyEventEffects(choice.effects);

    // Apply specific actions defined in choice (e.g., adding to active heresies)
    if (choice.onChoose && typeof choice.onChoose === 'function') {
        choice.onChoose();
    }

    // Update global flags/story variables
    if (choice.triggerFlags) {
        for (const flag in choice.triggerFlags) {
            gameState[flag] = choice.triggerFlags[flag];
        }
    }

    // Add to event log for ledger
    gameState.eventLog.push({
        year: gameState.year,
        month: getMonthName(gameState.month),
        description: choice.consequence || `Chose: "${choice.text}" from "${event.title}"`
    });

    eventDescriptionDisplay.textContent = choice.consequence || `You chose: "${choice.text}".`;
    eventChoicesDisplay.innerHTML = '<p>Click "End Month" to continue.</p>';
    nextTurnButton.disabled = false; // Re-enable for next turn
    nextTurnButton.textContent = "End Month";

    // Trigger chained events (if any) - for now, just the first event
    if (choice.nextEvent) {
        const nextLinkedEvent = gameEvents.find(e => e.id === choice.nextEvent);
        if (nextLinkedEvent) {
            // For simplicity, we'll display chained events immediately
            // In a more complex system, this might be scheduled for next turn
            setTimeout(() => displayEvent(nextLinkedEvent), 500); // Small delay for effect
            return; // Don't allow next turn button to be re-enabled until chained event handled
        }
    }
}

function checkEventConditions(event) {
    if (!event.conditions || event.conditions.length === 0) {
        return true; // No conditions, event can always trigger
    }

    return event.conditions.every(condition => {
        switch (condition.type) {
            case 'resource':
                const currentResource = gameState.resources[condition.resource];
                if (currentResource === undefined) return false;
                switch (condition.operator) {
                    case '>': return currentResource > condition.value;
                    case '<': return currentResource < condition.value;
                    case '=': return currentResource === condition.value;
                    case '>=': return currentResource >= condition.value;
                    case '<=': return currentResource <= condition.value;
                    default: return false;
                }
            case 'flag':
                if (condition.exists !== undefined) {
                    return condition.exists ? gameState[condition.flag] : !gameState[condition.flag];
                }
                return false;
            case 'randomChance':
                return Math.random() < condition.value;
            case 'yearMin':
                return gameState.year >= condition.value;
            case 'yearMax':
                return gameState.year <= condition.value;
            case 'eventTrigger': // Check if a specific choice from a previous event was taken
                // This is a placeholder; requires tracking past choices more robustly
                // For simplicity, checking if an event ID exists in eventLog
                return gameState.eventLog.some(log => log.description.includes(`"${event.title}"`));
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
        // Only trigger random events if type is 'random' or no type specified
        if (event.type && event.type !== 'random') {
             // For more complex games, you'd categorize events into monthly/yearly pools
             return false;
        }
        return checkEventConditions(event);
    });

    if (availableEvents.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableEvents.length);
        return availableEvents[randomIndex];
    }
    return null; // No suitable event found
}

function endMonth() {
    // Advance time
    gameState.month++;
    if (gameState.month > 12) {
        gameState.month = 1;
        gameState.year++;
        handleYearlyEvents(); // Trigger yearly events/summaries
    }

    // Apply passive changes (monthly)
    gameState.resources.health = Math.max(0, gameState.resources.health - 1); // Health decay
    gameState.resources.wealth += 10; // Base income

    // Random cardinal loyalty changes (small fluctuations)
    gameState.cardinals.forEach(c => {
        c.loyalty += Math.floor(Math.random() * 5) - 2; // +/- 2 loyalty
        c.loyalty = Math.max(0, Math.min(100, c.loyalty));
    });

    // Trigger next event
    const nextEvent = selectRandomEvent();
    displayEvent(nextEvent);
    updateUI(); // Always update UI at the end of a turn
}

function handleYearlyEvents() {
    // This function will handle events that happen annually
    // E.g., annual reports, specific yearly historical events, aging Pope mechanics
    gameState.eventLog.push({
        year: gameState.year,
        month: 'Annual Summary',
        description: `The year ${gameState.year} concludes. Your health is ${gameState.resources.health}.`
    });

    // Example: Check for game over (Pope dies)
    if (gameState.resources.health <= 0) {
        gameOver("Your Holiness has passed away!");
        return;
    }
    // Example: If Pope reaches certain age, new events might trigger
    if (gameState.year > 1150 && Math.random() < 0.2) { // Example: After 50 years
        // Trigger specific late-game events
    }
}

function gameOver(message) {
    alert(`Game Over! ${message}`);
    // Reset game or show end screen
    location.reload(); // For now, just reload the page
}

function getMonthName(monthNum) {
    const months = ["January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"];
    return months[monthNum - 1];
}

// --- Panel Management Functions ---

function showPanel(panelElement) {
    // Hide all main content areas first
    mainGameDisplay.classList.add('hidden');
    curiaPanel.classList.add('hidden');
    decreesPanel.classList.add('hidden');
    mapPanel.classList.add('hidden');
    ledgerPanel.classList.add('hidden');

    // Show the requested panel
    panelElement.classList.remove('hidden');

    // Specific panel initialization logic
    if (panelElement === curiaPanel) {
        populateCuriaPanel();
    } else if (panelElement === ledgerPanel) {
        populateLedgerPanel();
    } else if (panelElement === decreesPanel) {
        resetDecreePanel();
    }
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
        li.textContent = `${cardinal.name} (Loyalty: ${cardinal.loyalty}, Infl: ${cardinal.influence})`;
        li.addEventListener('click', () => selectCardinal(cardinal.id));
        curiaCardinalListDisplay.appendChild(li);
    });
    // Clear detail view when opening panel
    clearSelectedCardinal();
}

function selectCardinal(cardinalId) {
    const cardinal = gameState.cardinals.find(c => c.id === cardinalId);
    if (!cardinal) return;

    gameState.selectedCardinal = cardinal;
    selectedCardinalName.textContent = cardinal.name;
    selectedCardinalDescription.textContent = `A cardinal of the Holy Church. ${cardinal.traits.join(', ')}.`;
    selectedCardinalLoyalty.textContent = cardinal.loyalty;
    selectedCardinalInfluence.textContent = cardinal.influence;
    selectedCardinalTraits.textContent = cardinal.traits.join(', ');

    // Highlight selected cardinal in the list
    document.querySelectorAll('#curia-cardinal-list li').forEach(li => {
        li.classList.remove('selected');
    });
    document.querySelector(`#curia-cardinal-list li[data-cardinal-id="${cardinalId}"]`).classList.add('selected');

    // Show cardinal actions
    bribeCardinalButton.classList.remove('hidden');
    // You'd add logic here to show/hide other actions based on cardinal or game state
}

function clearSelectedCardinal() {
    gameState.selectedCardinal = null;
    selectedCardinalName.textContent = "Select a Cardinal";
    selectedCardinalDescription.textContent = "Click on a cardinal in the list to see their details.";
    selectedCardinalLoyalty.textContent = "--";
    selectedCardinalInfluence.textContent = "--";
    selectedCardinalTraits.textContent = "--";
    bribeCardinalButton.classList.add('hidden'); // Hide actions
    document.querySelectorAll('#curia-cardinal-list li').forEach(li => {
        li.classList.remove('selected');
    });
}

function bribeCardinal() {
    if (!gameState.selectedCardinal) return;

    const cost = 20;
    if (gameState.resources.wealth >= cost) {
        gameState.resources.wealth -= cost;
        gameState.selectedCardinal.loyalty = Math.min(100, gameState.selectedCardinal.loyalty + 15); // Increase loyalty
        gameState.eventLog.push({
            year: gameState.year,
            month: getMonthName(gameState.month),
            description: `Bribed Cardinal ${gameState.selectedCardinal.name}, increasing loyalty to ${gameState.selectedCardinal.loyalty}.`
        });
        updateUI();
        selectCardinal(gameState.selectedCardinal.id); // Refresh detail view
        alert(`Successfully bribed Cardinal ${gameState.selectedCardinal.name}!`);
    } else {
        alert("Not enough wealth to bribe this cardinal!");
    }
}


// --- Decrees Panel Logic ---
let currentDecreeType = null;

function resetDecreePanel() {
    decreeOptions.classList.remove('hidden');
    decreeDetails.classList.add('hidden');
    decreeTextarea.value = '';
    currentDecreeType = null;
}

decreeOptions.querySelectorAll('.game-button').forEach(button => {
    button.addEventListener('click', (e) => {
        currentDecreeType = e.target.dataset.decreeType;
        decreeTypeName.textContent = currentDecreeType.charAt(0).toUpperCase() + currentDecreeType.slice(1);
        decreeOptions.classList.add('hidden');
        decreeDetails.classList.remove('hidden');
    });
});

issueDecreeButton.addEventListener('click', () => {
    const decreeContent = decreeTextarea.value.trim();
    if (!decreeContent) {
        alert("Please write your decree!");
        return;
    }

    let success = false;
    let cost = 0;
    let effects = {};
    let consequence = `You issued a new decree regarding ${currentDecreeType}: "${decreeContent.substring(0, 50)}..."`;

    switch (currentDecreeType) {
        case 'doctrine':
            cost = 50;
            effects = { theology: 20, piety: 10, curiaSupport: -5, prestige: 10 };
            consequence += " It will shape the future of Church theology.";
            break;
        case 'condemn':
            cost = 70;
            effects = { piety: 25, influence: 10, curiaSupport: 5, wealth: -30, prestige: 15 };
            consequence += " Heretics across Christendom tremble!";
            break;
        case 'excommunicate':
            cost = 100;
            effects = { influence: 30, prestige: 20, curiaSupport: -15, wealth: -50 };
            consequence += " A powerful ruler has been cast out of the Church. This is a bold move!";
            // Needs target selection in a full game
            break;
        case 'crusade':
            cost = 150;
            effects = { piety: 40, influence: 25, curiaSupport: 10, wealth: -150, prestige: 30 };
            consequence += " The call for a new Crusade echoes across Europe! God wills it!";
            // Needs target selection and management in a full game
            break;
        default:
            alert("Unknown decree type.");
            return;
    }

    if (gameState.resources.wealth >= cost) {
        gameState.resources.wealth -= cost;
        applyEventEffects(effects);
        gameState.eventLog.push({
            year: gameState.year,
            month: getMonthName(gameState.month),
            description: consequence
        });
        alert(`Decree issued: ${consequence}`);
        hideAllPanelsAndShowMain(); // Go back to main display
        updateUI();
    } else {
        alert(`You need ${cost} Wealth to issue this decree.`);
    }
});


// --- Ledger Panel Logic ---
function populateLedgerPanel() {
    ledgerIncomeDisplay.textContent = 10; // Simple base income for now
    ledgerExpensesDisplay.textContent = 5; // Simple base expenses for now
    ledgerBalanceDisplay.textContent = gameState.resources.wealth;

    ledgerEventLogDisplay.innerHTML = '';
    gameState.eventLog.forEach(log => {
        const li = document.createElement('li');
        li.textContent = `${log.month} ${log.year}: ${log.description}`;
        ledgerEventLogDisplay.prepend(li); // Add newest events at the top
    });
}


// --- Event Listeners ---
nextTurnButton.addEventListener('click', endMonth);
openCuriaButton.addEventListener('click', () => showPanel(curiaPanel));
openDecreesButton.addEventListener('click', () => showPanel(decreesPanel));
openMapButton.addEventListener('click', () => showPanel(mapPanel));
openLedgerButton.addEventListener('click', () => showPanel(ledgerPanel)); // New button listener

closePanelButtons.forEach(button => {
    button.addEventListener('click', hideAllPanelsAndShowMain);
});

// Specific action listeners for Curia Panel
bribeCardinalButton.addEventListener('click', bribeCardinal);


// --- Initialization ---
function initializeGame() {
    initializeCardinals(); // Set up initial cardinals
    gameState.eventLog.push({ // Initial log entry
        year: gameState.year,
        month: getMonthName(gameState.month),
        description: "Welcome to Habeas Papam! Your reign begins."
    });
    updateUI(); // Update UI with initial state
    displayEvent(gameEvents.find(e => e.id === 'pontificate_begins')); // Display the first event
    nextTurnButton.disabled = true; // Start with next turn disabled until first choice
    nextTurnButton.textContent = "Awaiting Choice...";
}

// Run the game initialization when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeGame);
