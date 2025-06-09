document.addEventListener('DOMContentLoaded', () => {
    // --- Game State Variables ---
    const gameMetrics = {
        piety: 50,         // Spiritual devotion, faith of the Church
        authority: 50,     // Temporal power, influence over secular rulers
        gold: 100,         // Financial resources of the Papacy
        publicOpinion: 50, // Favor of the common people
        cardinalFavor: 50, // Influence with the College of Cardinals
        integrity: 50,     // Moral standing, virtue vs. corruption
        divineFavor: 50,   // God's direct blessing/displeasure
        sin: 0,            // Hidden accumulated sin from corrupt actions
        influence: 50,     // NEW: Political capital, ability to sway powerful figures
        culture: 50,       // NEW: Intellectual & artistic capital
    };
    let gameDay = 1;
    let hasGameEnded = false;

    const MAX_GAME_DAYS = 1460; // Approximately 4 years (365 * 4) for a more substantial game

    // Game Flags - tracks specific conditions or outcomes of choices
    const gameFlags = {
        imperial_alliance_established: false,
        crusade_launched: false,
        papal_bull_issued: false,
        crusade_report_received: false,
        jubilee_initiated: false,
        triumph_divine_mandate_achieved: false,
        triumph_absolute_authority_achieved: false,
        // NEW Policy Flags (active if true)
        policy_centralized_power: false,
        policy_promote_education: false,
        policy_active_inquisition: false,
        policy_patronage_of_arts: false,
        policy_open_door_diplomacy: false,
        // NEW Doctrine Flags
        doctrine_papal_infallibility_affirmed: false,
        doctrine_simony_banned: false,
        // NEW Major Event Flags
        great_schism_resolved: false,
        reformation_begun: false, // Could be a major game over/transformation
    };

    // Game Factions - tracks favor with different powerful groups
    const gameFactions = {
        // Internal Curial Factions
        cardinals: { id: 'cardinals', name: 'The College of Cardinals', favor: 50, power_base: 60, desiredMetrics: { cardinalFavor: 70, authority: 60 }, desiredFlags: [], type: 'internal' },
        romanBarons: { id: 'romanBarons', name: 'The Roman Barons', favor: 50, power_base: 40, desiredMetrics: { gold: 60, publicOpinion: 40 }, desiredFlags: [], type: 'internal' },
        commonPeople: { id: 'commonPeople', name: 'The Common People', favor: 50, power_base: 30, desiredMetrics: { publicOpinion: 70, piety: 60 }, desiredFlags: [], type: 'internal' },
        monasticOrders: { id: 'monasticOrders', name: 'The Monastic Orders', favor: 50, power_base: 50, desiredMetrics: { piety: 70, integrity: 80 }, desiredFlags: [], type: 'internal' },
        curialTraditionalists: { id: 'curialTraditionalists', name: 'Curial Traditionalists', favor: 50, power_base: 55, desiredMetrics: { piety: 75, integrity: 30, authority: 60 }, desiredFlags: ['policy_active_inquisition'], type: 'internal' }, // NEW
        youngReformers: { id: 'youngReformers', name: 'Young Reformers', favor: 50, power_base: 45, desiredMetrics: { integrity: 80, piety: 60, publicOpinion: 70 }, desiredFlags: ['doctrine_simony_banned'], type: 'internal' }, // NEW
        nepotists: { id: 'nepotists', name: 'The Nepotists', favor: 50, power_base: 35, desiredMetrics: { gold: 70, influence: 60 }, desiredFlags: [], type: 'internal' }, // NEW

        // External European Powers
        france: { id: 'france', name: 'The Kingdom of France', favor: 50, attitude: 'neutral', strength: 70, desiredMetrics: { authority: 50, gold: 40 }, desiredFlags: [], type: 'external' },
        hre: { id: 'hre', name: 'The Holy Roman Empire', favor: 50, attitude: 'neutral', strength: 80, desiredMetrics: { authority: 70, piety: 50 }, desiredFlags: ['imperial_alliance_established'], type: 'external' },
        spain: { id: 'spain', name: 'The Kingdom of Spain', favor: 50, attitude: 'neutral', strength: 65, desiredMetrics: { piety: 60, integrity: 50 }, desiredFlags: [], type: 'external' }, // NEW
        england: { id: 'england', name: 'The Kingdom of England', favor: 50, attitude: 'neutral', strength: 60, desiredMetrics: { authority: 50, gold: 50 }, desiredFlags: [], type: 'external' }, // NEW
        ottomans: { id: 'ottomans', name: 'The Ottoman Empire', favor: 0, attitude: 'hostile', strength: 90, desiredMetrics: {}, desiredFlags: [], type: 'external' }, // NEW (always hostile)
    };

    // Game Buildings - tracks status, level, and properties of various constructions
    const gameBuildings = {
        st_peters_basilica_reconstruction: {
            level: 0, status: 'none', daysRemaining: 0,
            baseCost: { gold: 150, piety: 50, authority: 30 },
            baseDaysToBuild: 60,
            passiveBonuses: { piety: 2, publicOpinion: 1 },
            completionEventId: 'st_peters_completed'
        },
        papal_library: {
            level: 0, status: 'none', daysRemaining: 0,
            baseCost: { gold: 80, cardinalFavor: 20 },
            baseDaysToBuild: 40,
            passiveBonuses: { cardinalFavor: 1, authority: 1, culture: 1 }, // NEW: culture bonus
            completionEventId: 'papal_library_completed'
        },
        hospice_of_st_lazarus: {
            level: 0, status: 'none', daysRemaining: 0,
            baseCost: { gold: 50, piety: 20 },
            baseDaysToBuild: 30,
            passiveBonuses: { publicOpinion: 2, integrity: 1 },
            completionEventId: 'hospice_completed'
        },
        // NEW: University of Rome
        university_of_rome: {
            level: 0, status: 'none', daysRemaining: 0,
            baseCost: { gold: 120, culture: 40, influence: 20 }, // NEW: Culture & Influence cost
            baseDaysToBuild: 75,
            passiveBonuses: { culture: 3, cardinalFavor: 1 },
            completionEventId: 'university_completed'
        },
        // NEW: Vatican Gardens
        vatican_gardens: {
            level: 0, status: 'none', daysRemaining: 0,
            baseCost: { gold: 70, publicOpinion: 10 },
            baseDaysToBuild: 35,
            passiveBonuses: { publicOpinion: 1, integrity: 0.5 },
            completionEventId: 'vatican_gardens_completed'
        }
    };

    // Advisors system
    const advisors = {
        cardinalValerius: {
            id: 'cardinalValerius', name: "Cardinal Valerius",
            stats: { wisdom: 80, intrigue: 30, diplomacy: 70, piety: 60, finance: 50, military: 20, loyalty: 90, ambition: 40 }, // NEW: More stats
            traits: ['loyal', 'wise', 'diplomat'], // NEW: Traits
            currentOffice: 'papal_secretary_of_state', // NEW: Assigned office
            isAvailable: true // Could be false if they die or are dismissed
        },
        brotherThomas: {
            id: 'brotherThomas', name: "Brother Thomas",
            stats: { wisdom: 50, intrigue: 60, diplomacy: 30, piety: 90, finance: 10, military: 70, loyalty: 85, ambition: 30 },
            traits: ['zealous', 'stern', 'inquisitor'],
            currentOffice: 'inquisitor_general',
            isAvailable: true
        },
        monsignorBattista: {
            id: 'monsignorBattista', name: "Monsignor Battista",
            stats: { wisdom: 70, intrigue: 80, diplomacy: 60, piety: 50, finance: 60, military: 30, loyalty: 65, ambition: 70 },
            traits: ['scheming', 'ambitious', 'well_connected'],
            currentOffice: 'prefect_of_apostolic_camera', // NEW: Assigned office
            isAvailable: true
        },
        // NEW Advisors
        cardinalBenedict: {
            id: 'cardinalBenedict', name: "Cardinal Benedict",
            stats: { wisdom: 75, intrigue: 50, diplomacy: 70, piety: 80, finance: 40, military: 25, loyalty: 70, ambition: 55 },
            traits: ['pious', 'scholar', 'traditionalist'],
            currentOffice: '',
            isAvailable: true,
            isFamily: false // Can be flagged if nepotism path
        },
        captainGiovanni: {
            id: 'captainGiovanni', name: "Captain Giovanni",
            stats: { wisdom: 40, intrigue: 50, diplomacy: 20, piety: 30, finance: 20, military: 85, loyalty: 80, ambition: 60 },
            traits: ['aggressive', 'military_strategist'],
            currentOffice: '',
            isAvailable: true,
            isFamily: false
        }
    };

    // NEW: Curial Offices and their bonuses
    const curialOffices = {
        'papal_secretary_of_state': {
            name: 'Papal Secretary of State',
            requiredStat: { stat: 'diplomacy', min: 70 },
            bonus: { authority: 1, influence: 1 },
            effectDescription: "Boosts Authority and Influence.",
            occupiedBy: null // Will store advisor ID
        },
        'prefect_of_apostolic_camera': {
            name: 'Prefect of the Apostolic Camera',
            requiredStat: { stat: 'finance', min: 60 },
            bonus: { gold: 2, integrity: -0.5 }, // Can have negative effects
            effectDescription: "Boosts Gold income, slight Integrity drain.",
            occupiedBy: null
        },
        'inquisitor_general': {
            name: 'Inquisitor General',
            requiredStat: { stat: 'piety', min: 70 },
            bonus: { piety: 1, authority: 0.5 },
            effectDescription: "Boosts Piety and Authority.",
            occupiedBy: null
        },
        'commander_of_swiss_guard': { // NEW
            name: 'Commander of the Swiss Guard',
            requiredStat: { stat: 'military', min: 75 },
            bonus: { authority: 1, publicOpinion: 0.5 },
            effectDescription: "Boosts Authority and Public Opinion (from security).",
            occupiedBy: null
        },
        'librarian_of_the_vatican': { // NEW
            name: 'Librarian of the Vatican',
            requiredStat: { stat: 'wisdom', min: 70 },
            bonus: { culture: 2 },
            effectDescription: "Boosts Culture.",
            occupiedBy: null
        },
        // More offices could be added
    };

    // Papal States Provinces
    const papalStatesProvinces = {
        latium: { id: 'latium', name: 'Latium', prosperity: 60, loyalty: 70, heresy: 10, fortification: 50, population: 70, isCapital: true }, // NEW stats
        umbria: { id: 'umbria', name: 'Umbria', prosperity: 50, loyalty: 60, heresy: 15, fortification: 40, population: 60 },
        marche: { id: 'marche', name: 'Marche', prosperity: 40, loyalty: 50, heresy: 20, fortification: 30, population: 50 },
        romagna: { id: 'romagna', name: 'Romagna', prosperity: 35, loyalty: 45, heresy: 25, fortification: 25, population: 40 }, // NEW
        campania: { id: 'campania', name: 'Campania', prosperity: 45, loyalty: 55, heresy: 18, fortification: 35, population: 55 }, // NEW
    };

    // NEW: Military Units (for defense or crusades)
    const militaryUnits = {
        papal_guard_units: 0,
        mercenary_units: 0,
    };

    // NEW: Active Policies
    const gamePolicies = {
        policy_centralized_power: {
            isActive: false,
            name: "Centralized Papal Power",
            description: "Strengthens Rome's direct control over local churches.",
            passiveEffects: { authority: 0.5, monasticOrders: -0.2, cardinals: 0.1 }, // Daily small changes
            cost: { influence: 0.1 } // Daily influence cost
        },
        policy_promote_education: {
            isActive: false,
            name: "Promote Education",
            description: "Fosters learning and intellectual pursuits across Christendom.",
            passiveEffects: { culture: 1, publicOpinion: 0.1 },
            cost: { gold: 0.5 }
        },
        policy_active_inquisition: {
            isActive: false,
            name: "Active Inquisition",
            description: "Aggressively seeks out and suppresses heresy.",
            passiveEffects: { piety: 0.5, integrity: -0.1, heresy: -0.5 }, // Heresy reduction
            cost: { gold: 0.2, publicOpinion: -0.1 }
        },
        policy_patronage_of_arts: { // NEW
            isActive: false,
            name: "Patronage of the Arts",
            description: "Funds grand artistic and architectural endeavors.",
            passiveEffects: { culture: 0.5, publicOpinion: 0.2, gold: -0.5 },
            cost: { gold: 0.5 }
        },
        policy_open_door_diplomacy: { // NEW
            isActive: false,
            name: "Open Door Diplomacy",
            description: "Emphasizes negotiation and peaceful resolution with secular powers.",
            passiveEffects: { influence: 0.2, authority: -0.1 },
            cost: {}
        }
    };


    // Event Queue - all events to be processed are added here with a priority
    // Priority order: 100 (Game Over/Triumph/Final Evaluation), 90 (Delayed/Crisis/Major Narrative), 80 (Building Completion/Urgent Advisor), 75 (Faction Demands/Major Province), 70 (Recurring/Office Offers), 60 (Advisor/Minor Province/Doctrine), 50 (Main Story/Player Triggered), 40 (Random)
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
    const metricDivineFavor = document.getElementById('metric-divineFavor');
    const metricInfluence = document.getElementById('metric-influence'); // NEW
    const metricCulture = document.getElementById('metric-culture');     // NEW
    const gameDayCounter = document.getElementById('game-day-counter');

    const documentArea = document.getElementById('document-area');
    const documentTitle = document.getElementById('document-title');
    const documentContent = document.getElementById('document-content');
    const documentSource = document.getElementById('document-source');
    const optionsContainer = document.getElementById('options-container');

    const mapButton = document.getElementById('map-button');
    const mapOverlay = document.getElementById('map-overlay');
    const closeMapButton = document.getElementById('close-map-button');
    // Map province info elements
    const latiumInfo = document.getElementById('latium-info');
    const umbriaInfo = document.getElementById('umbria-info');
    const marcheInfo = document.getElementById('marche-info');
    const romagnaInfo = document.getElementById('romagna-info'); // NEW
    const campaniaInfo = document.getElementById('campania-info'); // NEW

    // Advisor / Office Display
    const advisorRoster = document.getElementById('advisor-roster'); // Parent container for advisor info
    const officeAssignmentContainer = document.getElementById('office-assignment-container'); // NEW UI element for office assignment

    // Policy Display
    const policiesList = document.getElementById('policies-list'); // NEW UI element

    // --- Game Events Data ---
    const events = [
        {
            id: 'start_game',
            title: 'A New Pontificate',
            content: 'You have been elected to the Holy See. The burdens of the papacy weigh heavily upon you, but with God\'s grace, you shall guide the Church.',
            source: 'The Conclave',
            options: [
                {
                    text: 'Embrace your new role with divine confidence.',
                    effects: [
                        { type: 'metricChange', metric: 'piety', value: 10 },
                        { type: 'metricChange', metric: 'authority', value: 5 },
                        { type: 'scheduleNextMainEvent' }
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
            source: gameFactions.hre.name,
            options: [
                {
                    text: 'Grant your blessing and offer 20 Gold.',
                    effects: [
                        { type: 'metricChange', metric: 'authority', value: 15 },
                        { type: 'metricChange', metric: 'gold', value: -20 },
                        { type: 'metricChange', metric: 'publicOpinion', value: -10 },
                        { type: 'factionChange', faction: 'hre', value: 20 },
                        { type: 'setFlag', flag: 'imperial_alliance_established', value: true }
                    ]
                },
                {
                    text: 'Deny his request, citing spiritual concerns and neutrality.',
                    effects: [
                        { type: 'metricChange', metric: 'piety', value: 10 },
                        { type: 'metricChange', metric: 'authority', value: -10 },
                        { type: 'metricChange', metric: 'cardinalFavor', value: 5 },
                        { type: 'factionChange', faction: 'hre', value: -15 }
                    ]
                }
            ]
        },
        {
            id: 'cardinal_meeting',
            title: 'The College Convenes',
            content: 'The cardinals are restless. Cardinal Giovanni, a Curial Traditionalist, expresses concerns about your lack of immediate, decisive action. "The faithful demand a strong hand!" he proclaims.',
            source: gameFactions.cardinals.name,
            options: [
                {
                    text: 'Assure them of your wisdom and long-term vision, citing patience as a virtue.',
                    effects: [
                        { type: 'metricChange', metric: 'cardinalFavor', value: -5 },
                        { type: 'metricChange', metric: 'piety', value: 5 },
                        { type: 'factionChange', faction: 'curialTraditionalists', value: -5 }
                    ]
                },
                {
                    text: 'Promise swift reforms to address their concerns, consolidating power.',
                    effects: [
                        { type: 'metricChange', metric: 'cardinalFavor', value: 10 },
                        { type: 'metricChange', metric: 'authority', value: 5 },
                        { type: 'factionChange', faction: 'curialTraditionalists', value: 10 }
                    ]
                }
            ]
        },
        {
            id: 'crusade_proposal',
            title: 'A Call for Crusade',
            content: 'Emperor Frederick, having secured his northern borders, now proposes a grand crusade to the Holy Land. This requires significant resources and commitment.',
            source: gameFactions.hre.name,
            requiredFlags: ['imperial_alliance_established'],
            requiredFactionFavor: { faction: 'hre', minFavor: 60 },
            options: [
                {
                    text: 'Launch the Crusade, for God and Glory!',
                    effects: [
                        { type: 'metricChange', metric: 'piety', value: 20 },
                        { type: 'metricChange', metric: 'gold', value: -50 },
                        { type: 'metricChange', metric: 'publicOpinion', value: 15 },
                        { type: 'factionChange', faction: 'hre', value: 10 },
                        { type: 'factionChange', faction: 'romanBarons', value: -10 },
                        { type: 'setFlag', flag: 'crusade_launched', value: true },
                        { type: 'delayEvent', eventId: 'crusade_outcome_report', days: 90 }
                    ]
                },
                {
                    text: 'Decline, citing more pressing internal church matters.',
                    effects: [
                        { type: 'metricChange', metric: 'authority', value: -10 },
                        { type: 'metricChange', metric: 'cardinalFavor', value: 10 },
                        { type: 'factionChange', faction: 'hre', value: -20 }
                    ]
                }
            ]
        },
        {
            id: 'noble_dissatisfaction',
            title: 'Noble Uprising Rumors',
            content: 'Rumors reach your ears that some powerful Roman Barons are questioning your authority. They believe your focus is too worldly.',
            source: advisors.monsignorBattista.name,
            requiredFactionFavor: { faction: 'romanBarons', maxFavor: 40 },
            options: [
                {
                    text: 'Send a Papal Legate to assert your spiritual dominance.',
                    effects: [
                        { type: 'metricChange', metric: 'authority', value: 10 },
                        { type: 'factionChange', faction: 'romanBarons', value: -20 },
                        { type: 'metricChange', metric: 'publicOpinion', value: 5 }
                    ]
                },
                {
                    text: 'Dispatch envoys to negotiate and hear their grievances.',
                    effects: [
                        { type: 'factionChange', faction: 'romanBarons', value: 15 },
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
            source: advisors.cardinalValerius.name,
            options: [
                {
                    text: 'Issue the Bull, affirming traditional doctrine strictly.',
                    effects: [
                        { type: 'metricChange', metric: 'piety', value: 15 },
                        { type: 'metricChange', metric: 'publicOpinion', value: 10 },
                        { type: 'metricChange', metric: 'cardinalFavor', value: -5 },
                        { type: 'factionChange', faction: 'monasticOrders', value: 10 },
                        { type: 'factionChange', faction: 'youngReformers', value: -10 }, // Reformers dislike strict doctrine
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
                        { type: 'factionChange', faction: 'hre', value: 5 },
                        { type: 'metricChange', metric: 'publicOpinion', value: 10 },
                        { type: 'setFlag', flag: 'crusade_report_received', value: true }
                    ]
                },
                {
                    text: 'Lament the losses and focus on rebuilding.',
                    effects: [
                        { type: 'metricChange', metric: 'piety', value: -10 },
                        { type: 'metricChange', metric: 'publicOpinion', value: -5 },
                        { type: 'factionChange', faction: 'hre', value: -10 },
                        { type: 'setFlag', flag: 'crusade_report_received', value: true }
                    ]
                }
            ]
        },
        {
            id: 'noble_tax_request',
            title: 'Noble\'s Plea for Tax Exemption',
            content: 'Lord Bertrand, a powerful Roman Baron, requests a special papal tax exemption for his lands, citing recent hardships.',
            source: gameFactions.romanBarons.name,
            requiredFactionFavor: { faction: 'romanBarons', minFavor: 70 },
            forbiddenFactionFavor: { faction: 'romanBarons', maxFavor: 90 }, // Prevent if already maxed out
            options: [
                {
                    text: 'Grant the exemption, strengthening ties with the nobility.',
                    effects: [
                        { type: 'metricChange', metric: 'gold', value: -15 },
                        { type: 'factionChange', faction: 'romanBarons', value: 20 },
                        { type: 'metricChange', metric: 'publicOpinion', value: -5 }
                    ]
                },
                {
                    text: 'Deny the exemption, upholding papal fiscal authority.',
                    effects: [
                        { type: 'metricChange', metric: 'authority', value: 10 },
                        { type: 'factionChange', faction: 'romanBarons', value: -15 },
                        { type: 'metricChange', metric: 'gold', value: 5 }
                    ]
                }
            ]
        },

        // Building Construction Events
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
        {
            id: 'construction_opportunity_hospice',
            title: 'A Hospice for the Poor',
            content: 'A local bishop pleads for the construction of a hospice to care for the sick and impoverished of Rome. It would be a testament to Christian charity.',
            source: gameFactions.commonPeople.name,
            requiredBuildings: { buildingId: 'hospice_of_st_lazarus', status: 'none' },
            options: [
                {
                    text: 'Fund the building of a grand hospice.',
                    effects: [
                        { type: 'startConstruction', buildingId: 'hospice_of_st_lazarus' },
                        { type: 'metricChange', metric: 'integrity', value: 5 }
                    ]
                },
                {
                    text: 'Express sympathy, but state funds are tied up elsewhere.',
                    effects: [
                        { type: 'metricChange', metric: 'publicOpinion', value: -10 },
                        { type: 'metricChange', metric: 'integrity', value: -5 }
                    ]
                }
            ]
        },
        {
            id: 'construction_opportunity_university',
            title: 'Found the University of Rome',
            content: 'Scholars propose establishing a Papal university in Rome, drawing students from across Europe. This would be a beacon of learning and enhance the Holy See\'s cultural influence.',
            source: advisors.cardinalBenedict.name,
            requiredBuildings: { buildingId: 'university_of_rome', status: 'none' },
            options: [
                {
                    text: 'Found the University!',
                    effects: [
                        { type: 'startConstruction', buildingId: 'university_of_rome' },
                        { type: 'metricChange', metric: 'culture', value: 10 }
                    ]
                },
                {
                    text: 'Such secular learning is a distraction.',
                    effects: [
                        { type: 'metricChange', metric: 'piety', value: 5 },
                        { type: 'metricChange', metric: 'culture', value: -10 },
                        { type: 'factionChange', faction: 'youngReformers', value: -5 }
                    ]
                }
            ]
        },
        {
            id: 'construction_opportunity_gardens',
            title: 'Beautify the Vatican Gardens',
            content: 'The Papal architects propose a grand project to expand and beautify the Vatican Gardens, creating a tranquil and inspiring space within the Holy See.',
            source: advisors.monsignorBattista.name,
            requiredBuildings: { buildingId: 'vatican_gardens', status: 'none' },
            options: [
                {
                    text: 'Commission the Vatican Gardens.',
                    effects: [
                        { type: 'startConstruction', buildingId: 'vatican_gardens' },
                        { type: 'metricChange', metric: 'publicOpinion', value: 5 }
                    ]
                },
                {
                    text: 'Funds are needed for more pressing matters.',
                    effects: [
                        { type: 'metricChange', metric: 'publicOpinion', value: -5 }
                    ]
                }
            ]
        },


        // Building Completion Events
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
        {
            id: 'hospice_completed',
            title: 'The Hospice of St. Lazarus is Open!',
            content: 'The hospice dedicated to St. Lazarus is now fully operational, offering succor to the sick and poor. Your compassion shines through this act of charity.',
            source: 'The Poor of Rome',
            options: [
                {
                    text: 'A testament to God\'s boundless love.',
                    effects: [
                        { type: 'metricChange', metric: 'publicOpinion', value: 15 },
                        { type: 'metricChange', metric: 'integrity', value: 10 },
                        { type: 'metricChange', metric: 'piety', value: 5 }
                    ]
                }
            ]
        },
        {
            id: 'university_completed',
            title: 'University of Rome Established!',
            content: 'The new University of Rome is officially open! It promises to be a center of theological and secular learning, attracting great minds and spreading the Church\'s influence.',
            source: 'The Rector',
            options: [
                {
                    text: 'A beacon of knowledge for Christendom!',
                    effects: [
                        { type: 'metricChange', metric: 'culture', value: 20 },
                        { type: 'metricChange', metric: 'influence', value: 10 },
                        { type: 'factionChange', faction: 'youngReformers', value: 10 },
                        { type: 'factionChange', faction: 'monasticOrders', value: -5 }
                    ]
                }
            ]
        },
        {
            id: 'vatican_gardens_completed',
            title: 'Vatican Gardens Unveiled!',
            content: 'The newly expanded Vatican Gardens are a masterpiece of design and tranquility. They offer a serene retreat and a symbol of the Papacy\'s grandeur and appreciation for beauty.',
            source: 'Garden Master',
            options: [
                {
                    text: 'A place of reflection and beauty.',
                    effects: [
                        { type: 'metricChange', metric: 'publicOpinion', value: 10 },
                        { type: 'metricChange', metric: 'integrity', value: 5 },
                        { type: 'metricChange', metric: 'culture', value: 5 }
                    ]
                }
            ]
        },

        // Jubilee Project Start Event
        {
            id: 'initiate_jubilee',
            title: 'A Holy Jubilee Year',
            content: 'A proposal for a grand Jubilee year. It would attract pilgrims and generate wealth, but demands great preparations and impeccable integrity.',
            source: advisors.cardinalValerius.name,
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
                                { type: 'addDivineFavor', value: 10 }
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
                                { type: 'factionChange', faction: 'monasticOrders', value: -15 },
                                { type: 'addSin', value: 10 }
                            ]
                        },
                        { type: 'setFlag', flag: 'jubilee_initiated', value: false },
                    ]
                }
            ]
        },

        // Integrity and Sin Events
        {
            id: 'indulgences_proposal',
            title: 'Selling of Indulgences',
            content: 'A desperate need for funds leads some cardinals to propose a widespread selling of indulgences for sins. This would generate immense wealth but might be seen as corrupt.',
            source: gameFactions.nepotists.name, // Nepotists might favor this
            requiredMetrics: { metric: 'gold', max: 50 },
            options: [
                {
                    text: 'Approve the sale of indulgences.',
                    effects: [
                        { type: 'metricChange', metric: 'gold', value: 50 },
                        { type: 'metricChange', metric: 'integrity', value: -20 },
                        { type: 'metricChange', metric: 'publicOpinion', value: -10 },
                        { type: 'factionChange', faction: 'monasticOrders', value: -15 },
                        { type: 'factionChange', faction: 'youngReformers', value: -20 },
                        { type: 'factionChange', faction: 'nepotists', value: 15 }, // Nepotists like it
                        { type: 'addSin', value: 15 }
                    ]
                },
                {
                    text: 'Forbid the practice, maintaining the purity of the Church.',
                    effects: [
                        { type: 'metricChange', metric: 'gold', value: -10 },
                        { type: 'metricChange', metric: 'integrity', value: 10 },
                        { type: 'metricChange', metric: 'piety', value: 10 },
                        { type: 'factionChange', faction: 'nepotists', value: -10 }, // Nepotists dislike it
                        { type: 'factionChange', faction: 'youngReformers', value: 10 }
                    ]
                }
            ]
        },
        {
            id: 'poor_relief_plea',
            title: 'Plea for the Roman Poor',
            content: 'The Roman populace suffers from famine and poverty. Local clergy appeal to you for papal relief efforts.',
            source: gameFactions.commonPeople.name,
            options: [
                {
                    text: 'Allocate significant funds for relief.',
                    effects: [
                        { type: 'metricChange', metric: 'gold', value: -30 },
                        { type: 'metricChange', metric: 'integrity', value: 15 },
                        { type: 'metricChange', metric: 'publicOpinion', value: 20 },
                        { type: 'metricChange', metric: 'piety', value: 10 },
                        { type: 'addDivineFavor', value: 10 }
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
        {
            id: 'heresy_inquisition',
            title: 'Rising Heresy in Saxony',
            content: 'Reports from Saxony indicate a growing movement of heretics challenging papal authority. The Inquisitor General demands swift action.',
            source: advisors.brotherThomas.name,
            options: [
                {
                    text: 'Launch a full-scale Inquisition to purge the heresy.',
                    effects: [
                        { type: 'metricChange', metric: 'piety', value: 15 },
                        { type: 'metricChange', metric: 'authority', value: 10 },
                        { type: 'metricChange', metric: 'publicOpinion', value: -10 },
                        { type: 'metricChange', metric: 'integrity', value: -5 },
                        { type: 'factionChange', faction: 'monasticOrders', value: 10 },
                        { type: 'factionChange', faction: 'curialTraditionalists', value: 10 },
                        { type: 'factionChange', faction: 'youngReformers', value: -10 },
                        { type: 'addSin', value: 5 }
                    ]
                },
                {
                    text: 'Send a mission of learned theologians to debate and persuade.',
                    effects: [
                        { type: 'metricChange', metric: 'piety', value: -5 },
                        { type: 'metricChange', metric: 'authority', value: -5 },
                        { type: 'metricChange', metric: 'integrity', value: 10 },
                        { type: 'factionChange', faction: 'monasticOrders', value: -5 },
                        { type: 'factionChange', faction: 'curialTraditionalists', value: -10 },
                        { type: 'factionChange', faction: 'youngReformers', value: 5 },
                        { type: 'metricChange', metric: 'gold', value: -15 },
                        { type: 'metricChange', metric: 'culture', value: 5 }
                    ]
                }
            ]
        },
        {
            id: 'noble_feud',
            title: 'A Princely Feud',
            content: 'Two powerful Italian princely families are embroiled in a violent feud, disrupting trade and pilgrimage routes. They appeal to Rome for intervention.',
            source: advisors.cardinalValerius.name,
            options: [
                {
                    text: 'Intervene forcefully, threatening excommunication.',
                    effects: [
                        { type: 'metricChange', metric: 'authority', value: 15 },
                        { type: 'factionChange', faction: 'romanBarons', value: -10 },
                        { type: 'metricChange', metric: 'publicOpinion', value: -5 },
                        { type: 'metricChange', metric: 'influence', value: 5 }, // Influence gain from strong action
                        {
                            type: 'conditionalEffect',
                            condition: { metric: 'authority', min: 70 },
                            effects: [
                                { type: 'metricChange', metric: 'gold', value: 20 },
                                { type: 'factionChange', faction: 'romanBarons', value: 15 }
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
                        { type: 'factionChange', faction: 'romanBarons', value: 10 },
                        { type: 'metricChange', metric: 'influence', value: -5 }, // Seen as weaker action
                        {
                            type: 'conditionalEffect',
                            condition: { metric: 'integrity', max: 40 },
                            effects: [
                                { type: 'factionChange', faction: 'romanBarons', value: -20 },
                                { type: 'metricChange', metric: 'authority', value: -10 }
                            ]
                        }
                    ]
                }
            ]
        },

        // Advisor-specific events (triggered if advisor is available and stats met)
        {
            id: 'advisor_ambition_valerius',
            title: 'Cardinal Valerius\'s Request',
            content: 'Cardinal Valerius, your Papal Secretary, requests a more prominent role within the Curia, hinting at his ambition to lead a new major commission.',
            source: advisors.cardinalValerius.name,
            requiredAdvisorStats: { advisorId: 'cardinalValerius', stat: 'ambition', min: 60 },
            options: [
                {
                    text: 'Grant his request and elevate his position.',
                    effects: [
                        { type: 'updateAdvisorStat', advisorId: 'cardinalValerius', stat: 'loyalty', value: 15 },
                        { type: 'metricChange', metric: 'cardinalFavor', value: 10 },
                        { type: 'metricChange', metric: 'influence', value: 5 },
                        // Could lead to a new policy or event series later
                    ]
                },
                {
                    text: 'Politely decline, stating his current role is too vital.',
                    effects: [
                        { type: 'updateAdvisorStat', advisorId: 'cardinalValerius', stat: 'loyalty', value: -10 },
                        { type: 'updateAdvisorStat', advisorId: 'cardinalValerius', stat: 'ambition', value: -5 },
                        { type: 'metricChange', metric: 'cardinalFavor', value: -5 },
                        { type: 'metricChange', metric: 'influence', value: -5 }
                    ]
                }
            ]
        },
        {
            id: 'advisor_corruption_battista',
            title: 'Monsignor Battista\'s Shady Dealings',
            content: 'Rumors circulate that Monsignor Battista, your Prefect of the Apostolic Camera, has been taking kickbacks from merchants involved in Papal trade.',
            source: advisors.brotherThomas.name,
            requiredAdvisorTraits: { advisorId: 'monsignorBattista', trait: 'corrupt', value: true },
            requiredAdvisorStats: { advisorId: 'monsignorBattista', stat: 'intrigue', min: 50 },
            options: [
                {
                    text: 'Confront Battista privately and demand he cease.',
                    effects: [
                        { type: 'updateAdvisorStat', advisorId: 'monsignorBattista', stat: 'loyalty', value: -10 },
                        { type: 'metricChange', metric: 'integrity', value: 5 },
                        { type: 'metricChange', metric: 'gold', value: -5 }, // Lost kickbacks
                        { type: 'factionChange', faction: 'nepotists', value: -5 }
                    ]
                },
                {
                    text: 'Allow it to continue, for the sake of efficiency and his loyalty.',
                    effects: [
                        { type: 'updateAdvisorStat', advisorId: 'monsignorBattista', stat: 'loyalty', value: 5 },
                        { type: 'metricChange', metric: 'integrity', value: -15 },
                        { type: 'metricChange', metric: 'gold', value: 10 }, // Shared kickbacks
                        { type: 'addSin', value: 10 },
                        { type: 'factionChange', faction: 'nepotists', value: 10 },
                        { type: 'factionChange', faction: 'youngReformers', value: -10 }
                    ]
                },
                {
                    text: 'Dismiss Battista and appoint a new Prefect.',
                    effects: [
                        { type: 'updateAdvisorStat', advisorId: 'monsignorBattista', stat: 'isAvailable', value: false },
                        { type: 'assignOffice', advisorId: 'monsignorBattista', officeId: '' }, // Remove from office
                        { type: 'metricChange', metric: 'integrity', value: 15 },
                        { type: 'metricChange', metric: 'influence', value: -10 }, // Loss of connected advisor
                        { type: 'factionChange', faction: 'nepotists', value: -15 }
                    ]
                }
            ]
        },

        // Province events
        {
            id: 'province_famine_umbria',
            title: 'Famine in Umbria!',
            content: 'Reports from Umbria indicate a severe famine. The people are suffering, and loyalty to Rome may waver without intervention.',
            source: 'Local Bishop of Umbria',
            context: { province: 'umbria' }, // Which province is affected
            options: [
                {
                    text: 'Send immediate grain shipments from the Papal stores.',
                    effects: [
                        { type: 'metricChange', metric: 'gold', value: -40 },
                        { type: 'updateProvince', provinceId: 'umbria', stat: 'loyalty', value: 20 },
                        { type: 'updateProvince', provinceId: 'umbria', stat: 'prosperity', value: -5 }, // Short term dip
                        { type: 'metricChange', metric: 'publicOpinion', value: 10 },
                        { type: 'metricChange', metric: 'integrity', value: 5 }
                    ]
                },
                {
                    text: 'Issue a papal bull calling for prayers and fasting.',
                    effects: [
                        { type: 'metricChange', metric: 'piety', value: 10 },
                        { type: 'updateProvince', provinceId: 'umbria', stat: 'loyalty', value: -10 },
                        { type: 'updateProvince', provinceId: 'umbria', stat: 'prosperity', value: -10 },
                        { type: 'metricChange', metric: 'publicOpinion', value: -10 }
                    ]
                }
            ]
        },
        {
            id: 'province_banditry_marche',
            title: 'Banditry in Marche!',
            content: 'Trade routes in the Marche region are plagued by increasingly bold bandit gangs, disrupting commerce and threatening pilgrims.',
            source: 'Merchants\' Guild',
            context: { province: 'marche' },
            options: [
                {
                    text: 'Dispatch papal guards to clear the routes and restore order.',
                    effects: [
                        { type: 'metricChange', metric: 'gold', value: -20 },
                        { type: 'updateProvince', provinceId: 'marche', stat: 'prosperity', value: 10 },
                        { type: 'updateProvince', provinceId: 'marche', stat: 'loyalty', value: 5 },
                        { type: 'metricChange', metric: 'authority', value: 10 },
                        { type: 'factionChange', faction: 'romanBarons', value: -5 }
                    ]
                },
                {
                    text: 'Call upon local Roman Barons to address the issue themselves.',
                    effects: [
                        { type: 'metricChange', metric: 'authority', value: -10 },
                        { type: 'updateProvince', provinceId: 'marche', stat: 'prosperity', value: -5 },
                        { type: 'factionChange', faction: 'romanBarons', value: 5 }
                    ]
                }
            ]
        },
        {
            id: 'province_heresy_romagna',
            title: 'Heresy Spreading in Romagna!',
            content: 'Reports indicate that heretical preachers are gaining a strong foothold in Romagna, challenging papal doctrine and disrupting local order.',
            source: advisors.brotherThomas.name,
            context: { province: 'romagna' },
            options: [
                {
                    text: 'Send the Inquisition to Romagna. Root out the heresy!',
                    effects: [
                        { type: 'updateProvince', provinceId: 'romagna', stat: 'heresy', value: -20 },
                        { type: 'updateProvince', provinceId: 'romagna', stat: 'loyalty', value: -10 }, // Harshness can reduce loyalty
                        { type: 'metricChange', metric: 'piety', value: 10 },
                        { type: 'metricChange', metric: 'integrity', value: -5 },
                        { type: 'addSin', value: 5 },
                        { type: 'factionChange', faction: 'monasticOrders', value: 10 }
                    ]
                },
                {
                    text: 'Dispatch a papal legate to preach and re-educate the populace.',
                    effects: [
                        { type: 'updateProvince', provinceId: 'romagna', stat: 'heresy', value: -5 }, // Slower reduction
                        { type: 'updateProvince', provinceId: 'romagna', stat: 'loyalty', value: 5 },
                        { type: 'metricChange', metric: 'gold', value: -15 },
                        { type: 'metricChange', metric: 'piety', value: 5 },
                        { type: 'metricChange', metric: 'culture', value: 5 }
                    ]
                }
            ]
        },
        // NEW: Investment event for provinces
        {
            id: 'invest_in_province_umbria',
            title: 'Invest in Umbrian Infrastructure',
            content: 'Umbria\'s roads and markets could be greatly improved with papal funds, boosting its prosperity and loyalty.',
            source: 'Umbrian Delegation',
            context: { province: 'umbria' },
            requiredMetrics: { metric: 'gold', min: 30 },
            options: [
                {
                    text: 'Invest 30 Gold to improve Umbria.',
                    effects: [
                        { type: 'metricChange', metric: 'gold', value: -30 },
                        { type: 'updateProvince', provinceId: 'umbria', stat: 'prosperity', value: 15 },
                        { type: 'updateProvince', provinceId: 'umbria', stat: 'loyalty', value: 10 },
                        { type: 'delayEvent', eventId: 'umbria_investment_result', days: 60, context: { province: 'umbria' } }
                    ]
                },
                {
                    text: 'Decline. Funds are too scarce.',
                    effects: [
                        { type: 'updateProvince', provinceId: 'umbria', stat: 'loyalty', value: -5 }
                    ]
                }
            ]
        },
        {
            id: 'umbria_investment_result',
            title: 'Umbrian Investment Results',
            content: 'Your investment in Umbria\'s infrastructure has yielded positive results. The region is more prosperous.',
            source: `${papalStatesProvinces.umbria.name} Governor`,
            context: { province: 'umbria' },
            options: [
                {
                    text: 'Good news!',
                    effects: [] // Effects already applied when investment began
                }
            ]
        },

        // Policy System Events
        {
            id: 'policy_centralize_power_proposal',
            title: 'Proposal: Centralize Church Power',
            content: 'Cardinal Sforza, a prominent Curial Traditionalist, proposes a new initiative to centralize ecclesiastical power, diminishing the autonomy of local bishops and strengthening Rome\'s direct control.',
            source: gameFactions.curialTraditionalists.name,
            forbiddenFlags: ['policy_centralized_power'],
            requiredMetrics: { metric: 'influence', min: 30 },
            options: [
                {
                    text: 'Enact the policy to centralize power (Costs 30 Influence).',
                    effects: [
                        { type: 'setPolicy', policyId: 'policy_centralized_power', value: true },
                        { type: 'metricChange', metric: 'authority', value: 20 },
                        { type: 'metricChange', metric: 'influence', value: -30 },
                        { type: 'factionChange', faction: 'cardinals', value: 15 },
                        { type: 'factionChange', faction: 'monasticOrders', value: -10 },
                        { type: 'factionChange', faction: 'youngReformers', value: -10 }
                    ]
                },
                {
                    text: 'Decline, respecting local church autonomy.',
                    effects: [
                        { type: 'metricChange', metric: 'authority', value: -5 },
                        { type: 'metricChange', metric: 'influence', value: 5 }, // Save influence
                        { type: 'factionChange', faction: 'cardinals', value: -10 },
                        { type: 'factionChange', faction: 'monasticOrders', value: 5 }
                    ]
                }
            ]
        },
        {
            id: 'policy_promote_education_proposal',
            title: 'Proposal: Promote Education',
            content: 'Scholar monks propose a broad policy to promote education throughout Christendom, funding schools and encouraging theological debate.',
            source: gameFactions.monasticOrders.name,
            forbiddenFlags: ['policy_promote_education'],
            requiredMetrics: { metric: 'culture', min: 40 },
            options: [
                {
                    text: 'Enact the Promote Education policy (Costs 40 Culture).',
                    effects: [
                        { type: 'setPolicy', policyId: 'policy_promote_education', value: true },
                        { type: 'metricChange', metric: 'culture', value: -40 },
                        { type: 'metricChange', metric: 'publicOpinion', value: 10 },
                        { type: 'factionChange', faction: 'youngReformers', value: 10 }
                    ]
                },
                {
                    text: 'Decline. Focus on spiritual purity, not worldly knowledge.',
                    effects: [
                        { type: 'metricChange', metric: 'culture', value: -10 },
                        { type: 'factionChange', faction: 'monasticOrders', value: -5 }
                    ]
                }
            ]
        },
        {
            id: 'policy_patronage_of_arts_proposal',
            title: 'Proposal: Patronage of the Arts',
            content: 'Renowned artists and architects appeal to you to establish a formal papal policy of supporting the arts, promising to make Rome the cultural heart of Europe.',
            source: 'Master Painters Guild',
            forbiddenFlags: ['policy_patronage_of_arts'],
            requiredMetrics: { metric: 'gold', min: 50, metric2: 'culture', min2: 30 },
            options: [
                {
                    text: 'Enact the Patronage of the Arts policy (Costs 50 Gold, 30 Culture).',
                    effects: [
                        { type: 'setPolicy', policyId: 'policy_patronage_of_arts', value: true },
                        { type: 'metricChange', metric: 'gold', value: -50 },
                        { type: 'metricChange', metric: 'culture', value: -30 },
                        { type: 'metricChange', metric: 'publicOpinion', value: 15 },
                        { type: 'factionChange', faction: 'romanBarons', value: 5 },
                        { type: 'factionChange', faction: 'youngReformers', value: 5 }
                    ]
                },
                {
                    text: 'Decline. Such lavish spending is imprudent.',
                    effects: [
                        { type: 'metricChange', metric: 'publicOpinion', value: -5 },
                        { type: 'metricChange', metric: 'integrity', value: 5 } // Seen as less worldly
                    ]
                }
            ]
        },

        // Doctrine System Event (Council)
        {
            id: 'call_council_infallibility',
            title: 'Call a Council: Papal Infallibility',
            content: 'There is growing debate over the extent of the Pope\'s divine authority. Calling a Church Council to definitively affirm papal infallibility would greatly strengthen your spiritual power, but faces strong opposition from some quarters.',
            source: gameFactions.curialTraditionalists.name,
            forbiddenFlags: ['doctrine_papal_infallibility_affirmed'],
            requiredMetrics: { metric: 'influence', min: 70, metric2: 'authority', min2: 60 },
            options: [
                {
                    text: 'Convene the Council to affirm Papal Infallibility (Costs 70 Influence, 30 Gold).',
                    effects: [
                        { type: 'metricChange', metric: 'influence', value: -70 },
                        { type: 'metricChange', metric: 'gold', value: -30 },
                        { type: 'delayEvent', eventId: 'council_infallibility_outcome', days: 100 }
                    ]
                },
                {
                    text: 'Postpone. The time is not right for such a divisive debate.',
                    effects: [
                        { type: 'factionChange', faction: 'curialTraditionalists', value: -10 },
                        { type: 'metricChange', metric: 'authority', value: -5 }
                    ]
                }
            ]
        },
        {
            id: 'council_infallibility_outcome',
            title: 'Council Concludes: Papal Infallibility!',
            content: 'The Church Council has concluded its deliberations. Despite fierce debate, your maneuvering secured the affirmation of Papal Infallibility.',
            source: 'The Council Fathers',
            options: [
                {
                    text: 'Rejoice in this monumental victory for Papal power!',
                    effects: [
                        { type: 'setFlag', flag: 'doctrine_papal_infallibility_affirmed', value: true },
                        { type: 'metricChange', metric: 'authority', value: 30 },
                        { type: 'metricChange', metric: 'piety', value: 10 },
                        { type: 'factionChange', faction: 'cardinals', value: 15 },
                        { type: 'factionChange', faction: 'youngReformers', value: -20 },
                        { type: 'addDivineFavor', value: 10 }
                    ]
                }
            ]
        },

        // Diplomacy & Warfare
        {
            id: 'ottoman_threat',
            title: 'Ottoman Advance in the East!',
            content: 'Reports indicate a major Ottoman army is advancing through the Balkans, threatening Christian Europe. They may soon turn their attention to Italy.',
            source: gameFactions.spain.name, // Spain has interests here
            requiredFactionFavor: { faction: 'spain', minFavor: 40 },
            options: [
                {
                    text: 'Call for a Holy League and rally Christian forces against the Ottomans.',
                    effects: [
                        { type: 'metricChange', metric: 'piety', value: 20 },
                        { type: 'metricChange', metric: 'authority', value: 10 },
                        { type: 'metricChange', metric: 'gold', value: -50 },
                        { type: 'recruitUnits', unitType: 'papal_guard', value: 5 }, // Recruit more guards
                        { type: 'recruitUnits', unitType: 'mercenary', value: 10 }, // Hire mercenaries
                        { type: 'factionChange', faction: 'spain', value: 15 },
                        { type: 'factionChange', faction: 'hre', value: 10 },
                        { type: 'delayEvent', eventId: 'ottoman_war_outcome', days: 180 }
                    ]
                },
                {
                    text: 'Focus on diplomacy and appeasement, offering concessions to avoid war.',
                    effects: [
                        { type: 'metricChange', metric: 'integrity', value: -10 },
                        { type: 'metricChange', metric: 'piety', value: -10 },
                        { type: 'metricChange', metric: 'influence', value: -15 },
                        { type: 'factionChange', faction: 'spain', value: -20 },
                        { type: 'factionChange', faction: 'monasticOrders', value: -10 },
                        { type: 'delayEvent', eventId: 'ottoman_appeasement_outcome', days: 90 }
                    ]
                }
            ]
        },
        {
            id: 'ottoman_war_outcome',
            title: 'Battle Against the Ottomans!',
            content: 'The Christian forces clashed with the Ottoman invaders. Your military preparedness and divine favor were key.',
            source: 'Battlefield Dispatch',
            options: [
                {
                    text: 'Assess the outcome.',
                    effects: [
                        {
                            type: 'conditionalEffect',
                            condition: { metric: 'divineFavor', min: 70, metric2: 'authority', min2: 70 },
                            effects: [
                                { type: 'metricChange', metric: 'piety', value: 30 },
                                { type: 'metricChange', metric: 'authority', value: 25 },
                                { type: 'metricChange', metric: 'publicOpinion', value: 20 },
                                { type: 'factionChange', faction: 'spain', value: 10 },
                                { type: 'factionChange', faction: 'hre', value: 10 },
                                { type: 'addDivineFavor', value: 10 }
                            ]
                        },
                        {
                            type: 'conditionalEffect',
                            condition: { metric: 'divineFavor', max: 69, metric2: 'authority', max2: 69 },
                            effects: [
                                { type: 'metricChange', metric: 'piety', value: -10 },
                                { type: 'metricChange', metric: 'authority', value: -15 },
                                { type: 'metricChange', metric: 'publicOpinion', value: -10 },
                                { type: 'factionChange', faction: 'spain', value: -10 },
                                { type: 'factionChange', faction: 'hre', value: -10 }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            id: 'ottoman_appeasement_outcome',
            title: 'Ottoman Demands Met',
            content: 'Your diplomatic efforts, though costly, have seemingly averted immediate conflict with the Ottomans. However, they have made significant territorial and financial demands.',
            source: 'Ottoman Ambassador',
            options: [
                {
                    text: 'Accept the bitter terms.',
                    effects: [
                        { type: 'metricChange', metric: 'gold', value: -80 },
                        { type: 'metricChange', metric: 'integrity', value: -20 },
                        { type: 'metricChange', metric: 'publicOpinion', value: -15 },
                        { type: 'factionChange', faction: 'spain', value: -20 },
                        { type: 'factionChange', faction: 'monasticOrders', value: -15 },
                        { type: 'addSin', value: 10 }
                    ]
                }
            ]
        },

        // Recurring Events
        {
            id: 'monthly_treasury_report',
            title: 'Monthly Treasury Report',
            content: 'A report on the papal finances for the past month. Your income varies with public opinion and provincial prosperity.',
            source: advisors.monsignorBattista.name,
            options: [
                {
                    text: 'Acknowledge the report.',
                    effects: [
                        { type: 'metricChange', metric: 'gold', value: 'dynamic_income' }
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
                        { type: 'metricChange', metric: 'gold', value: 10 },
                        { type: 'addDivineFavor', value: 5 }
                    ]
                }
            ]
        },
        {
            id: 'office_assignment_opportunity',
            title: 'Curial Office Opportunity',
            content: 'A key curial office has become vacant, or a new advisor is eager to prove their worth. Would you like to assign an advisor to a specific role?',
            source: 'The Curia',
            options: [
                {
                    text: 'Review available advisors and offices.',
                    effects: [{ type: 'showOfficeAssignment' }] // Special effect to show UI
                },
                {
                    text: 'Decline for now.',
                    effects: [{ type: 'metricChange', metric: 'influence', value: -5 }] // Missing an opportunity
                }
            ]
        },
        // Random Events
        {
            id: 'plague_outbreak',
            title: 'Plague Outbreak!',
            content: 'A virulent plague sweeps through a prominent city. What is your response?',
            source: 'Courier from the North',
            options: [
                { text: 'Order prayers and offer spiritual guidance.', effects: [{ type: 'metricChange', metric: 'piety', value: 15 }, { type: 'metricChange', metric: 'publicOpinion', value: -15 }, { type: 'metricChange', metric: 'gold', value: -5 }, { type: 'addDivineFavor', value: 5 }] },
                { text: 'Send papal doctors and allocate funds for quarantines.', effects: [{ type: 'metricChange', metric: 'publicOpinion', value: 10 }, { type: 'metricChange', metric: 'gold', value: -20 }, { type: 'metricChange', metric: 'piety', value: -5 }, { type: 'metricChange', metric: 'integrity', value: 5 }] }
            ]
        },
        {
            id: 'noble_dispute_arbitration',
            title: 'Noble Dispute Requires Arbitration',
            content: 'Two powerful noble families are embroiled in a bitter land dispute. They appeal to your authority to mediate.',
            source: 'Conflicting Envoys',
            options: [
                { text: 'Meditate and issue a Papal ruling, favoring one side slightly.', effects: [{ type: 'metricChange', metric: 'authority', value: 10 }, { type: 'factionChange', faction: 'romanBarons', value: 5 }, { type: 'metricChange', metric: 'cardinalFavor', value: -5 }] },
                { text: 'Decline to intervene, citing secular matters.', effects: [{ type: 'metricChange', metric: 'authority', value: -5 }, { type: 'factionChange', faction: 'romanBarons', value: -10 }] }
            ]
        },
        {
            id: 'heretical_preacher_sighted',
            title: 'Heretical Preacher Sighted!',
            content: 'Reports indicate a charismatic preacher is gaining followers in a remote province, spreading doctrines contrary to Papal teaching.',
            source: 'Local Bishop',
            options: [
                { text: 'Dispatch an Inquisition to suppress the heresy.', effects: [{ type: 'metricChange', metric: 'piety', value: 15 }, { type: 'metricChange', metric: 'publicOpinion', value: -10 }, { type: 'factionChange', faction: 'monasticOrders', value: 10 }, { type: 'addSin', value: 5 }] },
                { text: 'Send a conciliatory envoy to understand their grievances.', effects: [{ type: 'metricChange', metric: 'piety', value: -5 }, { type: 'metricChange', metric: 'authority', value: -5 }, { type: 'metricChange', metric: 'publicOpinion', value: 5 }, { type: 'metricChange', metric: 'integrity', value: 10 }] }
            ]
        },
        {
            id: 'papal_donation_offer',
            title: 'Generous Donation Offer',
            content: 'A wealthy merchant offers a substantial donation to the Papacy, but it comes with strings attached: a request for a lucrative trade monopoly.',
            source: 'Wealthy Merchant',
            options: [
                { text: 'Accept the donation and grant the monopoly.', effects: [{ type: 'metricChange', metric: 'gold', value: 40 }, { type: 'metricChange', metric: 'integrity', value: -15 }, { type: 'addSin', value: 10 }] },
                { text: 'Refuse the tainted funds.', effects: [{ type: 'metricChange', metric: 'gold', value: -5 }, { type: 'metricChange', metric: 'integrity', value: 10 }] }
            ]
        },
        // Divine Intervention/Wrath Events
        {
            id: 'divine_blessing',
            title: 'A Divine Blessing!',
            content: 'A miraculous event has occurred in Rome! The heavens favor your pious reign, bringing renewed hope and prosperity.',
            source: 'Divine Providence',
            options: [{ text: 'Praise be to God!', effects: [{ type: 'metricChange', metric: 'piety', value: 15 }, { type: 'metricChange', metric: 'publicOpinion', value: 10 }, { type: 'metricChange', metric: 'gold', value: 10 }] }]
        },
        {
            id: 'divine_wrath',
            title: 'Sign of Divine Displeasure!',
            content: 'A terrible omen has appeared – a sign of God\'s displeasure. Your sinful actions have not gone unnoticed by the Almighty.',
            source: 'Heavenly Judgement',
            options: [{ text: 'Repent and seek forgiveness.', effects: [{ type: 'metricChange', metric: 'piety', value: 10 }, { type: 'metricChange', metric: 'publicOpinion', value: -15 }, { type: 'metricChange', metric: 'integrity', value: -10 }, { type: 'addSin', value: -10 }] }]
        },

        // Game Ending / Triumph Events
        { id: 'game_over_heresy', title: 'The Papacy Fractures! A Schism of Faith', content: 'Your pious neglect or controversial doctrine has sown deep seeds of heresy. The faithful abandon Rome, and the Church falls into irreparable schism. Your legacy is one of failure.', source: 'The Annals of History', options: [{ text: 'Start Over', effects: [{ type: 'resetGame' }] }] },
        { id: 'game_over_tyranny', title: 'The Tyrant Pope! Public Uprising', content: 'Your relentless pursuit of power and neglect of the common folk has led to widespread revolt. The people rise up, storming the Vatican and deposing you by force. Your reign ends in chaos.', source: 'The Streets of Rome', options: [{ text: 'Start Over', effects: [{ type: 'resetGame' }] }] },
        { id: 'game_over_impoverished', title: 'The Bankrupt See! Ruin of Rome', content: 'Years of mismanagement and costly ventures have drained the papal coffers. With no funds, your authority crumples, and hostile powers seize control of Rome. The Holy See is ruined.', source: 'Papal Treasury Records', options: [{ text: 'Start Over', effects: [{ type: 'resetGame' }] }] },
        { id: 'game_over_deposed_cardinals', title: 'Deposed! A Cardinal Conspiracy', content: 'Your constant disregard for the College of Cardinals has led to a secret plot. They have unanimously voted for your deposition, backed by powerful secular rulers. Your authority crumples.', source: 'The Conclave Transcripts', options: [{ text: 'Start Over', effects: [{ type: 'resetGame' }] }] },
        { id: 'game_over_imperial_control', title: 'Puppet of the Emperor! Loss of Autonomy', content: 'Your excessive reliance on the Emperor has left the Papacy utterly subservient to his will. The Holy See is no longer an independent power, but merely a tool of the Empire. Your spiritual authority is lost.', source: 'Imperial Edicts', options: [{ text: 'Start Over', effects: [{ type: 'resetGame' }] }] },
        { id: 'game_over_noble_revolt', title: 'Noble Wars! Christendom Fractured', content: 'Your inability to manage the nobility has plunged Europe into endless feudal warfare. The Papacy, unable to exert influence, is powerless amidst the chaos. Your reign is a period of strife.', source: 'Chronicles of Conflict', options: [{ text: 'Start Over', effects: [{ type: 'resetGame' }] }] },
        { id: 'game_over_corrupt', title: 'The Corrupt See! Loss of Moral Authority', content: 'Your reign has been marked by venality and moral compromise. The faithful have lost all trust in the Papacy, and your spiritual authority is irrevocably broken. The Church faces utter moral decay.', source: 'The Cries of the Faithful', options: [{ text: 'Start Over', effects: [{ type: 'resetGame' }] }] },
        { id: 'game_over_ottoman_invasion', title: 'Rome Falls! The Crescent Triumphs', content: 'The Ottoman hordes swept through Italy, laying waste to the Papal States and conquering Rome itself. The Holy See is desecrated, and Christendom trembles. Your reign ends in utter cataclysm.', source: 'The Chronicles of the Fall', options: [{ text: 'Start Over', effects: [{ type: 'resetGame' }] }] }, // NEW Game Over

        // Triumph conditions (now just flags, not game enders until final evaluation)
        { id: 'triumph_divine_mandate', title: 'An Age of Unwavering Faith Achieved!', content: 'Your piety has inspired Christendom to a new golden age of faith. This achievement will be noted in your final evaluation.', source: 'Divine Providence', options: [{ text: 'Acknowledge this blessing', effects: [] }] },
        { id: 'triumph_absolute_authority', title: 'Papal Hegemony Achieved!', content: 'Through masterful politics, the Holy See has become the undisputed temporal and spiritual power. Kings and Emperors bow to your will. This achievement will be noted in your final evaluation.', source: 'The Throne Room', options: [{ text: 'Relish in your power', effects: [] }] },
        { id: 'triumph_intellectual_renaissance', title: 'The Renaissance Pope!', content: 'Through your patronage and foresight, Rome has become the undeniable center of humanism, art, and scientific inquiry, ushering in a new cultural epoch.', source: 'The Scholars of Europe', options: [{ text: 'Acknowledge this triumph', effects: [] }] }, // NEW Triumph

        // Final Game Evaluation Event
        {
            id: 'final_evaluation',
            title: 'Your Pontificate Concludes!',
            content: 'Your time as Supreme Pontiff has come to an end. The legacy you leave behind will shape the Church for centuries. Let us review your reign...',
            source: 'The Hand of History',
            options: [
                {
                    text: 'Review your legacy.',
                    effects: [
                        { type: 'displayFinalSummary' }
                    ]
                }
            ]
        },
        // Fallback for when no other events are eligible (should be rare with queue)
        {
            id: 'idle_day',
            title: 'A Quiet Day in Rome',
            content: 'The day passes quietly. No urgent matters demand your immediate attention. Perhaps you should review your advisors or provincial reports.',
            source: 'Your Chambers',
            options: [{ text: 'Continue your peaceful contemplation.', effects: [] }]
        }
    ];

    // Random Events Array (separate for easier management of probabilities)
    const randomEvents = [
        { id: 'plague_outbreak', weight: 3, requiredMetrics: { metric: 'publicOpinion', min: 20 } },
        { id: 'noble_dispute_arbitration', weight: 2, requiredFactionFavor: { faction: 'romanBarons', minFavor: 40 } },
        { id: 'heretical_preacher_sighted', weight: 4, requiredMetrics: { metric: 'piety', min: 30 } },
        { id: 'indulgences_proposal', weight: 1, requiredMetrics: { metric: 'gold', max: 50 }, forbiddenFlags: ['jubilee_initiated'] },
        { id: 'poor_relief_plea', weight: 2, requiredMetrics: { metric: 'publicOpinion', max: 70 } },
        { id: 'heresy_inquisition', weight: 2, requiredMetrics: { metric: 'piety', min: 40, max: 80 } },
        { id: 'noble_feud', weight: 2, requiredFactionFavor: { faction: 'romanBarons', minFavor: 20, maxFavor: 80 } },
        { id: 'papal_donation_offer', weight: 2, requiredMetrics: { metric: 'gold', max: 80 } },
        { id: 'advisor_ambition_valerius', weight: 1, requiredAdvisorStats: { advisorId: 'cardinalValerius', stat: 'ambition', min: 60 } },
        { id: 'advisor_corruption_battista', weight: 1, requiredAdvisorTraits: { advisorId: 'monsignorBattista', trait: 'corrupt', value: true } }, // NEW
    ];

    // Province Events (triggered dynamically)
    const provinceEvents = [
        { id: 'province_famine_umbria', provinceId: 'umbria', weight: 3, requiredProvince: { stat: 'prosperity', max: 40 }, forbiddenEvents: ['province_banditry_marche'] },
        { id: 'province_banditry_marche', provinceId: 'marche', weight: 2, requiredProvince: { stat: 'loyalty', max: 50 } },
        { id: 'province_heresy_romagna', provinceId: 'romagna', weight: 3, requiredProvince: { stat: 'heresy', min: 20, max: 80 }, forbiddenFlags: ['policy_active_inquisition'] }, // NEW
        { id: 'invest_in_province_umbria', provinceId: 'umbria', weight: 1, requiredMetrics: { metric: 'gold', min: 30 }, requiredProvince: { stat: 'prosperity', max: 60 } }, // NEW
        { id: 'province_famine_latium', provinceId: 'latium', weight: 1, requiredProvince: { stat: 'prosperity', max: 50 } },
        { id: 'province_unrest_campania', provinceId: 'campania', weight: 2, requiredProvince: { stat: 'loyalty', max: 40 } }, // NEW
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
            if (event.requiredMetrics.metric2) { // Secondary metric check
                const metricValue2 = gameMetrics[event.requiredMetrics.metric2];
                if (metricValue2 === undefined || metricValue2 < event.requiredMetrics.min2 || (event.requiredMetrics.max2 !== undefined && metricValue2 > event.requiredMetrics.max2)) return false;
            }
        }
        if (event.requiredBuildings) {
            const building = gameBuildings[event.requiredBuildings.buildingId];
            if (!building || building.status !== event.requiredBuildings.status) return false;
        }
        if (event.requiredAdvisorStats) {
            const advisor = advisors[event.requiredAdvisorStats.advisorId];
            if (!advisor || !advisor.isAvailable || advisor.stats[event.requiredAdvisorStats.stat] < event.requiredAdvisorStats.min || (event.requiredAdvisorStats.max !== undefined && advisor.stats[event.requiredAdvisorStats.stat] > event.requiredAdvisorStats.max)) return false;
        }
        // NEW: Check for required advisor traits
        if (event.requiredAdvisorTraits) {
            const advisor = advisors[event.requiredAdvisorTraits.advisorId];
            if (!advisor || !advisor.isAvailable || !advisor.traits.includes(event.requiredAdvisorTraits.trait)) return false;
        }
        if (event.requiredProvince) {
            const provinceId = event.context?.province || event.provinceId; // Event specific context takes precedence
            const province = papalStatesProvinces[provinceId];
            if (!province || province[event.requiredProvince.stat] < event.requiredProvince.min || (event.requiredProvince.max !== undefined && province[event.requiredProvince.stat] > event.requiredProvince.max)) return false;
        }
        return true;
    }

    function updateMetric(metricName, value) {
        if (metricName === 'gold' && value === 'dynamic_income') {
            let totalProsperity = 0;
            let totalLoyalty = 0;
            let totalPopulation = 0; // NEW
            let numProvinces = 0;
            for (const pId in papalStatesProvinces) {
                totalProsperity += papalStatesProvinces[pId].prosperity;
                totalLoyalty += papalStatesProvinces[pId].loyalty;
                totalPopulation += papalStatesProvinces[pId].population; // NEW
                numProvinces++;
            }
            const avgProsperity = totalProsperity / numProvinces;
            const avgLoyalty = totalLoyalty / numProvinces;

            // Income based on overall prosperity, public opinion, and loyalty, plus some base
            const calculatedIncome = Math.floor(gameMetrics.publicOpinion / 15) + Math.floor(avgProsperity / 10) + Math.floor(avgLoyalty / 20) + Math.floor(totalPopulation / 100) + 5;
            gameMetrics[metricName] = Math.max(0, gameMetrics[metricName] + calculatedIncome); // Gold can go higher than 100
            console.log(`Gold changed dynamically by: ${calculatedIncome}`);
        } else {
            gameMetrics[metricName] = Math.max(0, Math.min(100, gameMetrics[metricName] + value));
        }

        const metricElement = document.getElementById(`metric-${metricName}`);
        if (metricElement) {
            metricElement.textContent = Math.round(gameMetrics[metricName]); // Round for display
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

    function updateAdvisorStat(advisorId, stat, value) {
        if (advisors[advisorId] && advisors[advisorId].stats[stat] !== undefined) {
            advisors[advisorId].stats[stat] = Math.max(0, Math.min(100, advisors[advisorId].stats[stat] + value));
            console.log(`${advisors[advisorId].name}'s ${stat} changed by ${value} to ${advisors[advisorId].stats[stat]}`);
            updateAdvisorDisplay(); // Refresh advisor UI
        } else {
            console.warn(`Attempted to change stat for unknown advisor or stat: ${advisorId}, ${stat}`);
        }
    }

    function updateProvince(provinceId, stat, value) {
        if (papalStatesProvinces[provinceId] && papalStatesProvinces[provinceId][stat] !== undefined) {
            papalStatesProvinces[provinceId][stat] = Math.max(0, Math.min(100, papalStatesProvinces[provinceId][stat] + value));
            console.log(`${papalStatesProvinces[provinceId].name}'s ${stat} changed by ${value} to ${papalStatesProvinces[provinceId][stat]}`);
            updateMapInfo(); // Refresh map info display
        } else {
            console.warn(`Attempted to change stat for unknown province or stat: ${provinceId}, ${stat}`);
        }
    }

    function addSin(value) {
        gameMetrics.sin = Math.max(0, gameMetrics.sin + value);
        console.log(`Sin accumulated: ${value}. Total Sin: ${gameMetrics.sin}`);
    }

    function addDivineFavor(value) {
        gameMetrics.divineFavor = Math.max(0, Math.min(100, gameMetrics.divineFavor + value));
        console.log(`Divine Favor changed by: ${value}. Total Divine Favor: ${gameMetrics.divineFavor}`);
    }

    function recruitUnits(unitType, value) { // NEW
        if (militaryUnits[unitType] !== undefined) {
            militaryUnits[unitType] += value;
            console.log(`Recruited ${value} ${unitType}. Total: ${militaryUnits[unitType]}`);
        } else {
            console.warn(`Attempted to recruit unknown unit type: ${unitType}`);
        }
    }

    function assignOffice(advisorId, officeId) { // NEW
        // Remove advisor from their old office if they had one
        const oldOfficeId = advisors[advisorId].currentOffice;
        if (oldOfficeId && curialOffices[oldOfficeId]) {
            curialOffices[oldOfficeId].occupiedBy = null;
        }

        // Assign advisor to new office
        advisors[advisorId].currentOffice = officeId;
        if (officeId && curialOffices[officeId]) {
            curialOffices[officeId].occupiedBy = advisorId;
        }
        console.log(`${advisors[advisorId].name} assigned to ${officeId ? curialOffices[officeId].name : 'no office'}.`);
        updateAdvisorDisplay(); // Refresh UI
    }

    function setPolicy(policyId, value) { // NEW
        if (gamePolicies[policyId]) {
            gamePolicies[policyId].isActive = value;
            console.log(`Policy '${gamePolicies[policyId].name}' set to ${value ? 'Active' : 'Inactive'}.`);
            updatePoliciesDisplay(); // Refresh UI
        } else {
            console.warn(`Attempted to set unknown policy: ${policyId}`);
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
        metricPiety.textContent = Math.round(gameMetrics.piety);
        metricAuthority.textContent = Math.round(gameMetrics.authority);
        metricGold.textContent = Math.round(gameMetrics.gold);
        metricPublicOpinion.textContent = Math.round(gameMetrics.publicOpinion);
        metricCardinalFavor.textContent = Math.round(gameMetrics.cardinalFavor);
        metricIntegrity.textContent = Math.round(gameMetrics.integrity);
        metricDivineFavor.textContent = Math.round(gameMetrics.divineFavor);
        metricInfluence.textContent = Math.round(gameMetrics.influence);
        metricCulture.textContent = Math.round(gameMetrics.culture);
    }

    // Function to display an event.
    function displayEvent(event) {
        documentArea.classList.remove('show');
        officeAssignmentContainer.classList.remove('show'); // Hide office assignment if it's open
        setTimeout(() => {
            documentTitle.textContent = event.title;
            documentContent.textContent = event.content;
            documentSource.textContent = `- ${event.source}`;
            optionsContainer.innerHTML = '';

            event.options.forEach((option) => {
                const button = document.createElement('button');
                button.classList.add('option-button');
                button.textContent = option.text;
                button.addEventListener('click', () => applyChoice(option, event.context));
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

    function selectRandomProvinceEvent() {
        const eligibleProvinceEvents = provinceEvents.filter(pe => {
            const eventData = findEventById(pe.id);
            // Temporarily set context for eligibility check
            const tempEvent = { ...eventData, context: { province: pe.provinceId } };
            return tempEvent && isEventEligible(tempEvent);
        });

        if (eligibleProvinceEvents.length === 0) {
            return null;
        }

        const totalWeight = eligibleProvinceEvents.reduce((sum, pe) => sum + pe.weight, 0);
        let randomNum = Math.random() * totalWeight;

        for (const pe of eligibleProvinceEvents) {
            randomNum -= pe.weight;
            if (randomNum <= 0) {
                const eventData = findEventById(pe.id);
                eventData.context = { province: pe.provinceId };
                return eventData;
            }
        }
        return null;
    }

    function selectRandomFactionDemand() {
        // Filter for internal factions not at max favor and some random chance
        const internalFactions = Object.values(gameFactions).filter(faction =>
            faction.type === 'internal' && faction.favor < 90 && Math.random() < 0.5
        );
        if (internalFactions.length === 0) return null;

        const randomFaction = internalFactions[Math.floor(Math.random() * internalFactions.length)];
        let demandContent = '';
        let positiveEffects = [];
        let negativeEffects = [];
        let demandType = '';

        const desiredMetricKeys = Object.keys(randomFaction.desiredMetrics);
        const desiredFlagKeys = randomFaction.desiredFlags;

        // Prioritize demanding a policy/flag if desired and not set
        if (desiredFlagKeys.length > 0 && !gameFlags[desiredFlagKeys[0]] && Math.random() < 0.6) {
            const flagToDemand = desiredFlagKeys[0];
            const policy = gamePolicies[flagToDemand];
            if (policy) {
                demandType = `Enact Policy: ${policy.name}`;
                demandContent = `The ${randomFaction.name} strongly urge you to enact the policy of "${policy.name}" to address current deficiencies.`;
                positiveEffects.push({ type: 'setPolicy', policyId: flagToDemand, value: true });
                positiveEffects.push({ type: 'factionChange', faction: randomFaction.id, value: 25 });
                negativeEffects.push({ type: 'factionChange', faction: randomFaction.id, value: -20 });
            }
        } else if (desiredMetricKeys.length > 0) { // Or demand a metric change
            const metricToDemand = desiredMetricKeys[Math.floor(Math.random() * desiredMetricKeys.length)];
            const currentMetricValue = gameMetrics[metricToDemand];
            const desiredMetricValue = randomFaction.desiredMetrics[metricToDemand];

            if (currentMetricValue < desiredMetricValue - 10) {
                demandType = `Increase ${metricToDemand.charAt(0).toUpperCase() + metricToDemand.slice(1)}`;
                demandContent = `The ${randomFaction.name} demand that you take action to increase the Church's ${metricToDemand}, which they feel is too low.`;
                positiveEffects.push({ type: 'metricChange', metric: metricToDemand, value: 10 });
                positiveEffects.push({ type: 'factionChange', faction: randomFaction.id, value: 15 });
                negativeEffects.push({ type: 'factionChange', faction: randomFaction.id, value: -15 });
            } else if (currentMetricValue > desiredMetricValue + 10 && Math.random() < 0.3) { // Less common to demand decrease
                demandType = `Decrease ${metricToDemand.charAt(0).toUpperCase() + metricToDemand.slice(1)}`;
                demandContent = `The ${randomFaction.name} are concerned by the excessively high ${metricToDemand} of the Church. They urge you to moderate this trend.`;
                positiveEffects.push({ type: 'metricChange', metric: metricToDemand, value: -10 });
                positiveEffects.push({ type: 'factionChange', faction: randomFaction.id, value: 10 });
                negativeEffects.push({ type: 'factionChange', faction: randomFaction.id, value: -10 });
            }
        }

        if (!demandContent) return null;

        const eventId = `faction_demand_${randomFaction.id}_${gameDay}`;
        const genericDemandEvent = {
            id: eventId,
            title: `${randomFaction.name}'s Demand: ${demandType}`,
            content: demandContent,
            source: randomFaction.name,
            options: [
                {
                    text: `Grant their request.`,
                    effects: positiveEffects
                },
                {
                    text: `Decline.`,
                    effects: negativeEffects
                }
            ]
        };

        events.push(genericDemandEvent); // Add dynamically to events list
        return genericDemandEvent;
    }

    function checkGameStatusAndQueueEvents() {
        if (hasGameEnded) return;

        // --- Game Over Conditions (Highest Priority) ---
        const gameOverChecks = [
            { cond: gameMetrics.piety <= 0, eventId: 'game_over_heresy' },
            { cond: gameMetrics.publicOpinion <= 0, eventId: 'game_over_tyranny' },
            { cond: gameMetrics.gold <= -100, eventId: 'game_over_impoverished' }, // More lenient for debt
            { cond: gameMetrics.cardinalFavor <= 0, eventId: 'game_over_deposed_cardinals' },
            { cond: gameFactions.hre.favor <= 0 && gameMetrics.authority < 20, eventId: 'game_over_imperial_control' },
            { cond: gameFactions.romanBarons.favor <= 0 && gameMetrics.authority < 30, eventId: 'game_over_noble_revolt' },
            { cond: gameMetrics.integrity <= 0, eventId: 'game_over_corrupt' },
            { cond: gameFactions.ottomans.favor < -50 && militaryUnits.papal_guard_units + militaryUnits.mercenary_units < 10 && gameDay % 30 === 0 && Math.random() < 0.1, eventId: 'game_over_ottoman_invasion' } // Ottomans invade if weak
        ];

        for (const check of gameOverChecks) {
            if (check.cond) {
                gameEventQueue.push({ eventId: check.eventId, priority: 100 });
                hasGameEnded = true;
                return;
            }
        }

        // --- Triumph/High Metric Conditions (High Priority, but not ending the game immediately) ---
        if (gameMetrics.piety >= 95 && !gameFlags.triumph_divine_mandate_achieved) {
            gameFlags.triumph_divine_mandate_achieved = true;
            gameEventQueue.push({ eventId: 'triumph_divine_mandate', priority: 95 });
        }
        if (gameMetrics.authority >= 95 && !gameFlags.triumph_absolute_authority_achieved) {
            gameFlags.triumph_absolute_authority_achieved = true;
            gameEventQueue.push({ eventId: 'triumph_absolute_authority', priority: 95 });
        }
        if (gameMetrics.culture >= 90 && gameBuildings.university_of_rome.status === 'completed' && gameFlags.policy_patronage_of_arts && !gameFlags.triumph_intellectual_renaissance) { // NEW Triumph condition
            gameFlags.triumph_intellectual_renaissance = true;
            gameEventQueue.push({ eventId: 'triumph_intellectual_renaissance', priority: 95 });
        }
    }

    function checkBuildingProgressAndQueueEvents() {
        for (const buildingId in gameBuildings) {
            const building = gameBuildings[buildingId];
            if (building.status === 'under_construction') {
                building.daysRemaining--;
                if (building.daysRemaining <= 0) {
                    building.status = 'completed';
                    building.level = 1;
                    console.log(`${buildingId} construction completed!`);
                    if (building.completionEventId) {
                        gameEventQueue.push({ eventId: building.completionEventId, priority: 80 });
                    }
                }
            }
        }
    }

    function applyPassiveBonuses() {
        // Building Passive Bonuses
        for (const buildingId in gameBuildings) {
            const building = gameBuildings[buildingId];
            if (building.status === 'completed' && building.passiveBonuses) {
                for (const metric in building.passiveBonuses) {
                    const bonusValue = building.passiveBonuses[metric];
                    if (gameMetrics[metric] !== undefined) {
                        gameMetrics[metric] = Math.min(100, gameMetrics[metric] + bonusValue); // Apply directly, capped at 100
                    } else if (gameFactions[metric]) { // Check if it's a faction bonus
                         gameFactions[metric].favor = Math.min(100, gameFactions[metric].favor + bonusValue);
                    }
                }
            }
        }
        // Curial Office Passive Bonuses
        for (const officeId in curialOffices) {
            const office = curialOffices[officeId];
            if (office.occupiedBy && advisors[office.occupiedBy].isAvailable) {
                for (const metric in office.bonus) {
                    const bonusValue = office.bonus[metric];
                    if (gameMetrics[metric] !== undefined) {
                        gameMetrics[metric] = Math.min(100, gameMetrics[metric] + bonusValue);
                    } else if (gameFactions[metric]) {
                        gameFactions[metric].favor = Math.min(100, gameFactions[metric].favor + bonusValue);
                    }
                }
            }
        }
        // Policy Passive Effects & Costs
        for (const policyId in gamePolicies) {
            const policy = gamePolicies[policyId];
            if (policy.isActive) {
                for (const metric in policy.passiveEffects) {
                    const effectValue = policy.passiveEffects[metric];
                    if (gameMetrics[metric] !== undefined) {
                        gameMetrics[metric] = Math.min(100, gameMetrics[metric] + effectValue);
                    } else if (gameFactions[metric]) {
                        gameFactions[metric].favor = Math.max(0, gameFactions[metric].favor + effectValue); // Faction favor can decrease
                    } else if (metric === 'heresy') { // Special handling for heresy
                         for(const provId in papalStatesProvinces) {
                             papalStatesProvinces[provId].heresy = Math.max(0, papalStatesProvinces[provId].heresy + effectValue);
                         }
                    }
                }
                for (const costMetric in policy.cost) {
                    const costValue = policy.cost[costMetric];
                    gameMetrics[costMetric] = Math.max(0, gameMetrics[costMetric] - costValue); // Costs can reduce metric below 0 for gold
                }
            }
        }

        // Apply global integrity/sin effects to Divine Favor
        const integrityEffect = (gameMetrics.integrity - 50) * 0.1; // +5 for high integrity, -5 for low
        const sinEffect = -gameMetrics.sin * 0.05; // -0.5 for every 10 sin
        gameMetrics.divineFavor = Math.max(0, Math.min(100, gameMetrics.divineFavor + integrityEffect + sinEffect));

        updateAllMetricsDisplay(); // Update display after all passive changes
    }

    function checkDelayedEventsAndQueue() {
        gameEventQueue = gameEventQueue.filter(event => {
            if (event.type === 'delayed' && gameDay >= event.triggerDay) {
                gameEventQueue.push({ eventId: event.eventId, priority: 90, context: event.context });
                return false;
            }
            return true;
        });
    }

    function checkDivineEventsAndQueue() {
        if (gameMetrics.divineFavor > 80 && gameMetrics.sin < 20 && Math.random() < 0.03) {
            gameEventQueue.push({ eventId: 'divine_blessing', priority: 65 });
            addDivineFavor(-10);
        }
        if (gameMetrics.divineFavor < 20 && gameMetrics.sin > 50 && Math.random() < 0.03) {
            gameEventQueue.push({ eventId: 'divine_wrath', priority: 65 });
            addSin(-10);
        }
    }

    // Main daily game loop logic - adds events to queue
    function dailyChecksAndQueueEvents() {
        checkGameStatusAndQueueEvents();
        checkBuildingProgressAndQueueEvents();
        checkDelayedEventsAndQueue();
        checkDivineEventsAndQueue();

        applyPassiveBonuses(); // Apply passive bonuses before anything else changes metrics

        // Recurring Events
        if (gameDay % 30 === 0 && gameDay > 0) {
            const recurringEvent = findEventById('monthly_treasury_report');
            if (recurringEvent && isEventEligible(recurringEvent)) {
                gameEventQueue.push({ eventId: recurringEvent.id, priority: 70 });
            }
            // Check for office assignment opportunities monthly
            const officeEvent = findEventById('office_assignment_opportunity');
            if (officeEvent && isEventEligible(officeEvent)) {
                gameEventQueue.push({ eventId: officeEvent.id, priority: 70 });
            }
        }
        if (gameDay % 100 === 0 && gameDay > 0) {
            const recurringEvent = findEventById('annual_pilgrimage_season');
            if (recurringEvent && isEventEligible(recurringEvent)) {
                gameEventQueue.push({ eventId: recurringEvent.id, priority: 70 });
            }
        }

        // Random Faction Demands
        if (gameDay > 50 && gameDay % 45 === 0) {
            const factionDemandEvent = selectRandomFactionDemand();
            if (factionDemandEvent) {
                gameEventQueue.push({ eventId: factionDemandEvent.id, priority: 75 });
            }
        }

        // Random Province Events
        if (gameDay > 30 && gameDay % 25 === 0) {
            const provinceEvent = selectRandomProvinceEvent();
            if (provinceEvent) {
                gameEventQueue.push({ eventId: provinceEvent.id, priority: 60 });
            }
        }

        // General Random Events
        if (Math.random() < 0.2) {
            const randomEvent = selectRandomEvent();
            if (randomEvent) {
                gameEventQueue.push({ eventId: randomEvent.id, priority: 40 });
            }
        }

        // Check if MAX_GAME_DAYS reached (triggers final evaluation)
        if (gameDay >= MAX_GAME_DAYS && !hasGameEnded) {
            gameEventQueue.push({ eventId: 'final_evaluation', priority: 100 });
            hasGameEnded = true;
        }
    }

    function loadNextEventFromQueue() {
        gameEventQueue = gameEventQueue.filter(queuedEvent => {
            const eventData = findEventById(queuedEvent.eventId);
            // Re-check eligibility with the current game state, respecting specific event contexts
            const tempEvent = { ...eventData, context: queuedEvent.context };
            return eventData && isEventEligible(tempEvent);
        });

        if (gameEventQueue.length === 0) {
            const nextMainEvent = events[mainStoryEventIndex];
            if (nextMainEvent && isEventEligible(nextMainEvent) && !nextMainEvent.id.startsWith('game_over_') && !nextMainEvent.id.startsWith('triumph_')) {
                const systemEventIds = ['monthly_treasury_report', 'annual_pilgrimage_season', 'st_peters_completed', 'papal_library_completed', 'hospice_completed', 'university_completed', 'vatican_gardens_completed', 'jubilee_outcome', 'final_evaluation', 'divine_blessing', 'divine_wrath', 'office_assignment_opportunity', 'umbria_investment_result', 'council_infallibility_outcome', 'ottoman_war_outcome', 'ottoman_appeasement_outcome'];
                if (!systemEventIds.includes(nextMainEvent.id) && !nextMainEvent.id.startsWith('faction_demand_') && !nextMainEvent.id.startsWith('province_')) {
                    displayEvent(nextMainEvent);
                    return;
                }
            }
            displayEvent(findEventById('idle_day'));
            return;
        }

        gameEventQueue.sort((a, b) => b.priority - a.priority);

        const nextQueuedEvent = gameEventQueue.shift();
        const eventToLoad = findEventById(nextQueuedEvent.eventId);

        if (eventToLoad && isEventEligible(eventToLoad)) {
            // Apply event context to the event being displayed
            eventToLoad.context = nextQueuedEvent.context || {};
            displayEvent(eventToLoad);
        } else {
            console.warn(`Queued event '${nextQueuedEvent.eventId}' (Priority: ${nextQueuedEvent.priority}) is not eligible or not found. Skipping.`);
            loadNextEventFromQueue();
        }
    }

    function displayFinalSummary() {
        documentArea.classList.remove('show');
        setTimeout(() => {
            documentTitle.textContent = 'Your Pontificate: A Historical Review';
            let summaryContent = '<p>You have concluded your reign as Supreme Pontiff. The legacy you leave behind will shape the Church for centuries. Here is your legacy:</p>';

            summaryContent += '<h3>Final Metrics:</h3>';
            summaryContent += `<ul>
                <li>Piety: ${Math.round(gameMetrics.piety)}</li>
                <li>Authority: ${Math.round(gameMetrics.authority)}</li>
                <li>Gold: ${Math.round(gameMetrics.gold)}</li>
                <li>Public Opinion: ${Math.round(gameMetrics.publicOpinion)}</li>
                <li>Cardinal Favor: ${Math.round(gameMetrics.cardinalFavor)}</li>
                <li>Integrity: ${Math.round(gameMetrics.integrity)}</li>
                <li>Divine Favor: ${Math.round(gameMetrics.divineFavor)}</li>
                <li>Influence: ${Math.round(gameMetrics.influence)}</li>
                <li>Culture: ${Math.round(gameMetrics.culture)}</li>
            </ul>`;

            summaryContent += '<h3>Key Achievements:</h3><ul>';
            if (gameFlags.triumph_divine_mandate_achieved) summaryContent += '<li>**Divine Mandate:** You inspired an age of unwavering faith!</li>';
            if (gameFlags.triumph_absolute_authority_achieved) summaryContent += '<li>**Absolute Authority:** The Papacy\'s power became unquestioned!</li>';
            if (gameFlags.triumph_intellectual_renaissance) summaryContent += '<li>**Intellectual Renaissance:** You fostered an unprecedented era of learning and art!</li>'; // NEW
            if (gameFlags.crusade_launched && gameFlags.crusade_report_received) summaryContent += '<li>**Holy Crusade:** You answered the call to arms for the Holy Land.</li>';
            if (gameFlags.papal_bull_issued) summaryContent += '<li>**Papal Bull:** You decisively shaped theological doctrine.</li>';
            if (gameFlags.jubilee_initiated) summaryContent += '<li>**Grand Jubilee:** You brought pilgrims and blessings to Rome.</li>';
            if (gameBuildings.st_peters_basilica_reconstruction.status === 'completed') summaryContent += '<li>**St. Peter\'s Basilica:** You oversaw the reconstruction of the holiest church!</li>';
            if (gameBuildings.papal_library.status === 'completed') summaryContent += '<li>**Papal Library:** You fostered knowledge and intellectual pursuit.</li>';
            if (gameBuildings.hospice_of_st_lazarus.status === 'completed') summaryContent += '<li>**Hospice of St. Lazarus:** Your charity brought comfort to the poor!</li>';
            if (gameBuildings.university_of_rome.status === 'completed') summaryContent += '<li>**University of Rome:** You established a renowned center of higher learning!</li>'; // NEW
            if (gameBuildings.vatican_gardens.status === 'completed') summaryContent += '<li>**Vatican Gardens:** You created a masterpiece of beauty and tranquility!</li>'; // NEW
            if (gameFlags.policy_centralized_power) summaryContent += '<li>**Centralized Church Power:** You consolidated Rome\'s authority.</li>';
            if (gameFlags.policy_promote_education) summaryContent += '<li>**Promoted Education:** You championed widespread learning.</li>';
            if (gameFlags.policy_active_inquisition) summaryContent += '<li>**Active Inquisition:** You rigorously defended orthodoxy.</li>';
            if (gameFlags.policy_patronage_of_arts) summaryContent += '<li>**Patron of the Arts:** You ushered in an era of artistic splendor.</li>';
            if (gameFlags.doctrine_papal_infallibility_affirmed) summaryContent += '<li>**Papal Infallibility:** You cemented the Pope\'s supreme spiritual authority.</li>';

            if (!gameFlags.triumph_divine_mandate_achieved && !gameFlags.triumph_absolute_authority_achieved && !gameFlags.triumph_intellectual_renaissance) {
                summaryContent += '<li>No major triumphs achieved.</li>';
            }
            summaryContent += '</ul>';

            // Add narrative based on overall metrics/flags (more detailed)
            summaryContent += '<h3>Historical Assessment:</h3>';
            let finalVerdict = 'Your pontificate was marked by complex challenges. History\'s judgment is yet to be fully cast on your complex legacy.';

            if (gameMetrics.divineFavor > 80 && gameMetrics.integrity > 80 && gameMetrics.piety > 80) {
                finalVerdict = 'Your reign is remembered as a **Golden Age of Piety and Virtue**, truly blessed by God and revered by all. A Saintly Pope.';
            } else if (gameMetrics.authority > 80 && gameMetrics.influence > 80 && gameMetrics.gold > 80) {
                finalVerdict = 'You were a **powerful and pragmatic leader**, establishing the Papacy as an unshakeable temporal and financial force. The Iron Pope.';
            } else if (gameMetrics.publicOpinion > 70 && gameMetrics.cardinalFavor > 70 && gameMetrics.integrity > 60) {
                finalVerdict = 'You were a **beloved and diplomatic pontiff**, unifying the faithful and the College of Cardinals through wisdom and compassion. The Good Pope.';
            } else if (gameMetrics.culture > 70 && gameMetrics.gold > 60 && gameBuildings.university_of_rome.status === 'completed') {
                finalVerdict = 'You were a **Visionary Patron of the Arts and Sciences**, ushering in a new era of intellectual and artistic flourishing. The Renaissance Pope.';
            } else if (gameMetrics.sin > 50 && gameMetrics.integrity < 30) {
                finalVerdict = 'Your pontificate was ultimately **marred by venality and moral decay**, leaving a shadow upon the Holy See. The Corrupt Pope.';
            } else if (gameMetrics.authority < 30 && militaryUnits.papal_guard_units + militaryUnits.mercenary_units < 20) {
                finalVerdict = 'Your weakness left the Papacy vulnerable, struggling to assert its authority in a turbulent world. The Weak Pope.';
            }

            summaryContent += `<p>${finalVerdict}</p>`;

            documentContent.innerHTML = summaryContent;
            documentSource.textContent = '— The Judgment of History';
            optionsContainer.innerHTML = '<button class="option-button" id="start-new-game-button">Begin a New Pontificate</button>';
            document.getElementById('start-new-game-button').addEventListener('click', initGame);

            documentArea.classList.add('show');
        }, 300);
    }


    /**
     * Applies the effects of a chosen option and proceeds to the next day/event.
     * @param {object} chosenOption The option object that was clicked.
     * @param {object} eventContext The context object passed from the event (e.g., {province: 'umbria'})
     */
    function applyChoice(chosenOption, eventContext = {}) {
        // Apply all effects defined for the chosen option
        chosenOption.effects.forEach(effect => {
            if (effect.type === 'metricChange') {
                updateMetric(effect.metric, effect.value);
            } else if (effect.type === 'scheduleNextMainEvent') {
                const targetEventId = effect.overrideEventId || events[mainStoryEventIndex + 1]?.id;
                if (targetEventId) {
                    const eventData = findEventById(targetEventId);
                    if (eventData) {
                        const isAlreadyQueued = gameEventQueue.some(item => item.eventId === targetEventId && item.priority === 50);
                        if (!isAlreadyQueued) {
                            gameEventQueue.push({ eventId: targetEventId, priority: 50, context: eventContext });
                            console.log(`Scheduled next main event: ${targetEventId}`);
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
                gameEventQueue.push({ eventId: effect.eventId, priority: 90, type: 'delayed', triggerDay: gameDay + effect.days, context: eventContext });
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
                    if (cond.metric2) { // Secondary metric for conditional effect
                        const val = gameMetrics[cond.metric2];
                        if (val === undefined) return false;
                        if (cond.min2 !== undefined && val < cond.min2) return false;
                        if (cond.max2 !== undefined && val > cond.max2) return false;
                    }
                    if (cond.faction) {
                        const faction = gameFactions[cond.faction.factionId];
                        if (!faction || faction.favor < cond.faction.minFavor || (cond.faction.maxFavor !== undefined && faction.favor > cond.faction.maxFavor)) return false;
                    }
                    if (cond.advisor) {
                        const advisor = advisors[cond.advisor.advisorId];
                        if (!advisor || advisor.stats[cond.advisor.stat] === undefined || advisor.stats[cond.advisor.stat] < cond.advisor.min || (cond.advisor.max !== undefined && advisor.stats[cond.advisor.stat] > cond.advisor.max)) return false;
                    }
                    return true;
                })();

                if (conditionMet) {
                    console.log(`Conditional effect condition met: ${JSON.stringify(effect.condition)}. Applying sub-effects...`);
                    effect.effects.forEach(subEffect => {
                        if (subEffect.type === 'metricChange') { updateMetric(subEffect.metric, subEffect.value); }
                        else if (subEffect.type === 'factionChange') { updateFactionFavor(subEffect.faction, subEffect.value); }
                        else if (subEffect.type === 'updateAdvisorStat') { updateAdvisorStat(subEffect.advisorId, subEffect.stat, subEffect.value); }
                        else if (subEffect.type === 'updateProvince') { updateProvince(subEffect.provinceId || eventContext.province, subEffect.stat, subEffect.value); }
                        else if (subEffect.type === 'addSin') { addSin(subEffect.value); }
                        else if (subEffect.type === 'addDivineFavor') { addDivineFavor(subEffect.value); }
                        else if (subEffect.type === 'recruitUnits') { recruitUnits(subEffect.unitType, subEffect.value); } // NEW
                        else if (subEffect.type === 'assignOffice') { assignOffice(subEffect.advisorId, subEffect.officeId); } // NEW
                        else if (subEffect.type === 'setPolicy') { setPolicy(subEffect.policyId, subEffect.value); } // NEW
                    });
                } else {
                    console.log(`Conditional effect condition NOT met: ${JSON.stringify(effect.condition)}. Skipping sub-effects.`);
                }
            } else if (effect.type === 'updateAdvisorStat') {
                updateAdvisorStat(effect.advisorId, effect.stat, effect.value);
            } else if (effect.type === 'updateProvince') {
                const targetProvince = effect.provinceId || eventContext.province;
                if (targetProvince) {
                    updateProvince(targetProvince, effect.stat, effect.value);
                } else {
                    console.warn(`Update Province effect without specified province or context.`);
                }
            } else if (effect.type === 'addSin') {
                addSin(effect.value);
            } else if (effect.type === 'addDivineFavor') {
                addDivineFavor(effect.value);
            } else if (effect.type === 'recruitUnits') { // NEW
                recruitUnits(effect.unitType, effect.value);
            } else if (effect.type === 'assignOffice') { // NEW
                assignOffice(effect.advisorId, effect.officeId);
            } else if (effect.type === 'setPolicy') { // NEW
                setPolicy(effect.policyId, effect.value);
            } else if (effect.type === 'triggeredEvent') {
                gameEventQueue.push({ eventId: effect.eventId, priority: 50, context: effect.context || {} });
                console.log(`Triggered event '${effect.eventId}' added to queue.`);
            } else if (effect.type === 'resetGame') {
                initGame();
                return;
            } else if (effect.type === 'displayFinalSummary') {
                displayFinalSummary();
                return;
            } else if (effect.type === 'showOfficeAssignment') { // NEW: Special UI effect
                documentArea.classList.remove('show');
                showOfficeAssignmentUI();
                return; // Don't advance day here, wait for assignment decision
            }
        });

        if (chosenOption.effects.some(e => e.type === 'resetGame' || e.type === 'displayFinalSummary' || e.type === 'showOfficeAssignment')) {
            return;
        }

        gameDay++;
        gameDayCounter.textContent = gameDay;

        dailyChecksAndQueueEvents();
        loadNextEventFromQueue();
    }


    // --- UI Update Functions ---
    // Update map info display
    function updateMapInfo() {
        latiumInfo.textContent = `Latium: Pros. ${papalStatesProvinces.latium.prosperity}, Loy. ${papalStatesProvinces.latium.loyalty}, Her. ${papalStatesProvinces.latium.heresy}`;
        umbriaInfo.textContent = `Umbria: Pros. ${papalStatesProvinces.umbria.prosperity}, Loy. ${papalStatesProvinces.umbria.loyalty}, Her. ${papalStatesProvinces.umbria.heresy}`;
        marcheInfo.textContent = `Marche: Pros. ${papalStatesProvinces.marche.prosperity}, Loy. ${papalStatesProvinces.marche.loyalty}, Her. ${papalStatesProvinces.marche.heresy}`;
        romagnaInfo.textContent = `Romagna: Pros. ${papalStatesProvinces.romagna.prosperity}, Loy. ${papalStatesProvinces.romagna.loyalty}, Her. ${papalStatesProvinces.romagna.heresy}`;
        campaniaInfo.textContent = `Campania: Pros. ${papalStatesProvinces.campania.prosperity}, Loy. ${papalStatesProvinces.campania.loyalty}, Her. ${papalStatesProvinces.campania.heresy}`;
    }

    // Update Advisor Roster Display
    function updateAdvisorDisplay() {
        advisorRoster.innerHTML = ''; // Clear current display
        for (const advisorId in advisors) {
            const advisor = advisors[advisorId];
            if (!advisor.isAvailable) continue; // Skip if dismissed/unavailable

            const advisorDiv = document.createElement('div');
            advisorDiv.classList.add('advisor-card');
            advisorDiv.innerHTML = `
                <h3>${advisor.name}</h3>
                <p>Role: ${advisor.currentOffice ? curialOffices[advisor.currentOffice].name : 'Unassigned'}</p>
                <p>Wisdom: ${advisor.stats.wisdom} | Intrigue: ${advisor.stats.intrigue} | Diplomacy: ${advisor.stats.diplomacy}</p>
                <p>Piety: ${advisor.stats.piety} | Finance: ${advisor.stats.finance} | Military: ${advisor.stats.military}</p>
                <p>Loyalty: ${advisor.stats.loyalty} | Ambition: ${advisor.stats.ambition}</p>
                <p>Traits: ${advisor.traits.join(', ')}</p>
                <button class="assign-office-button" data-advisor-id="${advisor.id}">Assign Office</button>
            `;
            advisorRoster.appendChild(advisorDiv);
        }

        // Add event listeners for assign office buttons
        document.querySelectorAll('.assign-office-button').forEach(button => {
            button.addEventListener('click', (event) => {
                const advisorId = event.target.dataset.advisorId;
                showOfficeAssignmentUI(advisorId);
            });
        });
    }

    // Show Office Assignment UI
    function showOfficeAssignmentUI(selectedAdvisorId = null) {
        documentArea.classList.remove('show');
        officeAssignmentContainer.innerHTML = ''; // Clear previous content

        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.classList.add('close-button');
        closeButton.addEventListener('click', () => {
            officeAssignmentContainer.classList.remove('show');
            loadNextEventFromQueue(); // Resume game after closing
        });
        officeAssignmentContainer.appendChild(closeButton);

        const title = document.createElement('h2');
        title.textContent = 'Assign Curial Office';
        officeAssignmentContainer.appendChild(title);

        const advisorSelect = document.createElement('select');
        advisorSelect.id = 'advisor-select';
        let defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select an Advisor';
        advisorSelect.appendChild(defaultOption);

        let currentAdvisorId = selectedAdvisorId;

        for (const advisorId in advisors) {
            const advisor = advisors[advisorId];
            if (advisor.isAvailable) {
                const option = document.createElement('option');
                option.value = advisor.id;
                option.textContent = advisor.name + (advisor.currentOffice ? ` (Current: ${curialOffices[advisor.currentOffice].name})` : ' (Unassigned)');
                if (advisor.id === currentAdvisorId) {
                    option.selected = true;
                }
                advisorSelect.appendChild(option);
            }
        }
        officeAssignmentContainer.appendChild(advisorSelect);

        const officeSelect = document.createElement('select');
        officeSelect.id = 'office-select';
        defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select an Office';
        officeSelect.appendChild(defaultOption);

        for (const officeId in curialOffices) {
            const office = curialOffices[officeId];
            const option = document.createElement('option');
            option.value = office.id;
            option.textContent = office.name + (office.occupiedBy ? ` (Occupied by ${advisors[office.occupiedBy].name})` : '');
            officeSelect.appendChild(option);
        }
        officeAssignmentContainer.appendChild(officeSelect);

        const assignButton = document.createElement('button');
        assignButton.textContent = 'Assign';
        assignButton.classList.add('assign-button');
        officeAssignmentContainer.appendChild(assignButton);

        const feedbackDiv = document.createElement('div');
        feedbackDiv.id = 'assignment-feedback';
        feedbackDiv.style.marginTop = '10px';
        feedbackDiv.style.color = 'yellow';
        officeAssignmentContainer.appendChild(feedbackDiv);

        assignButton.addEventListener('click', () => {
            const selectedAdvisor = advisorSelect.value;
            const selectedOffice = officeSelect.value;
            const feedback = document.getElementById('assignment-feedback');

            if (!selectedAdvisor || !selectedOffice) {
                feedback.textContent = 'Please select both an advisor and an office.';
                return;
            }

            const advisor = advisors[selectedAdvisor];
            const office = curialOffices[selectedOffice];

            if (office.occupiedBy === advisor.id) {
                feedback.textContent = `${advisor.name} already holds the office of ${office.name}.`;
                return;
            }
            if (office.occupiedBy && office.occupiedBy !== advisor.id) {
                feedback.textContent = `The office of ${office.name} is currently occupied by ${advisors[office.occupiedBy].name}. Dismiss them first!`;
                return;
            }
            if (advisor.currentOffice && advisor.currentOffice !== selectedOffice) {
                feedback.textContent = `${advisor.name} currently holds the office of ${curialOffices[advisor.currentOffice].name}. They must be unassigned first.`;
                return;
            }

            // Check if advisor meets required stats
            const requiredStat = office.requiredStat;
            if (advisor.stats[requiredStat.stat] < requiredStat.min) {
                feedback.textContent = `${advisor.name}'s ${requiredStat.stat} (${advisor.stats[requiredStat.stat]}) is too low. Requires ${requiredStat.min}.`;
                return;
            }

            assignOffice(selectedAdvisor, selectedOffice);
            feedback.textContent = `${advisor.name} successfully assigned to ${office.name}!`;
            updateAdvisorDisplay(); // Refresh advisor list on main screen
            updateOfficeAssignmentUI(); // Refresh this UI as well

            // If this was triggered by an event, we need to signify completion
            // No direct game progression here, user closes when ready.
        });

        // Initial update of dropdowns
        updateOfficeAssignmentUI();
        officeAssignmentContainer.classList.add('show');
    }

    // Helper to refresh office assignment UI contents after a change
    function updateOfficeAssignmentUI() {
        const advisorSelect = document.getElementById('advisor-select');
        const officeSelect = document.getElementById('office-select');

        // Rebuild advisor options
        let currentAdvisorId = advisorSelect.value;
        advisorSelect.innerHTML = '<option value="">Select an Advisor</option>';
        for (const advisorId in advisors) {
            const advisor = advisors[advisorId];
            if (advisor.isAvailable) {
                const option = document.createElement('option');
                option.value = advisor.id;
                option.textContent = advisor.name + (advisor.currentOffice ? ` (Current: ${curialOffices[advisor.currentOffice].name})` : ' (Unassigned)');
                if (advisor.id === currentAdvisorId) {
                    option.selected = true;
                }
                advisorSelect.appendChild(option);
            }
        }

        // Rebuild office options and set occupiedBy fields
        officeSelect.innerHTML = '<option value="">Select an Office</option>';
        for (const officeId in curialOffices) {
            const office = curialOffices[officeId];
            const option = document.createElement('option');
            option.value = office.id;
            option.textContent = office.name + (office.occupiedBy ? ` (Occupied by ${advisors[office.occupiedBy].name})` : '');
            officeSelect.appendChild(option);
        }

        // Set `occupiedBy` in `curialOffices` based on current advisor roles
        for (const officeId in curialOffices) {
            curialOffices[officeId].occupiedBy = null; // Clear all first
        }
        for (const advisorId in advisors) {
            const advisor = advisors[advisorId];
            if (advisor.currentOffice && curialOffices[advisor.currentOffice]) {
                curialOffices[advisor.currentOffice].occupiedBy = advisor.id;
            }
        }
    }


    // Update Policies Display
    function updatePoliciesDisplay() {
        policiesList.innerHTML = '';
        for (const policyId in gamePolicies) {
            const policy = gamePolicies[policyId];
            const policyItem = document.createElement('li');
            policyItem.textContent = `${policy.name}: ${policy.isActive ? 'Active' : 'Inactive'}`;
            policiesList.appendChild(policyItem);
        }
    }


    // --- Event Listeners for UI ---
    mapButton.addEventListener('click', () => {
        mapOverlay.classList.add('show');
        updateMapInfo();
    });

    closeMapButton.addEventListener('click', () => {
        mapOverlay.classList.remove('show');
    });


    // --- Game Initialization ---
    function initGame() {
        // Reset Metrics
        gameMetrics.piety = 50;
        gameMetrics.authority = 50;
        gameMetrics.gold = 100;
        gameMetrics.publicOpinion = 50;
        gameMetrics.cardinalFavor = 50;
        gameMetrics.integrity = 50;
        gameMetrics.divineFavor = 50;
        gameMetrics.sin = 0;
        gameMetrics.influence = 50; // NEW
        gameMetrics.culture = 50;   // NEW

        // Reset Flags
        for (const flag in gameFlags) {
            gameFlags[flag] = false;
        }

        // Reset Faction Favors
        for (const factionKey in gameFactions) {
            gameFactions[factionKey].favor = 50;
            if (gameFactions[factionKey].type === 'external') {
                gameFactions[factionKey].attitude = 'neutral';
            }
        }
        gameFactions.ottomans.favor = 0; // Ottomans start hostile/very low favor

        // Reset Building Status
        for (const buildingId in gameBuildings) {
            const building = gameBuildings[buildingId];
            building.level = 0;
            building.status = 'none';
            building.daysRemaining = 0;
        }

        // Reset Advisors
        advisors.cardinalValerius.stats = { wisdom: 80, intrigue: 30, diplomacy: 70, piety: 60, finance: 50, military: 20, loyalty: 90, ambition: 40 };
        advisors.cardinalValerius.traits = ['loyal', 'wise', 'diplomat'];
        advisors.cardinalValerius.isAvailable = true;

        advisors.brotherThomas.stats = { wisdom: 50, intrigue: 60, diplomacy: 30, piety: 90, finance: 10, military: 70, loyalty: 85, ambition: 30 };
        advisors.brotherThomas.traits = ['zealous', 'stern', 'inquisitor'];
        advisors.brotherThomas.isAvailable = true;

        advisors.monsignorBattista.stats = { wisdom: 70, intrigue: 80, diplomacy: 60, piety: 50, finance: 60, military: 30, loyalty: 65, ambition: 70 };
        advisors.monsignorBattista.traits = ['scheming', 'ambitious', 'well_connected'];
        advisors.monsignorBattista.isAvailable = true;

        advisors.cardinalBenedict.stats = { wisdom: 75, intrigue: 50, diplomacy: 70, piety: 80, finance: 40, military: 25, loyalty: 70, ambition: 55 };
        advisors.cardinalBenedict.traits = ['pious', 'scholar', 'traditionalist'];
        advisors.cardinalBenedict.isAvailable = true;

        advisors.captainGiovanni.stats = { wisdom: 40, intrigue: 50, diplomacy: 20, piety: 30, finance: 20, military: 85, loyalty: 80, ambition: 60 };
        advisors.captainGiovanni.traits = ['aggressive', 'military_strategist'];
        advisors.captainGiovanni.isAvailable = true;

        // Clear all advisor offices first
        for (const advisorId in advisors) {
            advisors[advisorId].currentOffice = '';
        }
        // Assign initial offices
        assignOffice('cardinalValerius', 'papal_secretary_of_state');
        assignOffice('brotherThomas', 'inquisitor_general');
        assignOffice('monsignorBattista', 'prefect_of_apostolic_camera');


        // Reset Provinces
        papalStatesProvinces.latium = { id: 'latium', name: 'Latium', prosperity: 60, loyalty: 70, heresy: 10, fortification: 50, population: 70, isCapital: true };
        papalStatesProvinces.umbria = { id: 'umbria', name: 'Umbria', prosperity: 50, loyalty: 60, heresy: 15, fortification: 40, population: 60 };
        papalStatesProvinces.marche = { id: 'marche', name: 'Marche', prosperity: 40, loyalty: 50, heresy: 20, fortification: 30, population: 50 };
        papalStatesProvinces.romagna = { id: 'romagna', name: 'Romagna', prosperity: 35, loyalty: 45, heresy: 25, fortification: 25, population: 40 };
        papalStatesProvinces.campania = { id: 'campania', name: 'Campania', prosperity: 45, loyalty: 55, heresy: 18, fortification: 35, population: 55 };

        // Reset Military
        militaryUnits.papal_guard_units = 0;
        militaryUnits.mercenary_units = 0;

        // Reset Policies
        for (const policyId in gamePolicies) {
            gamePolicies[policyId].isActive = false;
        }


        gameEventQueue = [];
        mainStoryEventIndex = 0;
        gameDay = 1;
        gameDayCounter.textContent = gameDay;
        hasGameEnded = false;

        updateAllMetricsDisplay();
        updateMapInfo();
        updateAdvisorDisplay();
        updatePoliciesDisplay(); // NEW: Update policies display
        displayEvent(findEventById('start_game'));
    }

    initGame();
});
