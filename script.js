// --- DOM ELEMENT CACHING ---
// Caching DOM elements for frequent access improves performance.
const cognitionDisplay = document.getElementById('cognition-display');
const cognitionPsDisplay = document.getElementById('cognition-ps-display');
const cultureDisplay = document.getElementById('culture-display');
const influenceDisplay = document.getElementById('influence-display');
const languageNameDisplay = document.getElementById('language-name-display');
const languageStageDisplay = document.getElementById('language-stage-display');
const languageProgressBar = document.getElementById('language-progress-bar');
const clickValueDisplay = document.getElementById('click-value-display');
const generateCognitionBtn = document.getElementById('generate-cognition-btn');
const lexiconUpgradesContainer = document.getElementById('lexicon-upgrades');
const phonologyUpgradesContainer = document.getElementById('phonology-upgrades');
const grammarUpgradesContainer = document.getElementById('grammar-upgrades');
const scriptUpgradesContainer = document.getElementById('script-upgrades');
const scriptTabButton = document.getElementById('script-tab-button');
const prestigeTabButton = document.getElementById('prestige-tab-button');
const cultureGainOnPrestige = document.getElementById('culture-gain-on-prestige');
const toast = document.getElementById('toast');

// --- GAME STATE ---
// A central object to hold all mutable game data.
let gameState = {
    cognition: 0,
    culture: 0,
    influence: 0,
    cognitionPerSecond: 0,
    cognitionPerClick: 1,
    // Multipliers start at 1, so they don't zero out the production.
    phonologyMultiplier: 1,
    grammarMultiplier: 1,
    totalUpgradesPurchased: 0,
    purchasedUpgrades: new Set(), // Tracks IDs of purchased upgrades
    languageStage: 0, // Index for the stages array
};

// --- GAME DATA & DEFINITIONS ---
// Static data defining the game's content and balance.

const languageStages = [
    { name: "Primal Utterances", upgradesNeeded: 0, cultureBonus: 0, influenceBonus: 0 },
    { name: "Proto-Language", upgradesNeeded: 5, cultureBonus: 1, influenceBonus: 0 },
    { name: "Early Language", upgradesNeeded: 15, cultureBonus: 5, influenceBonus: 0 },
    { name: "Classical Language", upgradesNeeded: 30, cultureBonus: 25, influenceBonus: 1 },
    { name: "Modern Language", upgradesNeeded: 50, cultureBonus: 100, influenceBonus: 5 },
];

const upgrades = {
    lexicon: [
        { id: 'lex_noun_1', title: 'Noun: Water', desc: 'A fundamental concept. (+0.1 Ψ/s)', cost: 10, effect: { type: 'base_cognition', value: 0.1 } },
        { id: 'lex_verb_1', title: 'Verb: Eat', desc: 'Express a vital action. (+0.2 Ψ/s)', cost: 25, effect: { type: 'base_cognition', value: 0.2 } },
        { id: 'lex_adj_1', title: 'Adjective: Big', desc: 'Describe the world. (+0.4 Ψ/s)', cost: 60, effect: { type: 'base_cognition', value: 0.4 } },
        { id: 'lex_noun_2', title: 'Noun: Fire', desc: 'Harness a powerful force. (+0.8 Ψ/s)', cost: 150, effect: { type: 'base_cognition', value: 0.8 } },
        { id: 'lex_abstract_1', title: 'Abstract: Danger', desc: 'Communicate threats. (+1.5 Ψ/s)', cost: 400, effect: { type: 'base_cognition', value: 1.5 } },
        { id: 'lex_abstract_2', title: 'Abstract: Time', desc: 'Grasp the intangible. (+5 Ψ/s)', cost: 1000, effect: { type: 'base_cognition', value: 5 } },
    ],
    phonology: [
        { id: 'pho_vowel_1', title: 'Three-Vowel System', desc: 'Establish basic vowels (a, i, u). (+10% Ψ generation)', cost: 50, effect: { type: 'multiplier', target: 'phonology', value: 0.10 } },
        { id: 'pho_consonant_1', title: 'Add Plosives', desc: 'Introduce p, t, k sounds. (+15% Ψ generation)', cost: 120, effect: { type: 'multiplier', target: 'phonology', value: 0.15 } },
        { id: 'pho_syllable_1', title: 'CV Syllable Structure', desc: 'Combine consonants and vowels. (+20% Ψ generation)', cost: 300, effect: { type: 'multiplier', target: 'phonology', value: 0.20 } },
        { id: 'pho_consonant_2', title: 'Add Fricatives', desc: 'Introduce s, f sounds. (+25% Ψ generation)', cost: 800, effect: { type: 'multiplier', target: 'phonology', value: 0.25 } },
    ],
    grammar: [
        { id: 'gra_word_order_1', title: 'Establish Word Order', desc: 'Subject-Object-Verb. (+15% Ψ generation)', cost: 75, effect: { type: 'multiplier', target: 'grammar', value: 0.15 } },
        { id: 'gra_morphology_1', title: 'Invent Plurals', desc: 'Distinguish one from many. (+20% Ψ generation)', cost: 200, effect: { type: 'multiplier', target: 'grammar', value: 0.20 } },
        { id: 'gra_tense_1', title: 'Past/Present Tense', desc: 'Situate events in time. (+25% Ψ generation)', cost: 500, effect: { type: 'multiplier', target: 'grammar', value: 0.25 } },
        { id: 'gra_clause_1', title: 'Conditional Clauses', desc: "Express 'if...then' scenarios. (+40% Ψ generation)", cost: 1500, effect: { type: 'multiplier', target: 'grammar', value: 0.40 } },
    ],
    script: [
        { id: 'scr_pictograms', title: 'Invent Pictograms', desc: 'First step to writing. Unlocks passive Culture. (Req: 1M Cognition)', cost: 1000000, effect: { type: 'unlock', value: 'culture_generation' } },
    ]
};

