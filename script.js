// --- Game Data ---
const DOCUMENTS = {
    "intro_briefing": {
        title: "Your First Briefing: The State of the Church",
        content: "Welcome, Your Holiness, to the Chair of St. Peter. The realm faces numerous challenges, from distant heresies to disputes among our loyal monarchs. Your wisdom will guide us. Let us begin with your first pressing matter.",
        source: "Cardinal Secretary of State",
        options: [
            { text: 'Begin my holy duties.', consequences: {}, next_doc_id: 'crusade_appeal' }
        ]
    },
    "crusade_appeal": {
        title: "Urgent Appeal: Holy Land Under Threat!",
        content: "A desperate plea has arrived from the Latin Patriarch of Jerusalem. The Saracens press hard upon the Holy Land. Without immediate divine intervention, or perhaps a new crusade, all may be lost! The Kings of Europe await your decree.",
        source: "Patriarch of Jerusalem",
        options: [
            { text: 'Call for a new Crusade! Rally the faithful to arms.',
              consequences: { Piety: 15, Gold: -30, PublicOpinion: 10, CardinalFavor: 5 },
              next_doc_id: 'crusade_funding_request' },
            { text: 'Send only financial aid and blessings. Avoid direct military involvement.',
              consequences: { Piety: 5, Gold: -10, PublicOpinion: -5, CardinalFavor: -5 },
              next_doc_id: 'papal_states_revolt' }
        ]
    },
    "crusade_funding_request": {
        title: "Funding Request: Equipping the Crusade",
        content: "Your Holiness's call for a new Crusade has stirred the hearts of many! However, the costs of equipping such an expedition are immense. We require significant funds to provision the armies and secure passage. The treasury is not limitless.",
        source: "Head of Papal Treasury",
        options: [
            { text: 'Grant a substantial sum from the treasury for the Crusade.',
              consequences: { Gold: -50, Authority: 10 },
              next_doc_id: 'papal_states_revolt' },
            { text: 'Seek donations from wealthy nobles and merchants.',
              consequences: { PublicOpinion: -5, Piety: 5, Gold: 10 },
              next_doc_id: 'papal_states_revolt' }
        ]
    },
    "papal_states_revolt": {
        title: "Revolt in the Papal States!",
        content: "News has reached us that a rebellious lord in the Papal States has declared independence from your rule! His audacity threatens the very foundation of our temporal power. Immediate action is required to quell this uprising.",
        source: "Swiss Guard Commander",
        options: [
            { text: 'Send the Papal Guard to brutally suppress the revolt.',
              consequences: { Authority: 15, PublicOpinion: -15, Gold: -20 },
              next_doc_id: 'end_of_demo' },
            { text: 'Attempt peaceful negotiations, offering concessions.',
              consequences: { Authority: -10, CardinalFavor: -5, Piety: 10 },
              next_doc_id: 'end_of_demo' }
        ]
    },
    "end_of_demo": {
        title: "End of Demo",
        content: "This concludes the demo for Habeus Papam. You've experienced the core gameplay loop of receiving documents, making decisions, and seeing their immediate consequences. Imagine how deep the branching paths could become!",
        source: "Your Future Self",
        options: [
            { text: 'Restart Demo', consequences: {}, next_doc_id: 'intro_briefing' }
        ]
    }
};

// --- Game State Variables ---
let papalMetrics = {
    Piety: 50,
    Authority: 50,
    Gold: 100,
    PublicOpinion: 50,
    CardinalFavor: 50
};

let globalGameState = {
    CrusadeStatus: "None",
    PapalStatesControl: "Strong",
    HeresyLevel: "Low"
};

let currentDocumentId = "intro_briefing";
let gameDay = 0; // Start at day 0, increment for first document

// --- DOM Elements (References to HTML elements) ---
const docTitle = document.getElementById('document-title');
const docContent = document.getElementById('document-content');
const docSource = document.getElementById('document-source');
const optionsContainer = document.getElementById('options-container');
const documentArea = document.getElementById('document-area'); // Reference for animation
const gameDayCounter = document.getElementById('game-day-counter');

