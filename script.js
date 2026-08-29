class LatestModsTracker {
    constructor() {
        this.apiBase = 'https://bethesda.net/api/magiclinks/v2/magiclinks';
        this.refreshInterval = null;
        this.currentGame = 'skyrim';
        this.currentPlatform = 'WINDOWS';
        this.mods = [];

        this.elements = {
            gameSelect: document.getElementById('gameSelect'),
            platformSelect: document.getElementById('platformSelect'),
            refreshInterval: document.getElementById('refreshInterval'),
            refreshBtn: document.getElementById('refreshBtn'),
            modsGrid: document.getElementById('modsGrid'),
            lastUpdate: document.getElementById('lastUpdate'),
            loadingSpinner: document.getElementById('loadingSpinner'),
            errorMessage: document.getElementById('errorMessage')
        };

        this.init();
    }

    init() {
        this.attachEventListeners();
        this.loadMods();
    }

    attachEventListeners() {
        this.elements.gameSelect.addEventListener('change', () => {
            this.currentGame = this.elements.gameSelect.value;
            this.loadMods();
        });

        this.elements.platformSelect.addEventListener('change', () => {
            this.currentPlatform = this.elements.platformSelect.value;
            this.loadMods();
        });

        this.elements.refreshInterval.addEventListener('change', () => {
            const interval = parseInt(this.elements.refreshInterval.value);
            this.setAutoRefresh(interval);
        });

        this.elements.refreshBtn.addEventListener('click', () => {
            this.loadMods();
        });
    }

    async loadMods() {
        try {
            this.showLoadingSpinner(true);
            this.hideErrorMessage();

            const mods = await this.fetchLatestMods();
            this.mods = mods;
            this.renderMods(mods);
            this.updateLastRefresh();
        } catch (error) {
            console.error('Error loading mods:', error);
            this.showErrorMessage('Failed to load mods. Please try again.');
        } finally {
            this.showLoadingSpinner(false);
        }
    }

    async fetchLatestMods() {
        // Build query parameters
        const params = new URLSearchParams({
            game: this.currentGame,
            platform: this.currentPlatform,
            sortBy: 'latest',
            _sortBy: 'latest',
            v: Date.now() // Cache buster
        });

        const url = `${this.apiBase}?${params.toString()}`;

        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Parse and sort mods by date (newest first)
        const mods = (data.data || []).slice(0, 50); // Limit to 50 mods
        return mods;
    }

    renderMods(mods) {
        if (!mods || mods.length === 0) {
            this.elements.modsGrid.innerHTML = '<div class="no-results">No mods found. Try different filters.</div>';
            return;
        }

        const html = mods.map(mod => this.createModCard(mod)).join('');
        this.elements.modsGrid.innerHTML = html;
    }

    createModCard(mod) {
        const name = mod.name || 'Unknown';
        const author = mod.author_name || 'Unknown Author';
        const description = mod.description || 'No description available';
        const imageUrl = mod.image_url || '';
        const modUrl = mod.url || '#';
        const datePublished = mod.created_date ? new Date(mod.created_date).toLocaleDateString() : 'Unknown';
        const downloads = mod.downloads || 0;
        const favorites = mod.favorites || 0;

        return `
            <div class="mod-card" onclick="if(event.target.tagName !== 'A') window.open('${this.escapeHtml(modUrl)}', '_blank')">
                <div class="mod-card-header">
                    <h3 class="mod-title">${this.escapeHtml(name)}</h3>
                    <span class="mod-platform">${this.getPlatformLabel()}</span>
                </div>
                <p class="mod-author">by ${this.escapeHtml(author)}</p>
                <p class="mod-description">${this.escapeHtml(description.substring(0, 150))}</p>
                <div class="mod-stats">
                    <span class="stat">📥 ${this.formatNumber(downloads)} Downloads</span>
                    <span class="stat">❤️ ${this.formatNumber(favorites)} Favorites</span>
                </div>
                <p class="mod-date">📅 Published: ${datePublished}</p>
                <a href="${this.escapeHtml(modUrl)}" target="_blank" class="mod-link">View on Bethesda.net →</a>
            </div>
        `;
    }

    getPlatformLabel() {
        const labels = {
            'WINDOWS': 'PC',
            'XB1': 'Xbox',
            'PS4': 'PlayStation'
        };
        return labels[this.currentPlatform] || this.currentPlatform;
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    setAutoRefresh(interval) {
        // Clear existing interval
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }

        // Set new interval if enabled
        if (interval > 0) {
            this.refreshInterval = setInterval(() => {
                this.loadMods();
            }, interval);
        }
    }

    showLoadingSpinner(show) {
        this.elements.loadingSpinner.style.display = show ? 'block' : 'none';
    }

    showErrorMessage(message) {
        this.elements.errorMessage.textContent = message;
        this.elements.errorMessage.style.display = 'block';
    }

    hideErrorMessage() {
        this.elements.errorMessage.style.display = 'none';
    }

    updateLastRefresh() {
        const now = new Date();
        const timeStr = now.toLocaleTimeString();
        this.elements.lastUpdate.textContent = `Last updated: ${timeStr}`;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new LatestModsTracker();
});