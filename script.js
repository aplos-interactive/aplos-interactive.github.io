// --- Game State ---
const Game = {
    turn: 1,
    piety: 500,
    gold: 200,
    influence: 100,
    stability: 75,
    heresyLevel: 0,
    
    // Pope object with new attributes
    pope: {
        name: "Pope Leo X", // Placeholder name
        age: 50,
        health: 100, // New health stat (0-100)
        theology: 50,
        diplomacy: 50,
        intrigue: 50,
        administration: 50,
        maxAge: 90 // Popes won't live forever!
    },

    cardinals: [], // Array to hold appointed Cardinal objects
    
    // Pool of potential cardinals for appointment (expanded with more detail)
    cardinalPool: [
        { name: "Pietro Orsini", theology: 60, diplomacy: 40, intrigue: 30, loyalty: 70, ambition: 30, province: "Lazio" },
        { name: "Guido Visconti", theology: 45, diplomacy: 55, intrigue: 50, loyalty: 60, ambition: 50, province: "Tuscany" },
        { name: "Lorenzo Medici", theology: 50, diplomacy: 35, intrigue: 65, loyalty: 50, ambition: 70, province: "Florence" },
        { name: "Antonio Borgia", theology: 70, diplomacy: 40, intrigue: 20, loyalty: 80, ambition: 20, province: "Castile" },
        { name: "Cesare Sforza", theology: 30, diplomacy: 65, intrigue: 45, loyalty: 55, ambition: 60, province: "Milan" },
        { name: "Benedict Beaufort", theology: 55, diplomacy: 50, intrigue: 30, loyalty: 75, ambition: 40, province: "England" },
        { name: "Philip Valois", theology: 40, diplomacy: 60, intrigue: 55, loyalty: 65, ambition: 55, province: "France" },
        { name: "Johannes Hohenzollern", theology: 62, diplomacy: 38, intrigue: 40, loyalty: 68, ambition: 45, province: "Germany" },
        { name: "Diego Mendoza", theology: 48, diplomacy: 58, intrigue: 62, loyalty: 52, ambition: 72, province: "Aragon" },
        { name: "Francesco Gonzaga", theology: 53, diplomacy: 47, intrigue: 35, loyalty: 73, ambition: 38, province: "Mantua" },
        { name: "Giovanni Colonna", theology: 68, diplomacy: 32, intrigue: 28, loyalty: 82, ambition: 18, province: "Rome" },
        { name: "Stefan Báthory", theology: 50, diplomacy: 55, intrigue: 48, loyalty: 63, ambition: 57, province: "Hungary" },
        { name: "Patrick O'Connor", theology: 42, diplomacy: 40, intrigue: 30, loyalty: 60, ambition: 45, province: "Ireland" }
    ],

    // Simple representation of provinces (more detailed later)
    provinces: [
        { name: "Lazio", wealth: 100, piety: 70, heresy: 5, stability: 80 },
        { name: "Tuscany", wealth: 120, piety: 60, heresy: 10, stability: 75 },
        { name: "Umbria", wealth: 80, piety: 80, heresy: 2, stability: 90 },
        { name: "Naples", wealth: 150, piety: 50, heresy: 15, stability: 60 },
        // Add more provinces as needed for depth
    ],

    // Conclave state
    conclave: {
        isActive: false,
        ballot: 0,
        candidates: {}, // { cardinalName: voteCount }
        winningThreshold: 0, // Calculated based on number of cardinals
        electedPope: null
    },

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
                // Affect specific province
                const lazio = Game.provinces.find(p => p.name === "Lazio");
                if (lazio) lazio.stability = Math.max(0, lazio.stability - 15);
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
                // Spread heresy in a random province
                const randomProvince = Game.provinces[Math.floor(Math.random() * Game.provinces.length)];
                randomProvince.heresy = Math.min(100, randomProvince.heresy + 15);
                return `Whispers of heretical teachings surface in ${randomProvince.name}. Heresy spreads!`;
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
            condition: () => Game.cardinals.length > 2
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
                Game.piety = Math.max(0, Game.piety - 10);
                // Affect all provinces
                Game.provinces.forEach(p => {
                    p.wealth = Math.max(0, p.wealth - 20);
                    p.stability = Math.max(0, p.stability - 15);
                });
                return "A devastating plague sweeps through the Papal States, disrupting trade and sowing fear.";
            }
        },
        {
            name: "Construction of a New Cathedral",
            description: "A grand new cathedral is consecrated in a major city, boosting local piety and administration.",
            effect: () => {
                Game.piety = Math.min(1000, Game.piety + 20);
                Game.stability = Math.min(100, Game.stability + 5);
                // Boost a random province's piety/stability
                const randomProvince = Game.provinces[Math.floor(Math.random() * Game.provinces.length)];
                randomProvince.piety = Math.min(100, randomProvince.piety + 10);
                randomProvince.stability = Math.min(100, randomProvince.stability + 5);
                return `A grand new cathedral is consecrated in ${randomProvince.name}, boosting local piety and administration.`;
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
                        Game.cardinals.forEach(c => c.loyalty = Math.max(0, c.loyalty - 10));
                        Game.influence = Math.min(200, Game.influence + 10);
                        Game.heresyLevel = Math.max(0, Game.heresyLevel - 10); // Reforms might reduce heresy
                        Game.updateDisplay("Your radical reforms cause upheaval but increase your spiritual standing.");
                    }
                },
                {
                    text: "Support moderate reforms, balancing tradition and necessity.",
                    effect: () => {
                        Game.piety = Math.min(1000, Game.piety + 20);
                        Game.stability = Math.min(100, Game.stability + 5);
                        Game.cardinals.forEach(c => c.loyalty = Math.min(100, c.loyalty + 5));
                        Game.heresyLevel = Math.max(0, Game.heresyLevel - 5);
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
                        Game.heresyLevel = Math.min(100, Game.heresyLevel + 15); // Heresy might grow
                        Game.updateDisplay("You resist calls for reform, pleasing some but alienating others.");
                    }
                }
            ],
            triggered: false,
            condition: () => Game.turn >= 3 && Game.piety < 600
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
                        Game.cardinals.forEach(c => c.loyalty = Math.max(0, c.loyalty - 3)); // Some pious cardinals might dislike
                        Game.updateDisplay("You grant the dispensation, strengthening your ties with the monarch.");
                    }
                },
                {
                    text: "Refuse the dispensation, citing religious doctrine.",
                    effect: () => {
                        Game.piety = Math.min(1000, Game.piety + 20);
                        Game.influence = Math.max(0, Game.influence - 15);
                        Game.cardinals.forEach(c => c.loyalty = Math.min(100, c.loyalty + 5)); // Pious cardinals approve
                        Game.updateDisplay("You refuse the marriage, upholding doctrine but risking the king's wrath.");
                    }
                }
            ],
            triggered: false,
            condition: () => Game.turn >= 5 && Game.gold < 300
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
                            Game.heresyLevel = Math.max(0, Game.heresyLevel - 30);
                            Game.stability = Math.max(0, Game.stability - 10);
                            Game.piety = Math.min(1000, Game.piety + 15);
                            Game.cardinals.forEach(c => c.loyalty = Math.min(100, c.loyalty + 5));
                            // Reduce heresy in all affected provinces
                            Game.provinces.forEach(p => p.heresy = Math.max(0, p.heresy - 20));
                            Game.updateDisplay("The Inquisition is launched, crushing heresy but stirring unrest.");
                        } else {
                            Game.updateDisplay("You lack the gold to launch a full-scale Inquisition!");
                            Game.presentDecision(this); // Re-present the current decision
                        }
                    },
                    canAfford: () => Game.gold >= 100
                },
                {
                    text: "Send theologians to debate and persuade heretics.",
                    effect: () => {
                        Game.heresyLevel = Math.max(0, Game.heresyLevel - 10);
                        Game.piety = Math.min(1000, Game.piety + 5);
                        Game.stability = Math.min(100, Game.stability + 5);
                        Game.cardinals.forEach(c => c.loyalty = Math.max(0, c.loyalty - 5));
                        Game.provinces.forEach(p => p.heresy = Math.max(0, p.heresy - 10));
                        Game.updateDisplay("Theologians are sent forth, winning some souls back to the fold.");
                    }
                },
                {
                    text: "Ignore the heresy; it will fade on its own.",
                    effect: () => {
                        Game.heresyLevel = Math.min(100, Game.heresyLevel + 20);
                        Game.piety = Math.max(0, Game.piety - 20);
                        Game.stability = Math.max(0, Game.stability - 5);
                        Game.provinces.forEach(p => p.heresy = Math.min(100, p.heresy + 15));
                        Game.updateDisplay("You ignore the heresy, but it continues to fester and spread.");
                    }
                }
            ],
            triggered: false,
            condition: () => Game.heresyLevel >= 20 || Game.provinces.some(p => p.heresy >= 20) // Trigger if global or any province heresy is high
        }
    ],
    
    // --- DOM Elements ---
    elements: {
        turn: document.getElementById('turn'),
        piety: document.getElementById('piety'),
        gold: document.getElementById('gold'),
        influence: document.getElementById('influence'),
        stability: document.getElementById('stability'),
        heresyLevel: document.getElementById('heresyLevel'),
        
        popeName: document.getElementById('popeName'), // New Pope Name
        popeAge: document.getElementById('popeAge'),     // New Pope Age
        popeHealth: document.getElementById('popeHealth'), // New Pope Health
        theology: document.getElementById('theology'),
        diplomacy: document.getElementById('diplomacy'),
        intrigue: document.getElementById('intrigue'),
        administration: document.getElementById('administration'),

        cardinalSupportOverall: document.getElementById('cardinalSupportOverall'),
        cardinalsList: document.getElementById('cardinalsList'),
        appointCardinalButton: document.getElementById('appointCardinalButton'),

        gameMessage: document.getElementById('gameMessage'),
        nextTurnButton: document.getElementById('nextTurnButton'),

        decisionPanel: document.querySelector('.decision-panel'),
        decisionDescription: document.getElementById('decisionDescription'),
        decisionOptions: document.getElementById('decisionOptions'),

        conclavePanel: document.querySelector('.conclave-panel'), // New Conclave Panel
        conclaveMessage: document.getElementById('conclaveMessage'),
        ballotNumber: document.getElementById('ballotNumber'),
        candidateVotes: document.getElementById('candidateVotes'),
        advanceConclaveButton: document.getElementById('advanceConclaveButton'),
        conclaveInfluenceOptions: document.getElementById('conclaveInfluenceOptions')
    },

    // --- Core Functions ---
    init: function() {
        this.updateDisplay("Welcome, Holy Father! Your reign begins.");
        this.elements.nextTurnButton.addEventListener('click', () => this.advanceTurn());
        this.elements.appointCardinalButton.addEventListener('click', () => this.appointCardinal());
        this.elements.advanceConclaveButton.addEventListener('click', () => this.advanceConclave());
        this.elements.decisionPanel.classList.add('hidden');
        this.elements.conclavePanel.classList.add('hidden'); // Hide conclave panel initially
    },

    updateDisplay: function(message = "") {
        // Update Papal State Stats
        this.elements.turn.textContent = this.turn;
        this.elements.piety.textContent = this.piety;
        this.elements.gold.textContent = this.gold;
        this.elements.influence.textContent = this.influence;
        this.elements.stability.textContent = this.stability;
        this.elements.heresyLevel.textContent = this.heresyLevel;

        // Update Pope's Attributes
        this.elements.popeName.textContent = this.pope.name;
        this.elements.popeAge.textContent = this.pope.age;
        this.elements.popeHealth.textContent = this.pope.health;
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
        this.elements.cardinalsList.innerHTML = '';
        if (this.cardinals.length === 0) {
            this.elements.cardinalsList.innerHTML = '<p class="placeholder">No Cardinals appointed yet.</p>';
        } else {
            this.cardinals.forEach((cardinal, index) => {
                const div = document.createElement('div');
                div.classList.add('cardinal-entry');
                div.innerHTML = `
                    <strong>${cardinal.name}</strong> (${cardinal.province})
                    <div class="attributes">
                        Loyalty: ${cardinal.loyalty}<br>
                        Ambition: ${cardinal.ambition}<br>
                        Theology: ${cardinal.theology}<br>
                        Diplomacy: ${cardinal.diplomacy}
                    </div>
                    <div class="cardinal-actions">
                        <button class="cardinal-action-button" onclick="Game.grantCardinalFavor(${index})">Grant Favor (-20 Gold)</button>
                        <button class="cardinal-action-button" onclick="Game.sendCardinalOnMission(${index})">Send on Mission</button>
                    </div>
                `;
                this.elements.cardinalsList.appendChild(div);
            });
        }
        
        // Update Game Message
        this.elements.gameMessage.textContent = message;
    },

    advanceTurn: function() {
        // Prevent advancing turn if a decision is active or conclave is active
        if (!this.elements.decisionPanel.classList.contains('hidden') || this.conclave.isActive) {
            this.updateDisplay("You must resolve the current situation before advancing!");
            return;
        }

        this.turn += 1;
        let message = `Advancing to Turn ${this.turn}...`;

        // Pope ages and health declines
        this.pope.age += 1;
        this.pope.health = Math.max(0, this.pope.health - Math.floor(this.pope.age / 10) - Math.floor(Math.random() * 3)); // Health declines with age
        
        // Check for Pope's death
        if (this.pope.health <= 0 || this.pope.age >= this.pope.maxAge + Math.floor(Math.random() * 5)) { // Max age has some randomness
            this.startConclave("The Holy Father has passed away! The Conclave gathers.");
            return; // Stop turn advancement, start conclave
        }

        // Basic resource changes per turn
        this.gold += 15 + Math.floor(this.pope.administration / 10);
        this.piety += Math.floor(Math.random() * 5) - 2 + Math.floor(this.pope.theology / 20);
        this.influence += Math.floor(Math.random() * 3) - 1 + Math.floor(this.pope.diplomacy / 25);
        this.stability += Math.floor(Math.random() * 2) - 1 + Math.floor(this.pope.administration / 30);
        this.heresyLevel += Math.floor(Math.random() * 3) - 1;

        // Cardinal influence on stats and loyalty
        this.cardinals.forEach(cardinal => {
            this.stability += Math.floor(cardinal.loyalty / 20) - 2;
            this.piety += Math.floor(cardinal.loyalty / 30) - 1;
            // Ambition can cause loyalty to dip or provide influence if Pope has high intrigue
            if (cardinal.ambition > 60 && Math.random() < 0.05) {
                const intrigueEffect = Math.floor(this.pope.intrigue / 15);
                cardinal.loyalty = Math.max(0, cardinal.loyalty - (Math.floor(Math.random() * 10) - intrigueEffect));
                message += `\nRumors of Cardinal ${cardinal.name}'s ambition are spreading. His loyalty dips${intrigueEffect > 0 ? ' but your intrigue contained it slightly.' : '.'}`;
            }
            // Piety of cardinals can slightly affect overall piety
            this.piety += Math.floor(cardinal.theology / 50);
        });

        // Province updates
        this.provinces.forEach(p => {
            p.heresy = Math.min(100, Math.max(0, p.heresy + Math.floor(Math.random() * 5) - 2)); // Heresy fluctuates locally
            p.stability = Math.min(100, Math.max(0, p.stability + Math.floor(Math.random() * 3) - 1)); // Stability fluctuates
            // Local heresy impacts global stats
            Game.heresyLevel += p.heresy > 50 ? 1 : 0; // If a province has high heresy, it adds to global
        });
        Game.heresyLevel = Math.min(100, Math.max(0, Game.heresyLevel)); // Clamp global heresy

        // Clamp values to reasonable ranges
        this.piety = Math.max(0, Math.min(1000, this.piety));
        this.gold = Math.max(0, this.gold);
        this.influence = Math.max(0, Math.min(200, this.influence));
        this.stability = Math.max(0, Math.min(100, this.stability));
        this.heresyLevel = Math.max(0, Math.min(100, this.heresyLevel));

        // Heresy impacts
        if (this.heresyLevel > 0) {
            this.piety = Math.max(0, this.piety - Math.floor(this.heresyLevel / 5));
            this.stability = Math.max(0, this.stability - Math.floor(this.heresyLevel / 10));
            message += `\nHeresy is weakening the Church.`;
        }

        // --- Event & Decision Triggering ---
        const heresyDecision = this.decisions.find(d => d.id === "deal_with_heresy");
        if (heresyDecision && heresyDecision.condition()) {
            this.presentDecision(heresyDecision);
            return;
        }

        if (Math.random() < 0.7) {
            const possibleEvents = this.events.filter(e => !e.condition || e.condition());
            if (possibleEvents.length > 0) {
                const randomEventIndex = Math.floor(Math.random() * possibleEvents.length);
                const chosenEvent = possibleEvents[randomEventIndex];
                const eventMessage = chosenEvent.effect();
                message += `\nEvent: ${chosenEvent.name} - ${eventMessage}`;
            } else {
                message += "\nNo special events this turn.";
            }
        }
        
        const availableDecisions = this.decisions.filter(d => 
            d.id !== "deal_with_heresy" && 
            !d.triggered &&
            (!d.condition || d.condition())
        );

        if (availableDecisions.length > 0 && Math.random() < 0.2) {
            const randomDecisionIndex = Math.floor(Math.random() * availableDecisions.length);
            const chosenDecision = availableDecisions[randomDecisionIndex];
            
            this.presentDecision(chosenDecision);
            if (chosenDecision.id !== "deal_with_heresy") {
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

        const newCardinalData = this.cardinalPool.shift();
        const newCardinal = { ...newCardinalData }; // Create a copy
        
        this.gold -= cost;
        this.cardinals.push(newCardinal);
        this.stability = Math.min(100, this.stability + 2);
        this.updateDisplay(`You have appointed Cardinal ${newCardinal.name} from ${newCardinal.province}! Gold: -${cost}.`);
    },

    grantCardinalFavor: function(cardinalIndex) {
        const cardinal = this.cardinals[cardinalIndex];
        const cost = 20;
        if (!cardinal) return;

        if (this.gold < cost) {
            this.updateDisplay(`You do not have enough gold to grant a favor to Cardinal ${cardinal.name}. (Requires ${cost} Gold)`);
            return;
        }

        this.gold -= cost;
        cardinal.loyalty = Math.min(100, cardinal.loyalty + 15);
        this.piety = Math.max(0, this.piety - 5); // A favor might be seen as slightly worldly
        this.updateDisplay(`You granted a favor to Cardinal ${cardinal.name}. His loyalty increased significantly!`);
        this.updateDisplay(); // Refresh display after action
    },

    sendCardinalOnMission: function(cardinalIndex) {
        const cardinal = this.cardinals[cardinalIndex];
        if (!cardinal) return;

        // Simple mission logic for now
        const successChance = (cardinal.diplomacy + cardinal.intrigue) / 2 + Math.random() * 30; // Based on attributes
        const missionDuration = 1 + Math.floor(Math.random() * 3); // 1-3 turns
        
        this.updateDisplay(`Cardinal ${cardinal.name} has been sent on a mission for ${missionDuration} turns. Result pending...`);

        // Placeholder for future mission outcome (e.g., event after X turns)
        // For now, let's just give a random result immediately
        setTimeout(() => { // Simulate a delay for feedback
            if (successChance > 70) {
                this.gold += 30;
                this.influence = Math.min(200, this.influence + 10);
                cardinal.loyalty = Math.min(100, cardinal.loyalty + 5);
                this.updateDisplay(`Cardinal ${cardinal.name} successfully completed his mission! You gained gold and influence.`);
            } else if (successChance > 40) {
                this.updateDisplay(`Cardinal ${cardinal.name} returned from his mission with minor success. No major changes.`);
            } else {
                this.piety = Math.max(0, this.piety - 5);
                cardinal.loyalty = Math.max(0, cardinal.loyalty - 10);
                this.updateDisplay(`Cardinal ${cardinal.name}'s mission was a failure, causing some embarrassment.`);
            }
            this.updateDisplay(); // Refresh display
        }, 100); // Small delay to show message
    },

    // --- Decision System ---
    presentDecision: function(decision) {
        this.elements.nextTurnButton.disabled = true;
        this.elements.appointCardinalButton.disabled = true;
        // Disable individual cardinal action buttons
        document.querySelectorAll('.cardinal-action-button').forEach(btn => btn.disabled = true);

        this.elements.decisionPanel.classList.remove('hidden');
        this.elements.decisionDescription.textContent = decision.description;
        this.elements.decisionOptions.innerHTML = '';

        decision.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.classList.add('decision-button');
            button.textContent = option.text;
            
            if (option.canAfford && !option.canAfford()) {
                button.disabled = true;
                button.title = "You cannot afford this option.";
            }

            button.addEventListener('click', () => {
                if (option.canAfford && !option.canAfford()) {
                    this.updateDisplay("You no longer meet the requirements for this option!");
                    return;
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
        this.elements.appointCardinalButton.disabled = false;
        // Re-enable individual cardinal action buttons
        document.querySelectorAll('.cardinal-action-button').forEach(btn => btn.disabled = false);
        this.updateDisplay(`Decision made! Proceed to next turn.`);
    },

    // --- Conclave System ---
    startConclave: function(message) {
        this.conclave.isActive = true;
        this.elements.nextTurnButton.disabled = true;
        this.elements.appointCardinalButton.disabled = true;
        document.querySelectorAll('.cardinal-action-button').forEach(btn => btn.disabled = true);
        this.elements.decisionPanel.classList.add('hidden'); // Hide any active decision
        this.elements.conclavePanel.classList.remove('hidden'); // Show conclave panel

        this.elements.conclaveMessage.textContent = message;
        this.conclave.ballot = 0;
        this.conclave.candidates = {};
        this.conclave.winningThreshold = Math.ceil(this.cardinals.length * 2 / 3); // Two-thirds majority
        if (this.cardinals.length === 0) { // Handle case with no cardinals
            this.elements.conclaveMessage.textContent = "No cardinals to elect a Pope! The Church falls into chaos.";
            this.elements.advanceConclaveButton.disabled = true;
            return;
        }

        // Initialize candidates (all cardinals can be candidates for simplicity)
        this.cardinals.forEach(cardinal => {
            this.conclave.candidates[cardinal.name] = 0;
        });

        this.runConclaveBallot();
    },

    runConclaveBallot: function() {
        this.conclave.ballot++;
        this.elements.ballotNumber.textContent = this.conclave.ballot;
        this.elements.conclaveMessage.textContent = `Ballot ${this.conclave.ballot}: Cardinals cast their votes...`;
        
        // Reset votes for this ballot
        Object.keys(this.conclave.candidates).forEach(name => this.conclave.candidates[name] = 0);

        // Cardinals vote (simplified logic for now)
        this.cardinals.forEach(voter => {
            let bestCandidate = null;
            let maxScore = -1;

            // Voting preference: higher loyalty + a random factor, slightly skewed by theology/ambition
            const potentialCandidates = this.cardinals.filter(c => c !== voter); // Cardinals don't vote for themselves directly here
            
            if (potentialCandidates.length === 0) { // If only one cardinal left
                this.conclave.candidates[voter.name]++;
                return;
            }

            potentialCandidates.forEach(candidate => {
                let score = candidate.loyalty / 2 + candidate.theology / 2 + Math.random() * 20;
                // Ambitious cardinals might vote for someone they can control, or themselves
                if (voter.ambition > 70) {
                    score += Math.random() * 10; // More erratic
                }
                // Loyalty to the previous pope (player's Pope) can influence them to vote for a 'similar' type of cardinal
                // For now, let's just make it simple: vote for highest score
                
                if (score > maxScore) {
                    maxScore = score;
                    bestCandidate = candidate.name;
                }
            });
            if (bestCandidate) {
                this.conclave.candidates[bestCandidate]++;
            } else {
                // If no other candidates (e.g. only one cardinal left), they vote for themselves.
                 this.conclave.candidates[voter.name]++;
            }
        });

        this.updateConclaveDisplay();
        this.checkForPope();
    },

    updateConclaveDisplay: function() {
        this.elements.candidateVotes.innerHTML = '';
        let sortedCandidates = Object.entries(this.conclave.candidates).sort((a, b) => b[1] - a[1]);

        sortedCandidates.forEach(([name, votes]) => {
            const li = document.createElement('li');
            li.textContent = `${name}: ${votes} votes`;
            this.elements.candidateVotes.appendChild(li);
        });

        this.elements.conclaveInfluenceOptions.innerHTML = '';
        const influenceButton = document.createElement('button');
        influenceButton.classList.add('action-button');
        influenceButton.textContent = "Attempt to Influence Conclave (-50 Gold)";
        influenceButton.disabled = this.gold < 50;
        influenceButton.addEventListener('click', () => this.attemptInfluenceConclave());
        this.elements.conclaveInfluenceOptions.appendChild(influenceButton);
    },

    checkForPope: function() {
        let newPopeName = null;
        for (const [name, votes] of Object.entries(this.conclave.candidates)) {
            if (votes >= this.conclave.winningThreshold) {
                newPopeName = name;
                break;
            }
        }

        if (newPopeName) {
            const newPopeCardinal = this.cardinals.find(c => c.name === newPopeName);
            this.endConclave(newPopeCardinal);
        } else {
            this.elements.conclaveMessage.textContent += "\nNo Pope elected yet. Cardinals remain in Conclave.";
        }
    },

    attemptInfluenceConclave: function() {
        const cost = 50;
        if (this.gold < cost) {
            this.updateDisplay("You don't have enough gold to influence the Conclave!");
            return;
        }
        this.gold -= cost;
        this.updateDisplay("You send gold to secret channels, hoping to sway some cardinals...");

        // Simple influence effect: increase votes for the current leading candidate (or a random one)
        let sortedCandidates = Object.entries(this.conclave.candidates).sort((a, b) => b[1] - a[1]);
        if (sortedCandidates.length > 0) {
            const targetCandidate = sortedCandidates[0][0]; // Top candidate
            this.conclave.candidates[targetCandidate] += Math.floor(Math.random() * 5) + 3; // Add 3-7 votes
            this.updateConclaveDisplay();
            this.checkForPope();
        } else {
            this.updateDisplay("There are no candidates to influence!");
        }
        this.updateDisplay();
    },

    endConclave: function(electedCardinal) {
        this.conclave.isActive = false;
        this.elements.conclavePanel.classList.add('hidden');
        this.elements.nextTurnButton.disabled = false;
        this.elements.appointCardinalButton.disabled = false;
        document.querySelectorAll('.cardinal-action-button').forEach(btn => btn.disabled = false);

        // Set new Pope's attributes based on the elected cardinal
        this.pope.name = electedCardinal.name;
        this.pope.age = 40 + Math.floor(Math.random() * 20); // New Pope starts at a reasonable age
        this.pope.health = 100;
        this.pope.theology = electedCardinal.theology;
        this.pope.diplomacy = electedCardinal.diplomacy;
        this.pope.intrigue = electedCardinal.intrigue;
        this.pope.administration = electedCardinal.administration;
        
        // Remove elected cardinal from the cardinals list
        this.cardinals = this.cardinals.filter(c => c.name !== electedCardinal.name);

        this.updateDisplay(`Habemus Papam! Cardinal ${electedCardinal.name} is the new Holy Father! Long live the Pope!`);
    }
};

// Initialize the game when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => Game.init());

// Helper function to generate random cardinal attributes for initial pool (if needed for more dynamic pools)
function generateRandomCardinal(provinceName) {
    const names = ["Riccardo", "Fabio", "Giuseppe", "Matteo", "Marco", "Julian", "Leon"];
    const surnames = ["Rossi", "Bianchi", "Ferrari", "Russo", "Conti", "Romano", "Greco"];
    const randomName = `${names[Math.floor(Math.random() * names.length)]} ${surnames[Math.floor(Math.random() * surnames.length)]}`;

    return {
        name: randomName,
        theology: Math.floor(Math.random() * 60) + 30, // 30-90
        diplomacy: Math.floor(Math.random() * 60) + 30,
        intrigue: Math.floor(Math.random() * 60) + 30,
        loyalty: Math.floor(Math.random() * 40) + 60, // Start higher loyalty
        ambition: Math.floor(Math.random() * 80) + 10, // 10-90
        province: provinceName || "Unknown"
    };
}
