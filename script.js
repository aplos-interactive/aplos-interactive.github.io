// --- Game State (Medieval Papal Theme) ---
const Game = {
    currentTurn: 1, // Represents the passage of time/actions
    resources: 4, // Action points for playing cards each turn
    gold: 200,
    piety: 500,
    influence: 100, // Political influence over secular rulers/factions
    stability: 75, // Internal stability of the Papal States
    heresyLevel: 0, // 0-100, higher means more widespread heresy

    // Pope object
    pope: {
        name: "Leo X", // Current Pope's name
        age: 50,
        health: 100, // 0-100, affects chance of death
        attributes: { // Reflects the Pope's personal strengths
            theology: 50,
            diplomacy: 50,
            intrigue: 50,
            administration: 50
        }
    },

    // Cardinals array
    cardinals: [], // Populated dynamically or on init

    // Conclave state
    conclave: {
        active: false,
        ballot: 0,
        candidates: [], // List of cardinals who are candidates
        votes: {}, // Stores current votes for each candidate
        winningThreshold: 0, // Votes needed to win
        influenceAttempts: 0 // How many times player has influenced
    },

    // --- Card Definitions (Medieval Papal Theme) ---
    // Cards are organized by decks. Each card has a cost, effects, and conditions.
    decks: {
        'papal-affairs': [
            {
                id: 'papal_bull',
                title: 'Issue Papal Bull',
                text: 'Publish an important decree to solidify Church doctrine or policy.',
                cost: 1,
                effects: () => {
                    Game.piety = Math.min(1000, Game.piety + 30);
                    Game.heresyLevel = Math.max(0, Game.heresyLevel - 5);
                    return "A new Papal Bull strengthens faith and reduces heresy!";
                },
                canPlay: () => true
            },
            {
                id: 'appoint_bishop',
                title: 'Appoint Bishop',
                text: 'Appoint a loyal bishop to a key diocese.',
                cost: 1,
                effects: () => {
                    Game.influence = Math.min(200, Game.influence + 10);
                    Game.piety = Math.min(1000, Game.piety + 10);
                    return "A loyal bishop strengthens our control and piety in the region.";
                },
                canPlay: () => true
            },
            {
                id: 'fund_cathedral',
                title: 'Fund Cathedral',
                text: 'Invest in the construction of a magnificent cathedral.',
                cost: 2, // Gold cost
                effects: () => {
                    if (Game.gold < 50) return "Not enough gold to fund a cathedral!";
                    Game.gold -= 50;
                    Game.piety = Math.min(1000, Game.piety + 50);
                    Game.stability = Math.min(100, Game.stability + 5);
                    return "A grand cathedral boosts piety and local stability.";
                },
                canPlay: () => Game.gold >= 50 // Check gold before playing
            },
            {
                id: 'call_council',
                title: 'Call Church Council',
                text: 'Convene a council of bishops and cardinals to address pressing issues.',
                cost: 3,
                effects: () => {
                    Game.piety = Math.min(1000, Game.piety + 40);
                    Game.heresyLevel = Math.max(0, Game.heresyLevel - 10);
                    Game.influence = Math.min(200, Game.influence + 15);
                    Game.stability = Math.max(0, Game.stability - 5); // Councils can cause friction
                    return "A Church Council addresses critical issues, but stirs some debate.";
                },
                canPlay: () => true
            },
            {
                id: 'send_inquisitor',
                title: 'Send Inquisitor',
                text: 'Dispatch an inquisitor to root out heresy in a rebellious region.',
                cost: 1,
                effects: () => {
                    Game.heresyLevel = Math.max(0, Game.heresyLevel - 15);
                    Game.stability = Math.max(0, Game.stability - 10); // Can cause unrest
                    Game.piety = Math.min(1000, Game.piety + 5); // Opinion of loyalists
                    return "The Inquisitor strikes at heresy, but stability may suffer.";
                },
                canPlay: () => Game.heresyLevel > 0 // Only if there's heresy to fight
            }
        ],
        'diplomacy': [
            {
                id: 'negotiate_treaty',
                title: 'Negotiate Treaty',
                text: 'Forge a new alliance or peace treaty with a foreign power.',
                cost: 2,
                effects: () => {
                    Game.influence = Math.min(200, Game.influence + 20);
                    Game.stability = Math.min(100, Game.stability + 10);
                    return "A new treaty strengthens the Papal States' position!";
                },
                canPlay: () => true
            },
            {
                id: 'request_aid',
                title: 'Request Military Aid',
                text: 'Ask a powerful Catholic monarch for military assistance.',
                cost: 1,
                effects: () => {
                    if (Game.influence < 40) return "Not enough influence to request aid!";
                    Game.gold = Math.min(1000, Game.gold + 75); // Simulate aid in gold
                    Game.influence = Math.max(0, Game.influence - 20); // Influence cost
                    Game.stability = Math.min(100, Game.stability + 5);
                    return "Foreign aid arrives, but at a cost to your influence.";
                },
                canPlay: () => Game.influence >= 40
            }
        ],
        'church-doctrine': [
            {
                id: 'issue_indulgence',
                title: 'Issue Indulgence',
                text: 'Offer spiritual benefits in exchange for monetary contributions.',
                cost: 1,
                effects: () => {
                    Game.gold = Math.min(1000, Game.gold + 40);
                    Game.piety = Math.max(0, Game.piety - 10); // Can backfire on piety long-term
                    Game.heresyLevel = Math.min(100, Game.heresyLevel + 5); // Can increase heresy
                    return "Indulgences fill the coffers, but may fuel discontent among the faithful.";
                },
                canPlay: () => true
            },
            {
                id: 'publish_theological_work',
                title: 'Publish Theological Work',
                text: 'Commission a scholarly work to clarify complex doctrines.',
                cost: 2,
                effects: () => {
                    Game.piety = Math.min(1000, Game.piety + 25);
                    Game.heresyLevel = Math.max(0, Game.heresyLevel - 10);
                    Game.pope.attributes.theology = Math.min(100, Game.pope.attributes.theology + 5);
                    return "A new theological work strengthens faith and improves the Pope's standing.";
                },
                canPlay: () => true
            }
        ],
    },
    hand: [], // Cards currently in the player's hand
    maxHandSize: 3,

    // --- DOM Elements ---
    elements: {
        // Status Panel Elements
        currentTurn: document.getElementById('current-turn'),
        resourcesAvailable: document.getElementById('resources-available'),
        gold: document.getElementById('gold'),
        piety: document.getElementById('piety'),
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

        // Main Content Panel Elements
        currentMainYear: document.getElementById('current-main-year'),
        narrativeText: document.getElementById('narrative-text'),
        availableDecks: document.getElementById('available-decks'),
        playerHandSlots: document.getElementById('player-hand-slots'),
        feedbackMessage: document.getElementById('feedback-message'),

        // Conclave Panel Elements
        conclavePanel: document.querySelector('.conclave-panel'),
        conclaveMessage: document.getElementById('conclaveMessage'),
        ballotNumber: document.getElementById('ballotNumber'),
        winningThreshold: document.getElementById('winningThreshold'),
        candidateVotes: document.getElementById('candidateVotes'),
        influenceGoldButton: document.getElementById('influenceGoldButton'),
        influencePromisesButton: document.getElementById('influencePromisesButton'),
        influenceIntrigueButton: document.getElementById('influenceIntrigueButton'),
        favorPopeButton: document.getElementById('favorPopeButton'),
        advanceConclaveButton: document.getElementById('advanceConclaveButton'),

        // Menu buttons (for future implementation)
        menuButtons: document.querySelectorAll('.menu-button')
    },

    // --- Core Functions ---
    init: function() {
        this.generateCardinals(8); // Start with a good number of cardinals
        this.updateDisplay("Welcome, Your Holiness! The Papal States await your divine guidance.");

        // Attach event listeners for decks (drawing cards)
        document.querySelectorAll('.card-deck').forEach(deckDiv => {
            deckDiv.addEventListener('click', () => {
                const deckId = deckDiv.dataset.deckId;
                this.drawCard(deckId);
            });
        });

        // Conclave button listeners
        this.elements.influenceGoldButton.addEventListener('click', () => this.influenceConclave('gold'));
        this.elements.influencePromisesButton.addEventListener('click', () => this.influenceConclave('promises'));
        this.elements.influenceIntrigueButton.addEventListener('click', () => this.influenceConclave('intrigue'));
        this.elements.favorPopeButton.addEventListener('click', () => this.favorPope()); // This is a placeholder, needs definition
        this.elements.advanceConclaveButton.addEventListener('click', () => this.runConclaveBallot());


        // Initial hand slots
        this.updateHandDisplay();

        // Initial narrative
        this.setNarrative(`
            <p>The Holy See stands as a beacon of faith amidst a world of shifting allegiances and burgeoning heresies. Your Holiness, your reign begins. Guide the faithful, manage the temporal realm, and defend the Church from its enemies.</p>
        `);
    },

    updateDisplay: function(message = "") {
        // Update general stats
        this.elements.currentTurn.textContent = this.currentTurn;
        this.elements.resourcesAvailable.textContent = this.resources;
        this.elements.gold.textContent = this.gold;
        this.elements.piety.textContent = this.piety;
        this.elements.influence.textContent = this.influence;
        this.elements.stability.textContent = this.stability;
        this.elements.heresyLevel.textContent = this.heresyLevel;

        // Update Pope info
        this.elements.popeName.textContent = this.pope.name;
        this.elements.popeAge.textContent = this.pope.age;
        this.elements.popeHealth.textContent = this.pope.health;
        this.elements.theology.textContent = this.pope.attributes.theology;
        this.elements.diplomacy.textContent = this.pope.attributes.diplomacy;
        this.elements.intrigue.textContent = this.pope.attributes.intrigue;
        this.elements.administration.textContent = this.pope.attributes.administration;

        // Update Cardinals list
        this.elements.cardinalsList.innerHTML = '';
        if (this.cardinals.length === 0) {
            this.elements.cardinalsList.innerHTML = '<p class="placeholder">No Cardinals appointed yet.</p>';
        } else {
            let totalSupport = 0;
            this.cardinals.forEach(c => {
                totalSupport += c.loyalty;
                const cardinalDiv = document.createElement('div');
                cardinalDiv.classList.add('cardinal-entry');
                cardinalDiv.innerHTML = `
                    <strong>${c.name}</strong> (${c.age})<br>
                    <div class="attributes">Loyalty: ${c.loyalty}, Ambition: ${c.ambition}, Piety: ${c.piety}</div>
                `;
                this.elements.cardinalsList.appendChild(cardinalDiv);
            });
            this.elements.cardinalSupportOverall.textContent = Math.round(totalSupport / this.cardinals.length);
        }

        // Update main year (for narrative context, using a fixed start year for now)
        this.elements.currentMainYear.textContent = 1500 + this.currentTurn - 1; // Simple year progression

        // Update Game Message (feedback)
        if (message) {
            this.showFeedback(message, 'success');
        }

        // Disable/enable conclave buttons based on resources/state
        if (this.conclave.active) {
            this.elements.influenceGoldButton.disabled = Game.gold < 50;
            this.elements.influencePromisesButton.disabled = Game.piety < 10;
            this.elements.influenceIntrigueButton.disabled = Game.stability < 10;
        } else {
            this.elements.influenceGoldButton.disabled = true;
            this.elements.influencePromisesButton.disabled = true;
            this.elements.influenceIntrigueButton.disabled = true;
            this.elements.favorPopeButton.disabled = true;
            this.elements.advanceConclaveButton.disabled = true;
        }
    },

    setNarrative: function(text) {
        this.elements.narrativeText.innerHTML = text;
    },

    // --- Card System Functions ---
    drawCard: function(deckId) {
        if (this.conclave.active) {
            this.showFeedback("Cannot draw cards during a Conclave!", 'error');
            return;
        }
        if (this.hand.length >= this.maxHandSize) {
            this.showFeedback("Your hand is full! Play a card first.", 'error');
            return;
        }
        if (!this.decks[deckId] || this.decks[deckId].length === 0) {
            this.showFeedback(`No cards left in the ${deckId} deck!`, 'error');
            return;
        }

        const drawnCard = this.decks[deckId].shift(); // Remove from top of deck
        this.hand.push(drawnCard);
        this.showFeedback(`Drew "${drawnCard.title}" from the ${deckId} deck.`, 'success');
        this.updateHandDisplay();
    },

    playCard: function(cardIndex) {
        if (this.conclave.active) {
            this.showFeedback("Cannot play regular cards during a Conclave!", 'error');
            return;
        }
        if (cardIndex < 0 || cardIndex >= this.hand.length) {
            this.showFeedback("Invalid card selection.", 'error');
            return;
        }

        const cardToPlay = this.hand[cardIndex];

        if (this.resources < cardToPlay.cost) {
            this.showFeedback(`Not enough resources! This card costs ${cardToPlay.cost} resources.`, 'error');
            return;
        }

        // Check any specific play conditions for the card
        if (cardToPlay.canPlay && !cardToPlay.canPlay()) {
            this.showFeedback(`Cannot play "${cardToPlay.title}" at this time.`, 'error');
            return;
        }

        this.resources -= cardToPlay.cost;
        const feedback = cardToPlay.effects(); // Apply card effects
        this.hand.splice(cardIndex, 1); // Remove card from hand

        this.showFeedback(feedback, 'success');
        this.updateDisplay(); // Update stats
        this.updateHandDisplay(); // Update hand visuals

        this.advanceTurn(); // Advance the turn after playing a card
    },

    updateHandDisplay: function() {
        this.elements.playerHandSlots.innerHTML = ''; // Clear current hand display

        // Create empty slots up to maxHandSize
        for (let i = 0; i < this.maxHandSize; i++) {
            const slot = document.createElement('div');
            slot.classList.add('card-slot');
            slot.classList.add('empty-hand-slot');
            this.elements.playerHandSlots.appendChild(slot);
        }

        // Populate slots with cards from hand
        this.hand.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.classList.add('card-in-hand');
            cardElement.innerHTML = `
                <div class="card-title">${card.title}</div>
                <div class="card-content">${card.text}</div>
                <div class="card-cost">Cost: ${card.cost} Resources</div>
            `;
            cardElement.addEventListener('click', () => this.playCard(index));

            // Replace an empty slot with the actual card
            if (this.elements.playerHandSlots.children[index]) {
                this.elements.playerHandSlots.children[index].replaceWith(cardElement);
            }
        });
    },

    // --- Turn Advancement ---
    advanceTurn: function() {
        if (this.conclave.active) {
            // During conclave, turns advance by ballot, not this function
            return;
        }

        this.currentTurn++;
        this.resources = 4; // Replenish resources each turn

        // Pope ages and health declines
        this.pope.age++;
        this.pope.health = Math.max(0, this.pope.health - Math.floor(Math.random() * 5 + 1)); // Lose 1-5 health per turn
        if (this.pope.age >= 70) { // Accelerate health decline for older popes
            this.pope.health = Math.max(0, this.pope.health - Math.floor(Math.random() * 5 + 5)); // Lose 5-10 health
        }

        // Check for Pope's death
        if (this.pope.health <= 0) {
            this.popeDies();
            return; // Don't run regular monthly events if Pope dies
        }

        // Random events affecting stats
        this.handleRandomEvents();

        this.updateDisplay(`Turn ${this.currentTurn}: Resources replenished. Pope's health: ${this.pope.health}.`);
        this.checkGameOver();
    },

    handleRandomEvents: function() {
        const eventChance = Math.random();

        if (eventChance < 0.1) { // Heresy outbreak
            this.heresyLevel = Math.min(100, this.heresyLevel + Math.floor(Math.random() * 10 + 5));
            this.setNarrative(`<p>A new wave of heresy spreads through the lands! Your Holiness, action is required!</p>`);
            this.showFeedback("Heresy Spreading!", 'error');
        } else if (eventChance < 0.2 && this.gold > 50) { // Gold income
            this.gold = Math.min(1000, this.gold + Math.floor(Math.random() * 30 + 10));
            this.setNarrative(`<p>Increased tithes and trade bring more gold to the Papal Treasury.</p>`);
            this.showFeedback("Gold Income!", 'success');
        } else if (eventChance < 0.3 && this.stability < 90) { // Stability issue
            this.stability = Math.max(0, this.stability - Math.floor(Math.random() * 10 + 5));
            this.setNarrative(`<p>Feudal lords squabble, testing the stability of your lands.</p>`);
            this.showFeedback("Stability Crisis!", 'error');
        }
    },

    // --- Pope Death & Conclave ---
    popeDies: function() {
        this.setNarrative(`
            <p style="color: red; font-weight: bold;">REQUIESCAT IN PACE!</p>
            <p>His Holiness, Pope ${this.pope.name}, has passed away at the age of ${this.pope.age}. The Holy See is vacant.</p>
            <p>The Conclave will now begin to elect the next Supreme Pontiff!</p>
        `);
        this.showFeedback("The Pope has Died!", 'error');

        // Disable regular game interaction
        document.querySelectorAll('.card-deck').forEach(btn => btn.style.pointerEvents = 'none');
        document.querySelectorAll('.card-in-hand').forEach(btn => btn.style.pointerEvents = 'none');

        this.startConclave();
    },

    startConclave: function() {
        this.conclave.active = true;
        this.conclave.ballot = 0;
        this.conclave.candidates = this.cardinals.filter(c => c.age < 90 && c.piety >= 30); // Cardinals eligible for Pope
        if (this.conclave.candidates.length === 0) {
            this.setNarrative(`<p style="color: red; font-weight: bold;">No eligible candidates for Pope! The Church falls into disarray. Game Over.</p>`);
            this.checkGameOver(true);
            return;
        }

        this.conclave.votes = {}; // Reset votes
        this.conclave.candidates.forEach(c => this.conclave.votes[c.name] = 0);
        this.conclave.winningThreshold = Math.floor(this.cardinals.length * (2/3)) + 1; // 2/3 majority + 1

        this.elements.conclavePanel.classList.remove('hidden');
        this.updateConclaveDisplay();
        this.setNarrative(`<p>The Sacred College has gathered. The fate of the Church is in their hands. Influence the Cardinals to elect a suitable successor!</p>`);
        this.showFeedback("Conclave has begun!", 'success');
    },

    updateConclaveDisplay: function() {
        this.elements.conclaveMessage.textContent = `Conclave Ballot: ${this.conclave.ballot}`;
        this.elements.ballotNumber.textContent = this.conclave.ballot;
        this.elements.winningThreshold.textContent = this.conclave.winningThreshold;

        this.elements.candidateVotes.innerHTML = '';
        const sortedCandidates = Object.keys(this.conclave.votes).sort((a, b) => this.conclave.votes[b] - this.conclave.votes[a]);

        sortedCandidates.forEach(name => {
            const li = document.createElement('li');
            li.textContent = `${name}: ${this.conclave.votes[name]} votes`;
            this.elements.candidateVotes.appendChild(li);
        });

        // Enable/disable influence buttons based on available resources
        this.elements.influenceGoldButton.disabled = Game.gold < 50;
        this.elements.influencePromisesButton.disabled = Game.piety < 10;
        this.elements.influenceIntrigueButton.disabled = Game.stability < 10;
        this.elements.favorPopeButton.disabled = false; // Always allow favoring
        this.elements.advanceConclaveButton.disabled = false; // Always allow advancing
    },

    influenceConclave: function(type) {
        if (this.conclave.influenceAttempts >= 3) {
            this.showFeedback("You can only influence cardinals a limited number of times per ballot!", 'error');
            return;
        }

        let costMet = false;
        let successMessage = "";
        let failureMessage = "";
        let influenceBonus = 0;

        switch (type) {
            case 'gold':
                if (Game.gold >= 50) {
                    Game.gold -= 50;
                    influenceBonus = Math.floor(Math.random() * 5 + 3) + Math.floor(Game.pope.attributes.administration / 20); // 3-7 + admin bonus
                    successMessage = `You spent 50 Gold to influence the Cardinals.`;
                    failureMessage = `Your Gold had little effect.`;
                    costMet = true;
                } else {
                    this.showFeedback("Not enough Gold!", 'error');
                }
                break;
            case 'promises':
                if (Game.piety >= 10) {
                    Game.piety -= 10;
                    influenceBonus = Math.floor(Math.random() * 5 + 2) + Math.floor(Game.pope.attributes.diplomacy / 20); // 2-6 + diplomacy bonus
                    successMessage = `You made promises, swaying some Cardinals.`;
                    failureMessage = `Your promises were met with skepticism.`;
                    costMet = true;
                } else {
                    this.showFeedback("Not enough Piety!", 'error');
                }
                break;
            case 'intrigue':
                if (Game.stability >= 10) {
                    Game.stability -= 10;
                    influenceBonus = Math.floor(Math.random() * 5 + 4) + Math.floor(Game.pope.attributes.intrigue / 20); // 4-8 + intrigue bonus
                    successMessage = `Subtle intrigues shift the balance of power.`;
                    failureMessage = `Your intrigues were ineffective.`;
                    costMet = true;
                } else {
                    this.showFeedback("Not enough Stability to risk intrigue!", 'error');
                }
                break;
        }

        if (costMet) {
            this.conclave.influenceAttempts++;
            // Distribute influence bonus to a random candidate
            if (this.conclave.candidates.length > 0) {
                const affectedCandidate = this.conclave.candidates[Math.floor(Math.random() * this.conclave.candidates.length)];
                this.conclave.votes[affectedCandidate.name] += influenceBonus;
                this.showFeedback(`${successMessage} ${affectedCandidate.name} gained ${influenceBonus} votes.`, 'success');
            } else {
                this.showFeedback(`${failureMessage} (No eligible candidates to influence).`, 'error');
            }
            this.updateConclaveDisplay();
            this.updateDisplay(); // Update main display for stat changes
        }
    },

    favorPope: function() {
        // This button allows the player to pick a specific cardinal to give votes to
        // For now, let's make it a simple "give +5 votes to your highest Piety cardinal"
        // In a real game, you'd likely open a modal to select a cardinal.
        if (this.conclave.candidates.length === 0) {
            this.showFeedback("No candidates to favor!", 'error');
            return;
        }
        if (this.conclave.influenceAttempts >= 3) {
            this.showFeedback("You can only favor a cardinal a limited number of times per ballot!", 'error');
            return;
        }

        this.conclave.influenceAttempts++;
        const favoriteCardinal = this.conclave.candidates.reduce((prev, current) => (prev.piety > current.piety ? prev : current)); // Simplistic: favor highest piety
        this.conclave.votes[favoriteCardinal.name] += 5; // Fixed bonus
        this.showFeedback(`You covertly favored Cardinal ${favoriteCardinal.name}, granting him 5 votes.`, 'success');
        this.updateConclaveDisplay();
    },

    runConclaveBallot: function() {
        this.conclave.ballot++;
        this.conclave.influenceAttempts = 0; // Reset influence attempts for new ballot

        // Cardinals vote based on their loyalty, ambition, and current influence
        this.cardinals.forEach(cardinal => {
            if (!this.conclave.votes[cardinal.name]) { // Ensure cardinal is still a candidate if they were removed
                return;
            }

            let candidateToVoteFor = null;
            let highestScore = -1;

            this.conclave.candidates.forEach(candidate => {
                // Simplified voting logic:
                // Loyalty to current Papacy (if they liked the old Pope's influence)
                // Ambition (for themselves)
                // Piety (for a pious Pope)
                // Current votes for that candidate (bandwagon effect)
                let score = (cardinal.loyalty * 0.5) + (cardinal.ambition * 0.3) + (cardinal.piety * 0.2) + (this.conclave.votes[candidate.name] * 0.1) + (Math.random() * 20); // Randomness
                if (candidate.name === cardinal.name) { // Cardinal votes for self (if candidate)
                    score += 20; // Strong bias
                }

                if (score > highestScore) {
                    highestScore = score;
                    candidateToVoteFor = candidate;
                }
            });

            if (candidateToVoteFor) {
                this.conclave.votes[candidateToVoteFor.name]++;
            }
        });

        this.updateConclaveDisplay();

        const electedPope = this.checkForPope();
        if (electedPope) {
            this.endConclave(electedPope);
        } else {
            this.setNarrative(`<p>Ballot #${this.conclave.ballot} concludes. No Pope elected yet. The Conclave continues...</p>`);
            this.showFeedback("Conclave continues!", 'success');
        }
        this.updateDisplay(); // Update general stats too
    },

    checkForPope: function() {
        for (const candidateName in this.conclave.votes) {
            if (this.conclave.votes[candidateName] >= this.conclave.winningThreshold) {
                return this.conclave.candidates.find(c => c.name === candidateName);
            }
        }
        return null;
    },

    endConclave: function(newPopeCardinal) {
        this.conclave.active = false;
        this.elements.conclavePanel.classList.add('hidden');

        // Restore regular game interaction
        document.querySelectorAll('.card-deck').forEach(btn => btn.style.pointerEvents = 'auto');
        document.querySelectorAll('.card-in-hand').forEach(btn => btn.style.pointerEvents = 'auto');

        // Set the new Pope
        this.pope = {
            name: newPopeCardinal.name,
            age: newPopeCardinal.age,
            health: 100, // New Pope starts with full health
            attributes: {
                theology: newPopeCardinal.piety, // Map cardinal's piety to Pope's theology
                diplomacy: newPopeCardinal.loyalty, // Map cardinal's loyalty to Pope's diplomacy (simplistic)
                intrigue: newPopeCardinal.ambition, // Map cardinal's ambition to Pope's intrigue
                administration: Math.floor(Math.random() * 30 + 40) // Random admin for new Pope
            }
        };

        this.setNarrative(`
            <p style="color: green; font-weight: bold;">HABEMUS PAPAM!</p>
            <p>Cardinal ${newPopeCardinal.name} has been elected the new Supreme Pontiff! Long live Pope ${newPopeCardinal.name}!</p>
            <p>A new era for the Holy See begins under his guidance.</p>
        `);
        this.showFeedback(`Pope ${newPopeCardinal.name} Elected!`, 'success');

        this.updateDisplay();
    },

    // --- Cardinal Generation (Placeholder) ---
    generateCardinals: function(num) {
        const cardinalNames = [
            "Giulio de' Medici", "Alessandro Farnese", "Reginald Pole", "Charles Borromeo",
            "Federico Borromeo", "Francesco Barberini", "Carlo Carafa", "Giovanni Morone",
            "Innocenzo Cybo", "Ercole Gonzaga", "Ippolito d'Este", "Cristoforo Madruzzo",
            "Antoine Perrenot de Granvelle", "Prospero Colonna", "Pietro Bembo", "Gasparo Contarini"
        ];
        this.cardinals = [];
        for (let i = 0; i < num; i++) {
            const name = cardinalNames[Math.floor(Math.random() * cardinalNames.length)];
            this.cardinals.push({
                name: name,
                age: Math.floor(Math.random() * 40) + 30, // Age between 30 and 70
                loyalty: Math.floor(Math.random() * 60) + 40, // 40-100
                ambition: Math.floor(Math.random() * 60) + 40, // 40-100
                piety: Math.floor(Math.random() * 60) + 40 // 40-100
            });
        }
    },

    // --- Feedback System ---
    showFeedback: function(message, type) {
        this.elements.feedbackMessage.textContent = message;
        this.elements.feedbackMessage.className = `feedback-message ${type}`;
        this.elements.feedbackMessage.classList.remove('hidden');
        setTimeout(() => {
            this.hideFeedback();
        }, 3000); // Hide after 3 seconds
    },

    hideFeedback: function() {
        this.elements.feedbackMessage.classList.add('hidden');
        this.elements.feedbackMessage.className = 'feedback-message';
    },

    // --- Game Over Conditions ---
    checkGameOver: function(forced = false) {
        let gameOverMessage = "";

        if (forced) { // Used for specific game over conditions like no eligible Pope
            // Message already set by the calling function
        } else if (this.gold <= 0 && this.currentTurn > 5) { // Can't go bankrupt too early
            gameOverMessage = "The Papal Treasury is empty! Without funds, the Holy See collapses into disarray. Game Over.";
        } else if (this.piety <= 100) {
            gameOverMessage = "Faith has withered across Christendom! The Church has lost its spiritual authority. Game Over.";
        } else if (this.stability <= 10) {
            gameOverMessage = "The Papal States have fallen into utter chaos! Rebellions and civil strife consume the realm. Game Over.";
        } else if (this.heresyLevel >= 80) {
            gameOverMessage = "Heresy has consumed the lands! The Church has lost control of its flock. Game Over.";
        } else if (this.influence <= 10 && this.currentTurn > 5) {
            gameOverMessage = "The Holy See has lost all influence among the monarchs of Europe. The Papacy is but a hollow shell. Game Over.";
        }

        if (gameOverMessage) {
            this.setNarrative(`<p style="color: red; font-weight: bold;">${gameOverMessage}</p><p>Refresh the page to play again.</p>`);
            this.elements.feedbackMessage.textContent = gameOverMessage;
            this.elements.feedbackMessage.classList.remove('hidden');
            this.elements.feedbackMessage.classList.add('error');

            // Disable all interactive elements
            document.querySelectorAll('.card-deck').forEach(btn => btn.style.pointerEvents = 'none');
            document.querySelectorAll('.card-in-hand').forEach(btn => btn.style.pointerEvents = 'none');
            this.elements.menuButtons.forEach(btn => btn.disabled = true);
            this.elements.advanceConclaveButton.disabled = true; // Ensure conclave advances are stopped
            this.elements.conclavePanel.style.pointerEvents = 'none'; // Disable interactions within conclave panel

            return true; // Game is over
        }
        return false; // Game is not over
    }
};

// Initialize the game when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    Game.init();
    Game.updateDisplay(); // Initial display update
});
