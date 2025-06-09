document.addEventListener('DOMContentLoaded', () => {
    // --- Game State Variables ---
    const gameMetrics = {
        piety: 50,
        authority: 50,
        gold: 100,
        publicOpinion: 50,
        cardinalFavor: 50,
    };
    let gameDay = 1;
    let currentEventIndex = 0; // Tracks current event in the linear sequence
    let nextEventId = null; // Stores ID of the next event to load if branching occurs

    // NEW: Game Flags - tracks specific conditions or outcomes of choices
    const gameFlags = {
        imperial_alliance_established: false,
        crusade_launched: false,
        papal_bull_issued: false,
        crusade_report_received: false,
        // Add more flags as your game develops
    };

    // NEW: Game Factions - tracks favor with different powerful groups
    const gameFactions = {
        imperial: { favor: 50, name: 'The Holy Roman Emperor' }, // Relationship with the Emperor
        nobility: { favor: 50, name: 'European Nobility' },     // General favor with noble houses
        monasticOrders: { favor: 50, name: 'Monastic Orders' }, // Favor with powerful church orders
        // Add more factions as your game develops (e.g., Italian City-States, Common Populace could be a faction instead of just a metric)
    };


    // --- DOM Elements ---
    const metricPiety = document.getElementById('metric-piety');
    const metricAuthority = document.getElementById('metric-authority');
    const metricGold = document.getElementById('metric-gold');
    const metricPublicOpinion = document.getElementById('metric-publicOpinion');
    const metricCardinalFavor = document.getElementById('metric-cardinalFavor');
    const gameDayCounter = document.getElementById('game-day-counter');

    const documentArea = document.getElementById('document-area');
    const documentTitle = document.getElementById('document-title');
    const documentContent = document.getElementById('document-content');
    const documentSource = document.getElementById('document-source');
    const optionsContainer = document.getElementById('options-container');

    const mapButton = document.getElementById('map-button');
    const mapOverlay = document.getElementById('map-overlay');
    const closeMapButton = document.getElementById('close-map-button');

    // --- Game Events Data (UPDATED STRUCTURE WITH FACTIONS!) ---
    const events = [
        {
            id: 'start_game',
            title: 'A New Pontificate',
            content: 'You have been elected to the Holy See. The burdens of the papacy weigh heavily upon you. The world watches.',
            source: 'The Conclave',
            options: [
                {
                    text: 'Embrace your new role with divine confidence.',
                    effects: [
                        { type: 'metricChange', metric: 'piety', value: 10 },
                        { type: 'metricChange', metric: 'authority', value: 5 },
                        { type: 'setNextEvent', eventId: 'first_edict' }
                    ]
                },
                {
                    text: 'Seek immediate counsel from the College of Cardinals.',
                    effects: [
                        { type: 'metricChange', metric: 'cardinalFavor', value: 10 },
                        { type: 'metricChange', metric: 'publicOpinion', value: -5 },
                        { type: 'setNextEvent', eventId: 'cardinal_meeting' }
                    ]
                }
            ]
        },
        {
            id: 'first_edict',
            title: 'The Imperial Demand',
            content: 'Emperor Frederick demands your support for his military campaign against the rebellious northern states. He seeks papal blessing and financial aid.',
            source: 'Imperial Envoy',
            options: [
                {
                    text: 'Grant your blessing and offer 20 Gold.',
                    effects: [
                        { type: 'metricChange', metric: 'authority', value: 15 },
                        { type: 'metricChange', metric: 'gold', value: -20 },
                        { type: 'metricChange', metric: 'publicOpinion', value: -10 },
                        { type: 'factionChange', faction: 'imperial', value: 20 }, // NEW: Increase Imperial Favor
                        { type: 'setNextEvent', eventId: 'noble_dissatisfaction' },
                        { type: 'setFlag', flag: 'imperial_alliance_established', value: true }
                    ]
                },
                {
                    text: 'Deny his request, citing spiritual concerns and neutrality.',
                    effects: [
                        { type: 'metricChange', metric: 'piety', value: 10 },
                        { type: 'metricChange', metric: 'authority', value: -10 },
                        { type: 'metricChange', metric: 'cardinalFavor', value: 5 },
                        { type: 'factionChange', faction: 'imperial', value: -15 }, // NEW: Decrease Imperial Favor
                        { type: 'setNextEvent', eventId: 'papal_decree_consideration' }
                    ]
                }
            ]
        },
        {
            id: 'cardinal_meeting',
            title: 'The College Convenes',
            content: 'The cardinals are restless. Cardinal Giovanni expresses concerns about your lack of immediate, decisive action. "The faithful demand a strong hand!" he proclaims.',
            source: 'Cardinal Giovanni',
            options: [
                {
                    text: 'Assure them of your wisdom and long-term vision, citing patience as a virtue.',
                    effects: [
                        { type: 'metricChange', metric: 'cardinalFavor', value: -5 },
                        { type: 'metricChange', metric: 'piety', value: 5 },
                        { type: 'setNextEvent', eventId: 'papal_decree_consideration' }
                    ]
                },
                {
                    text: 'Promise swift reforms to address their concerns, consolidating power.',
                    effects: [
                        { type: 'metricChange', metric: 'cardinalFavor', value: 10 },
                        { type: 'metricChange', metric: 'authority', value: 5 },
                        { type: 'factionChange', faction: 'monasticOrders', value: -5 } // Monastics might dislike swift political action
                    ]
                }
            ]
        },
        {
            id: 'crusade_proposal',
            title: 'A Call for Crusade',
            content: 'Emperor Frederick, having secured his northern borders (due to your previous support), now proposes a grand crusade to the Holy Land. This requires significant resources and commitment.',
            source: 'Imperial Message',
            requiredFlags: ['imperial_alliance_established'],
            requiredFactionFavor: { faction: 'imperial', minFavor: 60 }, // NEW: Emperor must favor you
            options: [
                {
                    text: 'Launch the Crusade, for God and Glory!',
                    effects: [
                        { type: 'metricChange', metric: 'piety', value: 20 },
                        { type: 'metricChange', metric: 'gold', value: -50 },
                        { type: 'metricChange', metric: 'publicOpinion', value: 15 },
                        { type: 'factionChange', faction: 'imperial', value: 10 }, // Imperial favor up
                        { type: 'factionChange', faction: 'nobility', value: -10 }, // Nobility might resent the call for troops/funds
                        { type: 'setFlag', flag: 'crusade_launched', value: true },
                        { type: 'setNextEvent', eventId: 'crusade_outcome_report' }
                    ]
                },
                {
                    text: 'Decline, citing more pressing internal church matters.',
                    effects: [
                        { type: 'metricChange', metric: 'authority', value: -10 },
                        { type: 'metricChange', metric: 'cardinalFavor', value: 10 },
                        { type: 'factionChange', faction: 'imperial', value: -20 } // Imperial favor drops significantly
                    ]
                }
            ]
        },
        {
            id: 'noble_dissatisfaction',
            title: 'Noble Uprising Rumors',
            content: 'Rumors reach your ears that some northern nobles, emboldened by the Emperor\'s campaign, are questioning your authority in their lands. They believe your focus is too worldly.',
            source: 'Your Spymaster',
            requiredFactionFavor: { faction: 'nobility', maxFavor: 40 }, // NEW: Only appears if nobility favor is somewhat low
            options: [
                {
                    text: 'Send a Papal Legate to assert your spiritual dominance.',
                    effects: [
                        { type: 'metricChange', metric: 'authority', value: 10 },
                        { type: 'factionChange', faction: 'nobility', value: -20 }, // Direct confrontation lowers favor
                        { type: 'metricChange', metric: 'publicOpinion', value: 5 }
                    ]
                },
                {
                    text: 'Dispatch envoys to negotiate and hear their grievances.',
                    effects: [
                        { type: 'factionChange', faction: 'nobility', value: 15 }, // Attempt to reconcile
                        { type: 'metricChange', metric: 'gold', value: -10 },
                        { type: 'metricChange', metric: 'authority', value: -5 }
                    ]
                }
            ]
        },
        {
            id: 'papal_decree_consideration',
            title: 'A New Papal Bull',
            content: 'After much deliberation, you consider issuing a Papal Bull on a controversial theological matter regarding the Immaculate Conception. This could reshape doctrine.',
            source: 'Your Advisor',
            options: [
                {
                    text: 'Issue the Bull, affirming traditional doctrine strictly.',
                    effects: [
                        { type: 'metricChange', metric: 'piety', value: 15 },
                        { type: 'metricChange', metric: 'publicOpinion', value: 10 },
                        { type: 'metricChange', metric: 'cardinalFavor', value: -5 },
                        { type: 'factionChange', faction: 'monasticOrders', value: 10 }, // Monastics might like strict doctrine
                        { type: 'setFlag', flag: 'papal_bull_issued', value: true }
                    ]
                },
                {
                    text: 'Delay the Bull, seeking broader consensus and avoiding controversy.',
                    effects: [
                        { type: 'metricChange', metric: 'piety', value: -5 },
                        { type: 'metricChange', metric: 'cardinalFavor', value: 5 },
                        { type: 'metricChange', metric: 'authority', value: 5 },
                        { type: 'factionChange', faction: 'monasticOrders', value: -10 } // Monastics might dislike indecision
                    ]
                }
            ]
        },
        {
            id: 'crusade_outcome_report',
            title: 'Crusade Report',
            content: 'Your Holy Crusade to the East has returned. What are the tidings?',
            source: 'Crusader Captain',
            requiredFlags: ['crusade_launched'],
            forbiddenFlags: ['crusade_report_received'],
            options: [
                {
                    text: 'Assess the gains in piety and territory.',
                    effects: [
                        { type: 'metricChange', metric: 'piety', value: 25 },
                        { type: 'metricChange', metric: 'authority', value: 15 },
                        { type: 'metricChange', metric: 'gold', value: -10 },
                        { type: 'factionChange', faction: 'imperial', value: 5 }, // Emperor slightly pleased
                        { type: 'factionChange', faction: 'publicOpinion', value: 10 }, // Public opinion is not a faction in gameFactions, so this will affect the metric directly.
                        { type: 'setFlag', flag: 'crusade_report_received', value: true }
                    ]
                },
                {
                    text: 'Lament the losses and focus on rebuilding.',
                    effects: [
                        { type: 'metricChange', metric: 'piety', value: -10 },
                        { type: 'metricChange', metric: 'publicOpinion', value: -5 },
                        { type: 'factionChange', faction: 'imperial', value: -10 }, // Emperor displeased with losses
                        { type: 'setFlag', flag: 'crusade_report_received', value: true }
                    ]
                }
            ]
        },
        // NEW EVENT: Based on faction favor
        {
            id: 'noble_tax_request',
            title: 'Noble\'s Plea for Tax Exemption',
            content: 'Lord Bertrand, a powerful noble from Provence, requests a special papal tax exemption for his lands, citing recent hardships. Granting it would set a precedent.',
            source: 'Lord Bertrand\'s Envoy',
            requiredFactionFavor: { faction: 'nobility', minFavor: 70 }, // Only appears if Nobility favor is high enough to make this request
            forbiddenFactionFavor: { faction: 'nobility', maxFavor: 90 }, // Don't want it to be TOO high or it feels cheap
            options: [
                {
                    text: 'Grant the exemption, strengthening ties with the nobility.',
                    effects: [
                        { type: 'metricChange', metric: 'gold', value: -15 }, // Lost income
                        { type: 'factionChange', faction: 'nobility', value: 20 },
                        { type: 'metricChange', metric: 'publicOpinion', value: -5 } // Public might see it as unfair
                    ]
                },
                {
                    text: 'Deny the exemption, upholding papal fiscal authority.',
                    effects: [
                        { type: 'metricChange', metric: 'authority', value: 10 },
                        { type: 'factionChange', faction: 'nobility', value: -15 },
                        { type: 'metricChange', metric: 'gold', value: 5 } // Maintain income
                    ]
                }
            ]
        },
        {
            id: 'end_game_placeholder',
            title: 'The Papacy Continues...',
            content: 'You have navigated the initial challenges of your pontificate. More trials and triumphs await. You can start a new game from here.',
            source: 'History Itself',
            options: [
                {
                    text: 'Begin Anew',
                    effects: [
                        { type: 'resetGame', value: true }
                    ]
                }
            ]
        }
    ];

    // --- Helper Functions ---

    /**
     * Finds an event by its ID.
     * @param {string} eventId The ID of the event to find.
     * @returns {object|undefined} The event object or undefined if not found.
     */
    function findEventById(eventId) {
        return events.find(event => event.id === eventId);
    }

    /**
     * Checks if an event is eligible to be displayed based on current game flags and faction favors.
     * @param {object} event The event object to check.
     * @returns {boolean} True if the event is eligible, false otherwise.
     */
    function isEventEligible(event) {
        // Check requiredFlags
        if (event.requiredFlags) {
            for (const flag of event.requiredFlags) {
                if (!gameFlags[flag]) {
                    return false;
                }
            }
        }
        // Check forbiddenFlags
        if (event.forbiddenFlags) {
            for (const flag of event.forbiddenFlags) {
                if (gameFlags[flag]) {
                    return false;
                }
            }
        }

        // NEW: Check requiredFactionFavor
        if (event.requiredFactionFavor) {
            const faction = gameFactions[event.requiredFactionFavor.faction];
            if (!faction || faction.favor < event.requiredFactionFavor.minFavor) {
                return false;
            }
        }
        // NEW: Check forbiddenFactionFavor
        if (event.forbiddenFactionFavor) {
            const faction = gameFactions[event.forbiddenFactionFavor.faction];
            if (!faction || faction.favor > event.forbiddenFactionFavor.maxFavor) {
                return false;
            }
        }

        return true; // All flag and faction conditions met
    }

    /**
     * Updates a single metric and applies a visual flash.
     * @param {string} metricName The name of the metric (e.g., 'piety').
     * @param {number} value The amount to change the metric by.
     */
    function updateMetric(metricName, value) {
        gameMetrics[metricName] = Math.max(0, Math.min(100, gameMetrics[metricName] + value)); // Clamp between 0-100

        // Visual flash for metric change
        const metricElement = document.getElementById(`metric-${metricName}`);
        if (metricElement) {
            metricElement.textContent = gameMetrics[metricName];
            const changeClass = value > 0 ? 'metric-change-positive' : 'metric-change-negative';
            metricElement.classList.add(changeClass);
            setTimeout(() => {
                metricElement.classList.remove(changeClass);
            }, 800); // Duration of the flash animation
        }
    }

    /**
     * NEW: Updates a faction's favor and logs to console.
     * (You can add a UI update here later)
     * @param {string} factionName The key for the faction (e.g., 'imperial').
     * @param {number} value The amount to change favor by.
     */
    function updateFactionFavor(factionName, value) {
        if (gameFactions[factionName]) {
            gameFactions[factionName].favor = Math.max(0, Math.min(100, gameFactions[factionName].favor + value)); // Clamp favor
            console.log(`${gameFactions[factionName].name} Favor: ${gameFactions[factionName].favor} (Changed by ${value})`);
            // TODO: Add visual update for faction favor in UI
        } else {
            console.warn(`Attempted to change favor for unknown faction: ${factionName}`);
        }
    }


    /**
     * Updates all metric displays based on current game state.
     */
    function updateAllMetricsDisplay() {
        metricPiety.textContent = gameMetrics.piety;
        metricAuthority.textContent = gameMetrics.authority;
        metricGold.textContent = gameMetrics.gold;
        metricPublicOpinion.textContent = gameMetrics.publicOpinion;
        metricCardinalFavor.textContent = gameMetrics.cardinalFavor;
    }

    /**
     * Loads and displays an event from the `events` array.
     * @param {object} event The event object to display.
     */
    function loadEvent(event) {
        // Hide document briefly for effect
        documentArea.classList.remove('show');
        setTimeout(() => {
            documentTitle.textContent = event.title;
            documentContent.textContent = event.content;
            documentSource.textContent = `- ${event.source}`;

            // Clear previous options
            optionsContainer.innerHTML = '';

            // Create new option buttons
            event.options.forEach((option, index) => {
                const button = document.createElement('button');
                button.classList.add('option-button');
                button.textContent = option.text;
                button.addEventListener('click', () => applyChoice(option));
                optionsContainer.appendChild(button);
            });

            // Show document after content is loaded
            documentArea.classList.add('show');
        }, 300); // Short delay for animation
    }

    /**
     * Applies the effects of a chosen option and proceeds to the next day/event.
     * @param {object} chosenOption The option object that was clicked.
     */
    function applyChoice(chosenOption) {
        // Reset nextEventId for linear progression unless overridden by an effect
        nextEventId = null;

        // Apply all effects defined for the chosen option
        chosenOption.effects.forEach(effect => {
            if (effect.type === 'metricChange') {
                updateMetric(effect.metric, effect.value);
            } else if (effect.type === 'setNextEvent') {
                nextEventId = effect.eventId; // Set the ID of the next event to load
            } else if (effect.type === 'setFlag') { // Handle setting flags
                gameFlags[effect.flag] = effect.value;
                console.log(`Flag '${effect.flag}' set to ${effect.value}`);
            } else if (effect.type === 'factionChange') { // NEW: Handle faction changes
                updateFactionFavor(effect.faction, effect.value);
            } else if (effect.type === 'resetGame') { // Handle game reset
                initGame(); // Re-initialize the game state
                return; // Stop processing effects for this choice and exit applyChoice
            }
            // Add more effect types here as you expand mechanics (e.g., 'unlockFeature', 'triggerDelayedEvent')
        });

        // If a game reset was triggered, we're done here
        if (chosenOption.effects.some(e => e.type === 'resetGame')) {
            return;
        }

        // Advance game day
        gameDay++;
        gameDayCounter.textContent = gameDay;


        // Determine and load the next eligible event
        let nextEventToLoad = null;

        if (nextEventId) {
            // Try to load a specific branched event first
            const branchedEvent = findEventById(nextEventId);
            if (branchedEvent && isEventEligible(branchedEvent)) {
                nextEventToLoad = branchedEvent;
                currentEventIndex = events.indexOf(branchedEvent); // Update current index to the branched event
            } else {
                console.warn(`Branched event '${nextEventId}' is not eligible or not found. Attempting linear sequence.`);
                // If branched event isn't eligible, try next in linear sequence
                currentEventIndex++;
            }
        } else {
            currentEventIndex++; // Move to the next event in the linear array
        }

        // Loop through subsequent events in the array to find the next eligible one
        // This handles both linear progression and skipping ineligible events after a branch
        while (currentEventIndex < events.length) {
            const potentialNextEvent = events[currentEventIndex];
            if (isEventEligible(potentialNextEvent)) {
                nextEventToLoad = potentialNextEvent;
                break; // Found an eligible event
            } else {
                console.log(`Skipping event '${potentialNextEvent.id}' (Day ${gameDay}) - not eligible due to flags or faction favor.`);
                currentEventIndex++; // Skip and check the next one
            }
        }


        if (nextEventToLoad) {
            loadEvent(nextEventToLoad);
        } else {
            // No more eligible events, handle end of game or loop back
            console.log('End of game/event sequence reached. No eligible events left.');
            loadEvent(findEventById('end_game_placeholder')); // Fallback to a placeholder
        }
    }


    // --- Event Listeners for UI ---
    mapButton.addEventListener('click', () => {
        mapOverlay.classList.add('show');
    });

    closeMapButton.addEventListener('click', () => {
        mapOverlay.classList.remove('show');
    });

    // --- Game Initialization ---
    function initGame() {
        // Reset metrics
        gameMetrics.piety = 50;
        gameMetrics.authority = 50;
        gameMetrics.gold = 100;
        gameMetrics.publicOpinion = 50;
        gameMetrics.cardinalFavor = 50;

        // Reset flags
        for (const flag in gameFlags) {
            gameFlags[flag] = false;
        }

        // NEW: Reset faction favors
        for (const factionKey in gameFactions) {
            gameFactions[factionKey].favor = 50; // Reset all factions to 50 favor
        }

        gameDay = 1;
        gameDayCounter.textContent = gameDay;
        currentEventIndex = 0; // Start with the first event in the array
        nextEventId = null;

        updateAllMetricsDisplay(); // Set initial metric values
        loadEvent(events[currentEventIndex]); // Load the very first event
    }

    initGame(); // Call to start the game when the DOM is ready
});
