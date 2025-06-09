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

    // NEW: Game Buildings - tracks status, level, and properties of various constructions
    const gameBuildings = {
        st_peters_basilica_reconstruction: {
            level: 0, // 0: not built, 1: completed base
            status: 'none', // 'none', 'under_construction', 'completed'
            daysRemaining: 0,
            baseCost: { gold: 150, piety: 50, authority: 30 },
            baseDaysToBuild: 60,
            passiveBonuses: { piety: 2, publicOpinion: 1 }, // Daily passive gains
            completionEventId: 'st_peters_completed'
        },
        papal_library: {
            level: 0,
            status: 'none',
            daysRemaining: 0,
            baseCost: { gold: 80, cardinalFavor: 20 },
            baseDaysToBuild: 40,
            passiveBonuses: { cardinalFavor: 1, authority: 1 },
            completionEventId: 'papal_library_completed'
        },
        // Add more buildings here
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

    // --- Game Events Data (UPDATED WITH BUILDING EVENTS!) ---
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

        // NEW: Event to initiate building construction
        {
            id: 'construction_opportunity_basilica',
            title: 'Rebuilding St. Peter\'s Basilica',
            content: 'The old St. Peter\'s Basilica, though grand, is showing its age and does not fully reflect the glory of God. A grand reconstruction project could inspire the faithful and solidify Rome\'s prominence, but it will be costly.',
            source: 'Master Architect',
            requiredBuildings: { buildingId: 'st_peters_basilica_reconstruction', status: 'none' }, // Only available if not built yet
            options: [
                {
                    text: 'Begin the grand reconstruction!',
                    effects: [
                        { type: 'startConstruction', buildingId: 'st_peters_basilica_reconstruction' },
                        { type: 'setNextEvent', eventId: 'papal_decree_consideration' } // Return to normal flow after initiating
                    ]
                },
                {
                    text: 'Defer the project for a later date.',
                    effects: [
                        { type: 'metricChange', metric: 'publicOpinion', value: -5 },
                        { type: 'metricChange', metric: 'cardinalFavor', value: -5 },
                    ]
                }
            ]
        },
        {
            id: 'construction_opportunity_library',
            title: 'Establish a Papal Library',
            content: 'To foster theological learning and preserve ancient texts, a comprehensive Papal Library is proposed. This will enhance the Holy See\'s reputation as a center of knowledge, but requires significant investment.',
            source: 'Scholar Cardinal',
            requiredBuildings: { buildingId: 'papal_library', status: 'none' }, // Only available if not built yet
            options: [
                {
                    text: 'Commission the new Papal Library.',
                    effects: [
                        { type: 'startConstruction', buildingId: 'papal_library' },
                        { type: 'setNextEvent', eventId: 'noble_dissatisfaction' } // Return to normal flow after initiating
                    ]
                },
                {
                    text: 'Focus on more immediate concerns.',
                    effects: [
                        { type: 'metricChange', metric: 'piety', value: -5 },
                        { type: 'metricChange', metric: 'cardinalFavor', value: -10 },
                    ]
                }
            ]
        },

        // NEW: Building Completion Events (triggered by dailyChecks)
        {
            id: 'st_peters_completed',
            title: 'St. Peter\'s Basilica Completed!',
            content: 'The magnificent new St. Peter\'s Basilica stands complete! Its grandeur inspires awe and devotion across Christendom. Your name will forever be tied to this monumental achievement.',
            source: 'The Pope\'s Journal',
            options: [
                {
                    text: 'Rejoice in this divine accomplishment!',
                    effects: [
                        { type: 'metricChange', metric: 'piety', value: 20 },
                        { type: 'metricChange', metric: 'authority', value: 15 },
                        { type: 'metricChange', metric: 'publicOpinion', value: 20 }
                    ]
                }
            ]
        },
        {
            id: 'papal_library_completed',
            title: 'The Papal Library Opens!',
            content: 'The new Papal Library is now open, a repository of knowledge and wisdom. Scholars from across Europe flock to its halls, elevating the Holy See\'s intellectual standing.',
            source: 'Archivist',
            options: [
                {
                    text: 'Celebrate this intellectual triumph!',
                    effects: [
                        { type: 'metricChange', metric: 'cardinalFavor', value: 15 },
                        { type: 'metricChange', metric: 'authority', value: 10 },
                        { type: 'factionChange', faction: 'monasticOrders', value: 10 }
                    ]
                }
            ]
        },


        // Recurring Events
        {
            id: 'monthly_treasury_report',
            title: 'Monthly Treasury Report',
            content: 'A report on the papal finances for the past month. Your income varies with public opinion and overall prosperity. (Includes passive gold from buildings!)',
            source: 'Papal Accountant',
            options: [
                {
                    text: 'Acknowledge the report.',
                    effects: [
                        // Dynamic gold income based on public opinion. Passive gold is already applied before this event.
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
            requiredFlags: ['papal_bull_issued'],
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

        // Random Events (These should be defined in the randomEvents array)
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
                        { type: 'metricChange', metric: 'publicOpinion', value: -15 },
                        { type: 'metricChange', metric: 'gold', value: -5 }
                    ]
                },
                {
                    text: 'Send papal doctors and allocate funds for quarantines.',
                    effects: [
                        { type: 'metricChange', metric: 'publicOpinion', value: 10 },
                        { type: 'metricChange', metric: 'gold', value: -20 },
                        { type: 'metricChange', metric: 'piety', value: -5 }
                    ]
                }
            ]
        },
        {
            id: 'noble_dispute_arbitration',
            title: 'Noble Dispute Requires Arbitration',
            content: 'Two powerful noble families are embroiled in a bitter land dispute, threatening to escalate into open warfare. They appeal to your authority to mediate.',
            source: 'Conflicting Envoys',
            options: [
                {
                    text: 'Meditate and issue a Papal ruling, favoring one side slightly.',
                    effects: [
                        { type: 'metricChange', metric: 'authority', value: 10 },
                        { type: 'factionChange', faction: 'nobility', value: 5 },
                        { type: 'metricChange', metric: 'cardinalFavor', value: -5 }
                    ]
                },
                {
                    text: 'Decline to intervene, citing secular matters.',
                    effects: [
                        { type: 'metricChange', metric: 'authority', value: -5 },
                        { type: 'factionChange', faction: 'nobility', value: -10 }
                    ]
                }
            ]
        },
        {
            id: 'heretical_preacher_sighted',
            title: 'Heretical Preacher Sighted!',
            content: 'Reports indicate a charismatic preacher is gaining followers in a remote province, spreading doctrines contrary to Papal teaching. What is your response?',
            source: 'Local Bishop',
            options: [
                {
                    text: 'Dispatch an Inquisition to suppress the heresy.',
                    effects: [
                        { type: 'metricChange', metric: 'piety', value: 15 },
                        { type: 'metricChange', metric: 'publicOpinion', value: -10 },
                        { type: 'factionChange', faction: 'monasticOrders', value: 10 }
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

    // Random Events Array (separate for easier management of probabilities)
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
     * Checks if an event is eligible to be displayed based on current game flags, faction favors, metrics, and buildings.
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
            if (!faction || faction.favor < event.requiredFactionFavor.minFavor || (event.requiredFactionFavor.maxFavor !== undefined && faction.favor > event.requiredFactionFavor.maxFavor)) {
                return false;
            }
        }

        // Check requiredMetrics
        if (event.requiredMetrics) {
            const metricValue = gameMetrics[event.requiredMetrics.metric];
            if (metricValue === undefined || metricValue < event.requiredMetrics.min || (event.requiredMetrics.max !== undefined && metricValue > event.requiredMetrics.max)) {
                return false;
            }
        }

        // NEW: Check requiredBuildings
        if (event.requiredBuildings) {
            const building = gameBuildings[event.requiredBuildings.buildingId];
            if (!building || building.status !== event.requiredBuildings.status) {
                return false;
            }
            // Add level check if needed: && building.level >= event.requiredBuildings.minLevel
        }

        return true; // All conditions met
    }

    /**
     * Updates a single metric and applies a visual flash.
     * @param {string} metricName The name of the metric (e.g., 'piety').
     * @param {number} value The amount to change the metric by.
     */
    function updateMetric(metricName, value) {
        // Special handling for dynamic gold income from monthly report
        if (metricName === 'gold' && typeof value === 'string' && value.includes('gameMetrics.publicOpinion')) {
            const calculatedValue = Math.floor(gameMetrics.publicOpinion / 10) + 5;
            gameMetrics[metricName] = Math.max(0, Math.min(100, gameMetrics[metricName] + calculatedValue));
            console.log(`Gold changed dynamically by: ${calculatedValue}`);
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
     * NEW: Initiates construction for a specified building.
     * Deducts costs and sets building status to 'under_construction'.
     * @param {string} buildingId The ID of the building to start construction.
     */
    function startConstruction(buildingId) {
        const building = gameBuildings[buildingId];
        if (!building || building.status !== 'none') {
            console.warn(`Cannot start construction for ${buildingId}. Status is ${building ? building.status : 'undefined'}.`);
            return;
        }

        // Check if player can afford the cost
        let canAfford = true;
        for (const metricCost in building.baseCost) {
            if (gameMetrics[metricCost] < building.baseCost[metricCost]) {
                canAfford = false;
                console.warn(`Not enough ${metricCost} to build ${buildingId}. Required: ${building.baseCost[metricCost]}, Have: ${gameMetrics[metricCost]}`);
                // TODO: Provide UI feedback to the player about insufficient funds
                return; // Exit if cannot afford any part of the cost
            }
        }

        if (canAfford) {
            // Deduct costs
            for (const metricCost in building.baseCost) {
                updateMetric(metricCost, -building.baseCost[metricCost]);
            }

            // Set building status
            building.status = 'under_construction';
            building.daysRemaining = building.baseDaysToBuild;
            console.log(`Construction started for ${buildingId}! Days remaining: ${building.daysRemaining}`);
            // TODO: Add UI feedback for construction started
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
        // TODO: Add display for buildings and their status
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
     * Selects an eligible random event based on weights.
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
        if (gameMetrics.piety >= 95 && !gameFlags.triumph_divine_mandate_achieved) {
            hasGameEnded = true; gameFlags.triumph_divine_mandate_achieved = true; loadEvent(findEventById('triumph_divine_mandate')); return true;
        }
        if (gameMetrics.authority >= 95 && !gameFlags.triumph_absolute_authority_achieved) {
            hasGameEnded = true; gameFlags.triumph_absolute_authority_achieved = true; loadEvent(findEventById('triumph_absolute_authority')); return true;
        }

        return false; // No ending event was loaded
    }

    /**
     * NEW: Checks and updates progress for buildings under construction.
     * Triggers completion events when a building is finished.
     * @returns {boolean} True if a building completion event was loaded, false otherwise.
     */
    function checkBuildingProgress() {
        for (const buildingId in gameBuildings) {
            const building = gameBuildings[buildingId];
            if (building.status === 'under_construction') {
                building.daysRemaining--;
                console.log(`${buildingId} construction: ${building.daysRemaining} days left.`);

                if (building.daysRemaining <= 0) {
                    building.status = 'completed';
                    building.level = 1; // Mark as base level 1
                    console.log(`${buildingId} construction completed!`);
                    // Trigger completion event if specified
                    if (building.completionEventId) {
                        const completionEvent = findEventById(building.completionEventId);
                        if (completionEvent) {
                            loadEvent(completionEvent);
                            return true; // A completion event was loaded
                        }
                    }
                }
            }
        }
        return false; // No completion event was loaded
    }

    /**
     * NEW: Applies passive bonuses from completed buildings.
     * @returns {boolean} True if any passive bonuses were applied.
     */
    function applyPassiveBonuses() {
        let applied = false;
        for (const buildingId in gameBuildings) {
            const building = gameBuildings[buildingId];
            if (building.status === 'completed' && building.passiveBonuses) {
                for (const metric in building.passiveBonuses) {
                    const bonusValue = building.passiveBonuses[metric];
                    updateMetric(metric, bonusValue);
                    console.log(`Applied passive bonus from ${buildingId}: +${bonusValue} ${metric}`);
                    applied = true;
                }
            }
        }
        return applied;
    }


    /**
     * Performs daily checks for recurring events and random events.
     * This is called after game state updates and game end checks.
     * @returns {boolean} True if a recurring or random event was loaded, false otherwise.
     */
    function dailyChecks() {
        // If game has ended, don't trigger daily events
        if (hasGameEnded) return true; // Indicate that an event was "handled" (by being ended)

        // 1. NEW: Check Building Progress (highest priority among daily checks)
        if (checkBuildingProgress()) {
            return true; // A building just completed, so its event was loaded. Stop further daily checks.
        }

        // 2. NEW: Apply Passive Bonuses from completed buildings
        applyPassiveBonuses(); // Apply bonuses regardless of other events, as they are "daily"

        // 3. Check for Recurring Events
        if (gameDay % 30 === 0 && gameDay > 0) {
            const recurringEvent = findEventById('monthly_treasury_report');
            if (recurringEvent && isEventEligible(recurringEvent)) {
                loadEvent(recurringEvent);
                return true;
            }
        }
        if (gameDay % 100 === 0 && gameDay > 0) {
             const recurringEvent = findEventById('annual_pilgrimage_season');
             if (recurringEvent && isEventEligible(recurringEvent)) {
                 loadEvent(recurringEvent);
                 return true;
             }
         }


        // 4. Roll for Random Events
        if (Math.random() < 0.2) {
            const randomEvent = selectRandomEvent();
            if (randomEvent) {
                loadEvent(randomEvent);
                return true;
            }
        }

        return false; // No special event (recurring, random, or completion) was loaded
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
            } else if (effect.type === 'startConstruction') { // NEW: Handle starting construction
                startConstruction(effect.buildingId);
            }
            else if (effect.type === 'resetGame') { // Handle game reset
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

        // Perform daily checks for game status, recurring, and random events, and building progress/bonuses.
        // If any of these checks loads an event (including game end), stop further normal event loading.
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
            // Ensure we don't accidentally load special events that are handled by dailyChecks or gameStatus
            // This list of IDs should include all IDs that are explicitly triggered outside the linear flow.
            const specialEventIds = [
                'monthly_treasury_report',
                'annual_pilgrimage_season',
                'st_peters_completed', // Building completion events
                'papal_library_completed', // Building completion events
                ...randomEvents.map(re => re.id) // All random event IDs
            ];

            if (potentialNextEvent.id.startsWith('game_over_') || potentialNextEvent.id.startsWith('triumph_') ||
                specialEventIds.includes(potentialNextEvent.id)) {
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
        gameFlags.triumph_divine_mandate_achieved = false;
        gameFlags.triumph_absolute_authority_achieved = false;

        // Reset faction favors
        for (const factionKey in gameFactions) {
            gameFactions[factionKey].favor = 50; // Reset all factions to 50 favor
        }

        // NEW: Reset building states
        for (const buildingId in gameBuildings) {
            const building = gameBuildings[buildingId];
            building.level = 0;
            building.status = 'none';
            building.daysRemaining = 0;
            // Retain baseCost, baseDaysToBuild, passiveBonuses
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
