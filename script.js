document.addEventListener('DOMContentLoaded', () => {
    // --- Game State Variables ---
    const gameMetrics = {
        piety: 50,
        authority: 50,
        gold: 100,
        publicOpinion: 50,
        cardinalFavor: 50,
        integrity: 50, // Represents moral standing, corruption vs. virtue
    };
    let gameDay = 1;
    let hasGameEnded = false; // Flag to track if the game has ended

    // NEW: Max Game Days for a full playthrough before final evaluation
    const MAX_GAME_DAYS = 730; // Approximately 2 years (365 * 2)

    // Game Flags - tracks specific conditions or outcomes of choices
    const gameFlags = {
        imperial_alliance_established: false,
        crusade_launched: false,
        papal_bull_issued: false,
        crusade_report_received: false,
        jubilee_initiated: false,
        triumph_divine_mandate_achieved: false, // Now just a flag, doesn't end game immediately
        triumph_absolute_authority_achieved: false, // Now just a flag
    };

    // Game Factions - tracks favor with different powerful groups
    const gameFactions = {
        imperial: { favor: 50, name: 'The Holy Roman Emperor' },
        nobility: { favor: 50, name: 'European Nobility' },
        monasticOrders: { favor: 50, name: 'Monastic Orders' },
    };

    // Game Buildings - tracks status, level, and properties of various constructions
    const gameBuildings = {
        st_peters_basilica_reconstruction: {
            level: 0,
            status: 'none', // 'none', 'under_construction', 'completed'
            daysRemaining: 0,
            baseCost: { gold: 150, piety: 50, authority: 30 },
            baseDaysToBuild: 60,
            passiveBonuses: { piety: 2, publicOpinion: 1 },
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
    };

    // NEW: Advisors system (simple for now)
    const advisors = {
        cardinalSecretary: { name: "Cardinal Valerius", loyalty: 70, description: "Your chief administrative assistant, practical and efficient." },
        inquisitorGeneral: { name: "Brother Thomas", loyalty: 80, description: "Stern and devout, leader of the Holy Inquisition." },
        masterOfCeremonies: { name: "Monsignor Battista", loyalty: 60, description: "Oversees papal ceremonies and Vatican protocol." }
    };

    // NEW: Event Queue - all events to be processed are added here with a priority
    // Each entry: { eventId: string, priority: number, triggerDay?: number }
    // Priority order: 100 (Game Over/Triumph), 90 (Delayed), 80 (Building Completion), 70 (Recurring), 50 (Main Story/Next Event), 40 (Random)
    let gameEventQueue = [];

    // Tracks the index for the 'main story' progression if no other events are triggered
    let mainStoryEventIndex = 0;


    // --- DOM Elements ---
    const metricPiety = document.getElementById('metric-piety');
    const metricAuthority = document.getElementById('metric-authority');
    const metricGold = document.getElementById('metric-gold');
    const metricPublicOpinion = document.getElementById('metric-publicOpinion');
    const metricCardinalFavor = document.getElementById('metric-cardinalFavor');
    const metricIntegrity = document.getElementById('metric-integrity');
    const gameDayCounter = document.getElementById('game-day-counter');

    const documentArea = document.getElementById('document-area');
    const documentTitle = document.getElementById('document-title');
    const documentContent = document.getElementById('document-content');
    const documentSource = document.getElementById('document-source');
    const optionsContainer = document.getElementById('options-container');

    const mapButton = document.getElementById('map-button');
    const mapOverlay = document.getElementById('map-overlay');
    const closeMapButton = document.getElementById('close-map-button');

    // --- Game Events Data ---
    // Events are now just definitions. Their order in this array is for linear fallback,
    // but the event queue system will prioritize and manage their loading.
    const events = [
        {
            id: 'start_game',
            title: 'A New Pontificate',
            content: 'You have been elected to the Holy See. The burdens of the papacy weigh heavily upon you.',
            source: 'The Conclave',
            options: [
                {
                    text: 'Embrace your new role with divine confidence.',
                    effects: [
                        { type: 'metricChange', metric: 'piety', value: 10 },
                        { type: 'metricChange', metric: 'authority', value: 5 },
                        { type: 'scheduleNextMainEvent' } // Schedule next main event
                    ]
                },
                {
                    text: 'Seek immediate counsel from the College of Cardinals.',
                    effects: [
                        { type: 'metricChange', metric: 'cardinalFavor', value: 10 },
                        { type: 'metricChange', metric: 'publicOpinion', value: -5 },
                        { type: 'scheduleNextMainEvent', overrideEventId: 'cardinal_meeting' }
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
                        { type: 'setFlag', flag: 'imperial_alliance_established', value: true }
                    ]
                },
                {
                    text: 'Deny his request, citing spiritual concerns and neutrality.',
                    effects: [
                        { type: 'metricChange', metric: 'piety', value: 10 },
                        { type: 'metricChange', metric: 'authority', value: -10 },
                        { type: 'metricChange', metric: 'cardinalFavor', value: 5 },
                        { type: 'factionChange', faction: 'imperial', value: -15 }
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
                        { type: 'metricChange', metric: 'piety', value: 5 }
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
                        { type: 'delayEvent', eventId: 'crusade_outcome_report', days: 90 } // Delayed outcome
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
            content: 'Rumors reach your ears that some northern nobles are questioning your authority. They believe your focus is too worldly.',
            source: 'Your Spymaster', // Could be advisors.cardinalSecretary.name
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
            content: 'You consider issuing a Papal Bull on a controversial theological matter regarding the Immaculate Conception. This could reshape doctrine.',
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
            content: 'Lord Bertrand requests a special papal tax exemption for his lands, citing recent hardships.',
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

        // Event to initiate building construction
        {
            id: 'construction_opportunity_basilica',
            title: 'Rebuilding St. Peter\'s Basilica',
            content: 'The old St. Peter\'s Basilica, though grand, is showing its age. A grand reconstruction project could inspire the faithful and solidify Rome\'s prominence, but it will be costly.',
            source: 'Master Architect',
            requiredBuildings: { buildingId: 'st_peters_basilica_reconstruction', status: 'none' },
            options: [
                {
                    text: 'Begin the grand reconstruction!',
                    effects: [
                        { type: 'startConstruction', buildingId: 'st_peters_basilica_reconstruction' },
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
            requiredBuildings: { buildingId: 'papal_library', status: 'none' },
            options: [
                {
                    text: 'Commission the new Papal Library.',
                    effects: [
                        { type: 'startConstruction', buildingId: 'papal_library' },
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

        // Building Completion Events (triggered by dailyChecks via queue)
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

        // Jubilee Project Start Event
        {
            id: 'initiate_jubilee',
            title: 'A Holy Jubilee Year',
            content: 'A proposal for a grand Jubilee year. It would attract pilgrims and generate wealth, but demands great preparations and impeccable integrity.',
            source: advisors.cardinalSecretary.name,
            requiredFlags: ['papal_bull_issued'],
            forbiddenFlags: ['jubilee_initiated'],
            requiredMetrics: { metric: 'gold', min: 40 },
            options: [
                {
                    text: 'Declare the Jubilee! Let the faithful come!',
                    effects: [
                        { type: 'metricChange', metric: 'gold', value: -40 },
                        { type: 'metricChange', metric: 'publicOpinion', value: 10 },
                        { type: 'setFlag', flag: 'jubilee_initiated', value: true },
                        { type: 'delayEvent', eventId: 'jubilee_outcome', days: 120 }
                    ]
                },
                {
                    text: 'The time is not right. Postpone the Jubilee.',
                    effects: [
                        { type: 'metricChange', metric: 'piety', value: -10 },
                        { type: 'metricChange', metric: 'publicOpinion', value: -5 },
                    ]
                }
            ]
        },

        // Jubilee Project Outcome (Triggered by delayed event)
        {
            id: 'jubilee_outcome',
            title: 'The Grand Jubilee Concludes!',
            content: 'After many months, the Holy Jubilee Year has concluded. The faithful return to their homes. The success of the Jubilee largely depended on the perceived purity of your reign.',
            source: 'Jubilee Commission',
            options: [
                {
                    text: 'Assess the results.',
                    effects: [
                        {
                            type: 'conditionalEffect',
                            condition: { metric: 'integrity', min: 70 },
                            effects: [
                                { type: 'metricChange', metric: 'gold', value: 60 },
                                { type: 'metricChange', metric: 'piety', value: 40 },
                                { type: 'metricChange', metric: 'publicOpinion', value: 30 },
                            ]
                        },
                        {
                            type: 'conditionalEffect',
                            condition: { metric: 'integrity', min: 40, max: 69 },
                            effects: [
                                { type: 'metricChange', metric: 'gold', value: 20 },
                                { type: 'metricChange', metric: 'piety', value: 15 },
                                { type: 'metricChange', metric: 'publicOpinion', value: 5 },
                            ]
                        },
                        {
                            type: 'conditionalEffect',
                            condition: { metric: 'integrity', max: 39 },
                            effects: [
                                { type: 'metricChange', metric: 'gold', value: -10 },
                                { type: 'metricChange', metric: 'piety', value: -20 },
                                { type: 'metricChange', metric: 'publicOpinion', value: -15 },
                                { type: 'factionChange', faction: 'monasticOrders', value: -15 }
                            ]
                        },
                        { type: 'setFlag', flag: 'jubilee_initiated', value: false },
                    ]
                }
            ]
        },

        // Events showing choices affecting integrity
        {
            id: 'indulgences_proposal',
            title: 'Selling of Indulgences',
            content: 'A desperate need for funds leads some cardinals to propose a widespread selling of indulgences for sins. This would generate immense wealth but might be seen as corrupt.',
            source: advisors.masterOfCeremonies.name,
            requiredMetrics: { metric: 'gold', max: 50 },
            options: [
                {
                    text: 'Approve the sale of indulgences.',
                    effects: [
                        { type: 'metricChange', metric: 'gold', value: 50 },
                        { type: 'metricChange', metric: 'integrity', value: -20 },
                        { type: 'metricChange', metric: 'publicOpinion', value: -10 },
                        { type: 'factionChange', faction: 'monasticOrders', value: -15 }
                    ]
                },
                {
                    text: 'Forbid the practice, maintaining the purity of the Church.',
                    effects: [
                        { type: 'metricChange', metric: 'gold', value: -10 },
                        { type: 'metricChange', metric: 'integrity', value: 10 },
                        { type: 'metricChange', metric: 'piety', value: 10 }
                    ]
                }
            ]
        },
        {
            id: 'poor_relief_plea',
            title: 'Plea for the Roman Poor',
            content: 'The Roman populace suffers from famine and poverty. Local clergy appeal to you for papal relief efforts.',
            source: 'Bishop of Rome',
            options: [
                {
                    text: 'Allocate significant funds for relief.',
                    effects: [
                        { type: 'metricChange', metric: 'gold', value: -30 },
                        { type: 'metricChange', metric: 'integrity', value: 15 },
                        { type: 'metricChange', metric: 'publicOpinion', value: 20 },
                        { type: 'metricChange', metric: 'piety', value: 10 }
                    ]
                },
                {
                    text: 'Encourage local charities and sermons, but no direct funds.',
                    effects: [
                        { type: 'metricChange', metric: 'integrity', value: -5 },
                        { type: 'metricChange', metric: 'publicOpinion', value: -5 },
                        { type: 'metricChange', metric: 'piety', value: 5 }
                    ]
                }
            ]
        },
        // NEW: More events demonstrating new mechanics
        {
            id: 'heresy_inquisition',
            title: 'Rising Heresy in Saxony',
            content: 'Reports from Saxony indicate a growing movement of heretics challenging papal authority. The Inquisitor General demands swift action.',
            source: advisors.inquisitorGeneral.name,
            options: [
                {
                    text: 'Launch a full-scale Inquisition to purge the heresy.',
                    effects: [
                        { type: 'metricChange', metric: 'piety', value: 15 },
                        { type: 'metricChange', metric: 'authority', value: 10 },
                        { type: 'metricChange', metric: 'publicOpinion', value: -10 },
                        { type: 'metricChange', metric: 'integrity', value: -5 }, // Severity of inquisition can affect integrity
                        { type: 'factionChange', faction: 'monasticOrders', value: 10 }
                    ]
                },
                {
                    text: 'Send a mission of learned theologians to debate and persuade.',
                    effects: [
                        { type: 'metricChange', metric: 'piety', value: -5 },
                        { type: 'metricChange', metric: 'authority', value: -5 },
                        { type: 'metricChange', metric: 'integrity', value: 10 },
                        { type: 'factionChange', faction: 'monasticOrders', value: -5 },
                        { type: 'metricChange', metric: 'gold', value: -15 }
                    ]
                }
            ]
        },
        {
            id: 'noble_feud',
            title: 'A Princely Feud',
            content: 'Two powerful Italian princely families are embroiled in a violent feud, disrupting trade and pilgrimage routes.',
            source: advisors.cardinalSecretary.name,
            options: [
                {
                    text: 'Intervene forcefully, threatening excommunication.',
                    effects: [
                        { type: 'metricChange', metric: 'authority', value: 15 },
                        { type: 'factionChange', faction: 'nobility', value: -10 },
                        { type: 'metricChange', metric: 'publicOpinion', value: -5 },
                        {
                            type: 'conditionalEffect',
                            condition: { metric: 'authority', min: 70 },
                            effects: [
                                { type: 'metricChange', metric: 'gold', value: 20 },
                                { type: 'factionChange', faction: 'nobility', value: 15 } // They respect strong hand
                            ]
                        }
                    ]
                },
                {
                    text: 'Offer to mediate a peaceful resolution.',
                    effects: [
                        { type: 'metricChange', metric: 'integrity', value: 10 },
                        { type: 'metricChange', metric: 'cardinalFavor', value: 5 },
                        { type: 'metricChange', metric: 'gold', value: -5 },
                        { type: 'factionChange', faction: 'nobility', value: 10 },
                        {
                            type: 'conditionalEffect',
                            condition: { metric: 'integrity', max: 40 },
                            effects: [
                                { type: 'factionChange', faction: 'nobility', value: -20 }, // Seen as weakness
                                { type: 'metricChange', metric: 'authority', value: -10 }
                            ]
                        }
                    ]
                }
            ]
        },


        // Recurring Events (triggered by dailyChecks via queue)
        {
            id: 'monthly_treasury_report',
            title: 'Monthly Treasury Report',
            content: 'A report on the papal finances for the past month. Your income varies with public opinion and overall prosperity.',
            source: 'Papal Accountant',
            options: [
                {
                    text: 'Acknowledge the report.',
                    effects: [
                        { type: 'metricChange', metric: 'gold', value: Math.floor(gameMetrics.publicOpinion / 10) + 5 }
                    ]
                }
            ]
        },
        {
            id: 'annual_pilgrimage_season',
            title: 'Annual Pilgrimage Season',
            content: 'The season of grand pilgrimages draws to a close. Thousands have flocked to Rome and other holy sites.',
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

        // Random Events (now pulled from randomEvents list, not directly from 'events' array)
        // These are just placeholder definitions here; the actual randomEvents array holds their IDs and weights.
        {
            id: 'plague_outbreak',
            title: 'Plague Outbreak!',
            content: 'A virulent plague sweeps through a prominent city. What is your response?',
            source: 'Courier from the North',
            options: [
                { text: 'Order prayers and offer spiritual guidance.', effects: [{ type: 'metricChange', metric: 'piety', value: 15 }, { type: 'metricChange', metric: 'publicOpinion', value: -15 }, { type: 'metricChange', metric: 'gold', value: -5 }] },
                { text: 'Send papal doctors and allocate funds for quarantines.', effects: [{ type: 'metricChange', metric: 'publicOpinion', value: 10 }, { type: 'metricChange', metric: 'gold', value: -20 }, { type: 'metricChange', metric: 'piety', value: -5 }] }
            ]
        },
        {
            id: 'noble_dispute_arbitration',
            title: 'Noble Dispute Requires Arbitration',
            content: 'Two powerful noble families are embroiled in a bitter land dispute. They appeal to your authority to mediate.',
            source: 'Conflicting Envoys',
            options: [
                { text: 'Meditate and issue a Papal ruling, favoring one side slightly.', effects: [{ type: 'metricChange', metric: 'authority', value: 10 }, { type: 'factionChange', faction: 'nobility', value: 5 }, { type: 'metricChange', metric: 'cardinalFavor', value: -5 }] },
                { text: 'Decline to intervene, citing secular matters.', effects: [{ type: 'metricChange', metric: 'authority', value: -5 }, { type: 'factionChange', faction: 'nobility', value: -10 }] }
            ]
        },
        {
            id: 'heretical_preacher_sighted',
            title: 'Heretical Preacher Sighted!',
            content: 'Reports indicate a charismatic preacher is gaining followers in a remote province, spreading doctrines contrary to Papal teaching.',
            source: 'Local Bishop',
            options: [
                { text: 'Dispatch an Inquisition to suppress the heresy.', effects: [{ type: 'metricChange', metric: 'piety', value: 15 }, { type: 'metricChange', metric: 'publicOpinion', value: -10 }, { type: 'factionChange', faction: 'monasticOrders', value: 10 }] },
                { text: 'Send a conciliatory envoy to understand their grievances.', effects: [{ type: 'metricChange', metric: 'piety', value: -5 }, { type: 'metricChange', metric: 'authority', value: -5 }, { type: 'metricChange', metric: 'publicOpinion', value: 5 }] }
            ]
        },

        // Game Ending / Triumph Events (now just definitions, loading handled by queue)
        { id: 'game_over_heresy', title: 'The Papacy Fractures! A Schism of Faith', content: 'Your pious neglect or controversial doctrine has sown deep seeds of heresy. The faithful abandon Rome, and the Church falls into irreparable schism. Your legacy is one of failure.', source: 'The Annals of History', options: [{ text: 'Start Over', effects: [{ type: 'resetGame' }] }] },
        { id: 'game_over_tyranny', title: 'The Tyrant Pope! Public Uprising', content: 'Your relentless pursuit of power and neglect of the common folk has led to widespread revolt. The people rise up, storming the Vatican and deposing you by force. Your reign ends in chaos.', source: 'The Streets of Rome', options: [{ text: 'Start Over', effects: [{ type: 'resetGame' }] }] },
        { id: 'game_over_impoverished', title: 'The Bankrupt See! Ruin of Rome', content: 'Years of mismanagement and costly ventures have drained the papal coffers. With no funds, your authority crumbles, and hostile powers seize control of Rome. The Holy See is ruined.', source: 'Papal Treasury Records', options: [{ text: 'Start Over', effects: [{ type: 'resetGame' }] }] },
        { id: 'game_over_deposed_cardinals', title: 'Deposed! A Cardinal Conspiracy', content: 'Your constant disregard for the College of Cardinals has led to a secret plot. They have unanimously voted for your deposition, backed by powerful secular rulers. Your authority crumbles.', source: 'The Conclave Transcripts', options: [{ text: 'Start Over', effects: [{ type: 'resetGame' }] }] },
        { id: 'game_over_imperial_control', title: 'Puppet of the Emperor! Loss of Autonomy', content: 'Your excessive reliance on the Emperor has left the Papacy utterly subservient to his will. The Holy See is no longer an independent power, but merely a tool of the Empire. Your spiritual authority is lost.', source: 'Imperial Edicts', options: [{ text: 'Start Over', effects: [{ type: 'resetGame' }] }] },
        { id: 'game_over_noble_revolt', title: 'Noble Wars! Christendom Fractured', content: 'Your inability to manage the nobility has plunged Europe into endless feudal warfare. The Papacy, unable to exert influence, is powerless amidst the chaos. Your reign is a period of strife.', source: 'Chronicles of Conflict', options: [{ text: 'Start Over', effects: [{ type: 'resetGame' }] }] },
        { id: 'game_over_corrupt', title: 'The Corrupt See! Loss of Moral Authority', content: 'Your reign has been marked by venality and moral compromise. The faithful have lost all trust in the Papacy, and your spiritual authority is irrevocably broken. The Church faces utter moral decay.', source: 'The Cries of the Faithful', options: [{ text: 'Start Over', effects: [{ type: 'resetGame' }] }] },

        // Triumph conditions (now just flags, not game enders until final evaluation)
        { id: 'triumph_divine_mandate', title: 'An Age of Unwavering Faith Achieved!', content: 'Your piety has inspired Christendom to a new golden age of faith. This achievement will be noted in your final evaluation.', source: 'Divine Providence', options: [{ text: 'Acknowledge this blessing', effects: [] }] },
        { id: 'triumph_absolute_authority', title: 'Papal Hegemony Achieved!', content: 'Through masterful politics, the Holy See has become the undisputed temporal and spiritual power. Kings and Emperors bow to your will. This achievement will be noted in your final evaluation.', source: 'The Throne Room', options: [{ text: 'Relish in your power', effects: [] }] },

        // NEW: Final Game Evaluation Event
        {
            id: 'final_evaluation',
            title: 'Your Pontificate Concludes!',
            content: 'Your time as Supreme Pontiff has come to an end. The legacy you leave behind will shape the Church for centuries. Let us review your reign...',
            source: 'The Hand of History',
            options: [
                {
                    text: 'Review your legacy.',
                    effects: [
                        // This effect will be handled by a function that generates a summary
                        { type: 'displayFinalSummary' }
                    ]
                }
            ]
        },
        // Fallback for when no other events are eligible (should be rare with queue)
        {
            id: 'idle_day',
            title: 'A Quiet Day in Rome',
            content: 'The day passes quietly. No urgent matters demand your immediate attention.',
            source: 'Your Chambers',
            options: [{ text: 'Continue your peaceful contemplation.', effects: [] }]
        }
    ];

    // Random Events Array (separate for easier management of probabilities)
    const randomEvents = [
        { id: 'plague_outbreak', weight: 3, requiredMetrics: { metric: 'publicOpinion', min: 20 } },
        { id: 'noble_dispute_arbitration', weight: 2, requiredFactionFavor: { faction: 'nobility', minFavor: 40 } },
        { id: 'heretical_preacher_sighted', weight: 4, requiredMetrics: { metric: 'piety', min: 30 } },
        { id: 'indulgences_proposal', weight: 1, requiredMetrics: { metric: 'gold', max: 50 }, forbiddenFlags: ['jubilee_initiated'] }, // Only if gold is low, and not during Jubilee
        { id: 'poor_relief_plea', weight: 2, requiredMetrics: { metric: 'publicOpinion', max: 70 } },
        { id: 'heresy_inquisition', weight: 2, requiredMetrics: { metric: 'piety', min: 40, max: 80 } }, // Moderate piety for heresy to be a concern
        { id: 'noble_feud', weight: 2, requiredFactionFavor: { faction: 'nobility', minFavor: 20, maxFavor: 80 } }
    ];


    // --- Helper Functions ---

    function findEventById(eventId) {
        return events.find(event => event.id === eventId);
    }

    function isEventEligible(event) {
        if (event.requiredFlags) { for (const flag of event.requiredFlags) { if (!gameFlags[flag]) return false; } }
        if (event.forbiddenFlags) { for (const flag of event.forbiddenFlags) { if (gameFlags[flag]) return false; } }
        if (event.requiredFactionFavor) {
            const faction = gameFactions[event.requiredFactionFavor.faction];
            if (!faction || faction.favor < event.requiredFactionFavor.minFavor || (event.requiredFactionFavor.maxFavor !== undefined && faction.favor > event.requiredFactionFavor.maxFavor)) return false;
        }
        if (event.requiredMetrics) {
            const metricValue = gameMetrics[event.requiredMetrics.metric];
            if (metricValue === undefined || metricValue < event.requiredMetrics.min || (event.requiredMetrics.max !== undefined && metricValue > event.requiredMetrics.max)) return false;
        }
        if (event.requiredBuildings) {
            const building = gameBuildings[event.requiredBuildings.buildingId];
            if (!building || building.status !== event.requiredBuildings.status) return false;
        }
        return true;
    }

    function updateMetric(metricName, value) {
        if (metricName === 'gold' && typeof value === 'string' && value.includes('gameMetrics.publicOpinion')) {
            const calculatedValue = Math.floor(gameMetrics.publicOpinion / 10) + 5;
            gameMetrics[metricName] = Math.max(0, Math.min(100, gameMetrics[metricName] + calculatedValue));
            console.log(`Gold changed dynamically by: ${calculatedValue}`);
        } else {
            gameMetrics[metricName] = Math.max(0, Math.min(100, gameMetrics[metricName] + value));
        }

        const metricElement = document.getElementById(`metric-${metricName}`);
        if (metricElement) {
            metricElement.textContent = gameMetrics[metricName];
            const changeClass = value > 0 ? 'metric-change-positive' : 'metric-change-negative';
            metricElement.classList.add(changeClass);
            setTimeout(() => {
                metricElement.classList.remove(changeClass);
            }, 800);
        }
    }

    function updateFactionFavor(factionName, value) {
        if (gameFactions[factionName]) {
            gameFactions[factionName].favor = Math.max(0, Math.min(100, gameFactions[factionName].favor + value));
            console.log(`${gameFactions[factionName].name} Favor: ${gameFactions[factionName].favor} (Changed by ${value})`);
        } else {
            console.warn(`Attempted to change favor for unknown faction: ${factionName}`);
        }
    }

    function startConstruction(buildingId) {
        const building = gameBuildings[buildingId];
        if (!building || building.status !== 'none') {
            console.warn(`Cannot start construction for ${buildingId}. Status is ${building ? building.status : 'undefined'}.`);
            return;
        }

        let canAfford = true;
        for (const metricCost in building.baseCost) {
            if (gameMetrics[metricCost] < building.baseCost[metricCost]) {
                canAfford = false;
                console.warn(`Not enough ${metricCost} to build ${buildingId}. Required: ${building.baseCost[metricCost]}, Have: ${gameMetrics[metricCost]}`);
                return;
            }
        }

        if (canAfford) {
            for (const metricCost in building.baseCost) {
                updateMetric(metricCost, -building.baseCost[metricCost]);
            }
            building.status = 'under_construction';
            building.daysRemaining = building.baseDaysToBuild;
            console.log(`Construction started for ${buildingId}! Days remaining: ${building.daysRemaining}`);
        }
    }

    function updateAllMetricsDisplay() {
        metricPiety.textContent = gameMetrics.piety;
        metricAuthority.textContent = gameMetrics.authority;
        metricGold.textContent = gameMetrics.gold;
        metricPublicOpinion.textContent = gameMetrics.publicOpinion;
        metricCardinalFavor.textContent = gameMetrics.cardinalFavor;
        metricIntegrity.textContent = gameMetrics.integrity;
    }

    // NEW: Function to display an event. No longer directly called from choice effects.
    function displayEvent(event) {
        documentArea.classList.remove('show');
        setTimeout(() => {
            documentTitle.textContent = event.title;
            documentContent.textContent = event.content;
            documentSource.textContent = `- ${event.source}`;
            optionsContainer.innerHTML = '';

            event.options.forEach((option) => {
                const button = document.createElement('button');
                button.classList.add('option-button');
                button.textContent = option.text;
                button.addEventListener('click', () => applyChoice(option));
                optionsContainer.appendChild(button);
            });
            documentArea.classList.add('show');
        }, 300);
    }

    function selectRandomEvent() {
        const eligibleRandomEvents = randomEvents.filter(re => {
            const eventData = findEventById(re.id);
            return eventData && isEventEligible(eventData);
        });

        if (eligibleRandomEvents.length === 0) {
            return null;
        }

        const totalWeight = eligibleRandomEvents.reduce((sum, re) => sum + re.weight, 0);
        let randomNum = Math.random() * totalWeight;

        for (const re of eligibleRandomEvents) {
            randomNum -= re.weight;
            if (randomNum <= 0) {
                return findEventById(re.id);
            }
        }
        return null;
    }

    // NEW: Check game status and add relevant events to the queue
    function checkGameStatusAndQueueEvents() {
        if (hasGameEnded) return;

        // --- Game Over Conditions (Highest Priority) ---
        // Push game over events to queue, then set hasGameEnded. The queue will load it.
        if (gameMetrics.piety <= 0) { gameEventQueue.push({ eventId: 'game_over_heresy', priority: 100 }); hasGameEnded = true; return; }
        if (gameMetrics.publicOpinion <= 0) { gameEventQueue.push({ eventId: 'game_over_tyranny', priority: 100 }); hasGameEnded = true; return; }
        if (gameMetrics.gold <= 0) { gameEventQueue.push({ eventId: 'game_over_impoverished', priority: 100 }); hasGameEnded = true; return; }
        if (gameMetrics.cardinalFavor <= 0) { gameEventQueue.push({ eventId: 'game_over_deposed_cardinals', priority: 100 }); hasGameEnded = true; return; }
        if (gameFactions.imperial.favor <= 0) { gameEventQueue.push({ eventId: 'game_over_imperial_control', priority: 100 }); hasGameEnded = true; return; }
        if (gameFactions.nobility.favor <= 0) { gameEventQueue.push({ eventId: 'game_over_noble_revolt', priority: 100 }); hasGameEnded = true; return; }
        if (gameMetrics.integrity <= 0) { gameEventQueue.push({ eventId: 'game_over_corrupt', priority: 100 }); hasGameEnded = true; return; }


        // --- Triumph/High Metric Conditions (High Priority, but not ending the game immediately) ---
        if (gameMetrics.piety >= 95 && !gameFlags.triumph_divine_mandate_achieved) {
            gameFlags.triumph_divine_mandate_achieved = true;
            gameEventQueue.push({ eventId: 'triumph_divine_mandate', priority: 95 }); // High priority
        }
        if (gameMetrics.authority >= 95 && !gameFlags.triumph_absolute_authority_achieved) {
            gameFlags.triumph_absolute_authority_achieved = true;
            gameEventQueue.push({ eventId: 'triumph_absolute_authority', priority: 95 }); // High priority
        }
    }

    // NEW: Checks and updates progress for buildings under construction.
    function checkBuildingProgressAndQueueEvents() {
        for (const buildingId in gameBuildings) {
            const building = gameBuildings[buildingId];
            if (building.status === 'under_construction') {
                building.daysRemaining--;
                console.log(`${buildingId} construction: ${building.daysRemaining} days left.`);

                if (building.daysRemaining <= 0) {
                    building.status = 'completed';
                    building.level = 1;
                    console.log(`${buildingId} construction completed!`);
                    if (building.completionEventId) {
                        gameEventQueue.push({ eventId: building.completionEventId, priority: 80 }); // Add to queue
                    }
                }
            }
        }
    }

    // NEW: Applies passive bonuses from completed buildings.
    function applyPassiveBonuses() {
        for (const buildingId in gameBuildings) {
            const building = gameBuildings[buildingId];
            if (building.status === 'completed' && building.passiveBonuses) {
                for (const metric in building.passiveBonuses) {
                    const bonusValue = building.passiveBonuses[metric];
                    updateMetric(metric, bonusValue);
                    // console.log(`Applied passive bonus from ${buildingId}: +${bonusValue} ${metric}`); // Too chatty
                }
            }
        }
    }

    // NEW: Checks and queues any events that have been scheduled for a future day.
    function checkDelayedEventsAndQueue() {
        // Filter out events that are no longer pending
        const stillPendingDelayedEvents = [];
        for (const delayed of gameEventQueue) {
            if (delayed.type === 'delayed' && gameDay >= delayed.triggerDay) {
                // This event is ready to trigger, push it to main queue
                gameEventQueue.push({ eventId: delayed.eventId, priority: 90 });
            } else {
                stillPendingDelayedEvents.push(delayed);
            }
        }
        // Replace delayedEvents with only those still pending
        gameEventQueue = stillPendingDelayedEvents;
    }


    // NEW: Main daily game loop logic - adds events to queue
    function dailyChecksAndQueueEvents() {
        // High priority system events
        checkGameStatusAndQueueEvents(); // Checks for Game Over / Triumph
        checkBuildingProgressAndQueueEvents(); // Checks for building completions
        checkDelayedEventsAndQueue(); // Checks for specific scheduled events

        // Apply passive bonuses (always happen)
        applyPassiveBonuses();

        // Recurring Events
        if (gameDay % 30 === 0 && gameDay > 0) {
            const recurringEvent = findEventById('monthly_treasury_report');
            if (recurringEvent && isEventEligible(recurringEvent)) {
                gameEventQueue.push({ eventId: recurringEvent.id, priority: 70 });
            }
        }
        if (gameDay % 100 === 0 && gameDay > 0) {
             const recurringEvent = findEventById('annual_pilgrimage_season');
             if (recurringEvent && isEventEligible(recurringEvent)) {
                 gameEventQueue.push({ eventId: recurringEvent.id, priority: 70 });
             }
         }

        // Random Events (lower priority)
        if (Math.random() < 0.2) { // 20% chance each day for a random event
            const randomEvent = selectRandomEvent();
            if (randomEvent) {
                gameEventQueue.push({ eventId: randomEvent.id, priority: 40 });
            }
        }

        // Check if MAX_GAME_DAYS reached (triggers final evaluation)
        if (gameDay >= MAX_GAME_DAYS && !hasGameEnded) {
            gameEventQueue.push({ eventId: 'final_evaluation', priority: 100 });
            hasGameEnded = true; // Mark as ended to prevent further events
        }
    }

    // NEW: Function to load the next event from the queue
    function loadNextEventFromQueue() {
        if (gameEventQueue.length === 0) {
            // If nothing else to do, try to advance main story or load idle day
            const nextMainEvent = events[mainStoryEventIndex];
            if (nextMainEvent && isEventEligible(nextMainEvent) && !nextMainEvent.id.startsWith('game_over_') && !nextMainEvent.id.startsWith('triumph_')) {
                // Ensure we don't load special events from linear flow
                const specialEventIds = ['monthly_treasury_report', 'annual_pilgrimage_season', 'st_peters_completed', 'papal_library_completed', 'jubilee_outcome', 'final_evaluation', ...randomEvents.map(re => re.id)];
                if (!specialEventIds.includes(nextMainEvent.id)) {
                    displayEvent(nextMainEvent);
                    return;
                }
            }
            // Fallback to idle day if no other event is pending or eligible
            displayEvent(findEventById('idle_day'));
            return;
        }

        // Sort queue by priority (descending)
        gameEventQueue.sort((a, b) => b.priority - a.priority);

        // Get the highest priority event
        const nextQueuedEvent = gameEventQueue.shift(); // .shift() removes from array

        const eventToLoad = findEventById(nextQueuedEvent.eventId);

        if (eventToLoad && isEventEligible(eventToLoad)) {
            displayEvent(eventToLoad);
        } else {
            console.warn(`Queued event '${nextQueuedEvent.eventId}' (Priority: ${nextQueuedEvent.priority}) is not eligible or not found. Skipping.`);
            loadNextEventFromQueue(); // Try to load the next one
        }
    }

    // NEW: Function to display the final summary
    function displayFinalSummary() {
        documentArea.classList.remove('show');
        setTimeout(() => {
            documentTitle.textContent = 'Your Pontificate: A Historical Review';
            let summaryContent = '<p>You have concluded your reign as Supreme Pontiff. Your actions have shaped the destiny of the Holy See and Christendom. Here is your legacy:</p>';

            summaryContent += '<h3>Final Metrics:</h3>';
            summaryContent += `<ul>
                <li>Piety: ${gameMetrics.piety}</li>
                <li>Authority: ${gameMetrics.authority}</li>
                <li>Gold: ${gameMetrics.gold}</li>
                <li>Public Opinion: ${gameMetrics.publicOpinion}</li>
                <li>Cardinal Favor: ${gameMetrics.cardinalFavor}</li>
                <li>Integrity: ${gameMetrics.integrity}</li>
            </ul>`;

            summaryContent += '<h3>Key Achievements:</h3><ul>';
            if (gameFlags.triumph_divine_mandate_achieved) summaryContent += '<li>**Divine Mandate:** You inspired an age of unwavering faith!</li>';
            if (gameFlags.triumph_absolute_authority_achieved) summaryContent += '<li>**Absolute Authority:** The Papacy\'s power became unquestioned!</li>';
            if (gameFlags.crusade_launched && gameFlags.crusade_report_received) summaryContent += '<li>**Holy Crusade:** You answered the call to arms for the Holy Land.</li>';
            if (gameFlags.papal_bull_issued) summaryContent += '<li>**Papal Bull:** You decisively shaped theological doctrine.</li>';
            if (gameFlags.jubilee_initiated) summaryContent += '<li>**Grand Jubilee:** You brought pilgrims and blessings to Rome.</li>';
            if (gameBuildings.st_peters_basilica_reconstruction.status === 'completed') summaryContent += '<li>**St. Peter\'s Basilica:** You oversaw the reconstruction of the holiest church!</li>';
            if (gameBuildings.papal_library.status === 'completed') summaryContent += '<li>**Papal Library:** You fostered knowledge and intellectual pursuit.</li>';

            if (!gameFlags.triumph_divine_mandate_achieved && !gameFlags.triumph_absolute_authority_achieved) {
                summaryContent += '<li>No major triumphs achieved.</li>';
            }
            summaryContent += '</ul>';

            // Add narrative based on overall metrics/flags (simple example)
            summaryContent += '<h3>Historical Assessment:</h3>';
            if (gameMetrics.integrity > 70 && gameMetrics.piety > 70) {
                summaryContent += '<p>Your reign is remembered as a beacon of **moral purity and divine inspiration**, guiding the Church through turbulent times with unwavering faith.</p>';
            } else if (gameMetrics.authority > 70 && gameMetrics.gold > 70) {
                summaryContent += '<p>You were a **masterful temporal ruler**, solidifying the Papacy\'s power and wealth, though some questioned your methods.</p>';
            } else if (gameMetrics.publicOpinion > 70 && gameMetrics.cardinalFavor > 70) {
                summaryContent += '<p>You were a **beloved and diplomatic pontiff**, skilled at maintaining harmony within the Church and among the faithful.</p>';
            } else {
                summaryContent += '<p>Your pontificate was marked by complex challenges. History\'s judgment is yet to be fully cast on your complex legacy.</p>';
            }

            documentContent.innerHTML = summaryContent; // Use innerHTML for rich text
            documentSource.textContent = '— The Judgment of History';
            optionsContainer.innerHTML = '<button class="option-button" id="start-new-game-button">Begin a New Pontificate</button>';
            document.getElementById('start-new-game-button').addEventListener('click', initGame);

            documentArea.classList.add('show');
        }, 300);
    }


    /**
     * Applies the effects of a chosen option and proceeds to the next day/event.
     * @param {object} chosenOption The option object that was clicked.
     */
    function applyChoice(chosenOption) {
        // Apply all effects defined for the chosen option
        chosenOption.effects.forEach(effect => {
            if (effect.type === 'metricChange') {
                updateMetric(effect.metric, effect.value);
            } else if (effect.type === 'scheduleNextMainEvent') { // NEW: Schedule next main story event
                // If overrideEventId is provided, use that, otherwise increment mainStoryEventIndex
                const targetEventId = effect.overrideEventId || events[mainStoryEventIndex + 1]?.id;
                if (targetEventId) {
                    const eventData = findEventById(targetEventId);
                    if (eventData) {
                        // Ensure we don't double-add if it's already in queue
                        const isAlreadyQueued = gameEventQueue.some(item => item.eventId === targetEventId && item.priority === 50);
                        if (!isAlreadyQueued) {
                            gameEventQueue.push({ eventId: targetEventId, priority: 50 });
                            console.log(`Scheduled next main event: ${targetEventId}`);
                            // Only increment if we actually added the 'next' one, not an override
                            if (!effect.overrideEventId) {
                                mainStoryEventIndex++;
                            }
                        }
                    } else {
                        console.warn(`Event ID '${targetEventId}' for 'scheduleNextMainEvent' not found.`);
                    }
                }
            } else if (effect.type === 'setFlag') {
                gameFlags[effect.flag] = effect.value;
                console.log(`Flag '${effect.flag}' set to ${effect.value}`);
            } else if (effect.type === 'factionChange') {
                updateFactionFavor(effect.faction, effect.value);
            } else if (effect.type === 'startConstruction') {
                startConstruction(effect.buildingId);
            } else if (effect.type === 'delayEvent') {
                // Add delayed event to the queue with a 'delayed' type for specific handling
                gameEventQueue.push({ eventId: effect.eventId, priority: 90, type: 'delayed', triggerDay: gameDay + effect.days });
                console.log(`Event '${effect.eventId}' scheduled for Day ${gameDay + effect.days}`);
            } else if (effect.type === 'conditionalEffect') {
                const conditionMet = (() => {
                    const cond = effect.condition;
                    if (cond.metric) {
                        const val = gameMetrics[cond.metric];
                        if (val === undefined) return false;
                        if (cond.min !== undefined && val < cond.min) return false;
                        if (cond.max !== undefined && val > cond.max) return false;
                    }
                    return true;
                })();

                if (conditionMet) {
                    console.log(`Conditional effect condition met: ${JSON.stringify(effect.condition)}. Applying sub-effects...`);
                    effect.effects.forEach(subEffect => {
                        if (subEffect.type === 'metricChange') {
                            updateMetric(subEffect.metric, subEffect.value);
                        } else if (subEffect.type === 'factionChange') {
                            updateFactionFavor(subEffect.faction, subEffect.value);
                        }
                    });
                } else {
                    console.log(`Conditional effect condition NOT met: ${JSON.stringify(effect.condition)}. Skipping sub-effects.`);
                }
            } else if (effect.type === 'resetGame') {
                initGame();
                return;
            } else if (effect.type === 'displayFinalSummary') { // NEW: Handle final summary display
                displayFinalSummary();
                return; // Stop further processing after showing summary
            }
        });

        // If a game reset was triggered or final summary is shown, we're done here
        if (chosenOption.effects.some(e => e.type === 'resetGame' || e.type === 'displayFinalSummary')) {
            return;
        }

        // Advance game day
        gameDay++;
        gameDayCounter.textContent = gameDay;

        // Perform all daily checks and populate the event queue
        dailyChecksAndQueueEvents();

        // Load the next event from the queue
        loadNextEventFromQueue();
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
        gameMetrics.piety = 50;
        gameMetrics.authority = 50;
        gameMetrics.gold = 100;
        gameMetrics.publicOpinion = 50;
        gameMetrics.cardinalFavor = 50;
        gameMetrics.integrity = 50;

        for (const flag in gameFlags) {
            gameFlags[flag] = false;
        }

        for (const factionKey in gameFactions) {
            gameFactions[factionKey].favor = 50;
        }

        for (const buildingId in gameBuildings) {
            const building = gameBuildings[buildingId];
            building.level = 0;
            building.status = 'none';
            building.daysRemaining = 0;
        }

        gameEventQueue = []; // Clear any pending events in the queue
        mainStoryEventIndex = 0; // Reset main story index
        gameDay = 1;
        gameDayCounter.textContent = gameDay;
        hasGameEnded = false;

        updateAllMetricsDisplay();
        displayEvent(findEventById('start_game')); // Load the very first event to start the game
    }

    initGame(); // Call to start the game when the DOM is ready
});
