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

    // --- Game Events Data (UPDATED STRUCTURE!) ---
    // Each choice option now has an 'effects' array
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
                        { type: 'setNextEvent', eventId: 'noble_dissatisfaction' } // Leads to another specific event
                    ]
                },
                {
                    text: 'Deny his request, citing spiritual concerns and neutrality.',
                    effects: [
                        { type: 'metricChange', metric: 'piety', value: 10 },
                        { type: 'metricChange', metric: 'authority', value: -10 }, // Authority drops with Emperor
                        { type: 'metricChange', metric: 'cardinalFavor', value: 5 },
                        { type: 'setNextEvent', eventId: 'papal_decree_consideration' } // Leads to another specific event
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
                        { type: 'setNextEvent', eventId: 'papal_decree_consideration' } // Leads to a specific event
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
            id: 'noble_dissatisfaction', // Follow-up event from Imperial Demand choice
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
                        { type: 'metricChange', metric: 'gold', value: -5 } // Lost taxes due to unrest
                    ]
                }
            ]
        },
        {
            id: 'papal_decree_consideration', // Follow-up event from various choices
            title: 'A New Papal Bull',
            content: 'After much deliberation, you consider issuing a Papal Bull on a controversial theological matter regarding the Immaculate Conception. This could reshape doctrine.',
            source: 'Your Advisor',
            options: [
                {
                    text: 'Issue the Bull, affirming traditional doctrine strictly.',
                    effects: [
                        { type: 'metricChange', metric: 'piety', value: 15 },
                        { type: 'metricChange', metric: 'publicOpinion', value: 10 },
                        { type: 'metricChange', metric: 'cardinalFavor', value: -5 } // Some modern cardinals might disagree
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
        // Add more events here to continue the game,
        // either linear or by adding more 'setNextEvent' effects
        {
            id: 'end_game_placeholder',
            title: 'The Papacy Continues...',
            content: 'You have navigated the initial challenges of your pontificate. More trials and triumphs await.',
            source: 'History Itself',
            options: [
                {
                    text: 'Begin Anew',
                    effects: [
                        { type: 'setNextEvent', eventId: 'start_game' } // Loop back to start for replayability
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
        // Reset nextEventId for linear progression unless overridden
        nextEventId = null;

        // Apply all effects defined for the chosen option
        chosenOption.effects.forEach(effect => {
            if (effect.type === 'metricChange') {
                updateMetric(effect.metric, effect.value);
            } else if (effect.type === 'setNextEvent') {
                nextEventId = effect.eventId; // Set the ID of the next event to load
            }
            // Add more effect types here as you expand mechanics (e.g., 'unlockFeature', 'triggerFlag')
        });

        // Advance game day
        gameDay++;
        gameDayCounter.textContent = gameDay;

        // Determine and load the next event
        let nextEvent;
        if (nextEventId) {
            nextEvent = findEventById(nextEventId);
            // If branched, reset currentEventIndex to -1 to prevent linear progression
            // Or set it to the index of the branched event if you want linear from there
            currentEventIndex = events.indexOf(nextEvent); // Set current index to the branched event
        } else {
            currentEventIndex++; // Move to the next event in the linear array
            nextEvent = events[currentEventIndex];
        }

        if (nextEvent) {
            loadEvent(nextEvent);
        } else {
            // No more events, handle end of game or loop back
            console.log('End of game/event sequence reached.');
            // For now, let's loop back to the start game event for demonstration
            loadEvent(findEventById('end_game_placeholder'));
            // You might want a proper 'Game Over' screen here
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
        updateAllMetricsDisplay(); // Set initial metric values
        currentEventIndex = 0; // Start with the first event in the array
        loadEvent(events[currentEventIndex]); // Load the very first event
    }

    initGame(); // Call to start the game when the DOM is ready
});