// --- INITIALIZATION ---

/**
 * Initializes the game. This function is called when the script loads.
 * It sets up the initial UI state by creating the upgrade buttons.
 */
function init() {
    populateUpgrades('lexicon', lexiconUpgradesContainer);
    populateUpgrades('phonology', phonologyUpgradesContainer);
    populateUpgrades('grammar', grammarUpgradesContainer);
    populateUpgrades('script', scriptUpgradesContainer);
    
    // Set up event listener for the manual click button.
    generateCognitionBtn.addEventListener('click', () => {
        gameState.cognition += gameState.cognitionPerClick;
        updateUI();
    });

    // Start the main game loop.
    setInterval(gameLoop, 1000);
}

/**
 * Creates and appends upgrade buttons to their respective containers.
 * @param {string} category - The key for the upgrades category (e.g., 'lexicon').
 * @param {HTMLElement} container - The container element to append buttons to.
 */
function populateUpgrades(category, container) {
    upgrades[category].forEach(upgrade => {
        const btn = document.createElement('button');
        btn.id = upgrade.id;
        btn.className = 'upgrade-btn';
        btn.disabled = true; // Start disabled, enabled by updateUI
        btn.innerHTML = `
            <span class="upgrade-title">${upgrade.title}</span>
            <span class="upgrade-desc">${upgrade.desc}</span>
            <span class="upgrade-cost">${formatNumber(upgrade.cost)} $\\Psi$</span>
        `;
        btn.onclick = () => buyUpgrade(category, upgrade.id);
        container.appendChild(btn);
    });
}


// --- CORE GAME LOGIC ---

/**
 * The main game loop, executed once per second.
 * Calculates and adds passive resource generation.
 */
function gameLoop() {
    const baseCognitionPerSecond = gameState.cognitionPerSecond;
    const totalMultiplier = gameState.phonologyMultiplier * gameState.grammarMultiplier;
    const effectiveCognitionPerSecond = baseCognitionPerSecond * totalMultiplier;
    
    gameState.cognition += effectiveCognitionPerSecond;
    
    // Update the UI with the new values.
    updateUI();
}

/**
 * Handles the logic for purchasing an upgrade.
 * @param {string} category - The category of the upgrade.
 * @param {string} upgradeId - The unique ID of the upgrade to purchase.
 */
function buyUpgrade(category, upgradeId) {
    const upgrade = upgrades[category].find(u => u.id === upgradeId);
    if (!upgrade || gameState.purchasedUpgrades.has(upgradeId) || gameState.cognition < upgrade.cost) {
        return; // Exit if upgrade doesn't exist, is already bought, or can't be afforded.
    }

    // Deduct cost and mark as purchased
    gameState.cognition -= upgrade.cost;
    gameState.purchasedUpgrades.add(upgradeId);
    gameState.totalUpgradesPurchased++;

    // Apply the upgrade's effect
    applyEffect(upgrade.effect);
    
    // Check if a new language stage has been reached.
    checkLanguageStage();

    // Show a confirmation toast.
    showToast(`${upgrade.title} purchased!`);
    updateUI();
}

/**
 * Applies the effect of a purchased upgrade to the game state.
 * @param {object} effect - The effect object from the upgrade definition.
 */
function applyEffect(effect) {
    switch (effect.type) {
        case 'base_cognition':
            gameState.cognitionPerSecond += effect.value;
            break;
        case 'multiplier':
            if (effect.target === 'phonology') {
                gameState.phonologyMultiplier += effect.value;
            } else if (effect.target === 'grammar') {
                gameState.grammarMultiplier += effect.value;
            }
            break;
        case 'unlock':
            if (effect.value === 'culture_generation') {
                // This is a placeholder for a more complex mechanic.
                // For now, it just gives a one-time bonus.
                gameState.culture += 50; 
                showToast("Writing unlocked! You feel a sense of history.", 5000);
            }
            break;
    }
}

