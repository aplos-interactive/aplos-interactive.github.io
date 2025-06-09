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
    let hasGameEnded = false; // NEW: Flag to track if the game has ended

    // NEW: Game Flags - tracks specific conditions or outcomes of choices
    const gameFlags = {
        imperial_alliance_established: false,
        crusade_launched: false,
        papal_bull_issued: false,
        crusade_report_received: false, // Ensures report only happens once
        // Add more flags as your game develops
    };

    // NEW: Game Factions - tracks favor with different powerful groups
    const gameFactions = {
        imperial: { favor: 50, name: 'The Holy Roman Emperor' },     // Relationship with the Emperor
        nobility: { favor: 50, name: 'European Nobility' },         // General favor with noble houses
        monasticOrders: { favor: 50, name: 'Monastic Orders' },     // Favor with powerful church orders
        // Add more factions as your game develops (e.g., Italian City-States)
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

    // --- Game Events Data (UPDATED WITH ENDING EVENTS!) ---
    const events = [
        {
            id: 'start_game', // Unique ID for the event
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
                        { type: 'factionChange', faction: 'imperial', value: 20 },
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
                        { type: 'factionChange', faction: 'imperial', value: -15 },
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
                        { type: 'factionChange', faction: 'monasticOrders', value: -5 }
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
            requiredFactionFavor: { faction: 'imperial', minFavor: 60 },
            options: [
                {
                    text: 'Launch the Crusade, for God and Glory!',
                    effects: [
                        { type: 'metricChange', metric: 'piety', value: 20 },
                        { type: 'metricChange', metric: 'gold', value: -50 },
                        { type: 'metricChange', metric: 'publicOpinion', value: 15 },
                        { type: 'factionChange', faction: 'imperial', value: 10 },
                        { type: 'factionChange', faction: 'nobility', value: -10 },
                        { type: 'setFlag', flag: 'crusade_launched', value: true },
                        { type: 'setNextEvent', eventId: 'crusade_outcome_report' }
                    ]
                },
                {
                    text: 'Decline, citing more pressing internal church matters.',
                    effects: [
                        { type: 'metricChange', metric: 'authority', value: -10 },
                        { type: 'metricChange', metric: 'cardinalFavor', value: 10 },
                        { type: 'factionChange', faction: 'imperial', value: -20 }
                    ]
                }
            ]
        },
        {
            id: 'noble_dissatisfaction',
            title: 'Noble Uprising Rumors',
            content: 'Rumors reach your ears that some northern nobles, emboldened by the Emperor\'s campaign, are questioning your authority in their lands. They believe your focus is too worldly.',
            source: 'Your Spymaster',
            requiredFactionFavor: { faction: 'nobility', maxFavor: 40 },
            options: [
                {
                    text: 'Send a Papal Legate to assert your spiritual dominance.',
                    effects: [
                        { type: 'metricChange', metric: 'authority', value: 10 },
                        { type: 'factionChange', faction: 'nobility', value: -20 },
                        { type: 'metricChange', metric: 'publicOpinion', value: 5 }
                    ]
                },
                {
                    text: 'Dispatch envoys to negotiate and hear their grievances.',
                    effects: [
                        { type: 'factionChange', faction: 'nobility', value: 15 },
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
                        { type: 'factionChange', faction: 'monasticOrders', value: 10 },
                        { type: 'setFlag', flag: 'papal_bull_issued', value: true }
                    ]
                },
                {
                    text: 'Delay the Bull, seeking broader consensus and avoiding controversy.',
                    effects: [
                        { type: 'metricChange', metric: 'piety', value: -5 },
                        { type: 'metricChange', metric: 'cardinalFavor', value: 5 },
                        { type: 'metricChange', metric: 'authority', value: 5 },
                        { type: 'factionChange', faction: 'monasticOrders', value: -10 }
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
                        { type: 'factionChange', faction: 'imperial', value: 5 },
                        { type: 'metricChange', metric: 'publicOpinion', value: 10 },
                        { type: 'setFlag', flag: 'crusade_report_received', value: true }
                    ]
                },
                {
                    text: 'Lament the losses and focus on rebuilding.',
                    effects: [
                        { type: 'metricChange', metric: 'piety', value: -10 },
                        { type: 'metricChange', metric: 'publicOpinion', value: -5 },
                        { type: 'factionChange', faction: 'imperial', value: -10 },
                        { type: 'setFlag', flag: 'crusade_report_received', value: true }
                    ]
                }
            ]
        },
        {
            id: 'noble_tax_request',
            title: 'Noble\'s Plea for Tax Exemption',
            content: 'Lord Bertrand, a powerful noble from Provence, requests a special papal tax exemption for his lands, citing recent hardships. Granting it would set a precedent.',
            source: 'Lord Bertrand\'s Envoy',
            requiredFactionFavor: { faction: 'nobility', minFavor: 70 },
            forbiddenFactionFavor: { faction: 'nobility', maxFavor: 90 },
            options: [
                {
                    text: 'Grant the exemption, strengthening ties with the nobility.',
                    effects: [
                        { type: 'metricChange', metric: 'gold', value: -15 },
                        { type: 'factionChange', faction: 'nobility', value: 20 },
                        { type: 'metricChange', metric: 'publicOpinion', value: -5 }
                    ]
                },
                {
                    text: 'Deny the exemption, upholding papal fiscal authority.',
                    effects: [
                        { type: 'metricChange', metric: 'authority', value: 10 },
                        { type: 'factionChange', faction: 'nobility', value: -15 },
                        { type: 'metricChange', metric: 'gold', value: 5 }
                    ]
                }
            ]
        },

        // NEW: Game Ending / Triumph Events

        {
            id: 'game_over_heresy',
            title: 'The Papacy Fractures! A Schism of Faith',
            content: 'Your pious neglect or controversial doctrine has sown deep seeds of heresy. The faithful abandon Rome, and the Church falls into irreparable schism. Your legacy is one of failure.',
            source: 'The Annals of History',
            options: [{ text: 'Start Over', effects: [{ type: 'resetGame' }] }]
        },
        {
            id: 'game_over_tyranny',
            title: 'The Tyrant Pope! Public Uprising',
            content: 'Your relentless pursuit of power and neglect of the common folk has led to widespread revolt. The people rise up, storming the Vatican and deposing you by force. Your reign ends in chaos.',
            source: 'The Streets of Rome',
            options: [{ text: 'Start Over', effects: [{ type: 'resetGame' }] }]
        },
        {
            id: 'game_over_impoverished',
            title: 'The Bankrupt See! Ruin of Rome',
            content: 'Years of mismanagement and costly ventures have drained the papal coffers. With no funds, your authority crumbles, and hostile powers seize control of Rome. The Holy See is ruined.',
            source: 'Papal Treasury Records',
            options: [{ text: 'Start Over', effects: [{ type: 'resetGame' }] }]
        },
        {
            id: 'game_over_deposed_cardinals',
            title: 'Deposed! A Cardinal Conspiracy',
            content: 'Your constant disregard for the College of Cardinals has led to a secret plot. They have unanimously voted for your deposition, backed by powerful secular rulers. Your authority crumbles.',
            source: 'The Conclave Transcripts',
            options: [{ text: 'Start Over', effects: [{ type: 'resetGame' }] }]
        },
        {
            id: 'game_over_imperial_control',
            title: 'Puppet of the Emperor! Loss of Autonomy',
            content: 'Your excessive reliance on the Emperor has left the Papacy utterly subservient to his will. The Holy See is no longer an independent power, but merely a tool of the Empire. Your spiritual authority is lost.',
            source: 'Imperial Edicts',
            options: [{ text: 'Start Over', effects: [{ type: 'resetGame' }] }]
        },
        {
            id: 'game_over_noble_revolt',
            title: 'Noble Wars! Christendom Fractured',
            content: 'Your inability to manage the nobility has plunged Europe into endless feudal warfare. The Papacy, unable to exert influence, is powerless amidst the chaos. Your reign is a period of strife.',
            source: 'Chronicles of Conflict',
            options: [{ text: 'Start Over', effects: [{ type: 'resetGame' }] }]
        },
        // NEW: Triumph/Good Ending Examples
        {
            id: 'triumph_divine_mandate',
            title: 'An Age of Unwavering Faith!',
            content: 'Your unwavering piety has inspired Christendom to a new golden age of faith. The Church stands as a beacon of spiritual purity, guiding all souls toward salvation. Your legacy is secured for eternity!',
            source: 'Divine Providence',
            options: [{ text: 'Continue Reign (Endless Mode / New Game+ placeholder)', effects: [{ type: 'resetGame' }] }]
        },
        {
            id: 'triumph_absolute_authority',
            title: 'The Papal Hegemony! Uncontested Rule',
            content: 'Through masterful politics and astute decision-making, the Holy See has become the undisputed temporal and spiritual power in Europe. Kings and Emperors bow to your will. Your authority is absolute and unquestioned!',
            source: 'The Throne Room',
            options: [{ text: 'Continue Reign (Endless Mode / New Game+ placeholder)', effects: [{ type: 'resetGame' }] }]
        },


        // The game will try to go through events in order.
        // If an event has requiredFlags that aren't met, it will skip to the next.
        // It's good to have a final "end" event or loop.
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

        // Check requiredFactionFavor
        if (event.requiredFactionFavor) {
            const faction = gameFactions[event.requiredFactionFavor.faction];
            if (!faction || faction.favor < event.requiredFactionFavor.minFavor) {
                return false;
            }
        }
        // Check forbiddenFactionFavor
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
     * Updates a faction's favor and logs to console.
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
     * NEW: Checks for game ending or special achievement conditions.
     * If a condition is met, it loads the appropriate ending event.
     * Prioritizes game over conditions over triumph conditions.
     */
    function checkGameStatus() {
        if (hasGameEnded) return; // If game has already ended, do nothing

        // --- Game Over Conditions ---
        if (gameMetrics.piety <= 0) {
            hasGameEnded = true;
            loadEvent(findEventById('game_over_heresy'));
            return;
        }
        if (gameMetrics.publicOpinion <= 0) {
            hasGameEnded = true;
            loadEvent(findEventById('game_over_tyranny'));
            return;
        }
        if (gameMetrics.gold <= 0) {
            hasGameEnded = true;
            loadEvent(findEventById('game_over_impoverished'));
            return;
        }
        if (gameMetrics.cardinalFavor <= 0) {
            hasGameEnded = true;
            loadEvent(findEventById('game_over_deposed_cardinals'));
            return;
        }
        if (gameFactions.imperial.favor <= 0) {
            hasGameEnded = true;
            loadEvent(findEventById('game_over_imperial_control'));
            return;
        }
        if (gameFactions.nobility.favor <= 0) {
            hasGameEnded = true;
            loadEvent(findEventById('game_over_noble_revolt'));
            return;
        }

        // --- Triumph/High Metric Conditions (Optional, can lead to special events or just positive feedback) ---
        // These can be set to 100 or a high value like 90-95.
        // For simplicity, I'll put examples at 95.
        if (gameMetrics.piety >= 95 && !gameFlags.triumph_divine_mandate_achieved) {
            hasGameEnded = true; // Mark as ended for now to show the triumph screen
            gameFlags.triumph_divine_mandate_achieved = true; // Set flag to prevent re-triggering
            loadEvent(findEventById('triumph_divine_mandate'));
            return;
        }
        if (gameMetrics.authority >= 95 && !gameFlags.triumph_absolute_authority_achieved) {
            hasGameEnded = true;
            gameFlags.triumph_absolute_authority_achieved = true;
            loadEvent(findEventById('triumph_absolute_authority'));
            return;
        }
        // Add more triumph conditions as desired
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
            } else if (effect.type === 'factionChange') { // Handle faction changes
                updateFactionFavor(effect.faction, effect.value);
            } else if (effect.type === 'resetGame') { // Handle game reset
                initGame(); // Re-initialize the game state
                return; // Stop processing effects for this choice and exit applyChoice
            }
        });

        // If a game reset was triggered, we're done here
        if (chosenOption.effects.some(e => e.type === 'resetGame')) {
            return;
        }

        // Advance game day
        gameDay++;
        gameDayCounter.textContent = gameDay;

        // NEW: Check game status AFTER effects are applied and day advanced
        checkGameStatus();

        // If game has ended by a status check, prevent loading next event
        if (hasGameEnded) {
            return;
        }

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
            // Ensure we don't accidentally load an ending event as part of linear progression
            if (potentialNextEvent.id.startsWith('game_over_') || potentialNextEvent.id.startsWith('triumph_')) {
                 currentEventIndex++; // Skip explicit game end events if reached linearly
                 continue;
            }

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
            // Special handling for triumph flags if you want them to be permanently unlocked across games
            // For now, reset all
            gameFlags[flag] = false;
        }
        // Ensure achievement flags are reset for a new game if they were set by triumph conditions
        gameFlags.triumph_divine_mandate_achieved = false;
        gameFlags.triumph_absolute_authority_achieved = false;


        // Reset faction favors
        for (const factionKey in gameFactions) {
            gameFactions[factionKey].favor = 50; // Reset all factions to 50 favor
        }

        gameDay = 1;
        gameDayCounter.textContent = gameDay;
        currentEventIndex = 0; // Start with the first event in the array
        nextEventId = null;
        hasGameEnded = false; // NEW: Reset game ended flag

        updateAllMetricsDisplay(); // Set initial metric values
        loadEvent(events[currentEventIndex]); // Load the very first event
    }

    initGame(); // Call to start the game when the DOM is ready
});
