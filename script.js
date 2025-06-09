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
        { name: "Pietro Orsini", theology: 60, diplomacy: 40, intrigue: 30, loyalty: 70, ambition: 30, province: "Lazio", missionTurns: 0 },
        { name: "Guido Visconti", theology: 45, diplomacy: 55, intrigue: 50, loyalty: 60, ambition: 50, province: "Tuscany", missionTurns: 0 },
        { name: "Lorenzo Medici", theology: 50, diplomacy: 35, intrigue: 65, loyalty: 50, ambition: 70, province: "Florence", missionTurns: 0 },
        { name: "Antonio Borgia", theology: 70, diplomacy: 40, intrigue: 20, loyalty: 80, ambition: 20, province: "Castile", missionTurns: 0 },
        { name: "Cesare Sforza", theology: 30, diplomacy: 65, intrigue: 45, loyalty: 55, ambition: 60, province: "Milan", missionTurns: 0 },
        { name: "Benedict Beaufort", theology: 55, diplomacy: 50, intrigue: 30, loyalty: 75, ambition: 40, province: "England", missionTurns: 0 },
        { name: "Philip Valois", theology: 40, diplomacy: 60, intrigue: 55, loyalty: 65, ambition: 55, province: "France", missionTurns: 0 },
        { name: "Johannes Hohenzollern", theology: 62, diplomacy: 38, intrigue: 40, loyalty: 68, ambition: 45, province: "Germany", missionTurns: 0 },
        { name: "Diego Mendoza", theology: 48, diplomacy: 58, intrigue: 62, loyalty: 52, ambition: 72, province: "Aragon", missionTurns: 0 },
        { name: "Francesco Gonzaga", theology: 53, diplomacy: 47, intrigue: 35, loyalty: 73, ambition: 38, province: "Mantua", missionTurns: 0 },
        { name: "Giovanni Colonna", theology: 68, diplomacy: 32, intrigue: 28, loyalty: 82, ambition: 18, province: "Rome", missionTurns: 0 },
        { name: "Stefan Báthory", theology: 50, diplomacy: 55, intrigue: 48, loyalty: 63, ambition: 57, province: "Hungary", missionTurns: 0 },
        { name: "Patrick O'Connor", theology: 42, diplomacy: 40, intrigue: 30, loyalty: 60, ambition: 45, province: "Ireland", missionTurns: 0 }
    ],

    // Simple representation of provinces (more detailed later)
    provinces: [
        { name: "Lazio", wealth: 100, piety: 70, heresy: 5, stability: 80 },
        { name: "Tuscany", wealth: 120, piety: 60, heresy: 10, stability: 75 },
        { name: "Umbria", wealth: 80, piety: 80, heresy: 2, stability: 90 },
        { name: "Naples", wealth: 150, piety: 50, heresy: 15, stability: 60 },
        { name: "Sicily", wealth: 90, piety: 40, heresy: 20, stability: 55 }
    ],

    // Conclave state
    conclave: {
        isActive: false,
        ballot: 0,
        candidates: {}, // { cardinalName: { votes: int, cardinalObject: obj } }
        winningThreshold: 0,
        electedPope: null,
        playerFavoredCandidate: null // Name of the cardinal the player is trying to favor
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
                Game.cardinals.forEach(c => c.loyalty = Math.max(0, c.loyalty - 5));
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
                        Game.heresyLevel = Math.max(0, Game.heresyLevel - 10);
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
                        Game.heresyLevel = Math.min(100, Game.heresyLevel + 15);
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
                        Game.cardinals.forEach(c => c.loyalty = Math.max(0, c.loyalty - 3));
                        Game.updateDisplay("You grant the dispensation, strengthening your ties with the monarch.");
                    }
                },
                {
                    text: "Refuse the dispensation, citing religious doctrine.",
                    effect: () => {
                        Game.piety = Math.min(1000, Game.piety + 20);
                        Game.influence = Math.max(0, Game.influence - 15);
                        Game.cardinals.forEach(c => c.loyalty = Math.min(100, c.loyalty + 5));
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
                            Game.provinces.forEach(p => p.heresy = Math.max(0, p.heresy - 20));
                            Game.updateDisplay("The Inquisition is launched, crushing heresy but stirring unrest.");
                        } else {
                            Game.updateDisplay("You lack the gold to launch a full-scale Inquisition!");
                            Game.presentDecision(this);
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
            condition: () => Game.heresyLevel >= 20 || Game.provinces.some(p => p.heresy >= 20)
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
        
        popeName: document.getElementById('popeName'),
        popeAge: document.getElementById('popeAge'),
        popeHealth: document.getElementById('popeHealth'),
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

        conclavePanel: document.querySelector('.conclave-panel'),
        conclaveMessage: document.getElementById('conclaveMessage'),
        ballotNumber: document.getElementById('ballotNumber'),
        winningThreshold: document.getElementById('winningThreshold'), // New element for threshold
        candidateVotes: document.getElementById('candidateVotes'),
        advanceConclaveButton: document.getElementById('advanceConclaveButton'),
        conclaveInfluenceOptions: document.getElementById('conclaveInfluenceOptions'),
        influenceGoldButton: document.getElementById('influenceGoldButton'),
        influencePromisesButton: document.getElementById('influencePromisesButton'),
        influenceIntrigueButton: document.getElementById('influenceIntrigueButton')
    },

    // --- Core Functions ---
    init: function() {
        this.updateDisplay("Welcome, Holy Father! Your reign begins.");
        this.elements.nextTurnButton.addEventListener('click', () => this.advanceTurn());
        this.elements.appointCardinalButton.addEventListener('click', () => this.appointCardinal());
        this.elements.advanceConclaveButton.addEventListener('click', () => this.advanceConclave());
        
        // Add event listeners for new conclave influence buttons
        this.elements.influenceGoldButton.addEventListener('click', () => this.attemptInfluenceConclave('gold'));
        this.elements.influencePromisesButton.addEventListener('click', () => this.attemptInfluenceConclave('promises'));
        this.elements.influenceIntrigueButton.addEventListener('click', () => this.attemptInfluenceConclave('intrigue'));

        this.elements.decisionPanel.classList.add('hidden');
        this.elements.conclavePanel.classList.add('hidden');
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
                
                let missionStatus = '';
                let missionButtonsDisabled = '';
                if (cardinal.missionTurns > 0) {
                    missionStatus = `<span class="on-mission-badge">On Mission (${cardinal.missionTurns} turns)</span>`;
                    missionButtonsDisabled = 'disabled';
                }

                div.innerHTML = `
                    <strong>${cardinal.name}</strong> (${cardinal.province}) ${missionStatus}
                    <div class="attributes">
                        Loyalty: ${cardinal.loyalty}<br>
                        Ambition: ${cardinal.ambition}<br>
                        Theology: ${cardinal.theology}<br>
                        Diplomacy: ${cardinal.diplomacy}<br>
                        Intrigue: ${cardinal.intrigue}<br>
                        Administration: ${cardinal.administration}
                    </div>
                    <div class="cardinal-actions">
                        <button class="cardinal-action-button" ${missionButtonsDisabled} onclick="Game.grantCardinalFavor(${index})">Grant Favor (-20 Gold)</button>
                        <button class="cardinal-action-button" ${missionButtonsDisabled} onclick="Game.promptCardinalMission(${index})">Send on Mission</button>
                        <button class="cardinal-action-button" ${missionButtonsDisabled} onclick="Game.setFavoredCandidate(${index})">Favor for Pope</button>
                    </div>
                `;
                this.elements.cardinalsList.appendChild(div);
            });
        }
        
        // Update Game Message
        this.elements.gameMessage.textContent = message;
    },

    advanceTurn: function() {
        // If a decision is active or conclave is active, prevent advancing turn
        if (!this.elements.decisionPanel.classList.contains('hidden') || this.conclave.isActive) {
            this.updateDisplay("You must resolve the current situation before advancing!");
            return;
        }

        this.turn += 1;
        let message = `Advancing to Turn ${this.turn}...`;

        // Pope ages and health declines
        this.pope.age += 1;
        this.pope.health = Math.max(0, this.pope.health - Math.floor(this.pope.age / 10) - Math.floor(Math.random() * 3));
        
        // Check for Pope's death
        if (this.pope.health <= 0 || this.pope.age >= this.pope.maxAge + Math.floor(Math.random() * 5)) {
            this.startConclave("The Holy Father has passed away! The Conclave gathers.");
            return;
        }

        // Basic resource changes per turn
        this.gold += 15 + Math.floor(this.pope.administration / 10);
        this.piety += Math.floor(Math.random() * 5) - 2 + Math.floor(this.pope.theology / 20);
        this.influence += Math.floor(Math.random() * 3) - 1 + Math.floor(this.pope.diplomacy / 25);
        this.stability += Math.floor(Math.random() * 2) - 1 + Math.floor(this.pope.administration / 30);
        this.heresyLevel += Math.floor(Math.random() * 3) - 1;

        // Cardinal influence on stats, loyalty, and mission progress
        this.cardinals.forEach(cardinal => {
            this.stability += Math.floor(cardinal.loyalty / 20) - 2;
            this.piety += Math.floor(cardinal.loyalty / 30) - 1;
            
            // Handle mission progress
            if (cardinal.missionTurns > 0) {
                cardinal.missionTurns--;
                if (cardinal.missionTurns === 0) {
                    this.completeCardinalMission(cardinal, message); // Pass message by reference or return from it
                }
            } else {
                // Only apply ambition/loyalty effects if not on mission
                if (cardinal.ambition > 60 && Math.random() < 0.05) {
                    const intrigueEffect = Math.floor(this.pope.intrigue / 15);
                    cardinal.loyalty = Math.max(0, cardinal.loyalty - (Math.floor(Math.random() * 10) - intrigueEffect));
                    message += `\nRumors of Cardinal ${cardinal.name}'s ambition are spreading. His loyalty dips${intrigueEffect > 0 ? ' but your intrigue contained it slightly.' : '.'}`;
                }
            }
            this.piety += Math.floor(cardinal.theology / 50);
        });

        // Province updates
        this.provinces.forEach(p => {
            p.heresy = Math.min(100, Math.max(0, p.heresy + Math.floor(Math.random() * 5) - 2));
            p.stability = Math.min(100, Math.max(0, p.stability + Math.floor(Math.random() * 3) - 1));
            Game.heresyLevel += p.heresy > 50 ? 1 : 0;
        });
        Game.heresyLevel = Math.min(100, Math.max(0, Game.heresyLevel));

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
        if (this.cardinals.length >= 15) { // Cap on number of cardinals
            this.updateDisplay("The College of Cardinals is full (max 15). You cannot appoint more.");
            return;
        }
        if (this.cardinalPool.length === 0) {
            this.updateDisplay("There are no suitable candidates left in the Cardinal Pool!");
            return;
        }

        const newCardinalData = this.cardinalPool.shift();
        const newCardinal = { ...newCardinalData };
        
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
        this.piety = Math.max(0, this.piety - 5);
        this.updateDisplay(`You granted a favor to Cardinal ${cardinal.name}. His loyalty increased significantly!`);
        this.updateDisplay();
    },

    setFavoredCandidate: function(cardinalIndex) {
        const cardinal = this.cardinals[cardinalIndex];
        if (!cardinal) return;

        if (this.conclave.playerFavoredCandidate === cardinal.name) {
            this.conclave.playerFavoredCandidate = null;
            this.updateDisplay(`You are no longer secretly favoring Cardinal ${cardinal.name} for the Papacy.`);
        } else {
            this.conclave.playerFavoredCandidate = cardinal.name;
            this.updateDisplay(`You are now secretly favoring Cardinal ${cardinal.name} for the Papacy.`);
        }
        this.updateDisplay(); // Refresh to update button states if needed
    },

    promptCardinalMission: function(cardinalIndex) {
        const cardinal = this.cardinals[cardinalIndex];
        if (!cardinal || cardinal.missionTurns > 0) return;

        // Temporarily disable buttons and present mission choice
        this.elements.nextTurnButton.disabled = true;
        this.elements.appointCardinalButton.disabled = true;
        document.querySelectorAll('.cardinal-action-button').forEach(btn => btn.disabled = true);

        const missionChoices = [
            { id: "collect_taxes", text: "Collect Taxes (Risk: Stability, Reward: Gold)", cost: 0, effect: () => this.sendCardinalOnMission(cardinalIndex, "collect_taxes") },
            { id: "spread_piety", text: "Spread Piety (Risk: Heresy, Reward: Piety, Influence)", cost: 0, effect: () => this.sendCardinalOnMission(cardinalIndex, "spread_piety") },
            { id: "suppress_heresy", text: "Suppress Heresy (Cost: 20 Gold, Risk: Stability, Reward: Heresy Reduction)", cost: 20, effect: () => this.sendCardinalOnMission(cardinalIndex, "suppress_heresy"), canAfford: () => Game.gold >= 20 },
            { id: "spy_on_rivals", text: "Spy on Rivals (Risk: Loyalty, Reward: Influence)", cost: 0, effect: () => this.sendCardinalOnMission(cardinalIndex, "spy_on_rivals") }
        ];

        let missionMessage = `What mission will you send Cardinal ${cardinal.name} on?`;
        this.presentDecision({
            id: "cardinal_mission_choice",
            description: missionMessage,
            options: missionChoices.map(m => ({
                text: m.text + (m.cost > 0 ? ` (Cost: ${m.cost} Gold)` : ''),
                effect: m.effect,
                canAfford: m.canAfford
            })),
            isTemporary: true // Flag to not mark as 'triggered'
        });
    },

    sendCardinalOnMission: function(cardinalIndex, missionType) {
        const cardinal = this.cardinals[cardinalIndex];
        if (!cardinal) return;

        let cost = 0;
        let baseSuccessChance = 50;
        let duration = 2; // Default mission duration

        switch (missionType) {
            case "collect_taxes":
                baseSuccessChance = cardinal.administration + (cardinal.diplomacy / 2);
                duration = 2;
                break;
            case "spread_piety":
                baseSuccessChance = cardinal.theology + (cardinal.diplomacy / 2);
                duration = 3;
                break;
            case "suppress_heresy":
                cost = 20;
                if (this.gold < cost) {
                    this.updateDisplay("You don't have enough gold for this mission!");
                    this.resolveDecision(); // Close mission choice
                    return;
                }
                this.gold -= cost;
                baseSuccessChance = cardinal.theology + (cardinal.intrigue / 2);
                duration = 3;
                break;
            case "spy_on_rivals":
                baseSuccessChance = cardinal.intrigue + (cardinal.diplomacy / 2);
                duration = 1;
                break;
            default:
                this.updateDisplay("Invalid mission type.");
                this.resolveDecision();
                return;
        }

        cardinal.missionTurns = duration;
        cardinal.currentMissionType = missionType; // Store mission type for outcome
        
        this.updateDisplay(`Cardinal ${cardinal.name} has embarked on a mission to ${missionType.replace('_', ' ')} for ${duration} turns.`);
        this.resolveDecision(); // Close the mission choice panel
    },

    completeCardinalMission: function(cardinal) {
        let outcomeMessage = `Cardinal ${cardinal.name} has returned from his mission.`;
        const randomRoll = Math.random() * 100;
        let successChance = 0;

        switch (cardinal.currentMissionType) {
            case "collect_taxes":
                successChance = cardinal.administration + (cardinal.diplomacy / 2);
                if (randomRoll < successChance) { // Success
                    const goldGained = 50 + Math.floor(Math.random() * 30);
                    this.gold += goldGained;
                    this.stability = Math.max(0, this.stability - 5); // Some unrest from tax collection
                    outcomeMessage += ` He successfully collected ${goldGained} gold, though some local unrest is reported.`;
                } else { // Failure
                    this.gold = Math.max(0, this.gold - 20);
                    this.stability = Math.max(0, this.stability - 10);
                    cardinal.loyalty = Math.max(0, cardinal.loyalty - 10);
                    outcomeMessage += ` His tax collection efforts failed and caused significant unrest.`;
                }
                break;
            case "spread_piety":
                successChance = cardinal.theology + (cardinal.diplomacy / 2);
                if (randomRoll < successChance) {
                    this.piety = Math.min(1000, this.piety + 30);
                    this.influence = Math.min(200, this.influence + 10);
                    // Reduce heresy in a random province
                    const randomProvince = this.provinces[Math.floor(Math.random() * this.provinces.length)];
                    randomProvince.heresy = Math.max(0, randomProvince.heresy - 10);
                    outcomeMessage += ` He successfully spread the faith, increasing piety and influence, and reducing heresy in ${randomProvince.name}.`;
                } else {
                    this.piety = Math.max(0, this.piety - 10);
                    this.heresyLevel = Math.min(100, this.heresyLevel + 5);
                    outcomeMessage += ` His attempts to spread piety met with resistance, leading to a slight increase in heresy.`;
                }
                break;
            case "suppress_heresy":
                successChance = cardinal.theology + (cardinal.intrigue / 2);
                if (randomRoll < successChance) {
                    this.heresyLevel = Math.max(0, this.heresyLevel - 20);
                    this.stability = Math.min(100, this.stability + 5);
                    // Significantly reduce heresy in the cardinal's home province if applicable
                    const homeProvince = this.provinces.find(p => p.name === cardinal.province);
                    if (homeProvince) homeProvince.heresy = Math.max(0, homeProvince.heresy - 30);
                    outcomeMessage += ` He successfully suppressed heretical movements, restoring order and faith.`;
                } else {
                    this.heresyLevel = Math.min(100, this.heresyLevel + 15);
                    this.stability = Math.max(0, this.stability - 15);
                    cardinal.loyalty = Math.max(0, cardinal.loyalty - 15);
                    outcomeMessage += ` His efforts to suppress heresy backfired, causing more unrest and a rise in dissent.`;
                }
                break;
            case "spy_on_rivals":
                successChance = cardinal.intrigue + (cardinal.diplomacy / 2);
                if (randomRoll < successChance) {
                    this.influence = Math.min(200, this.influence + 20);
                    cardinal.loyalty = Math.min(100, cardinal.loyalty + 5);
                    outcomeMessage += ` He uncovered valuable intelligence on a rival power, boosting your influence.`;
                } else {
                    this.influence = Math.max(0, this.influence - 10);
                    cardinal.loyalty = Math.max(0, cardinal.loyalty - 10);
                    outcomeMessage += ` His espionage mission was discovered, leading to a diplomatic setback.`;
                }
                break;
        }

        cardinal.currentMissionType = null; // Clear mission type
        this.updateDisplay(outcomeMessage);
    },

    // --- Decision System ---
    presentDecision: function(decision) {
        this.elements.nextTurnButton.disabled = true;
        this.elements.appointCardinalButton.disabled = true;
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
                // Only mark as triggered if it's not a temporary decision (like mission choice)
                if (!decision.isTemporary) {
                    decision.triggered = true;
                }
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
        document.querySelectorAll('.cardinal-action-button').forEach(btn => btn.disabled = false);
        this.updateDisplay(`Decision made! Proceed to next turn.`);
    },

    // --- Conclave System ---
    startConclave: function(message) {
        this.conclave.isActive = true;
        this.elements.nextTurnButton.disabled = true;
        this.elements.appointCardinalButton.disabled = true;
        document.querySelectorAll('.cardinal-action-button').forEach(btn => btn.disabled = true);
        this.elements.decisionPanel.classList.add('hidden');
        this.elements.conclavePanel.classList.remove('hidden');

        this.elements.conclaveMessage.textContent = message;
        this.conclave.ballot = 0;
        this.conclave.candidates = {};
        
        // Ensure there are cardinals to vote
        if (this.cardinals.length === 0) {
            this.elements.conclaveMessage.textContent = "No cardinals to elect a Pope! The Church falls into chaos.";
            this.elements.advanceConclaveButton.disabled = true;
            this.elements.conclaveInfluenceOptions.innerHTML = ''; // Clear influence options
            return;
        }

        this.conclave.winningThreshold = Math.ceil(this.cardinals.length * 2 / 3);
        this.elements.winningThreshold.textContent = this.conclave.winningThreshold;

        // Initialize candidates (all cardinals can be candidates, plus a few 'outsiders' if we want)
        this.cardinals.forEach(cardinal => {
            this.conclave.candidates[cardinal.name] = { votes: 0, cardinalObject: cardinal };
        });
        
        // If player has a favored candidate, give them an initial boost (e.g., 5-10 votes)
        if (this.conclave.playerFavoredCandidate) {
            const favored = this.conclave.candidates[this.conclave.playerFavoredCandidate];
            if (favored) {
                favored.votes += Math.floor(Math.random() * 6) + 5; // Initial boost
                this.elements.conclaveMessage.textContent += `\nYour favored Cardinal ${this.conclave.playerFavoredCandidate} receives some early support.`;
            }
        }

        this.runConclaveBallot();
    },

    runConclaveBallot: function() {
        this.conclave.ballot++;
        this.elements.ballotNumber.textContent = this.conclave.ballot;
        this.elements.conclaveMessage.textContent = `Ballot ${this.conclave.ballot}: Cardinals cast their votes...`;
        
        // Reset votes for this ballot, keeping initial boosts
        for (const name in this.conclave.candidates) {
            if (this.conclave.candidates.hasOwnProperty(name)) {
                // If this is the first ballot, keep the initial boost. Otherwise, reset for new ballot.
                if (this.conclave.ballot > 1) {
                    this.conclave.candidates[name].votes = 0;
                }
            }
        }

        // Cardinals vote (more complex logic)
        this.cardinals.forEach(voter => {
            // Cardinals on mission cannot vote or be voted for
            if (voter.missionTurns > 0) return;

            let eligibleCandidates = this.cardinals.filter(c => c !== voter && c.missionTurns === 0);
            if (eligibleCandidates.length === 0) { // If only one cardinal left (the voter themselves)
                 if (this.conclave.candidates[voter.name]) { // Ensure candidate exists
                    this.conclave.candidates[voter.name].votes++;
                 }
                return;
            }

            let bestCandidate = null;
            let maxScore = -Infinity; // Use negative infinity for score comparison

            eligibleCandidates.forEach(candidate => {
                let score = 0;

                // Piety alignment: Cardinals prefer candidates with high theology
                score += candidate.theology * 0.5;

                // Pragmatic alignment: Cardinals prefer candidates with good administration/diplomacy
                score += (candidate.administration + candidate.diplomacy) * 0.2;

                // Ambition: Ambitious cardinals might vote for those they think they can control, or highly ambitious peers
                if (voter.ambition > 70) {
                    score += candidate.ambition * 0.3; // High ambition voter favors high ambition candidate
                } else {
                    score += (100 - candidate.ambition) * 0.1; // Low ambition voter prefers less ambitious
                }

                // Loyalty to the previous Pope (indirectly, player's influence)
                // Cardinals who were loyal to the previous pope might favor candidates aligned with the past papal style
                // For simplicity, let's say high loyalty cardinals lean towards current Pope's attributes if we want to model that
                // Or for now, just a general 'stability' factor
                score += voter.loyalty * 0.1;

                // Randomness
                score += Math.random() * 20;

                // Player's favored candidate receives a hidden bonus for loyal cardinals
                if (this.conclave.playerFavoredCandidate === candidate.name) {
                    score += voter.loyalty * 0.2; // Loyalty bonus to player's choice
                }

                if (score > maxScore) {
                    maxScore = score;
                    bestCandidate = candidate.name;
                }
            });

            if (bestCandidate && this.conclave.candidates[bestCandidate]) {
                this.conclave.candidates[bestCandidate].votes++;
            }
        });

        this.updateConclaveDisplay();
        this.checkForPope();
    },

    updateConclaveDisplay: function() {
        this.elements.candidateVotes.innerHTML = '';
        // Convert to array, sort by votes, then by candidate's theology (tie-breaker)
        let sortedCandidates = Object.entries(this.conclave.candidates)
                                .map(([name, data]) => ({ name, votes: data.votes, cardinal: data.cardinalObject }))
                                .sort((a, b) => {
                                    if (b.votes !== a.votes) return b.votes - a.votes;
                                    return b.cardinal.theology - a.cardinal.theology; // Tie-breaker
                                });

        sortedCandidates.forEach(entry => {
            const li = document.createElement('li');
            li.textContent = `${entry.name} (Th: ${entry.cardinal.theology}, Amb: ${entry.cardinal.ambition}): ${entry.votes} votes`;
            if (this.conclave.playerFavoredCandidate === entry.name) {
                li.style.fontWeight = 'bold'; // Highlight player's favored candidate
                li.style.color = '#FFD700'; // Gold color
            }
            this.elements.candidateVotes.appendChild(li);
        });

        // Update influence button states based on gold/piety/stability
        this.elements.influenceGoldButton.disabled = this.gold < 50;
        this.elements.influencePromisesButton.disabled = this.piety < 10;
        this.elements.influenceIntrigueButton.disabled = this.stability < 10;
    },

    checkForPope: function() {
        let newPopeCardinal = null;
        for (const name in this.conclave.candidates) {
            if (this.conclave.candidates.hasOwnProperty(name)) {
                if (this.conclave.candidates[name].votes >= this.conclave.winningThreshold) {
                    newPopeCardinal = this.conclave.candidates[name].cardinalObject;
                    break;
                }
            }
        }

        if (newPopeCardinal) {
            this.endConclave(newPopeCardinal);
        } else {
            this.elements.conclaveMessage.textContent += `\nNo Pope elected yet. Cardinals remain in Conclave. ${this.cardinals.length} Cardinals participating. Required: ${this.conclave.winningThreshold}`;
        }
    },

    attemptInfluenceConclave: function(type) {
        let effectMessage = "";
        let modifier = 0; // Base votes to add

        switch (type) {
            case 'gold':
                const goldCost = 50;
                if (this.gold < goldCost) {
                    this.updateDisplay("You don't have enough gold for this influence attempt!");
                    return;
                }
                this.gold -= goldCost;
                modifier = 5; // Base votes from gold
                effectMessage = "Your gold flows into the pockets of influential cardinals.";
                this.piety = Math.max(0, this.piety - 5); // Gold influence can be seen as less pious
                break;
            case 'promises':
                const pietyCost = 10;
                if (this.piety < pietyCost) {
                    this.updateDisplay("You lack the piety to make convincing promises!");
                    return;
                }
                this.piety -= pietyCost;
                modifier = 4; // Base votes from promises
                effectMessage = "You send secret envoys, promising future favors and positions.";
                this.loyalty = Math.max(0, this.loyalty - 5); // Promises can backfire if not kept, affecting loyalty
                break;
            case 'intrigue':
                const stabilityCost = 10;
                if (this.stability < stabilityCost) {
                    this.updateDisplay("Your state is too unstable for such risky intrigue!");
                    return;
                }
                this.stability = Math.max(0, this.stability - stabilityCost);
                modifier = 6; // Base votes from intrigue
                effectMessage = "Whispers and veiled threats ripple through the Sacred College.";
                this.cardinals.forEach(c => c.loyalty = Math.max(0, c.loyalty - 3)); // Intrigue might reduce overall cardinal loyalty
                break;
            default:
                this.updateDisplay("Invalid influence type.");
                return;
        }

        this.updateDisplay(effectMessage);

        // Target the player's favored candidate, or the current front-runner if none favored
        let targetCandidateName = this.conclave.playerFavoredCandidate;
        if (!targetCandidateName) {
            let sortedCandidates = Object.entries(this.conclave.candidates).sort((a, b) => b[1].votes - a[1].votes);
            if (sortedCandidates.length > 0) {
                targetCandidateName = sortedCandidates[0][0];
            }
        }

        if (targetCandidateName && this.conclave.candidates[targetCandidateName]) {
            // Apply influence bonus with some randomness
            this.conclave.candidates[targetCandidateName].votes += modifier + Math.floor(Math.random() * 5); // Add 3-7 votes
            this.updateConclaveDisplay();
            this.checkForPope();
        } else {
            this.updateDisplay("No suitable candidate to influence!");
        }
    },

    advanceConclave: function() {
        if (!this.conclave.isActive) return;
        this.runConclaveBallot();
    },

    endConclave: function(electedCardinal) {
        this.conclave.isActive = false;
        this.elements.conclavePanel.classList.add('hidden');
        this.elements.nextTurnButton.disabled = false;
        this.elements.appointCardinalButton.disabled = false;
        document.querySelectorAll('.cardinal-action-button').forEach(btn => btn.disabled = false);

        this.pope.name = electedCardinal.name;
        this.pope.age = 40 + Math.floor(Math.random() * 20); // New Pope starts at a reasonable age
        this.pope.health = 100;
        this.pope.theology = electedCardinal.theology;
        this.pope.diplomacy = electedCardinal.diplomacy;
        this.pope.intrigue = electedCardinal.intrigue;
        this.pope.administration = electedCardinal.administration;
        
        // Remove elected cardinal from the cardinals list
        this.cardinals = this.cardinals.filter(c => c.name !== electedCardinal.name);

        this.conclave.playerFavoredCandidate = null; // Reset favored candidate

        this.updateDisplay(`Habemus Papam! Cardinal ${electedCardinal.name} is the new Holy Father! Long live the Pope!`);
    }
};

// Initialize the game when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => Game.init());

// Helper function to generate random cardinal attributes for initial pool (if needed for more dynamic pools)
function generateRandomCardinal(provinceName) {
    const names = ["Riccardo", "Fabio", "Giuseppe", "Matteo", "Marco", "Julian", "Leon", "Francesco", "Giovanni", "Alessandro", "Vincenzo"];
    const surnames = ["Rossi", "Bianchi", "Ferrari", "Russo", "Conti", "Romano", "Greco", "Ricci", "Moretti", "Bruno", "Galli"];
    const randomName = `${names[Math.floor(Math.random() * names.length)]} ${surnames[Math.floor(Math.random() * surnames.length)]}`;

    return {
        name: randomName,
        theology: Math.floor(Math.random() * 60) + 30, // 30-90
        diplomacy: Math.floor(Math.random() * 60) + 30,
        intrigue: Math.floor(Math.random() * 60) + 30,
        loyalty: Math.floor(Math.random() * 40) + 60, // Start higher loyalty
        ambition: Math.floor(Math.random() * 80) + 10, // 10-90
        province: provinceName || "Unknown",
        missionTurns: 0, // Initialize mission status
        currentMissionType: null // Initialize mission type
    };
}