/**
 * Checks if the player has enough upgrades to advance to the next language stage.
 */
function checkLanguageStage() {
    const currentStage = languageStages[gameState.languageStage];
    const nextStage = languageStages[gameState.languageStage + 1];

    if (nextStage && gameState.totalUpgradesPurchased >= nextStage.upgradesNeeded) {
        gameState.languageStage++;
        gameState.culture += nextStage.cultureBonus;
        gameState.influence += nextStage.influenceBonus;
        showToast(`Language evolved to ${nextStage.name}!`, 4000);
    }
}

/**
 * Handles the prestige mechanic.
 */
function performPrestige() {
    const cultureGained = calculateCultureOnPrestige();
    if (cultureGained <= 0) {
        showToast("You need to develop your language further to gain Culture.", 3000);
        return;
    }

    gameState.culture += cultureGained;

    // Reset language-specific progress
    gameState.cognition = 0;
    gameState.cognitionPerSecond = 0;
    gameState.phonologyMultiplier = 1;
    gameState.grammarMultiplier = 1;
    gameState.totalUpgradesPurchased = 0;
    gameState.purchasedUpgrades.clear();
    gameState.languageStage = 0;
    
    showToast(`Mastery achieved! Gained ${cultureGained} Culture. A new era begins.`, 5000);
    updateUI();
}

/**
 * Calculates how much culture will be gained on prestige.
 * @returns {number} The amount of culture to be gained.
 */
function calculateCultureOnPrestige() {
    // Simple formula: 1 Culture for every 5 upgrades purchased.
    return Math.floor(gameState.totalUpgradesPurchased / 5);
}


// --- UI & UTILITY FUNCTIONS ---

/**
 * Updates all dynamic elements in the UI. Called frequently.
 */
function updateUI() {
    // Update resource displays
    cognitionDisplay.textContent = formatNumber(gameState.cognition);
    const totalMultiplier = gameState.phonologyMultiplier * gameState.grammarMultiplier;
    const effectiveCps = gameState.cognitionPerSecond * totalMultiplier;
    cognitionPsDisplay.textContent = `(+${formatNumber(effectiveCps)}/s)`;
    cultureDisplay.textContent = formatNumber(gameState.culture);
    influenceDisplay.textContent = formatNumber(gameState.influence);

    // Update language stage display
    const currentStage = languageStages[gameState.languageStage];
    const nextStage = languageStages[gameState.languageStage + 1];
    languageNameDisplay.textContent = currentStage.name;
    languageStageDisplay.textContent = `Stage ${gameState.languageStage + 1} of ${languageStages.length}`;
    if (nextStage) {
        const progress = Math.min(100, (gameState.totalUpgradesPurchased / nextStage.upgradesNeeded) * 100);
        languageProgressBar.style.width = `${progress}%`;
    } else {
        languageProgressBar.style.width = '100%'; // Maxed out
    }
    
    // Update upgrade buttons (availability and purchased state)
    for (const category in upgrades) {
        upgrades[category].forEach(upgrade => {
            const btn = document.getElementById(upgrade.id);
            if (!btn) return;

            if (gameState.purchasedUpgrades.has(upgrade.id)) {
                btn.classList.add('purchased');
                btn.disabled = true;
                btn.querySelector('.upgrade-cost').textContent = 'Purchased';
            } else {
                btn.disabled = gameState.cognition < upgrade.cost;
            }
        });
    }
    
    // Enable/disable special tabs
    scriptTabButton.disabled = gameState.languageStage < 2; // Req: Early Language
    prestigeTabButton.disabled = gameState.languageStage < 4; // Req: Modern Language
    
    // Update prestige info
    if (gameState.languageStage >= 4) {
        cultureGainOnPrestige.textContent = formatNumber(calculateCultureOnPrestige());
    }
}

/**
 * Formats large numbers for readability (e.g., 1,234.5).
 * @param {number} num - The number to format.
 * @returns {string} The formatted number string.
 */
function formatNumber(num) {
    if (num < 1000) return num.toFixed(1);
    return num.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

/**
 * Handles switching between tabs.
 * @param {Event} evt - The click event.
 * @param {string} tabName - The ID of the tab to open.
 */
function openTab(evt, tabName) {
    let i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tab-content");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
        tabcontent[i].classList.remove("active");
    }
    tablinks = document.getElementsByClassName("tab-link");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(tabName).style.display = "block";
    document.getElementById(tabName).classList.add("active");
    evt.currentTarget.className += " active";
}

/**
 * Shows a temporary message at the bottom of the screen.
 * @param {string} message - The message to display.
 * @param {number} [duration=3000] - How long to show the message in ms.
 */
function showToast(message, duration = 3000) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

// --- GAME START ---
// Call the init function to set up and start the game.
init();
