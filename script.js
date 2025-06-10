// --- Game State Management ---
const gameState = {
    piety: 100,
    gold: 50,
    influence: 20,
    papalAuthority: 50, // Represents direct control over the church
    stability: 70,      // Represents general stability of the realm
    currentTurn: 0,     // To track turns for cooldowns and events
    // Flags for choice paths
    hasSecuredNobleSupport: false,
    hasSecuredTheologicalValidation: false,
    hasReformedChurch: false,
    hasFormedRomanEmpire: false, // Main flag for the Roman Empire path
    hasCrownedNewEmperor: false, // Main flag for the alternative Emperor path
    // Advisor cooldowns
    advisorCooldowns: {
        bellini: 0,
        valerius: 0,
        alchemist: 0,
    },
    // Track if a specific event card is currently displayed (to prevent multiple events in one turn)
    currentEventCardDisplayed: false
};

// --- UI Element References ---
const pietyValueSpan = document.getElementById('pietyValue');
const goldValueSpan = document.getElementById('goldValue');
const influenceValueSpan = document.getElementById('influenceValue');
const papalAuthorityValueSpan = document.getElementById('papalAuthorityValue');
const stabilityValueSpan = document.getElementById('stabilityValue');
const turnValueSpan = document.getElementById('turnValue');
const logMessagesDiv = document.getElementById('logMessages');
const eventAreaDiv = document.getElementById('eventArea');
const nextTurnButton = document.getElementById('nextTurnButton');
const consultButtons = document.querySelectorAll('.consult-button');

// Function to update the UI with current resource values
function updateResourceUI() {
    pietyValueSpan.textContent = gameState.piety;
    goldValueSpan.textContent = gameState.gold;
    influenceValueSpan.textContent = gameState.influence;
    papalAuthorityValueSpan.textContent = gameState.papalAuthority;
    stabilityValueSpan.textContent = gameState.stability;
    turnValueSpan.textContent = gameState.currentTurn;
    updateAdvisorButtonStates();
}

// Function to add a message to the game log
function addToLog(message) {
    const newMessage = document.createElement('p');
    newMessage.innerHTML = `<strong>Turn ${gameState.currentTurn}:</strong> ${message}`;
    logMessagesDiv.prepend(newMessage); // Add new messages at the top
    if (logMessagesDiv.children.length > 15) { // Keep log concise
        logMessagesDiv.lastChild.remove();
    }
}

// Function to update advisor button states (e.g., disable/enable based on cooldown)
function updateAdvisorButtonStates() {
    consultButtons.forEach(button => {
        const advisorId = button.dataset.advisorId;
        if (gameState.advisorCooldowns[advisorId] > gameState.currentTurn) {
            button.disabled = true;
            const remainingTurns = gameState.advisorCooldowns[advisorId] - gameState.currentTurn;
            button.textContent = `Consult (CD: ${remainingTurns})`;
        } else {
            button.disabled = false;
            button.textContent = 'Consult';
        }
    });
}