const metricElements = {
    piety: document.getElementById('metric-piety'),
    authority: document.getElementById('metric-authority'),
    gold: document.getElementById('metric-gold'),
    publicOpinion: document.getElementById('metric-publicOpinion'),
    cardinalFavor: document.getElementById('metric-cardinalFavor')
};
const mapButton = document.getElementById('map-button');
const mapOverlay = document.getElementById('map-overlay'); // New: Map overlay
const closeMapButton = document.getElementById('close-map-button'); // New: Close map button

// --- Functions ---

function updateMetricsDisplay(changes = {}) {
    for (const metric in papalMetrics) {
        const element = metricElements[metric.toLowerCase()];
        if (element) {
            const oldValue = parseFloat(element.textContent);
            const newValue = papalMetrics[metric];

            element.textContent = newValue;

            // Apply temporary color change if value changed
            if (metric in changes && oldValue !== newValue) {
                element.classList.remove('metric-change-positive', 'metric-change-negative'); // Clean previous
                if (newValue > oldValue) {
                    element.classList.add('metric-change-positive');
                } else if (newValue < oldValue) {
                    element.classList.add('metric-change-negative');
                }
                // Remove class after a short delay
                setTimeout(() => {
                    element.classList.remove('metric-change-positive', 'metric-change-negative');
                }, 500); // Flash for 0.5 seconds
            }
        }
    }
}

function loadDocument(docId) {
    const doc = DOCUMENTS[docId];
    if (!doc) {
        console.error("Document not found:", docId);
        return;
    }

    currentDocumentId = docId;

    // Ensure map is closed when a new document loads
    hideMap();

    // Trigger document area animation
    documentArea.classList.remove('show'); // Hide for re-animation
    setTimeout(() => {
        docTitle.textContent = doc.title;
        docContent.textContent = doc.content;
        docSource.textContent = `— ${doc.source}`;

        // Clear previous options
        optionsContainer.innerHTML = '';

        // Create new option buttons
        doc.options.forEach(option => {
            const button = document.createElement('button');
            button.classList.add('option-button');
            button.textContent = option.text;
            button.addEventListener('click', () => handleDecision(option));
            optionsContainer.appendChild(button);
        });
        documentArea.classList.add('show'); // Show with animation
    }, 100); // Small delay to allow 'hide' to register

    // Increment day counter, unless restarting demo
    if (docId !== "intro_briefing" || gameDay !== 0) { // Don't increment on first load
        gameDay++;
    } else {
        // Reset metrics when restarting demo (only on explicit restart, not if gameDay is already > 0)
        if (gameDay === 0 || docId === 'intro_briefing') { // Also handles the "Restart Demo" button
            papalMetrics = { Piety: 50, Authority: 50, Gold: 100, PublicOpinion: 50, CardinalFavor: 50 };
        }
        gameDay = 1; // Start at day 1 for a new demo run
    }
    gameDayCounter.textContent = gameDay;
}

function handleDecision(option) {
    const changes = {}; // Track changes for visual feedback

    // Apply consequences to papal metrics
    for (const metric in option.consequences) {
        if (papalMetrics.hasOwnProperty(metric)) {
            const oldValue = papalMetrics[metric];
            papalMetrics[metric] += option.consequences[metric];
            // Clamp values between 0 and 100
            papalMetrics[metric] = Math.max(0, Math.min(100, papalMetrics[metric]));
            changes[metric] = papalMetrics[metric] - oldValue; // Store the change amount
        }
    }

    // Update metrics display with visual feedback
    updateMetricsDisplay(changes);

    // Update global game state (placeholder for future use)
    // if (option.globalStateChange) {
    //     Object.assign(globalGameState, option.globalStateChange);
    // }

    // Load next document
    if (option.next_doc_id) {
        loadDocument(option.next_doc_id);
    } else {
        console.log("No next document specified. End of path.");
    }
}

// --- Map Functions ---
function showMap() {
    mapOverlay.classList.add('show');
}

function hideMap() {
    mapOverlay.classList.remove('show');
}

// --- Event Listeners ---
mapButton.addEventListener('click', showMap);
closeMapButton.addEventListener('click', hideMap);

// --- Initial Game Setup ---
document.addEventListener('DOMContentLoaded', () => {
    loadDocument(currentDocumentId); // This will also set initial gameDay to 1
    updateMetricsDisplay(); // Initial display without changes
});
