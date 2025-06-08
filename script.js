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

// --- DOM Elements (References to HTML elements) ---
const docTitle = document.getElementById('document-title');
const docContent = document.getElementById('document-content');
const docSource = document.getElementById('document-source');
const optionsContainer = document.getElementById('options-container');
const metricElements = {
    piety: document.getElementById('metric-piety'),
    authority: document.getElementById('metric-authority'),
    gold: document.getElementById('metric-gold'),
    publicOpinion: document.getElementById('metric-publicOpinion'),
    cardinalFavor: document.getElementById('metric-cardinalFavor')
};
const mapButton = document.getElementById('map-button');

// --- Functions ---

function updateMetricsDisplay() {
    for (const metric in papalMetrics) {
        const element = metricElements[metric.toLowerCase()];
        if (element) {
            element.textContent = papalMetrics[metric];
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
}

function handleDecision(option) {
    // Apply consequences to papal metrics
    for (const metric in option.consequences) {
        if (papalMetrics.hasOwnProperty(metric)) {
            papalMetrics[metric] += option.consequences[metric];
            // Clamp values between 0 and 100 for display
            papalMetrics[metric] = Math.max(0, Math.min(100, papalMetrics[metric]));
        }
    }

    // Update global game state (placeholder for future use)
    // if (option.globalStateChange) {
    //     Object.assign(globalGameState, option.globalStateChange);
    // }

    updateMetricsDisplay();

    // Load next document
    if (option.next_doc_id) {
        loadDocument(option.next_doc_id);
    } else {
        console.log("No next document specified. End of path.");
    }
}

// --- Event Listeners ---
// Map button - currently non-functional, just an alert
mapButton.addEventListener('click', () => {
    alert("The map shows the state of Europe! (Feature to be implemented)");
});


// --- Initial Game Setup ---
document.addEventListener('DOMContentLoaded', () => {
    updateMetricsDisplay();
    loadDocument(currentDocumentId);
});