// --- Advisor Data and Abilities ---
const advisors = {
    bellini: {
        name: "Cardinal Bellini",
        faction: "Theologian",
        ideology: "Traditionalist",
        description: "A staunch defender of ancient doctrines. Strong Piety, but resists change.",
        cooldown: 3, // Cooldown in turns
        consultAbility: function() {
            addToLog(`${this.name} (Traditionalist Theologian) preaches orthodoxy. Your piety grows, but authority is rigid.`);
            gameState.piety = Math.min(250, gameState.piety + 20); // Piety max 250
            gameState.papalAuthority = Math.min(100, gameState.papalAuthority + 5); // Authority max 100
            gameState.gold = Math.max(0, gameState.gold - 5); // Small cost
            
            // Condition for a choice path (e.g., securing theological validation for Empire)
            if (gameState.piety >= 200 && gameState.papalAuthority >= 75) {
                if (!gameState.hasSecuredTheologicalValidation) { // Check if flag isn't already set
                    gameState.hasSecuredTheologicalValidation = true;
                    addToLog(`Bellini's influence has deeply validated your spiritual standing!`);
                }
            }
        }
    },
    valerius: {
        name: "Lord Valerius",
        faction: "Noble",
        ideology: "Pragmatist",
        description: "A cunning strategist with vast estates. Excellent Gold, but may challenge traditional authority.",
        cooldown: 2,
        consultAbility: function() {
            addToLog(`${this.name} (Pragmatist Noble) offers alliances and suggests pragmatic compromises. Your influence expands, but at a cost to piety.`);
            gameState.gold = Math.max(0, gameState.gold + 30);
            gameState.influence = Math.min(100, gameState.influence + 15); // Influence max 100
            gameState.piety = Math.max(0, gameState.piety - 10); // Noble pragmatism might conflict with religious dogma
            gameState.papalAuthority = Math.max(0, gameState.papalAuthority - 5); // Reduced direct control

            // Condition for a choice path (e.g., securing noble support for Empire)
            if (gameState.influence >= 100 && gameState.gold >= 150) {
                if (!gameState.hasSecuredNobleSupport) { // Check if flag isn't already set
                    gameState.hasSecuredNobleSupport = true;
                    addToLog(`Valerius has secured key noble support for your ambitions!`);
                }
            }
        }
    },
    alchemist: {
        name: "Master Alchemist",
        faction: "Merchant",
        ideology: "Reformer",
        description: "Seeks new discoveries and economic opportunities. Focuses on Gold and stability through innovation.",
        cooldown: 4,
        consultAbility: function() {
            addToLog(`${this.name} (Reformer Merchant) proposes innovative economic reforms. Gold flows in, and society becomes more stable, but traditional ways are questioned.`);
            gameState.gold = Math.max(0, gameState.gold + 40);
            gameState.stability = Math.min(100, gameState.stability + 10); // Stability max 100
            gameState.piety = Math.max(0, gameState.piety - 5); // New ideas might challenge old beliefs
            
            // This advisor might be key for the "Reforming the Church" path
            if (gameState.stability >= 80 && gameState.piety <= 80 && gameState.papalAuthority >= 40) {
                 if (!gameState.hasReformedChurch) { // Check if flag isn't already set
                    gameState.hasReformedChurch = true;
                    addToLog(`The Alchemist's reforms are taking hold, shifting the church's direction!`);
                }
            }
        }
    }
};

// --- Event Management - Centralized Display Function ---
function displayEvent(eventData) {
    gameState.currentEventCardDisplayed = true; // Mark an event card as active
    eventAreaDiv.innerHTML = `
        <h3>${eventData.title}</h3>
        <p>${eventData.description}</p>
        <div class="event-choices">
            ${eventData.choices.map(choice => `<button class="event-choice-button" data-choice-id="${choice.id}">${choice.text}</button>`).join('')}
        </div>
    `;
    // Add event listeners to new choice buttons
    document.querySelectorAll('.event-choice-button').forEach(button => {
        button.addEventListener('click', (event) => {
            const choiceId = event.target.dataset.choiceId;
            const chosenAction = eventData.choices.find(c => c.id === choiceId).action;
            
            if (chosenAction) {
                chosenAction(); // Execute the choice action
            }
            
            eventAreaDiv.innerHTML = ''; // Clear event area after choice
            gameState.currentEventCardDisplayed = false; // Mark event card as no longer active
            updateResourceUI(); // Re-update UI after choices
            advanceTurn(true); // Advance turn after a choice, passing true to skip event check
        });
    });
}

