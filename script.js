const CONFIG = {
    CORS_PROXY: 'https://cors-anywhere.herokuapp.com/',
    API_BASE: 'https://bethesda.net/api/v2/mods',
    defaultGame: 'skyrim',
    defaultPlatform: 'XB1'
};

const DOM = {
    gameSelect: document.getElementById('gameSelect'),
    platformSelect: document.getElementById('platformSelect'),
    refreshInterval: document.getElementById('refreshInterval'),
    refreshBtn: document.getElementById('refreshBtn'),
    modsGrid: document.getElementById('modsGrid'),
    lastUpdate: document.getElementById('lastUpdate'),
    loadingSpinner: document.getElementById('loadingSpinner'),
    errorMessage: document.getElementById('errorMessage')
};

let refreshTimer = null;

async function fetchMods() {
    if (DOM.loadingSpinner) DOM.loadingSpinner.style.display = 'block';
    if (DOM.errorMessage) DOM.errorMessage.style.display = 'none';
    if (DOM.modsGrid) DOM.modsGrid.innerHTML = '<p class="loading-text">Loading latest mods...</p>';
    
    try {
        const game = DOM.gameSelect ? DOM.gameSelect.value : CONFIG.defaultGame;
        let platform = DOM.platformSelect ? DOM.platformSelect.value : CONFIG.defaultPlatform;
        
        if (platform.toLowerCase() === 'windows' || platform.toLowerCase() === 'pc') {
            platform = 'PC';
        } else if (platform.toLowerCase().includes('xbox')) {
            platform = 'XB1';
        } else if (platform.toLowerCase().includes('playstation') || platform.toLowerCase().includes('ps4')) {
            platform = 'PS4';
        }

        // Use CORS proxy to bypass Bethesda's CORS restrictions
        const apiUrl = `${CONFIG.API_BASE}?game_filter=${game}&number_results=40&order=desc&sort=updated&platform=${platform}`;
        const proxiedUrl = CONFIG.CORS_PROXY + apiUrl;
        
        console.log('Fetching from:', proxiedUrl);
        
        const response = await fetch(proxiedUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data && data.mods && data.mods.length > 0) {
            displayMods(data.mods);
            updateTimestamp();
        } else {
            showError('No mods found for this selection. Try a different platform or game.');
        }
    } catch (error) {
        console.error('Fetch Error:', error);
        showError(`Failed to load mods: ${error.message}. Please check the console for more details.`);
    } finally {
        if (DOM.loadingSpinner) DOM.loadingSpinner.style.display = 'none';
    }
}

function displayMods(mods) {
    if (!DOM.modsGrid) return;
    
    if (!mods || mods.length === 0) {
        DOM.modsGrid.innerHTML = '<p class="loading-text">No mods found.</p>';
        return;
    }
    
    DOM.modsGrid.innerHTML = mods.map(mod => `
        <div class="mod-card">
            <div class="mod-header">
                <h3>${mod.name || 'Unknown Mod'}</h3>
                <span class="mod-date">${new Date(mod.created_at || mod.updated_at).toLocaleDateString()}</span>
            </div>
            <p class="mod-description">${mod.description ? mod.description.substring(0, 150) + '...' : 'No description available.'}</p>
            <div class="mod-footer">
                <span class="mod-author">👤 ${mod.author_username || 'Unknown'}</span>
                <span class="mod-size">💾 ${(mod.size ? (mod.size / 1024 / 1024).toFixed(2) : 0)} MB</span>
                <span class="mod-downloads">⬇️ ${mod.download_count || 0}</span>
            </div>
        </div>
    `).join('');
}

function updateTimestamp() {
    if (DOM.lastUpdate) {
        const now = new Date();
        DOM.lastUpdate.innerText = `Last updated: ${now.toLocaleTimeString()}`;
    }
}

function showError(message) {
    if (DOM.errorMessage) {
        DOM.errorMessage.innerText = message;
        DOM.errorMessage.style.display = 'block';
    }
}

function setupAutoRefresh() {
    if (refreshTimer) clearInterval(refreshTimer);
    if (!DOM.refreshInterval) return;
    
    const value = DOM.refreshInterval.value;
    if (value === '0' || !value) return;
    
    const interval = parseInt(value);
    refreshTimer = setInterval(fetchMods, interval);
    console.log(`Auto-refresh set to every ${interval / 1000} seconds`);
}

// Event Listeners
if (DOM.refreshBtn) DOM.refreshBtn.addEventListener('click', fetchMods);
if (DOM.gameSelect) DOM.gameSelect.addEventListener('change', fetchMods);
if (DOM.platformSelect) DOM.platformSelect.addEventListener('change', fetchMods);
if (DOM.refreshInterval) DOM.refreshInterval.addEventListener('change', setupAutoRefresh);

// Initial load
window.addEventListener('DOMContentLoaded', () => {
    fetchMods();
    setupAutoRefresh();
});
