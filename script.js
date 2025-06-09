// script.js

// --- Game State ---
const gameState = {
    year: 1100,
    resources: {
        piety: 100,
        wealth: 500,
        influence: 75,
        curiaSupport: 60,
        theology: 50,
        health: 80
    },
    cardinals: [], // Array to hold cardinal objects
    currentEvent: null,
    // Add more game state variables as needed (e.g., active crusades, heresies)
};

// --- DOM Elements ---
const currentYearDisplay = document.getElementById('current-year');
const resourceDisplays = {
    piety: document.getElementById('resource-piety'),
    wealth: document.getElementById('resource-wealth'),
    influence: document.getElementById('resource-influence'),
    curiaSupport: document.getElementById('resource-curia'),
    theology: document.getElementById('resource-theology'),
    health: document.getElementById('resource-health')
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
const openCuriaButton = document.getElementById('open-curia-button');
const openDecreesButton = document.getElementById('open-decrees-button');
const openMapButton = document.getElementById('open-map-button');
const closePanelButtons = document.querySelectorAll('.close-panel-button'); // Common class for close buttons

// --- Game Data (Events, Cardinals, etc.) ---

// Simple Cardinal structure
function createCardinal(name, traits = []) {
    return {
        name: name,
        loyalty: Math.floor(Math.random() * 40) + 60, // 60-100 initial loyalty
        influence: Math.floor(Math.random() * 10) + 1, // 1-10 influence
        traits: traits // e.g., ['Ambitious', 'Pious', 'French']
    };
}

// Initial Cardinals (for demonstration)
function initializeCardinals() {
    gameState.cardinals = [
        createCardinal("Cardinal Pietro", ['Pious', 'Italian']),
        createCardinal("Cardinal Dubois", ['Ambitious', 'French']),
        createCardinal("Cardinal Otto", ['Imperial Supporter', 'German']),
        createCardinal("Cardinal Rodrigo", ['Scholar', 'Spanish']),
        createCardinal("Cardinal Thomas", ['Loyal', 'English']),
    ];
    updateCardinalList();
}


// Event structure (simplified)
const gameEvents = [
    {
        id: 'welcome_event',
        title: "The Weight of the Tiara",
        description: "You have been elected Pope! The Church is at a crossroads. Kings vie for power, heresies threaten the flock, and the Holy Land cries for aid. What will be the first decree of your pontificate?",
        choices: [
            {
                text: "Call for a grand Council to address doctrinal issues.",
                effects: { piety: 10, theology: 15, curiaSupport: -5 },
                consequence: "The cardinals debate fiercely, but your authority is affirmed."
            },
            {
                text: "Excommunicate the Holy Roman Emperor for defiance.",
                effects: { influence: 20, curiaSupport: -10, wealth: -50 },
                consequence: "The Emperor's power is challenged, but many rulers are uneasy."
            },
            {
                text: "Launch a fundraising drive for a new cathedral.",
                effects: { wealth: 100, piety: 5, influence: 5 },
                consequence: "Donations pour in, and the people praise your vision."
            }
        ]
    },
    {
        id: 'heresy_in_south',
        title: "Whispers of Heresy",
        description: "Reports arrive from Southern France of a new heresy, the 'Cathars', gaining traction. They reject many Church doctrines and are converting local nobles.",
        choices: [
            {
                text: "Send inquisitors to suppress them by force.",
                effects: { piety: 15, curiaSupport: 5, influence: -10, wealth: -30 },
                consequence: "The inquisition is brutal but effective in the short term. Some commoners are discontent."
            },
            {
                text: "Send a delegation of learned monks to preach against their errors.",
                effects: { theology: 10, piety: -5, influence: 5, wealth: -10 },
                consequence: "The monks engage in debates, winning some over, but the heresy persists in pockets."
            },
            {
                text: "Ignore it for now; local bishops should handle it.",
                effects: { piety: -10, curiaSupport: -5, influence: -5 },
                consequence: "The heresy spreads further, and your authority is questioned."
            }
        ]
    },
    {
        id: 'royal_dispute',
        title: "A King's Divorce",
        description: "King Louis of France seeks an annulment from his wife, Queen Eleanor, on flimsy grounds. He threatens to withdraw French support from the Church if you deny him.",
        choices: [
            {
                text: "Grant the annulment to maintain French loyalty.",
                effects: { influence: 20, piety: -15, curiaSupport: -10 },
                consequence: "Louis is pleased, but other rulers and devout cardinals are scandalized."
            },
            {
                text: "Deny the annulment, upholding the sanctity of marriage.",
                effects: { piety: 20, influence: -15, curiaSupport: 5 },
                consequence: "The Church's moral standing is reinforced, but France becomes hostile."
            },
            {
                text: "Delegate the decision to a special council, buying time.",
                effects: { curiaSupport: 10, wealth: -20 },
                consequence: "The decision is delayed, but Louis grows impatient. The council may side with him or not."
            }
        ]
    },
    {
        id: 'empty_treasury',
        title: "The Coffers are Empty",
        description: "Decades of lavish spending and expensive wars have left the Holy See's treasury depleted. Urgent action is needed to secure funds.",
        choices: [
            {
                text: "Impose a new tax on all Church lands.",
                effects: { wealth: 100, curiaSupport: -15, piety: -5 },
                consequence: "Funds are raised, but resentment among bishops and abbots grows."
            },
            {
                text: "Seek a large loan from the wealthy Italian banking families.",
                effects: { wealth: 150, influence: -10, piety: -5 },
                consequence: "You secure funds, but become beholden to powerful merchants."
            },
            {
                text: "Issue indulgences to raise money for a 'holy cause'.",
                effects: { wealth: 200, piety: -20, theology: -10 },
                consequence: "A substantial amount of gold flows in, but the practice is widely criticized as simony."
            }
        ]
    }
    // Add many, many more events here!
];

// --- Game Functions ---

function updateUI() {
    currentYearDisplay.textContent = gameState.year + " AD";
    for (const resource in gameState.resources) {
        resourceDisplays[resource].textContent = gameState.resources[resource];
        // Optional: Add visual feedback for resource changes (e.g., color change)
    }
    updateCardinalList();
}

function updateCardinalList() {
    cardinalListDisplay.innerHTML = ''; // Clear current list
    numCardinalsDisplay.textContent = gameState.cardinals.length;
    gameState.cardinals.forEach(cardinal => {
        const li = document.createElement('li');
        li.textContent = `${cardinal.name} (Loyalty: ${cardinal.loyalty}, Infl: ${cardinal.influence})`;
        // Add more details or even hover effects for cardinal info
        cardinalListDisplay.appendChild(li);
    });
}

function applyEventEffects(effects) {
    for (const resource in effects) {
        if (gameState.resources.hasOwnProperty(resource)) {
            gameState.resources[resource] += effects[resource];
            // Ensure resources don't go below 0 (or some minimum)
            if (gameState.resources[resource] < 0) {
                gameState.resources[resource] = 0;
            }
        }
    }
    updateUI();
}

function displayEvent(event) {
    gameState.currentEvent = event;
    eventTitleDisplay.textContent = event.title;
    eventDescriptionDisplay.textContent = event.description;
    eventChoicesDisplay.innerHTML = ''; // Clear previous choices

    event.choices.forEach((choice, index) => {
        const button = document.createElement('button');
        button.classList.add('choice-button');
        button.textContent = choice.text;
        button.addEventListener('click', () => handleChoice(choice));
        eventChoicesDisplay.appendChild(button);
    });
}

function handleChoice(choice) {
    applyEventEffects(choice.effects);
    // Display consequence (could be a separate temporary pop-up or update description)
    eventDescriptionDisplay.textContent = choice.consequence || gameState.currentEvent.description;
    // Clear choices until next turn
    eventChoicesDisplay.innerHTML = '<p>Click "Next Turn" to continue.</p>';
    // Disable next turn button until ready for next event (or enable it depending on design)
    nextTurnButton.disabled = false;
    nextTurnButton.textContent = "Next Turn";
}

function nextTurn() {
    gameState.year++;
    // Apply passive changes (e.g., health decay, slow wealth gain)
    gameState.resources.health = Math.max(0, gameState.resources.health - 1); // Aging
    gameState.resources.wealth += 10; // Base income

    // Select a new random event (for now, just cycle through our demo events)
    const nextEventIndex = Math.floor(Math.random() * gameEvents.length);
    const nextEvent = gameEvents[nextEventIndex]; // Pick a random event for now

    displayEvent(nextEvent);
    nextTurnButton.disabled = true; // Disable until a choice is made
    nextTurnButton.textContent = "Awaiting Choice...";
    updateUI();
    // In a real game, you'd have logic to pick relevant events based on state, year, etc.
}

function showPanel(panelElement) {
    mainGameDisplay.classList.add('hidden'); // Hide the main event display
    curiaPanel.classList.add('hidden');
    decreesPanel.classList.add('hidden');
    mapPanel.classList.add('hidden'); // Hide all panels first

    panelElement.classList.remove('hidden'); // Show the target panel
}

function hideAllPanelsAndShowMain() {
    curiaPanel.classList.add('hidden');
    decreesPanel.classList.add('hidden');
    mapPanel.classList.add('hidden');
    mainGameDisplay.classList.remove('hidden'); // Show the main game area
}

// --- Event Listeners ---
nextTurnButton.addEventListener('click', nextTurn);
openCuriaButton.addEventListener('click', () => showPanel(curiaPanel));
openDecreesButton.addEventListener('click', () => showPanel(decreesPanel));
openMapButton.addEventListener('click', () => showPanel(mapPanel));

closePanelButtons.forEach(button => {
    button.addEventListener('click', hideAllPanelsAndShowMain);
});


// --- Initialization ---
function initializeGame() {
    initializeCardinals(); // Set up initial cardinals
    updateUI(); // Update UI with initial state
    displayEvent(gameEvents[0]); // Display the first event
    nextTurnButton.disabled = true; // Start with next turn disabled until first choice
    nextTurnButton.textContent = "Awaiting Choice...";
}

// Run the game initialization when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeGame);