// --- Define General Event Cards (Inspired by Social Democracy) ---
const generalEventCards = [
    {
        id: "localDispute",
        title: "A Local Dispute",
        description: "Two powerful local lords are feuding over ancient land claims. Their conflict threatens the peace and your authority in the region. How do you intervene?",
        conditions: () => true, // Always available
        choices: [
            {
                id: "sideWithLordA",
                text: "Back Lord A with Papal decree.",
                action: () => {
                    addToLog("You sided with Lord A. He is grateful, but Lord B resents your interference.");
                    gameState.piety += 5;
                    gameState.influence += 10;
                    gameState.gold -= 5;
                    gameState.stability = Math.max(0, gameState.stability - 5);
                }
            },
            {
                id: "mediatePeace",
                text: "Send envoys to mediate a peaceful resolution.",
                action: () => {
                    addToLog("Your envoys managed to broker a peace. Stability is preserved, but both lords feel you favored the other.");
                    gameState.stability = Math.min(100, gameState.stability + 10);
                    gameState.piety += 10;
                    gameState.influence -= 5;
                }
            },
            {
                id: "ignoreDispute",
                text: "Ignore it. Let them resolve it themselves.",
                action: () => {
                    addToLog("You ignored the dispute. The conflict escalates, reducing stability but saving resources.");
                    gameState.stability = Math.max(0, gameState.stability - 15);
                    gameState.gold += 5;
                }
            }
        ]
    },
    {
        id: "scholarlyRequest",
        title: "Scholarly Request",
        description: "A renowned scholar seeks Papal patronage for his ambitious project to translate ancient pagan texts. This could spread knowledge, but also potentially heretical ideas.",
        conditions: () => gameState.gold >= 30, // Requires some gold to fund
        choices: [
            {
                id: "fundTranslation",
                text: "Fund the translation generously.",
                action: () => {
                    addToLog("You funded the scholarly translation. Knowledge expands, but so does intellectual unrest.");
                    gameState.gold -= 30;
                    gameState.piety = Math.max(0, gameState.piety - 10);
                    gameState.influence = Math.min(100, gameState.influence + 10);
                }
            },
            {
                id: "prohibitTranslation",
                text: "Prohibit the translation as heresy.",
                action: () => {
                    addToLog("You prohibited the translation. Piety is preserved, but scholars murmur about your backwardness.");
                    gameState.piety = Math.min(250, gameState.piety + 15);
                    gameState.influence = Math.max(0, gameState.influence - 10);
                    gameState.stability = Math.max(0, gameState.stability - 5);
                }
            }
        ]
    },
    {
        id: "churchBuilding",
        title: "Call for New Cathedrals",
        description: "From across Christendom, calls rise for new magnificent cathedrals to be built, enhancing faith and beauty. This would require substantial gold and resources.",
        conditions: () => gameState.gold >= 50, // Requires gold
        choices: [
            {
                id: "buildCathedrals",
                text: "Approve funds for new cathedrals.",
                action: () => {
                    addToLog("You approved the construction of new cathedrals. Piety soars, but your treasury is depleted.");
                    gameState.gold = Math.max(0, gameState.gold - 50);
                    gameState.piety = Math.min(250, gameState.piety + 30);
                    gameState.stability = Math.min(100, gameState.stability + 5);
                }
            },
            {
                id: "deferConstruction",
                text: "Defer construction due to financial constraints.",
                action: () => {
                    addToLog("You deferred the construction. Gold is saved, but some faithful are disappointed.");
                    gameState.gold += 10;
                    gameState.piety = Math.max(0, gameState.piety - 10);
                }
            }
        ]
    }
    // Add more general event cards here
];

