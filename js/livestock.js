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

    function renderImage(imageUrl) {
        if (!imageUrl) return '';
        return `<div class="ls-card__img"><img src="${escapeHtml(imageUrl)}" alt="Product photo" loading="lazy"></div>`;
    }

    function renderAdultCard(item) {
        const soldOut = isSoldOut(item);
        return `
        <div class="ls-card${soldOut ? ' sold-out' : ''}" data-searchable="${(item.species + ' ' + item.commonName + ' ' + (item.variation || '')).toLowerCase()}">
            <span class="status-badge ${statusClass(item.status)}">${statusLabel(item.status)}</span>
            ${renderImage(item.image)}
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
            ${renderImage(item.image)}
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
            ${renderImage(item.image)}
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

    // ---------- CSV Parser ----------

    /**
     * Parse a CSV string into an array of objects using the first row as headers.
     */
    /**
     * Normalize a header string to camelCase key.
     * "Common Name" → "commonName", "Video URL" → "videoUrl", etc.
     */
    function normalizeHeader(h) {
        var s = h.trim().toLowerCase();
        // Convert spaces to camelCase: "common name" → "commonName"
        return s.replace(/\s+(.)/g, function (_, ch) { return ch.toUpperCase(); });
    }

    function parseCSV(csvText) {
        var lines = [];
        var current = '';
        var inQuotes = false;

        // Split by lines, respecting quoted fields that contain newlines
        for (var i = 0; i < csvText.length; i++) {
            var ch = csvText[i];
            if (ch === '"') {
                inQuotes = !inQuotes;
                current += ch;
            } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
                if (current.trim()) lines.push(current);
                current = '';
                // Skip \r\n pair
                if (ch === '\r' && csvText[i + 1] === '\n') i++;
            } else {
                current += ch;
            }
        }
        if (current.trim()) lines.push(current);

        if (lines.length < 2) return [];

        var rawHeaders = splitCSVRow(lines[0]);
        var headers = rawHeaders.map(normalizeHeader);
        var results = [];
        for (var j = 1; j < lines.length; j++) {
            var values = splitCSVRow(lines[j]);
            var obj = {};
            var hasData = false;
            for (var k = 0; k < headers.length; k++) {
                if (!headers[k]) continue; // skip empty header columns
                var val = (values[k] || '').trim();
                if (val) hasData = true;
                obj[headers[k]] = val;
            }
            // Skip completely empty rows
            if (hasData) results.push(obj);
        }
        return results;
    }

    function splitCSVRow(line) {
        var result = [];
        var current = '';
        var inQuotes = false;
        for (var i = 0; i < line.length; i++) {
            var ch = line[i];
            if (ch === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (ch === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += ch;
            }
        }
        result.push(current);
        return result;
    }

    // ---------- Google Sheets → Data Conversion ----------

    var SHEET_ID = '1REYfG_U7TUbmdtBeEBJw05DXxDqW49pYq1Roe4Ie4jY';

    function sheetURL(tabName) {
        return 'https://docs.google.com/spreadsheets/d/' + SHEET_ID +
               '/gviz/tq?tqx=out:csv&sheet=' + encodeURIComponent(tabName);
    }

    /**
     * Convert a row from the Adults sheet into the expected object.
     * Expected columns: species, commonName, variation, sex, quantity, price, status
     */
    function parseAdult(row) {
        // Skip rows with no species (empty template rows)
        if (!row.species) return null;
        return {
            species:    row.species || '',
            commonName: row.commonName || '',
            variation:  row.variation || '',
            sex:        row.sex || '',
            quantity:   parseInt(row.quantity, 10) || 0,
            price:      parseInt(row.price, 10) || 0,
            status:     normalizeStatus(row.status),
            image:      row.image || ''
        };
    }

    /**
     * Convert a row from the Larvae sheet.
     * Expected columns: species, commonName, variation, stage, quantity, price, status
     */
    function parseLarva(row) {
        if (!row.species) return null;
        return {
            species:    row.species || '',
            commonName: row.commonName || '',
            variation:  row.variation || '',
            stage:      row.stage || '',
            quantity:   parseInt(row.quantity, 10) || 0,
            price:      parseInt(row.price, 10) || 0,
            status:     normalizeStatus(row.status),
            image:      row.image || ''
        };
    }

    /**
     * Convert a row from the Jelly / Equipment sheets.
     * Expected columns: name, description, price, quantity, status, videoUrl
     */
    /**
     * Normalize status strings: "out of stock" → "sold", etc.
     */
    function normalizeStatus(s) {
        var st = (s || 'available').toLowerCase().trim();
        if (st === 'out of stock' || st === 'sold out') return 'sold';
        return st;
    }

    function parseProduct(row) {
        if (!row.name) return null;
        return {
            name:        row.name || '',
            description: row.description || '',
            price:       parseInt(row.price, 10) || 0,
            quantity:    parseInt(row.quantity, 10) || 0,
            status:      normalizeStatus(row.status),
            videoUrl:    row.videoUrl || '',
            image:       row.image || ''
        };
    }

    // ---------- Data Fetching ----------

    /**
     * Fetch a single sheet tab as CSV → parsed objects.
     * Returns a Promise that resolves to an array.
     */
    function fetchSheet(tabName, parser) {
        return fetch(sheetURL(tabName))
            .then(function (res) {
                if (!res.ok) throw new Error('Sheet "' + tabName + '" not available');
                return res.text();
            })
            .then(function (csv) {
                return parseCSV(csv).map(parser).filter(Boolean);
            });
    }

    /**
     * Fetch all 4 sheets in parallel, assemble into the data object,
     * then render. Falls back to local JSON if Sheets fails.
     */
    function fetchData() {
        Promise.all([
            fetchSheet('Adult Beetles', parseAdult),
            fetchSheet('Larvae', parseLarva),
            fetchSheet('Beetle Jelly', parseProduct),
            fetchSheet('Equipment', parseProduct)
        ])
        .then(function (results) {
            var data = {
                lastUpdated: new Date().toISOString().slice(0, 10),
                adults:    results[0],
                larvae:    results[1],
                jelly:     results[2],
                equipment: results[3]
            };
            livestockData = data;
            renderAll(data);
        })
        .catch(function (err) {
            console.warn('Google Sheets fetch failed, trying local JSON fallback…', err);
            fetchLocalJSON();
        });
    }

    /**
     * Fallback: load from local data/livestock.json
     */
    function fetchLocalJSON() {
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
