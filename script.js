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
        crusade_report_received: false, // Ensures report only happens once
        // Add more flags as your game develops
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

    // --- Game Events Data (UPDATED STRUCTURE WITH FLAGS!) ---
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
                        { type: 'setNextEvent', eventId: 'first_edict' } // This choice branches to 'first_edict'
                    ]
                },
                {
                    text: 'Seek immediate counsel from the College of Cardinals.',
                    effects: [
                        { type: 'metricChange', metric: 'cardinalFavor', value: 10 },
                        { type: 'metricChange', metric: 'publicOpinion', value: -5 }, // Multiple effects
                        { type: 'setNextEvent', eventId: 'cardinal_meeting' } // This choice branches to 'cardinal_meeting'
                    ]
                }
            ]
        },
        {
            id: 'first_edict', // New event accessible via branching
            title: 'The Imperial Demand',
            content: 'Emperor Frederick demands your support for his military campaign against the rebellious northern states. He seeks papal blessing and financial aid.',
            source: 'Imperial Envoy',
            options: [
                {
                    text: 'Grant your blessing and offer 20 Gold.',
                    effects: [
                        { type: 'metricChange', metric: 'authority', value: 15 },
                        { type: 'metricChange', metric: 'gold', value: -20 }, // Cost Gold
                        { type: 'metricChange', metric: 'publicOpinion', value: -10 }, // Public opinion drops
                        { type: 'setNextEvent', eventId: 'noble_dissatisfaction' }, // Leads to another specific event
                        { type: 'setFlag', flag: 'imperial_alliance_established', value: true } // NEW: Sets this flag
                    ]
                },
                {
                    text: 'Deny his request, citing spiritual concerns and neutrality.',
                    effects: [
                        { type: 'metricChange', metric: 'piety', value: 10 },
                        { type: 'metricChange', metric: 'authority', value: -10 }, // Authority drops with Emperor
                        { type: 'metricChange', metric: 'cardinalFavor', value: 5 },
                        { type: 'setNextEvent', eventId: 'papal_decree_consideration' }
                    ]
                }
            ]
        },
        {
            id: 'cardinal_meeting', // New event accessible via branching
            title: 'The College Convenes',
            content: 'The cardinals are restless. Cardinal Giovanni expresses concerns about your lack of immediate, decisive action. "The faithful demand a strong hand!" he proclaims.',
            source: 'Cardinal Giovanni',
            options: [
                {
                    text: 'Assure them of your wisdom and long-term vision, citing patience as a virtue.',
                    effects: [
                        { type: 'metricChange', metric: 'cardinalFavor', value: -5 }, // Some cardinals are displeased
                        { type: 'metricChange', metric: 'piety', value: 5 },
                        { type: 'setNextEvent', eventId: 'papal_decree_consideration' }
                    ]
                },
                {
                    text: 'Promise swift reforms to address their concerns, consolidating power.',
                    effects: [
                        { type: 'metricChange', metric: 'cardinalFavor', value: 10 },
                        { type: 'metricChange', metric: 'authority', value: 5 } // You gain authority by acting decisively
                    ]
                }
            ]
        },
        {
            id: 'crusade_proposal', // NEW BRANCHING EVENT - Requires a flag!
            title: 'A Call for Crusade',
            content: 'Emperor Frederick, having secured his northern borders (due to your previous support), now proposes a grand crusade to the Holy Land. This requires significant resources and commitment.',
            source: 'Imperial Message',
            requiredFlags: ['imperial_alliance_established'], // This event only appears if this flag is true
            options: [
                {
                    text: 'Launch the Crusade, for God and Glory!',
                    effects: [
                        { type: 'metricChange', metric: 'piety', value: 20 },
                        { type: 'metricChange', metric: 'gold', value: -50 },
                        { type: 'metricChange', metric: 'publicOpinion', value: 15 },
                        { type: 'setFlag', flag: 'crusade_launched', value: true }, // NEW: Sets crusade flag
                        { type: 'setNextEvent', eventId: 'crusade_outcome_report' } // Immediately jump to report
                    ]
                },
                {
                    text: 'Decline, citing more pressing internal church matters.',
                    effects: [
                        { type: 'metricChange', metric: 'authority', value: -10 },
                        { type: 'metricChange', metric: 'cardinalFavor', value: 10 }
                    ]
                }
            ]
        },
        {
            id: 'noble_dissatisfaction',
            title: 'Noble Uprising Rumors',
            content: 'Rumors reach your ears that some northern nobles, emboldened by the Emperor\'s campaign, are questioning your authority in their lands. They believe your focus is too worldly.',
            source: 'Your Spymaster',
            options: [
                {
                    text: 'Send a Papal Legate to assert your spiritual dominance.',
                    effects: [
                        { type: 'metricChange', metric: 'piety', value: 10 },
                        { type: 'metricChange', metric: 'authority', value: -5 },
                        { type: 'metricChange', metric: 'publicOpinion', value: 5 }
                    ]
                },
                {
                    text: 'Ignore them; focus on Rome\'s internal affairs.',
                    effects: [
                        { type: 'metricChange', metric: 'authority', value: -10 },
                        { type: 'metricChange', metric: 'gold', value: -5 }
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
                        { type: 'setFlag', flag: 'papal_bull_issued', value: true } // NEW: Sets papal bull flag
                    ]
                },
                {
                    text: 'Delay the Bull, seeking broader consensus and avoiding controversy.',
                    effects: [
                        { type: 'metricChange', metric: 'piety', value: -5 },
                        { type: 'metricChange', metric: 'cardinalFavor', value: 5 },
                        { type: 'metricChange', metric: 'authority', value: 5 }
                    ]
                }
            ]
        },
        {
            id: 'crusade_outcome_report', // NEW EVENT - conditional based on flag
            title: 'Crusade Report',
            content: 'Your Holy Crusade to the East has returned. What are the tidings?',
            source: 'Crusader Captain',
            requiredFlags: ['crusade_launched'], // Only appears if crusade was launched
            forbiddenFlags: ['crusade_report_received'], // Ensures it only happens once per game
            options: [
                {
                    text: 'Assess the gains in piety and territory.',
                    effects: [
                        { type: 'metricChange', metric: 'piety', value: 25 },
                        { type: 'metricChange', metric: 'authority', value: 15 },
                        { type: 'metricChange', metric: 'gold', value: -10 }, // Cost to maintain new territory
                        { type: 'setFlag', flag: 'crusade_report_received', value: true } // Mark as received
                    ]
                },
                {
                    text: 'Lament the losses and focus on rebuilding.',
                    effects: [
                        { type: 'metricChange', metric: 'piety', value: -10 },
                        { type: 'metricChange', metric: 'publicOpinion', value: -5 },
                        { type: 'setFlag', flag: 'crusade_report_received', value: true }
                    ]
                }
            ]
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
                        // When beginning anew, reset all game state
                        { type: 'resetGame', value: true } // NEW: Custom effect type to reset game
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
     * Checks if an event is eligible to be displayed based on current game flags.
     * @param {object} event The event object to check.
     * @returns {boolean} True if the event is eligible, false otherwise.
     */
    function isEventEligible(event) {
        // Check requiredFlags
        if (event.requiredFlags) {
            for (const flag of event.requiredFlags) {
                if (!gameFlags[flag]) { // If a required flag is false/undefined
                    return false;
                }
            }
        }
        // Check forbiddenFlags
        if (event.forbiddenFlags) {
            for (const flag of event.forbiddenFlags) {
                if (gameFlags[flag]) { // If a forbidden flag is true
                    return false;
                }
            }
        }
        return true; // All flag conditions met
    }

    /**
     * Updates a single metric and applies a visual flash.
     * @param {string} metricName The name of the metric (e.g., 'piety').
     * @param {number} value The amount to change the metric by.
     */
    function updateMetric(metricName, value) {
        const oldValue = gameMetrics[metricName];
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
                console.log(`Skipping event '${potentialNextEvent.id}' (Day ${gameDay}) - not eligible due to flags.`);
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

        gameDay = 1;
        gameDayCounter.textContent = gameDay; // FIX: Ensure game day is updated on reset
        currentEventIndex = 0; // Start with the first event in the array
        nextEventId = null;

        updateAllMetricsDisplay(); // Set initial metric values
        loadEvent(events[currentEventIndex]); // Load the very first event
    }

    initGame(); // Call to start the game when the DOM is ready
});
