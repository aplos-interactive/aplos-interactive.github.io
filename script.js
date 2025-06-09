// --- Game State ---
const Game = {
    turn: 1,
    piety: 500,
    gold: 200,
    influence: 100,
    stability: 75,
    heresyLevel: 0, // New stat: Global Heresy Level (0-100)
    
    pope: {
        theology: 50,
        diplomacy: 50,
        intrigue: 50,
        administration: 50
    },

    cardinals: [], // Array to hold appointed Cardinal objects
    
    // Pool of potential cardinals for appointment
    cardinalPool: [
        { name: "Cardinal Pietro", theology: 60, diplomacy: 40, intrigue: 30, loyalty: 70, ambition: 30 },
        { name: "Cardinal Guido", theology: 45, diplomacy: 55, intrigue: 50, loyalty: 60, ambition: 50 },
        { name: "Cardinal Lorenzo", theology: 50, diplomacy: 35, intrigue: 65, loyalty: 50, ambition: 70 },
        { name: "Cardinal Antonio", theology: 70, diplomacy: 40, intrigue: 20, loyalty: 80, ambition: 20 },
        { name: "Cardinal Cesare", theology: 30, diplomacy: 65, intrigue: 45, loyalty: 55, ambition: 60 },
        { name: "Cardinal Benedict", theology: 55, diplomacy: 50, intrigue: 30, loyalty: 75, ambition: 40 },
        { name: "Cardinal Philip", theology: 40, diplomacy: 60, intrigue: 55, loyalty: 65, ambition: 55 },
        // Add more cardinals to the pool for variety
    ],

    // --- Events (More complex events added) ---
    events: [
        {
            name: "Bumper Harvest!",
            description: "A period of unusually good weather leads to plentiful crops across the Papal States. Your coffers swell!",
            effect: () => {
                Game.gold += 50;
                Game.stability = Math.min(100, Game.stability + 5);
                return "A period of unusually good weather leads to plentiful crops across the Papal States. Your coffers swell!";
            }
        },
        {
            name: "Local Rebellion in Lazio",
            description: "A minor noble in Lazio defies your authority. Stability drops!",
            effect: () => {
                Game.stability = Math.max(0, Game.stability - 10);
                Game.gold = Math.max(0, Game.gold - 20);
                return "A minor noble in Lazio defies your authority. Stability drops!";
            }
        },
        {
            name: "Pilgrimage Boost",
            description: "News of your holiness spreads, attracting more pilgrims and increasing piety.",
            effect: () => {
                Game.piety = Math.min(1000, Game.piety + 30);
                return "News of your holiness spreads, attracting more pilgrims and increasing piety.";
            }
        },
        {
            name: "Rumors of Heresy",
            description: "Whispers of heretical teachings surface in a distant diocese. Heresy spreads!",
            effect: () => {
                Game.piety = Math.max(0, Game.piety - 15);
                Game.heresyLevel = Math.min(100, Game.heresyLevel + 10);
                return "Whispers of heretical teachings surface in a distant diocese. Heresy spreads!";
            }
        },
        {
            name: "Diplomatic Overture",
            description: "A major European ruler sends an envoy, seeking your arbitration in a dispute.",
            effect: () => {
                Game.influence = Math.min(200, Game.influence + 10);
                return "A major European ruler sends an envoy, seeking your arbitration in a dispute.";
            }
        },
        {
            name: "Cardinal Faction Forms",
            description: "A group of cardinals begins to question your decisions, reducing their loyalty.",
            effect: () => {
                Game.cardinals.forEach(c => c.loyalty = Math.max(0, c.loyalty - 5)); // Affect all cardinals
                return "A group of cardinals begins to question your decisions, reducing their loyalty.";
            },
            condition: () => Game.cardinals.length > 2 // Only if enough cardinals exist
        },
        {
            name: "Donation from a Devout Noble",
            description: "A wealthy noble, impressed by your piety, sends a generous gift to the Papal coffers.",
            effect: () => {
                Game.gold += 75;
                Game.piety = Math.min(1000, Game.piety + 10);
                return "A wealthy noble, impressed by your piety, sends a generous gift to the Papal coffers.";
            }
        },
        {
            name: "Plague Outbreak",
            description: "A devastating plague sweeps through the Papal States, disrupting trade and sowing fear.",
            effect: () => {
                Game.gold = Math.max(0, Game.gold - 50);
                Game.stability = Math.max(0, Game.stability - 20);
                Game.piety = Math.max(0, Game.piety - 10); // People question God's will
                return "A devastating plague sweeps through the Papal States, disrupting trade and sowing fear.";
            }
        },
        {
            name: "Construction of a New Cathedral",
            description: "A grand new cathedral is consecrated in a major city, boosting local piety and administration.",
            effect: () => {
                Game.piety = Math.min(1000, Game.piety + 20);
                Game.stability = Math.min(100, Game.stability + 5);
                return "A grand new cathedral is consecrated in a major city, boosting local piety and administration.";
            }
        }
    ],

    // --- Decisions (Added Heresy decision) ---
    decisions: [
        {
            id: "church_reform",
            description: "The Church is facing growing calls for reform. What is your stance?",
            options: [
                {
                    text: "Embrace radical reforms to purify the Church.",
                    effect: () => {
                        Game.piety = Math.min(1000, Game.piety + 50);
                        Game.stability = Math.max(0, Game.stability - 15);
                        Game.cardinals.forEach(c => c.loyalty = Math.max(0, c.loyalty - 10)); // Cardinals might resist
                        Game.influence = Math.min(200, Game.influence + 10);
                        Game.updateDisplay("Your radical reforms cause upheaval but increase your spiritual standing.");
                    }
                },
                {
                    text: "Support moderate reforms, balancing tradition and necessity.",
                    effect: () => {
                        Game.piety = Math.min(1000, Game.piety + 20);
                        Game.stability = Math.min(100, Game.stability + 5);
                        Game.cardinals.forEach(c => c.loyalty = Math.min(100, c.loyalty + 5));
                        Game.updateDisplay("Moderate reforms bring some peace and modest improvements.");
                    }
                },
                {
                    text: "Resist all reforms, maintaining the status quo.",
                    effect: () => {
                        Game.piety = Math.max(0, Game.piety - 30);
                        Game.stability = Math.min(100, Game.stability + 10);
                        Game.cardinals.forEach(c => c.loyalty = Math.min(100, c.loyalty + 10));
                        Game.influence = Math.max(0, Game.influence - 10);
                        Game.updateDisplay("You resist calls for reform, pleasing some but alienating others.");
                    }
                }
            ],
            triggered: false, // Ensure this specific decision type only appears once
            condition: () => Game.turn >= 3 && Game.piety < 600 // Example condition
        },
        {
            id: "royal_marriage",
            description: "A powerful king seeks your blessing for a controversial marriage to consolidate his power. What do you do?",
            options: [
                {
                    text: "Grant the dispensation.",
                    effect: () => {
                        Game.gold += 100;
                        Game.influence = Math.min(200, Game.influence + 20);
                        Game.piety = Math.max(0, Game.piety - 10);
                        Game.updateDisplay("You grant the dispensation, strengthening your ties with the monarch.");
                    }
                },
                {
                    text: "Refuse the dispensation, citing religious doctrine.",
                    effect: () => {
                        Game.piety = Math.min(1000, Game.piety + 20);
                        Game.influence = Math.max(0, Game.influence - 15);
                        Game.updateDisplay("You refuse the marriage, upholding doctrine but risking the king's wrath.");
                    }
                }
            ],
            triggered: false,
            condition: () => Game.turn >= 5 && Game.gold < 300 // Example condition
        },
        {
            id: "deal_with_heresy",
            description: "Heresy is spreading within the Church. How will you respond?",
            options: [
                {
                    text: "Launch a full-scale Inquisition! (Cost: 100 Gold)",
                    effect: () => {
                        if (Game.gold >= 100) {
                            Game.gold -= 100;
                            Game.heresyLevel = Math.max(0, Game.heresyLevel - 30); // Significant reduction
                            Game.stability = Math.max(0, Game.stability - 10); // Instability from repression
                            Game.piety = Math.min(1000, Game.piety + 15); // Some might see it as just
                            Game.cardinals.forEach(c => c.loyalty = Math.min(100, c.loyalty + 5)); // Pious cardinals approve
                            Game.updateDisplay("The Inquisition is launched, crushing heresy but stirring unrest.");
                        } else {
                            Game.updateDisplay("You lack the gold to launch a full-scale Inquisition!");
                            // Re-present decision if not enough gold, or make it a choice with consequences for not enough gold
                            Game.presentDecision(this); // Re-present the current decision
                        }
                    },
                    canAfford: () => Game.gold >= 100 // Condition for displaying this option
                },
                {
                    text: "Send theologians to debate and persuade heretics.",
                    effect: () => {
                        Game.heresyLevel = Math.max(0, Game.heresyLevel - 10); // Moderate reduction
                        Game.piety = Math.min(1000, Game.piety + 5);
                        Game.stability = Math.min(100, Game.stability + 5); // Peaceful resolution
                        Game.cardinals.forEach(c => c.loyalty = Math.max(0, c.loyalty - 5)); // Some cardinals might see it as weak
                        Game.updateDisplay("Theologians are sent forth, winning some souls back to the fold.");
                    }
                },
                {
                    text: "Ignore the heresy; it will fade on its own.",
                    effect: () => {
                        Game.heresyLevel = Math.min(100, Game.heresyLevel + 20); // Heresy grows
                        Game.piety = Math.max(0, Game.piety - 20);
                        Game.stability = Math.max(0, Game.stability - 5);
                        Game.updateDisplay("You ignore the heresy, but it continues to fester and spread.");
                    }
                }
            ],
            // This decision should trigger repeatedly if heresy is high
            triggered: false, // For general decision, but we'll re-trigger it based on condition
            condition: () => Game.heresyLevel >= 20 // Only appears if heresy is above 20
        }
    ],
    
    // --- DOM Elements ---
    elements: {
        turn: document.getElementById('turn'),
        piety: document.getElementById('piety'),
        gold: document.getElementById('gold'),
        influence: document.getElementById('influence'),
        stability: document.getElementById('stability'),
        heresyLevel: document.getElementById('heresyLevel'), // New element reference
        
        theology: document.getElementById('theology'),
        diplomacy: document.getElementById('diplomacy'),
        intrigue: document.getElementById('intrigue'),
        administration: document.getElementById('administration'),

        cardinalSupportOverall: document.getElementById('cardinalSupportOverall'), // Overall cardinal support
        cardinalsList: document.getElementById('cardinalsList'), // Container for individual cardinals
        appointCardinalButton: document.getElementById('appointCardinalButton'), // Button to appoint

        gameMessage: document.getElementById('gameMessage'),
        nextTurnButton: document.getElementById('nextTurnButton'),

        decisionPanel: document.querySelector('.decision-panel'),
        decisionDescription: document.getElementById('decisionDescription'),
        decisionOptions: document.getElementById('decisionOptions')
    },

    // --- Core Functions ---
    init: function() {
        this.updateDisplay("Welcome, Holy Father! Your reign begins.");
        this.elements.nextTurnButton.addEventListener('click', () => this.advanceTurn());
        this.elements.appointCardinalButton.addEventListener('click', () => this.appointCardinal());
        this.elements.decisionPanel.classList.add('hidden');
    },

    updateDisplay: function(message = "") {
        // Update Papal State Stats
        this.elements.turn.textContent = this.turn;
        this.elements.piety.textContent = this.piety;
        this.elements.gold.textContent = this.gold;
        this.elements.influence.textContent = this.influence;
        this.elements.stability.textContent = this.stability;
        this.elements.heresyLevel.textContent = this.heresyLevel; // Update heresy level

        // Update Pope's Attributes
        this.elements.theology.textContent = this.pope.theology;
        this.elements.diplomacy.textContent = this.pope.diplomacy;
        this.elements.intrigue.textContent = this.pope.intrigue;
        this.elements.administration.textContent = this.pope.administration;

        // Update Overall Cardinal Support
        if (this.cardinals.length > 0) {
            const totalLoyalty = this.cardinals.reduce((sum, cardinal) => sum + cardinal.loyalty, 0);
            this.elements.cardinalSupportOverall.textContent = Math.round(totalLoyalty / this.cardinals.length);
        } else {
            this.elements.cardinalSupportOverall.textContent = 0;
        }


        // Update Cardinal List
        this.elements.cardinalsList.innerHTML = ''; // Clear previous entries
        if (this.cardinals.length === 0) {
            this.elements.cardinalsList.innerHTML = '<p class="placeholder">No Cardinals appointed yet.</p>';
        } else {
            this.cardinals.forEach(cardinal => {
                const div = document.createElement('div');
                div.classList.add('cardinal-entry');
                div.innerHTML = `
                    <strong>${cardinal.name}</strong>
                    <div class="attributes">
                        Loyalty: ${cardinal.loyalty}<br>
                        Ambition: ${cardinal.ambition}<br>
                        Theology: ${cardinal.theology}
                    </div>
                `;
                this.elements.cardinalsList.appendChild(div);
            });
        }
        
        // Update Game Message
        this.elements.gameMessage.textContent = message;
    },

    advanceTurn: function() {
        // If a decision is active, prevent advancing turn
        if (!this.elements.decisionPanel.classList.contains('hidden')) {
            this.updateDisplay("You must make a decision before advancing!");
            return;
        }

        this.turn += 1;
        let message = `Advancing to Turn ${this.turn}...`;

        // Basic resource changes per turn
        this.gold += 15;
        this.piety += Math.floor(Math.random() * 5) - 2;
        this.influence += Math.floor(Math.random() * 3) - 1;
        this.stability += Math.floor(Math.random() * 2) - 1;
        this.heresyLevel += Math.floor(Math.random() * 3) - 1; // Heresy slowly spreads or recedes naturally

        // Apply Pope's attribute influence
        this.gold += Math.floor(this.pope.administration / 10);
        this.piety += Math.floor(this.pope.theology / 20);
        this.influence += Math.floor(this.pope.diplomacy / 25);
        this.stability += Math.floor(this.pope.administration / 30);

        // Cardinal influence on stats
        this.cardinals.forEach(cardinal => {
            // Loyalty affects stability and piety
            this.stability += Math.floor(cardinal.loyalty / 20) - 2;
            this.piety += Math.floor(cardinal.loyalty / 30) - 1;
            // Ambition can cause issues or opportunities
            if (cardinal.ambition > 60 && Math.random() < 0.05) { // 5% chance for ambitious cardinal to cause trouble
                cardinal.loyalty = Math.max(0, cardinal.loyalty - Math.floor(Math.random() * 10));
                message += `\nRumors of Cardinal ${cardinal.name}'s ambition are spreading. His loyalty dips.`;
            }
        });

        // Clamp values to reasonable ranges
        this.piety = Math.max(0, Math.min(1000, this.piety));
        this.gold = Math.max(0, this.gold);
        this.influence = Math.max(0, Math.min(200, this.influence));
        this.stability = Math.max(0, Math.min(100, this.stability));
        this.heresyLevel = Math.max(0, Math.min(100, this.heresyLevel)); // Heresy capped at 100

        // Heresy impacts
        if (this.heresyLevel > 0) {
            this.piety = Math.max(0, this.piety - Math.floor(this.heresyLevel / 5));
            this.stability = Math.max(0, this.stability - Math.floor(this.heresyLevel / 10));
            message += `\nHeresy is weakening the Church.`;
        }

        // --- Event & Decision Triggering ---
        // Always try to trigger a decision if certain conditions met (e.g. for heresy)
        const heresyDecision = this.decisions.find(d => d.id === "deal_with_heresy");
        if (heresyDecision && heresyDecision.condition()) {
            this.presentDecision(heresyDecision);
            return;
        }

        // Chance for a random event
        if (Math.random() < 0.7) {
            const possibleEvents = this.events.filter(e => !e.condition || e.condition()); // Filter for events with met conditions
            if (possibleEvents.length > 0) {
                const randomEventIndex = Math.floor(Math.random() * possibleEvents.length);
                const chosenEvent = possibleEvents[randomEventIndex];
                const eventMessage = chosenEvent.effect(); // Event now returns its message
                message += `\nEvent: ${chosenEvent.name} - ${eventMessage}`;
            } else {
                message += "\nNo special events this turn.";
            }
        }
        
        // Chance to trigger a general decision (not heresy-specific, and unique if triggered once)
        const availableDecisions = this.decisions.filter(d => 
            d.id !== "deal_with_heresy" && // Exclude heresy decision from general pool
            !d.triggered && // Only un-triggered unique decisions
            (!d.condition || d.condition()) // Check if conditional decision's conditions are met
        );

        if (availableDecisions.length > 0 && Math.random() < 0.2) { // 20% chance to trigger a new general decision
            const randomDecisionIndex = Math.floor(Math.random() * availableDecisions.length);
            const chosenDecision = availableDecisions[randomDecisionIndex];
            
            this.presentDecision(chosenDecision);
            if (chosenDecision.id !== "deal_with_heresy") { // Mark as triggered only for unique decisions
                chosenDecision.triggered = true;
            }
            return;
        }

        this.updateDisplay(message);
    },

    // --- Cardinal Management ---
    appointCardinal: function() {
        const cost = 50;
        if (this.gold < cost) {
            this.updateDisplay("You do not have enough gold to appoint a new Cardinal!");
            return;
        }
        if (this.cardinalPool.length === 0) {
            this.updateDisplay("There are no suitable candidates left in the Cardinal Pool!");
            return;
        }

        const newCardinalData = this.cardinalPool.shift(); // Take one from the pool
        // Create a copy to ensure changes to the cardinal don't affect the original pool object if it was a direct reference
        const newCardinal = { ...newCardinalData }; 
        
        this.gold -= cost;
        this.cardinals.push(newCardinal);
        this.stability = Math.min(100, this.stability + 2); // Small stability boost
        this.updateDisplay(`You have appointed Cardinal ${newCardinal.name}! Gold: -${cost}.`);
    },

    // --- Decision System ---
    presentDecision: function(decision) {
        this.elements.nextTurnButton.disabled = true;
        this.elements.appointCardinalButton.disabled = true; // Disable cardinal button too
        this.elements.decisionPanel.classList.remove('hidden');
        this.elements.decisionDescription.textContent = decision.description;
        this.elements.decisionOptions.innerHTML = '';

        decision.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.classList.add('decision-button');
            button.textContent = option.text;
            
            // Disable if option has a cost and player can't afford it
            if (option.canAfford && !option.canAfford()) {
                button.disabled = true;
                button.title = "You cannot afford this option.";
            }

            button.addEventListener('click', () => {
                // Re-check affordability on click, in case state changed
                if (option.canAfford && !option.canAfford()) {
                    this.updateDisplay("You no longer meet the requirements for this option!");
                    return; // Do nothing if suddenly unaffordable
                }
                option.effect();
                this.resolveDecision();
            });
            this.elements.decisionOptions.appendChild(button);
        });
    },

    resolveDecision: function() {
        this.elements.decisionPanel.classList.add('hidden');
        this.elements.decisionOptions.innerHTML = '';
        this.elements.nextTurnButton.disabled = false;
        this.elements.appointCardinalButton.disabled = false; // Re-enable cardinal button
        this.updateDisplay(`Decision made! Proceed to next turn.`); // Overwritten by next turn's display anyway
    }
};

// Initialize the game when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => Game.init());
