const CONFIG = {
    API_URL: 'https://allorigins.win' + encodeURIComponent('https://bethesda.net'),
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
    if (DOM.modsGrid) DOM.modsGrid.innerHTML = '';
    
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

        const targetUrl = `https://bethesda.net{game}&number_results=40&order=desc&sort=updated&platform=${platform}`;
        const finalUrl = 'https://allorigins.win' + encodeURIComponent(targetUrl);
        
        const response = await fetch(finalUrl);
        if (!response.ok) throw new Error('Network response error');
        
        const data = await response.json();
        
        if (data && data.mods && data.mods.length > 0) {
            displayMods(data.mods);
            updateTimestamp();
        } else {
            showError('No mods found for this selection.');
        }
    } catch (error) {
        console.error(error);
        showError('Failed to load mods. Please try again.');
    } finally {
        if (DOM.loadingSpinner) DOM.loadingSpinner.style.display = 'none';
    }
}

function displayMods(mods) {
    if (!DOM.modsGrid) return;
    DOM.modsGrid.innerHTML = mods.map(mod => `
        <div class="mod-card" style="border: 1px solid #334155; padding: 15px; margin: 10px 0; border-radius: 8px; background: #1e293b; text-align: left;">
            <h3 style="color: #38bdf8; margin-top: 0; font-size: 18px;">${mod.name || 'Unknown Mod'}</h3>
            <p style="font-size: 14px; color: #cbd5e1; line-height: 1.4;">${mod.description ? mod.description.substring(0, 150) + '...' : 'No description available.'}</p>
            <div style="font-size: 12px; color: #94a3b8; display: flex; justify-content: space-between; margin-top: 10px;">
                <span>👤 ${mod.author_username || 'Unknown'}</span>
                <span>💾 ${(mod.size ? (mod.size / 1024 / 1024).toFixed(2) : 0)} MB</span>
            </div>
        </div>
    `).join('');
}

function updateTimestamp() {
    if (DOM.lastUpdate) {
        DOM.lastUpdate.innerText = `Last updated: ${new Date().toLocaleTimeString()}`;
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
    if (value === 'manual' || !value) return;
    
    refreshTimer = setInterval(fetchMods, parseInt(value) * 1000);
}

if (DOM.refreshBtn) DOM.refreshBtn.addEventListener('click', fetchMods);
if (DOM.gameSelect) DOM.gameSelect.addEventListener('change', fetchMods);
if (DOM.platformSelect) DOM.platformSelect.addEventListener('change', fetchMods);
if (DOM.refreshInterval) DOM.refreshInterval.addEventListener('change', setupAutoRefresh);

window.addEventListener('DOMContentLoaded', () => {
    fetchMods();
    setupAutoRefresh();
});
