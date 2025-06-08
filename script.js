// --- Game Data ---
const DOCUMENTS = {
    "intro_briefing": {
        title: "Your First Briefing: The State of the Church",
        content: "Welcome, Your Holiness, to the Chair of St. Peter, a throne burdened by both divine grace and worldly strife. The vast realm of Christendom faces numerous challenges: from distant pagan incursions to unsettling heresies festering within our very flock, and ceaseless disputes among our supposedly loyal monarchs. Your wisdom, divinely bestowed, will now guide our holy endeavors. Let us begin with your first pressing matter, laid before you by the diligent hand of the Cardinal Secretary of State.",
        source: "Cardinal Secretary of State",
        options: [
            { text: 'Embrace my sacred duty. Lead us forward.', consequences: {}, next_doc_id: 'crusade_appeal' }
        ]
    },
    "crusade_appeal": {
        title: "Urgent Appeal: Holy Land Under Siege!",
        content: "A desperate, tear-stained plea has arrived from the venerable Latin Patriarch of Jerusalem. The relentless Saracens, ever pressing their advantage, bear down hard upon the dwindling Christian enclaves in the Holy Land. Without immediate and profound divine intervention, or perhaps a renewed and fervent crusade championed by Your Holiness, the sacred sites and all our faithful there may be irrevocably lost! The Kings of Europe, ever wary, now await your unequivocal decree.",
        source: "Patriarch of Jerusalem",
        options: [
            { text: 'Issue a Papal Bull! Call for a new Crusade! Rally the faithful to arms across Europe.',
              consequences: { Piety: 15, Gold: -30, PublicOpinion: 10, CardinalFavor: 5 },
              next_doc_id: 'crusade_funding_request' },
            { text: 'Send only substantial financial aid and spiritual blessings. Avoid direct military entanglement for now.',
              consequences: { Piety: 5, Gold: -10, PublicOpinion: -5, CardinalFavor: -5 },
              next_doc_id: 'papal_states_revolt' }
        ]
    },
    "crusade_funding_request": {
        title: "Funding Request: Equipping the Crusade's Vanguard",
        content: "Your Holiness's impassioned call for a new Crusade has stirred the very souls of countless faithful across Europe! However, the logistical and material costs of equipping such a formidable expedition are, regrettably, immense. We require significant funds to provision the burgeoning armies, procure essential supplies, and secure safe passage across treacherous lands and seas. Our holy treasury, while substantial, is not limitless, and prudent stewardship is paramount.",
        source: "Head of Papal Treasury",
        options: [
            { text: 'Grant a substantial sum from the holy treasury to ensure the Crusade’s success.',
              consequences: { Gold: -50, Authority: 10 },
              next_doc_id: 'papal_states_revolt' },
            { text: 'Issue a special indulgence. Seek generous donations from wealthy nobles and influential merchants.',
              consequences: { PublicOpinion: -5, Piety: 5, Gold: 10 },
              next_doc_id: 'papal_states_revolt' }
        ]
    },
    "papal_states_revolt": {
        title: "Insurrection: Revolt in the Papal States!",
        content: "Grave news, Your Holiness! Dispatches have reached us confirming that a brazenly rebellious lord within the very heart of the Papal States, emboldened by defiance, has declared his independence from your sacred rule! His audacious challenge threatens the very temporal foundation of our Church's power and stability. Immediate and resolute action is paramount to quell this ignoble uprising before it spreads like a plague.",
        source: "Commander of the Swiss Guard",
        options: [
            { text: 'Dispatch the Papal Guard to brutally suppress the revolt. Show no mercy.',
              consequences: { Authority: 15, PublicOpinion: -15, Gold: -20 },
              next_doc_id: 'end_of_demo' },
            { text: 'Attempt peaceful negotiations, offering clemency and carefully considered concessions.',
              consequences: { Authority: -10, CardinalFavor: -5, Piety: 10 },
              next_doc_id: 'end_of_demo' }
        ]
    },
    "end_of_demo": {
        title: "End of Demo: The Pontiff's Burden",
        content: "This concludes the initial demonstration for 'Habeus Papam: The Pontiff's Burden.' You've experienced the core gameplay loop of receiving crucial documents, making difficult decisions that ripple through the political and religious landscape, and witnessing their immediate consequences on your Papal metrics. Imagine the intricate, branching paths, the moral dilemmas, and the vast historical tapestry that awaits in the full game!",
        source: "Your Future Self, from a more polished age",
        options: [
            { text: 'Begin anew. The Papacy awaits.', consequences: {}, next_doc_id: 'intro_briefing' }
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
const mapOverlay = document.getElementById('map-overlay'); // Map overlay
const closeMapButton = document.getElementById('close-map-button'); // Close map button

// --- Functions ---

function updateMetricsDisplay(changes = {}) {
    for (const metric in papalMetrics) {
        const element = metricElements[metric.toLowerCase()];
        if (element) {
            const oldValue = parseFloat(element.textContent);
            const newValue = papalMetrics[metric];

            element.textContent = newValue;

            // Apply temporary color change and animation if value changed
            if (metric in changes && oldValue !== newValue) {
                element.classList.remove('metric-change-positive', 'metric-change-negative'); // Clean previous classes
                // Force reflow for animation to re-trigger
                void element.offsetWidth; // eslint-disable-line no-void

                if (newValue > oldValue) {
                    element.classList.add('metric-change-positive');
                } else if (newValue < oldValue) {
                    element.classList.add('metric-change-negative');
                }
                // Remove class after a short delay
                setTimeout(() => {
                    element.classList.remove('metric-change-positive', 'metric-change-negative');
                }, 800); // Flash for 0.8 seconds
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

    // Hide document area for re-animation
    documentArea.classList.remove('show');

    // Small delay to allow 'hide' animation to complete before content updates
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

        // Show with animation after content is loaded
        documentArea.classList.add('show');
    }, 300); // Match or slightly exceed the document-area hide transition duration

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

// Initial game setup
document.addEventListener('DOMContentLoaded', () => {
    loadDocument(currentDocumentId); // This will also set initial gameDay to 1
    updateMetricsDisplay(); // Initial display without changes

    // Add event listeners for map paths for potential future interaction/tooltip
    const mapPaths = document.querySelectorAll('.detailed-map path');
    mapPaths.forEach(path => {
        path.addEventListener('mouseover', function() {
            // console.log(this.querySelector('title').textContent); // Example: log country name on hover
        });
    });
});