// --- Define Major Choice Paths (These are specific, high-impact events) ---
const majorChoicePaths = {
    formRomanEmpire: {
        title: "The Vision of Rome Reborn",
        description: "Your authority and influence have reached a pinnacle, with both noble houses and spiritual leaders endorsing your ambitions. Whispers of a new Roman Empire, under your divine guidance, are growing louder. Do you dare to seize this grand destiny?",
        conditions: () => gameState.hasSecuredNobleSupport && gameState.hasSecuredTheologicalValidation && gameState.papalAuthority >= 80 && gameState.influence >= 80 && !gameState.hasFormedRomanEmpire,
        choices: [
            {
                id: "declareEmpire",
                text: "Declare the New Roman Empire!",
                action: () => {
                    addToLog("You have declared the New Roman Empire! The world holds its breath.");
                    gameState.hasFormedRomanEmpire = true;
                    gameState.piety = Math.min(250, gameState.piety + 50);
                    gameState.gold = Math.min(500, gameState.gold + 100);
                    gameState.influence = Math.min(100, gameState.influence + 50);
                    gameState.stability = Math.max(0, gameState.stability - 20); // Initial instability from massive undertaking
                    gameState.papalAuthority = Math.min(100, gameState.papalAuthority + 20);
                    addToLog("The declaration of the Empire creates new challenges.");
                    displayEvent(majorChoicePaths.romanEmpireChallenges); // Trigger follow-up event
                }
            },
            {
                id: "rejectEmpire",
                text: "Maintain the status quo. The burden is too great.",
                action: () => {
                    addToLog("You decide against the grand ambition of the Empire. Stability is maintained, but a great opportunity is missed.");
                    gameState.piety = Math.min(250, gameState.piety + 10);
                    gameState.stability = Math.min(100, gameState.stability + 10);
                    gameState.influence = Math.max(0, gameState.influence - 10);
                    // Reset flags so the event can trigger again if conditions are met later (or if you want a one-time choice, remove these resets)
                    gameState.hasSecuredNobleSupport = false;
                    gameState.hasSecuredTheologicalValidation = false;
                }
            }
        ]
    },
    romanEmpireChallenges: { // A follow-up event/stage to formRomanEmpire
        title: "Challenges to Imperial Authority",
        description: "The declaration of a new Roman Empire has sent shockwaves through Europe. Neighboring powers are wary, and internal dissent may arise. How will you assert your new authority?",
        conditions: () => false, // This event is triggered directly by the previous one, not by general conditions
        choices: [
            {
                id: "militaryMight",
                text: "Demonstrate military might.",
                action: () => {
                    addToLog("Your legions march! The world trembles before your strength. Gold is spent, but fear keeps order.");
                    gameState.gold = Math.max(0, gameState.gold - 50);
                    gameState.influence = Math.min(100, gameState.influence + 30);
                    gameState.stability = Math.min(100, gameState.stability + 15);
                }
            },
            {
                id: "diplomaticOvertures",
                text: "Send diplomatic envoys and forge alliances.",
                action: () => {
                    addToLog("Diplomats are dispatched. Alliances are forged, securing your new claim through peace.");
                    gameState.gold = Math.max(0, gameState.gold - 20);
                    gameState.influence = Math.min(100, gameState.influence + 20);
                    gameState.stability = Math.min(100, gameState.stability + 20);
                    gameState.papalAuthority = Math.min(100, gameState.papalAuthority + 10);
                }
            }
        ]
    },
    crownNewEmperor: {
        title: "A New Emperor for the West?",
        description: "The traditional secular power in the West is waning, and influential factions seek a new strong hand to guide them. There are whispers of crowning a new Emperor, bypassing traditional claims.",
        conditions: () => gameState.hasReformedChurch && gameState.influence >= 90 && gameState.piety <= 90 && !gameState.hasCrownedNewEmperor,
        choices: [
            {
                id: "crownNoble",
                text: "Crown a powerful noble as Emperor.",
                action: () => {
                    addToLog("You have crowned a powerful noble as the new Emperor of the West! This cements a new era of secular power.");
                    gameState.hasCrownedNewEmperor = true;
                    gameState.influence = Math.min(100, gameState.influence + 40);
                    gameState.gold = Math.min(500, gameState.gold + 70);
                    gameState.papalAuthority = Math.max(0, gameState.papalAuthority - 20); // Reduced papal direct power
                    gameState.piety = Math.max(0, gameState.piety - 15); // Secularization
                }
            },
            {
                id: "maintainTheocraticRule",
                text: "Maintain strict Papal authority. No Emperor.",
                action: () => {
                    addToLog("You assert direct Papal rule. No secular Emperor is crowned, strengthening the Church's direct control.");
                    gameState.papalAuthority = Math.min(100, gameState.papalAuthority + 30);
                    gameState.piety = Math.min(250, gameState.piety + 20);
                    gameState.influence = Math.max(0, gameState.influence - 10); // Alienates secular powers
                    // Reset flag so the event can trigger again if conditions are met later (or if you want a one-time choice, remove these resets)
                    gameState.hasReformedChurch = false;
                }
            }
        ]
    }
};

