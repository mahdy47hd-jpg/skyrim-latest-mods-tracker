// Skyrim Latest Mods Tracker - Using Nexus Mods API (CORS-friendly)
const CONFIG = {
    NEXUS_API_BASE: 'https://api.nexusmods.com/v1',
    // Note: In production, use your own backend to hide API key
    // For now, we're using public endpoints that don't require authentication
    games: {
        'skyrimspecialedition': 'skyrimspecialedition',
        'skyrim': 'skyrim',
        'fallout4': 'fallout4',
        'fallout3': 'fallout3'
    },
    updateInterval: 60000 // Default 1 minute
};

const DOM = {
    gameSelect: document.getElementById('gameSelect'),
    sortSelect: document.getElementById('sortSelect'),
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

// Simple fetch wrapper with error handling
async function fetchWithTimeout(url, timeout = 10000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'Accept': 'application/json'
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
        const game = DOM.gameSelect?.value || 'skyrimspecialedition';
        const sortBy = DOM.sortSelect?.value || 'updated';
        
        // Map sort options to Nexus API parameters
        let sortParam = 'last_updated';
        if (sortBy === 'published') sortParam = 'published_at';
        if (sortBy === 'trending') sortParam = 'endorsement_count';
        if (sortBy === 'downloaded') sortParam = 'download_count';
        
        // Construct URL with proper parameters
        const url = `${CONFIG.NEXUS_API_BASE}/games/${game}/mods/latest.json?period=1w&sort=${sortParam}`;
        
        console.log('Fetching mods from:', url);
        
        const response = await fetchWithTimeout(url, 15000);
        
        if (!response.ok) {
            if (response.status === 429) {
                throw new Error('API rate limit reached. Please wait a moment and try again.');
            }
            if (response.status === 403) {
                throw new Error('Access denied. The API may be temporarily unavailable.');
            }
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (Array.isArray(data) && data.length > 0) {
            cachedMods = data;
            displayMods(data);
            updateTimestamp();
            showSuccess(`Successfully loaded ${data.length} mods`);
        } else {
            showError('No mods found for this selection.');
        }
    } catch (error) {
        console.error('Fetch Error:', error);
        
        let errorMsg = 'Failed to load mods.';
        
        if (error.name === 'AbortError') {
            errorMsg = 'Request timeout. The API took too long to respond.';
        } else if (error instanceof TypeError) {
            errorMsg = 'Network error. Check your internet connection.';
        } else {
            errorMsg = error.message || errorMsg;
        }
        
        showError(errorMsg);
        
        // Display cached mods if available
        if (cachedMods.length > 0) {
            displayMods(cachedMods);
            showSuccess(`Showing cached mods (${cachedMods.length} items)`);
        }
    } finally {
        showSpinner(false);
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
        const imageUrl = mod.picture_url ? `https://staticdelivery.nexusmods.com/Images/${DOM.gameSelect.value}/mods/${mod.uid}/${mod.picture_url}` : 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22200%22%3E%3Crect fill=%22%23334155%22 width=%22300%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%2394a3b8%22 font-family=%22Arial%22%3ENo Image%3C/text%3E%3C/svg%3E';
        const uploadDate = new Date(mod.uploaded_at || mod.published_at || Date.now()).toLocaleDateString();
        const endorsements = mod.endorsement_count || 0;
        const downloads = mod.download_count || 0;
        
        return `
            <div class="mod-card">
                <div class="mod-image-container">
                    <img src="${imageUrl}" alt="${mod.name}" class="mod-image" onerror="this.style.display='none'">
                </div>
                <div class="mod-content">
                    <div class="mod-header">
                        <h3>${mod.name || 'Unknown Mod'}</h3>
                        <span class="mod-date">${uploadDate}</span>
                    </div>
                    <p class="mod-description">${mod.summary || 'No description available.'}</p>
                    <div class="mod-footer">
                        <span class="mod-stat">👤 ${mod.user?.name || 'Unknown'}</span>
                        <span class="mod-stat">👍 ${endorsements.toLocaleString()}</span>
                        <span class="mod-stat">⬇️ ${downloads.toLocaleString()}</span>
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
        }, 3000);
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
if (DOM.sortSelect) DOM.sortSelect.addEventListener('change', fetchMods);
if (DOM.refreshInterval) DOM.refreshInterval.addEventListener('change', setupAutoRefresh);

// Initial load when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    console.log('App initialized');
    fetchMods();
    setupAutoRefresh();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (refreshTimer) clearInterval(refreshTimer);
});