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
    let hasGameEnded = false; // Flag to track if the game has ended

    // Game Flags - tracks specific conditions or outcomes of choices
    const gameFlags = {
        imperial_alliance_established: false,
        crusade_launched: false,
        papal_bull_issued: false,
        crusade_report_received: false, // Ensures report only happens once
        triumph_divine_mandate_achieved: false, // Prevents re-triggering triumph
        triumph_absolute_authority_achieved: false, // Prevents re-triggering triumph
        // Add more flags as your game develops
    };

    // Game Factions - tracks favor with different powerful groups
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

    // --- Game Events Data (UPDATED WITH RECURRING & RANDOM EVENTS!) ---
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

        // NEW: Recurring Events
        {
            id: 'monthly_treasury_report',
            title: 'Monthly Treasury Report',
            content: 'A report on the papal finances for the past month. Your income varies with public opinion and overall prosperity.',
            source: 'Papal Accountant',
            options: [
                {
                    text: 'Acknowledge the report.',
                    effects: [
                        // Dynamic gold income based on public opinion
                        { type: 'metricChange', metric: 'gold', value: Math.floor(gameMetrics.publicOpinion / 10) + 5 } // Example: 5 to 15 gold
                    ]
                }
            ]
        },
        {
            id: 'annual_pilgrimage_season',
            title: 'Annual Pilgrimage Season',
            content: 'The season of grand pilgrimages draws to a close. Thousands have flocked to Rome and other holy sites, bringing renewed devotion and some offerings.',
            source: 'Head of Papal Household',
            requiredFlags: ['papal_bull_issued'], // Maybe only if a bull has been issued to mark significant papal activity
            options: [
                {
                    text: 'Bless the pilgrims and receive their offerings.',
                    effects: [
                        { type: 'metricChange', metric: 'piety', value: 10 },
                        { type: 'metricChange', metric: 'publicOpinion', value: 5 },
                        { type: 'metricChange', metric: 'gold', value: 10 }
                    ]
                }
            ]
        },

        // NEW: Random Events (These should be defined in the randomEvents array)
        // Leaving these in `events` for findEventById convenience, but they'll be chosen by `selectRandomEvent`
        {
            id: 'plague_outbreak',
            title: 'Plague Outbreak!',
            content: 'A virulent plague sweeps through a prominent city in your domains, causing widespread panic and death. What is your response?',
            source: 'Courier from the North',
            options: [
                {
                    text: 'Order prayers and offer spiritual guidance.',
                    effects: [
                        { type: 'metricChange', metric: 'piety', value: 15 },
                        { type: 'metricChange', metric: 'publicOpinion', value: -15 }, // Some will blame you for inaction
                        { type: 'metricChange', metric: 'gold', value: -5 } // Small cost for aid
                    ]
                },
                {
                    text: 'Send papal doctors and allocate funds for quarantines.',
                    effects: [
                        { type: 'metricChange', metric: 'publicOpinion', value: 10 },
                        { type: 'metricChange', metric: 'gold', value: -20 },
                        { type: 'metricChange', metric: 'piety', value: -5 } // Seen as less spiritual, more worldly
                    ]
                }
            ]
        },
        {
            id: 'noble_dispute_arbitration',
            title: 'Noble Dispute Requires Arbitration',
            content: 'Two powerful noble families are embroiled in a bitter land dispute, threatening to escalate into open warfare. They appeal to your authority to mediate.',
            source: 'Conflicting Envoys',
            requiredFactionFavor: { faction: 'nobility', minFavor: 50 }, // Requires some nobility favor to be approached
            options: [
                {
                    text: 'Meditate and issue a Papal ruling, favoring one side slightly.',
                    effects: [
                        { type: 'metricChange', metric: 'authority', value: 10 },
                        { type: 'factionChange', faction: 'nobility', value: 5 }, // Overall neutrality, slight boost
                        { type: 'metricChange', metric: 'cardinalFavor', value: -5 } // Cardinals might see it as overreach
                    ]
                },
                {
                    text: 'Decline to intervene, citing secular matters.',
                    effects: [
                        { type: 'metricChange', metric: 'authority', value: -5 },
                        { type: 'factionChange', faction: 'nobility', value: -10 } // Nobility loses faith in your leadership
                    ]
                }
            ]
        },
        {
            id: 'heretical_preacher_sighted',
            title: 'Heretical Preacher Sighted!',
            content: 'Reports indicate a charismatic preacher is gaining followers in a remote province, spreading doctrines contrary to Papal teaching. What is your response?',
            source: 'Local Bishop',
            requiredMetrics: { metric: 'piety', min: 40 }, // Only if piety isn't too low to care
            options: [
                {
                    text: 'Dispatch an Inquisition to suppress the heresy.',
                    effects: [
                        { type: 'metricChange', metric: 'piety', value: 15 },
                        { type: 'metricChange', metric: 'publicOpinion', value: -10 },
                        { type: 'factionChange', faction: 'monasticOrders', value: 10 } // Monastics approve
                    ]
                },
                {
                    text: 'Send a conciliatory envoy to understand their grievances.',
                    effects: [
                        { type: 'metricChange', metric: 'piety', value: -5 },
                        { type: 'metricChange', metric: 'authority', value: -5 },
                        { type: 'metricChange', metric: 'publicOpinion', value: 5 }
                    ]
                }
            ]
        },

        // Game Ending / Triumph Events (from previous iteration)
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

    // NEW: Random Events Array (separate for easier management of probabilities)
    const randomEvents = [
        {
            id: 'plague_outbreak',
            weight: 3, // Higher weight means more likely to occur
            requiredMetrics: { metric: 'publicOpinion', min: 20 } // Only occurs if public opinion isn't completely gone
        },
        {
            id: 'noble_dispute_arbitration',
            weight: 2,
            requiredFactionFavor: { faction: 'nobility', minFavor: 40 } // Requires some nobility favor to be approached
        },
        {
            id: 'heretical_preacher_sighted',
            weight: 4,
            requiredMetrics: { metric: 'piety', min: 30 }
        },
        // Add more random event IDs here with their weights
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

        // NEW: Check requiredMetrics
        if (event.requiredMetrics) {
            const metricValue = gameMetrics[event.requiredMetrics.metric];
            if (metricValue === undefined || metricValue < event.requiredMetrics.min || (event.requiredMetrics.max !== undefined && metricValue > event.requiredMetrics.max)) {
                return false;
            }
        }

        return true; // All conditions met
    }

    /**
     * Updates a single metric and applies a visual flash.
     * @param {string} metricName The name of the metric (e.g., 'piety').
     * @param {number} value The amount to change the metric by.
     */
    function updateMetric(metricName, value) {
        // Apply dynamic gold income calculation directly
        if (metricName === 'gold' && typeof value === 'string' && value.includes('gameMetrics.publicOpinion')) {
            // This is a basic example. For more complex dynamic calculations,
            // you might want a dedicated 'dynamicValue' effect type.
            const calculatedValue = Math.floor(gameMetrics.publicOpinion / 10) + 5;
            gameMetrics[metricName] = Math.max(0, Math.min(100, gameMetrics[metricName] + calculatedValue));
            console.log(`Gold changed by dynamic value: ${calculatedValue}`);
        } else {
            gameMetrics[metricName] = Math.max(0, Math.min(100, gameMetrics[metricName] + value)); // Clamp between 0-100
        }


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
     * NEW: Selects an eligible random event based on weights.
     * @returns {object|null} An eligible random event, or null if none found.
     */
    function selectRandomEvent() {
        const eligibleRandomEvents = randomEvents.filter(re => {
            const eventData = findEventById(re.id);
            return eventData && isEventEligible(eventData);
        });

        if (eligibleRandomEvents.length === 0) {
            return null;
        }

        // Calculate total weight of eligible events
        const totalWeight = eligibleRandomEvents.reduce((sum, re) => sum + re.weight, 0);

        // Pick a random number within the total weight
        let randomNum = Math.random() * totalWeight;

        // Find the event corresponding to that random number
        for (const re of eligibleRandomEvents) {
            randomNum -= re.weight;
            if (randomNum <= 0) {
                return findEventById(re.id);
            }
        }
        return null; // Should not happen if totalWeight > 0
    }

    /**
     * Checks for game ending or special achievement conditions.
     * If a condition is met, it loads the appropriate ending event.
     * Prioritizes game over conditions over triumph conditions.
     * @returns {boolean} True if an ending event was loaded, false otherwise.
     */
    function checkGameStatus() {
        if (hasGameEnded) return true; // If game has already ended, do nothing

        // --- Game Over Conditions (priority) ---
        if (gameMetrics.piety <= 0) {
            hasGameEnded = true; loadEvent(findEventById('game_over_heresy')); return true;
        }
        if (gameMetrics.publicOpinion <= 0) {
            hasGameEnded = true; loadEvent(findEventById('game_over_tyranny')); return true;
        }
        if (gameMetrics.gold <= 0) {
            hasGameEnded = true; loadEvent(findEventById('game_over_impoverished')); return true;
        }
        if (gameMetrics.cardinalFavor <= 0) {
            hasGameEnded = true; loadEvent(findEventById('game_over_deposed_cardinals')); return true;
        }
        if (gameFactions.imperial.favor <= 0) {
            hasGameEnded = true; loadEvent(findEventById('game_over_imperial_control')); return true;
        }
        if (gameFactions.nobility.favor <= 0) {
            hasGameEnded = true; loadEvent(findEventById('game_over_noble_revolt')); return true;
        }

        // --- Triumph/High Metric Conditions ---
        // These can be set to 100 or a high value like 95.
        if (gameMetrics.piety >= 95 && !gameFlags.triumph_divine_mandate_achieved) {
            hasGameEnded = true; gameFlags.triumph_divine_mandate_achieved = true; loadEvent(findEventById('triumph_divine_mandate')); return true;
        }
        if (gameMetrics.authority >= 95 && !gameFlags.triumph_absolute_authority_achieved) {
            hasGameEnded = true; gameFlags.triumph_absolute_authority_achieved = true; loadEvent(findEventById('triumph_absolute_authority')); return true;
        }

        return false; // No ending event was loaded
    }

    /**
     * NEW: Performs daily checks for recurring events and random events.
     * This is called after game state updates and game end checks.
     * @returns {boolean} True if a recurring or random event was loaded, false otherwise.
     */
    function dailyChecks() {
        // If game has ended, don't trigger daily events
        if (hasGameEnded) return true; // Indicate that an event was "handled" (by being ended)

        // 1. Check for Recurring Events (Higher priority than random)
        // Example: Monthly Treasury Report every 30 days
        if (gameDay % 30 === 0 && gameDay > 0) { // Ensure it doesn't trigger on Day 0
            const recurringEvent = findEventById('monthly_treasury_report');
            if (recurringEvent && isEventEligible(recurringEvent)) {
                loadEvent(recurringEvent);
                return true;
            }
        }
        // Example: Annual Pilgrimage Season every 100 days
        if (gameDay % 100 === 0 && gameDay > 0) {
             const recurringEvent = findEventById('annual_pilgrimage_season');
             if (recurringEvent && isEventEligible(recurringEvent)) {
                 loadEvent(recurringEvent);
                 return true;
             }
         }


        // 2. Roll for Random Events (Lower priority than recurring)
        // 20% chance each day for a random event, if no recurring event triggered
        if (Math.random() < 0.2) { // Adjust probability as desired (e.g., 0.1 for 10%)
            const randomEvent = selectRandomEvent();
            if (randomEvent) {
                loadEvent(randomEvent);
                return true;
            }
        }

        return false; // No special event (recurring or random) was loaded
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

        // NEW: Perform daily checks for game status, recurring, and random events
        // If any of these checks loads an event (including game end), stop further normal event loading
        if (checkGameStatus() || dailyChecks()) {
            return;
        }

        // Determine and load the next eligible event (Only if no special event took priority)
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
            // or other special events handled by dailyChecks
            if (potentialNextEvent.id.startsWith('game_over_') || potentialNextEvent.id.startsWith('triumph_') ||
                potentialNextEvent.id === 'monthly_treasury_report' ||
                potentialNextEvent.id === 'annual_pilgrimage_season' ||
                randomEvents.some(re => re.id === potentialNextEvent.id)) {
                 currentEventIndex++; // Skip these special event IDs if found in linear path
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
        hasGameEnded = false; // Reset game ended flag

        updateAllMetricsDisplay(); // Set initial metric values
        loadEvent(events[currentEventIndex]); // Load the very first event
    }

    initGame(); // Call to start the game when the DOM is ready
});
