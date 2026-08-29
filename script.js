// Skyrim Latest Mods Tracker - Using Bethesda UGC API
const CONFIG = {
    // Bethesda's official UGC (User Generated Content) API endpoint
    BETHESDA_API_BASE: 'https://api.bethesda.net/ugcmods/v2',
    // Using corsproxy.io - more stable and no activation needed
    CORS_PROXY: 'https://corsproxy.io/?',
    games: {
        'skyrim': 'SKYRIM',
        'skyrimse': 'SKYRIMSE', // Skyrim Special Edition
        'fallout4': 'FALLOUT4',
        'fallout76': 'FALLOUT76'
    },
    platforms: {
        'PC': 'WINDOWS',
        'XBOX': 'XBOX',
        'PS4': 'PLAYSTATION'
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

// Fetch with timeout
async function fetchWithTimeout(url, timeout = 15000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

// Main fetch mods function
async function fetchMods() {
    showSpinner(true);
    hideError();
    hideSuccess();
    
    try {
        const game = DOM.gameSelect?.value || 'skyrimse';
        const platform = DOM.platformSelect?.value || 'PC';
        
        // Construct Bethesda API URL
        // Format: GET /ugcmods/v2/content?product=GAME&platform=PLATFORM&number_results=40&order=desc&sort=updated&deleted=false
        const params = new URLSearchParams({
            'product': CONFIG.games[game] || 'SKYRIMSE',
            'platform': CONFIG.platforms[platform] || 'WINDOWS',
            'number_results': '40',
            'order': 'desc',
            'sort': 'updated',
            'deleted': 'false'
        });
        
        const apiUrl = `${CONFIG.BETHESDA_API_BASE}/content?${params.toString()}`;
        const proxiedUrl = CONFIG.CORS_PROXY + encodeURIComponent(apiUrl);
        
        console.log('Fetching from Bethesda API:', apiUrl);
        console.log('Using corsproxy.io for CORS bypass');
        console.log('Proxied URL:', proxiedUrl);
        
        const response = await fetchWithTimeout(proxiedUrl, 20000);
        
        if (!response.ok) {
            if (response.status === 429) {
                throw new Error('API rate limit reached. Please wait and try again.');
            }
            if (response.status === 403) {
                throw new Error('Access denied by Bethesda API. Proxy may have been blocked.');
            }
            if (response.status === 502 || response.status === 503) {
                throw new Error('Bethesda API is temporarily unavailable.');
            }
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('API Response:', data);
        
        if (data && data.mods && Array.isArray(data.mods) && data.mods.length > 0) {
            cachedMods = data.mods;
            displayMods(data.mods);
            updateTimestamp();
            showSuccess(`Successfully loaded ${data.mods.length} Bethesda mods`);
        } else {
            showError('No mods found for this selection. Try a different platform or game.');
        }
    } catch (error) {
        console.error('Fetch Error:', error);
        
        let errorMsg = 'Failed to load mods from Bethesda API.';
        
        if (error.name === 'AbortError') {
            errorMsg = 'Request timeout. Bethesda API took too long to respond. Try again in a moment.';
        } else if (error instanceof TypeError) {
            errorMsg = 'Network error. Check your connection and try again.';
        } else {
            errorMsg = error.message || errorMsg;
        }
        
        showError(errorMsg);
        
        // Show cached mods if available
        if (cachedMods.length > 0) {
            displayMods(cachedMods);
            showSuccess(`Showing ${cachedMods.length} cached Bethesda mods`);
        }
    } finally {
        showSpinner(false);
    }
}

// Display mods in grid
function displayMods(mods) {
    if (!DOM.modsGrid) return;
    
    if (!mods || mods.length === 0) {
        DOM.modsGrid.innerHTML = '<p class="loading-text">No Bethesda mods found.</p>';
        return;
    }
    
    DOM.modsGrid.innerHTML = mods.map(mod => {
        const uploadDate = new Date(mod.created_at || mod.updated_at || Date.now()).toLocaleDateString();
        const author = mod.author || mod.author_username || 'Unknown Author';
        const description = mod.description || mod.summary || 'No description available.';
        const size = mod.size ? (mod.size / 1024 / 1024).toFixed(2) : 'N/A';
        const downloads = mod.download_count || 0;
        const platform = mod.platform || 'N/A';
        
        let platformClass = 'badge-pc';
        if (platform === 'XBOX') platformClass = 'badge-xbox';
        if (platform === 'PLAYSTATION') platformClass = 'badge-ps4';
        
        return `
            <div class="mod-card">
                <div class="mod-header">
                    <h3>${mod.name || 'Unknown Mod'}</h3>
                    <span class="mod-date">${uploadDate}</span>
                </div>
                <div class="mod-platform">
                    <span class="badge ${platformClass}">
                        ${platform}
                    </span>
                </div>
                <p class="mod-description">${description.substring(0, 200)}${description.length > 200 ? '...' : ''}</p>
                <div class="mod-footer">
                    <span class="mod-stat">👤 ${author}</span>
                    <span class="mod-stat">💾 ${size} MB</span>
                    <span class="mod-stat">⬇️ ${downloads.toLocaleString()}</span>
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
        }, 4000);
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
    console.log(`Auto-refresh set to every ${interval / 1000} seconds`);
}

// Event Listeners
if (DOM.refreshBtn) DOM.refreshBtn.addEventListener('click', fetchMods);
if (DOM.gameSelect) DOM.gameSelect.addEventListener('change', fetchMods);
if (DOM.platformSelect) DOM.platformSelect.addEventListener('change', fetchMods);
if (DOM.refreshInterval) DOM.refreshInterval.addEventListener('change', setupAutoRefresh);

// Initial load
window.addEventListener('DOMContentLoaded', () => {
    console.log('Bethesda Mod Tracker initialized');
    fetchMods();
    setupAutoRefresh();
});

// Cleanup
window.addEventListener('beforeunload', () => {
    if (refreshTimer) clearInterval(refreshTimer);
});