// --- Main Event/Turn Progression Logic ---

// Function to draw a random general event card that meets conditions
function getRandomGeneralEventCard() {
    const availableCards = generalEventCards.filter(card => card.conditions());
    if (availableCards.length === 0) {
        return null; // No available general events
    }
    const randomIndex = Math.floor(Math.random() * availableCards.length);
    return availableCards[randomIndex];
}

// Function to check for and display events (Major paths take priority)
function checkForEvents() {
    // 1. Check for Major Choice Paths first (highest priority)
    if (majorChoicePaths.formRomanEmpire.conditions()) {
        displayEvent(majorChoicePaths.formRomanEmpire);
        return true;
    }
    
    if (majorChoicePaths.crownNewEmperor.conditions()) {
        displayEvent(majorChoicePaths.crownNewEmperor);
        return true;
    }

    // 2. If no major path, draw a random general event card
    const randomEvent = getRandomGeneralEventCard();
    if (randomEvent) {
        displayEvent(randomEvent);
        return true;
    }

    return false; // No event displayed this turn
}

// Function to advance the game turn
// The `skipEventCheck` parameter is used when an event choice already triggered a displayEvent,
// preventing `advanceTurn` from drawing another event on the same logical "turn."
function advanceTurn(skipEventCheck = false) {
    if (gameState.currentEventCardDisplayed && !skipEventCheck) {
        addToLog("You must first resolve the current event before advancing.");
        return; // Prevent turn advancement if an event is active and not skipped by choice
    }
    
    gameState.currentTurn++;
    addToLog("A new turn begins.");
    updateResourceUI();
    
    // Only check for new events if not explicitly told to skip (i.e., if an event choice just happened)
    if (!skipEventCheck) {
        const eventTriggered = checkForEvents();
        if (eventTriggered) {
            addToLog("A major decision awaits you!");
            // `displayEvent` sets `gameState.currentEventCardDisplayed = true;`
        } else {
            addToLog("The days pass uneventfully. Consider your next move or consult an advisor.");
        }
    }
}

// --- Initial Setup and Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    updateResourceUI(); // Initial UI update
    addToLog("Welcome to Habeus Papam! Begin your reign."); // Initial welcome message
    
    // Attach click listeners to advisor buttons
    consultButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            if (gameState.currentEventCardDisplayed) {
                addToLog("You cannot consult an advisor while an important event requires your attention!");
                return; // Prevent advisor consultation during events
            }

            const advisorId = event.target.dataset.advisorId;
            const advisor = advisors[advisorId];

            if (advisor) {
                // Check cooldown
                if (gameState.advisorCooldowns[advisorId] > gameState.currentTurn) {
                    addToLog(`Cannot consult ${advisor.name} yet. Cooldown remaining: ${gameState.advisorCooldowns[advisorId] - gameState.currentTurn} turns.`);
                    return; // Stop function if on cooldown
                }

                advisor.consultAbility(); // Execute the advisor's unique ability
                gameState.advisorCooldowns[advisorId] = gameState.currentTurn + advisor.cooldown; // Set cooldown
                updateResourceUI();      // Update the displayed resources and button states
                advanceTurn();           // Advance the turn after a successful advisor action
            } else {
                console.error("Advisor not found:", advisorId);
            }
        });
    });

    // Attach listener to the Next Turn button
    nextTurnButton.addEventListener('click', () => {
        advanceTurn(); // Call advanceTurn without skipping event check
    });
});
