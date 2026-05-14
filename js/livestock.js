// ===== JRN BEETLE — Livestock Page =====

(function () {
    'use strict';

    // ---------- State ----------
    let livestockData = null;

    // ---------- Helpers ----------

    function formatPrice(price) {
        return '฿' + price.toLocaleString();
    }

    /**
     * Extract YouTube video ID from various URL formats.
     * Returns null if not a YouTube URL.
     */
    function getYouTubeId(url) {
        if (!url) return null;
        const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
        return m ? m[1] : null;
    }

    /**
     * Build an embedded video element or a link button.
     */
    function renderVideo(url) {
        if (!url) return '';
        const ytId = getYouTubeId(url);
        if (ytId) {
            return `
                <div class="video-container">
                    <iframe src="https://www.youtube-nocookie.com/embed/${ytId}"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowfullscreen
                            loading="lazy"
                            title="Product video"></iframe>
                </div>`;
        }
        // Non-YouTube link
        return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="video-link-btn">&#9654; Watch Video</a>`;
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function sexLabel(sex) {
        switch ((sex || '').toLowerCase()) {
            case 'male':   return '<span class="sex-icon sex-icon--male">♂</span> Male';
            case 'female': return '<span class="sex-icon sex-icon--female">♀</span> Female';
            case 'pair':   return '<span class="sex-icon sex-icon--pair">♂♀</span> Pair';
            default:       return '';
        }
    }

    function statusClass(status) {
        switch ((status || '').toLowerCase()) {
            case 'available': return 'status-badge--available';
            case 'sold':      return 'status-badge--sold';
            case 'breeding':  return 'status-badge--breeding';
            case 'reserved':  return 'status-badge--reserved';
            default:          return 'status-badge--available';
        }
    }

    function statusLabel(status) {
        return (status || 'available').charAt(0).toUpperCase() + (status || 'available').slice(1);
    }

    function isSoldOut(item) {
        return item.quantity === 0 || (item.status || '').toLowerCase() === 'sold';
    }

    /**
     * Sort items: available first, then sold / out-of-stock.
     */
    function sortByAvailability(items) {
        return [...items].sort((a, b) => {
            const aSold = isSoldOut(a) ? 1 : 0;
            const bSold = isSoldOut(b) ? 1 : 0;
            return aSold - bSold;
        });
    }

    // ---------- Card Renderers ----------

    function renderAdultCard(item) {
        const soldOut = isSoldOut(item);
        return `
        <div class="ls-card${soldOut ? ' sold-out' : ''}" data-searchable="${(item.species + ' ' + item.commonName + ' ' + (item.variation || '')).toLowerCase()}">
            <span class="status-badge ${statusClass(item.status)}">${statusLabel(item.status)}</span>
            <div class="ls-card__species">${escapeHtml(item.species)}</div>
            <div class="ls-card__common">${escapeHtml(item.commonName)}</div>
            ${item.variation ? `<div class="variation-badge">${escapeHtml(item.variation)}</div>` : ''}
            <div class="ls-card__row">
                <div>${sexLabel(item.sex)}</div>
                <div class="ls-card__qty">${item.quantity > 0
                    ? `<span class="in-stock">${item.quantity} In Stock</span>`
                    : `<span class="out-of-stock">Sold Out</span>`}</div>
            </div>
            <div class="ls-card__row">
                <div class="ls-card__price">${formatPrice(item.price)}</div>
            </div>
        </div>`;
    }

    function renderLarvaCard(item) {
        const soldOut = isSoldOut(item);
        return `
        <div class="ls-card${soldOut ? ' sold-out' : ''}" data-searchable="${(item.species + ' ' + item.commonName + ' ' + (item.variation || '')).toLowerCase()}">
            <span class="status-badge ${statusClass(item.status)}">${statusLabel(item.status)}</span>
            ${item.stage ? `<span class="stage-badge">${escapeHtml(item.stage)}</span>` : ''}
            <div class="ls-card__species">${escapeHtml(item.species)}</div>
            <div class="ls-card__common">${escapeHtml(item.commonName)}</div>
            ${item.variation ? `<div class="variation-badge">${escapeHtml(item.variation)}</div>` : ''}
            <div class="ls-card__row">
                <div class="ls-card__qty">${item.quantity > 0
                    ? `<span class="in-stock">${item.quantity} In Stock</span>`
                    : `<span class="out-of-stock">Sold Out</span>`}</div>
                <div class="ls-card__price">${formatPrice(item.price)}</div>
            </div>
        </div>`;
    }

    function renderProductCard(item) {
        const soldOut = isSoldOut(item);
        return `
        <div class="ls-card${soldOut ? ' sold-out' : ''}" data-searchable="${(item.name + ' ' + (item.description || '')).toLowerCase()}">
            <span class="status-badge ${statusClass(item.status)}">${statusLabel(item.status)}</span>
            ${renderVideo(item.videoUrl)}
            <div class="ls-card__common">${escapeHtml(item.name)}</div>
            <div class="ls-card__desc">${escapeHtml(item.description || '')}</div>
            <div class="ls-card__row">
                <div class="ls-card__qty">${item.quantity > 0
                    ? `<span class="in-stock">${item.quantity} In Stock</span>`
                    : `<span class="out-of-stock">Sold Out</span>`}</div>
                <div class="ls-card__price">${formatPrice(item.price)}</div>
            </div>
        </div>`;
    }

    // ---------- Rendering ----------

    function renderGrid(gridId, items, renderer) {
        const grid = document.getElementById(gridId);
        if (!grid) return;

        if (!items || items.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state__icon">🪲</div>
                    <p class="empty-state__text">No items available yet</p>
                </div>`;
            return;
        }

        const sorted = sortByAvailability(items);
        grid.innerHTML = sorted.map(renderer).join('');
    }

    function renderAll(data) {
        renderGrid('grid-adults', data.adults || [], renderAdultCard);
        renderGrid('grid-larvae', data.larvae || [], renderLarvaCard);
        renderGrid('grid-jelly', data.jelly || [], renderProductCard);
        renderGrid('grid-equipment', data.equipment || [], renderProductCard);

        // Last updated
        const el = document.getElementById('lastUpdated');
        if (el && data.lastUpdated) {
            el.innerHTML = `<span>Last updated: ${escapeHtml(data.lastUpdated)}</span>`;
        }
    }

    function showError(message) {
        const grids = ['grid-adults', 'grid-larvae', 'grid-jelly', 'grid-equipment'];
        grids.forEach(function (id) {
            const grid = document.getElementById(id);
            if (grid) {
                grid.innerHTML = `
                    <div class="error-state">
                        <div class="error-state__icon">⚠️</div>
                        <p>${escapeHtml(message)}</p>
                    </div>`;
            }
        });
    }

    // ---------- Data Fetching ----------

    function fetchData() {
        fetch('data/livestock.json')
            .then(function (res) {
                if (!res.ok) throw new Error('Could not load livestock data.');
                return res.json();
            })
            .then(function (data) {
                livestockData = data;
                renderAll(data);
            })
            .catch(function (err) {
                console.error(err);
                showError('No data available — please check back later.');
            });
    }

    // ---------- Tabs ----------

    function initTabs() {
        var nav = document.getElementById('tabsNav');
        if (!nav) return;

        nav.addEventListener('click', function (e) {
            var btn = e.target.closest('.tab-btn');
            if (!btn) return;

            var tabName = btn.dataset.tab;

            // Update buttons
            nav.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');

            // Update content
            document.querySelectorAll('.tab-content').forEach(function (tc) { tc.classList.remove('active'); });
            var target = document.getElementById('tab-' + tabName);
            if (target) target.classList.add('active');
        });
    }

    // ---------- Search / Filter ----------

    function initSearch() {
        document.querySelectorAll('[data-search]').forEach(function (input) {
            input.addEventListener('input', function () {
                var query = this.value.trim().toLowerCase();
                var category = this.dataset.search;
                var grid = document.getElementById('grid-' + category);
                if (!grid) return;

                grid.querySelectorAll('.ls-card').forEach(function (card) {
                    var text = card.getAttribute('data-searchable') || '';
                    card.style.display = text.includes(query) ? '' : 'none';
                });
            });
        });
    }

    // ---------- Mobile Nav Toggle ----------

    function initNav() {
        var toggle = document.getElementById('navToggle');
        var links = document.getElementById('navLinks');
        if (!toggle || !links) return;

        toggle.addEventListener('click', function () {
            toggle.classList.toggle('active');
            links.classList.toggle('open');
        });

        // Close menu when a link is clicked
        links.querySelectorAll('a').forEach(function (a) {
            a.addEventListener('click', function () {
                toggle.classList.remove('active');
                links.classList.remove('open');
            });
        });

        // Navbar scroll effect
        window.addEventListener('scroll', function () {
            var navbar = document.getElementById('navbar');
            if (navbar) {
                navbar.classList.toggle('scrolled', window.scrollY > 20);
            }
        });
    }

    // ---------- Init ----------

    document.addEventListener('DOMContentLoaded', function () {
        initNav();
        initTabs();
        fetchData();
        // Search bindings are set after data loads
        // Use a small delay to ensure DOM is ready after render
        setTimeout(initSearch, 500);
    });

})();
