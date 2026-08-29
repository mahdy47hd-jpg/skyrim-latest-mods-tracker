// Skyrim Latest Mods Tracker - Using Bethesda API via JSONP
const CONFIG = {
    // Using a reliable JSONP backend that bypasses CORS
    PROXY_URL: 'https://devlicious.link/modorganiser/moddata.php',
    games: {
        'skyrimse': 'SKYRIMSE',
        'skyrim': 'SKYRIM',
        'fallout4': 'FALLOUT4',
        'fallout76': 'FALLOUT76'
    },
    platforms: {
        'PC': 'WINDOWS',
        'XBOX': 'XB1',
        'PS4': 'PS4'
    }
};

const DOM = {
    gameSelect: document.getElementById('gameSelect'),
    platformSelect: document.getElementById('platformSelect'),
    refreshInterval: document.getElementById('refreshInterval'),
    refreshBtn: document.getElementById('refreshBtn'),
    modsGrid: document.getElementById('modsGrid'),
    lastUpdate: document.getElementById('lastUpdate'),
    loadingSpinner: document.getElementById('loadingSpinner'),
    errorMessage: document.getElementById('errorMessage'),
    successMessage: document.getElementById('successMessage')
};

let refreshTimer = null;
let cachedMods = [];

// Fetch mods using JSONP (no CORS issues!)
function fetchMods() {
    showSpinner(true);
    hideError();
    hideSuccess();
    
    try {
        const game = DOM.gameSelect?.value || 'skyrimse';
        const platform = DOM.platformSelect?.value || 'PC';
        
        // Map to Bethesda's expected values
        const bethesdaGame = CONFIG.games[game] || 'SKYRIMSE';
        const bethesdaPlatform = CONFIG.platforms[platform] || 'WINDOWS';
        
        console.log(`Fetching mods for ${bethesdaGame} on ${bethesdaPlatform}`);
        
        // Create JSONP callback
        const callbackName = 'modData_' + Date.now();
        window[callbackName] = function(data) {
            console.log('JSONP Response received:', data);
            
            // Clean up callback
            delete window[callbackName];
            document.body.removeChild(script);
            
            if (data && Array.isArray(data) && data.length > 0) {
                cachedMods = data;
                displayMods(data);
                updateTimestamp();
                showSuccess(`✅ Successfully loaded ${data.length} Bethesda mods!`);
            } else {
                showError('No mods found for this selection. Try a different platform or game.');
            }
            
            showSpinner(false);
        };
        
        // Build JSONP request URL
        const params = new URLSearchParams({
            'selectGame': bethesdaGame,
            'selectPlatform': bethesdaPlatform,
            'searchText': ''
        });
        
        const url = `${CONFIG.PROXY_URL}?${params.toString()}&callback=${callbackName}`;
        
        // Create and append script tag (JSONP technique)
        const script = document.createElement('script');
        script.src = url;
        script.onerror = function() {
            console.error('Failed to load JSONP script');
            showSpinner(false);
            showError('Failed to fetch mods. The proxy server may be unavailable. Please try again later.');
            delete window[callbackName];
            document.body.removeChild(script);
            
            // Show cached mods if available
            if (cachedMods.length > 0) {
                displayMods(cachedMods);
                showSuccess(`📦 Showing ${cachedMods.length} cached mods`);
            }
        };
        
        document.body.appendChild(script);
        
    } catch (error) {
        console.error('Error:', error);
        showSpinner(false);
        showError('An error occurred: ' + error.message);
    }
}

// Display mods in grid
function displayMods(mods) {
    if (!DOM.modsGrid) return;
    
    if (!mods || mods.length === 0) {
        DOM.modsGrid.innerHTML = '<p class="loading-text">No mods found.</p>';
        return;
    }
    
    DOM.modsGrid.innerHTML = mods.map(mod => {
        const modName = mod.name || 'Unknown Mod';
        const author = mod.author || 'Unknown Author';
        const filesize = mod.filesize || 'N/A';
        const platform = mod.platform || 'N/A';
        const thumbnail = mod.thm || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22200%22%3E%3Crect fill=%22%23334155%22 width=%22300%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%2394a3b8%22 font-family=%22Arial%22%3ENo Image%3C/text%3E%3C/svg%3E';
        
        let platformClass = 'badge-pc';
        if (platform === 'XB1') platformClass = 'badge-xbox';
        if (platform === 'PS4') platformClass = 'badge-ps4';
        
        return `
            <div class="mod-card">
                <div class="mod-image-container">
                    <img src="${thumbnail}" alt="${modName}" class="mod-image" onerror="this.style.display='none'">
                </div>
                <div class="mod-content">
                    <div class="mod-header">
                        <h3>${modName}</h3>
                    </div>
                    <div class="mod-platform">
                        <span class="badge ${platformClass}">
                            ${platform}
                        </span>
                    </div>
                    <div class="mod-footer">
                        <span class="mod-stat">👤 ${author}</span>
                        <span class="mod-stat">💾 ${filesize}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// UI Helper Functions
function showSpinner(show) {
    if (DOM.loadingSpinner) {
        DOM.loadingSpinner.style.display = show ? 'block' : 'none';
    }
}

function showError(message) {
    if (DOM.errorMessage) {
        DOM.errorMessage.innerText = message;
        DOM.errorMessage.style.display = 'block';
    }
}

function hideError() {
    if (DOM.errorMessage) {
        DOM.errorMessage.style.display = 'none';
    }
}

function showSuccess(message) {
    if (DOM.successMessage) {
        DOM.successMessage.innerText = message;
        DOM.successMessage.style.display = 'block';
        setTimeout(() => {
            DOM.successMessage.style.display = 'none';
        }, 5000);
    }
}

function hideSuccess() {
    if (DOM.successMessage) {
        DOM.successMessage.style.display = 'none';
    }
}

function updateTimestamp() {
    if (DOM.lastUpdate) {
        const now = new Date();
        DOM.lastUpdate.innerText = `Last updated: ${now.toLocaleTimeString()}`;
    }
}

// Setup auto-refresh
function setupAutoRefresh() {
    if (refreshTimer) clearInterval(refreshTimer);
    if (!DOM.refreshInterval) return;
    
    const value = DOM.refreshInterval.value;
    if (value === '0' || !value) return;
    
    const interval = parseInt(value);
    refreshTimer = setInterval(fetchMods, interval);
    console.log(`✅ Auto-refresh set to every ${interval / 1000} seconds`);
}

// Event Listeners
if (DOM.refreshBtn) DOM.refreshBtn.addEventListener('click', fetchMods);
if (DOM.gameSelect) DOM.gameSelect.addEventListener('change', fetchMods);
if (DOM.platformSelect) DOM.platformSelect.addEventListener('change', fetchMods);
if (DOM.refreshInterval) DOM.refreshInterval.addEventListener('change', setupAutoRefresh);

// Initial load
window.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 Bethesda Mod Tracker initialized');
    fetchMods();
    setupAutoRefresh();
});

// Cleanup
window.addEventListener('beforeunload', () => {
    if (refreshTimer) clearInterval(refreshTimer);
});
