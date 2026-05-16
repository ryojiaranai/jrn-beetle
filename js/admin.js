/**
 * JRN BEETLE — Admin Panel
 * Livestock management system for beetle breeding inventory.
 * Data is persisted in localStorage and can be exported as livestock.json.
 */

// ===== DATA STRUCTURE =====

const STORAGE_KEY = 'jrn_beetle_livestock';

const defaultData = {
    lastUpdated: "",
    currency: "THB",
    categories: {
        adultBeetles: [],
        larvae: [],
        beetleJelly: [],
        equipment: []
    }
};

// Current application state
let data = loadData();
let activeTab = 'adultBeetles';
let editingId = null; // null = adding new, otherwise the id being edited

// ===== DATA PERSISTENCE =====

/** Load data from localStorage, falling back to defaults */
function loadData() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            // Ensure all categories exist (in case of older data format)
            for (const key of Object.keys(defaultData.categories)) {
                if (!parsed.categories[key]) {
                    parsed.categories[key] = [];
                }
            }
            return parsed;
        }
    } catch (e) {
        console.warn('Failed to load data from localStorage:', e);
    }
    return JSON.parse(JSON.stringify(defaultData));
}

/** Save current data to localStorage */
function saveData() {
    data.lastUpdated = new Date().toISOString();
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.error('Failed to save data:', e);
        alert('Error saving data to localStorage.');
    }
}

// ===== TAB SWITCHING =====

/** Switch active tab and re-render */
function switchTab(category) {
    activeTab = category;

    // Update tab button styles
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === category);
    });

    // Show/hide panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.toggle('active', panel.id === `panel-${category}`);
    });

    renderTable(category);
}

// Attach click handlers to tab buttons
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

// ===== RENDERING =====

/** Format a number with commas: 1500 -> "1,500 THB" */
function formatPrice(price) {
    if (price == null || price === '') return '—';
    return Number(price).toLocaleString('en-US') + ' THB';
}

/** Return HTML for a status badge */
function statusBadge(status) {
    if (!status) return '';
    const cls = `status-${status}`;
    const label = status.charAt(0).toUpperCase() + status.slice(1);
    return `<span class="status-badge ${cls}">${label}</span>`;
}

/** Render the table body for a given category */
function renderTable(category) {
    const tbody = document.getElementById(`tbody-${category}`);
    const items = data.categories[category] || [];

    // Update tab count badges
    updateCounts();

    if (items.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10">
                    <div class="empty-state">
                        <div class="empty-state-icon">&#128366;</div>
                        <p>No items yet. Click "Add New" to get started.</p>
                    </div>
                </td>
            </tr>`;
        return;
    }

    let html = '';

    if (category === 'adultBeetles') {
        items.forEach(item => {
            const dimClass = item.quantity === 0 ? 'dimmed' : '';
            html += `
            <tr class="${dimClass}">
                <td>${esc(item.species)}</td>
                <td>${esc(item.commonName || '')}</td>
                <td>${esc(item.variation || '')}</td>
                <td>${esc(item.sex || '')}</td>
                <td>${esc(item.origin || '')}</td>
                <td>${item.quantity}</td>
                <td>${formatPrice(item.price)}</td>
                <td>${item.promoPrice ? formatPrice(item.promoPrice) : '—'}</td>
                <td>${statusBadge(item.status)}</td>
                <td>
                    <button class="btn-icon edit" title="Edit" onclick="openEditModal('${category}', ${item.id})">&#9998;</button>
                    <button class="btn-icon delete" title="Delete" onclick="deleteItem('${category}', ${item.id})">&#128465;</button>
                </td>
            </tr>`;
        });
    } else if (category === 'larvae') {
        items.forEach(item => {
            const dimClass = item.quantity === 0 ? 'dimmed' : '';
            html += `
            <tr class="${dimClass}">
                <td>${esc(item.species)}</td>
                <td>${esc(item.commonName || '')}</td>
                <td>${esc(item.variation || '')}</td>
                <td>${item.quantity}</td>
                <td>${formatPrice(item.price)}</td>
                <td>${item.promoPrice ? formatPrice(item.promoPrice) : '—'}</td>
                <td>${statusBadge(item.status)}</td>
                <td>
                    <button class="btn-icon edit" title="Edit" onclick="openEditModal('${category}', ${item.id})">&#9998;</button>
                    <button class="btn-icon delete" title="Delete" onclick="deleteItem('${category}', ${item.id})">&#128465;</button>
                </td>
            </tr>`;
        });
    } else {
        // beetleJelly or equipment
        items.forEach(item => {
            const dimClass = item.quantity === 0 ? 'dimmed' : '';
            const videoCell = item.videoUrl
                ? `<a href="${esc(item.videoUrl)}" target="_blank" class="video-link">Watch</a>`
                : '—';
            html += `
            <tr class="${dimClass}">
                <td>${esc(item.name)}</td>
                <td>${esc(item.description || '')}</td>
                <td>${item.quantity}</td>
                <td>${formatPrice(item.price)}</td>
                <td>${item.promoPrice ? formatPrice(item.promoPrice) : '—'}</td>
                <td>${videoCell}</td>
                <td>
                    <button class="btn-icon edit" title="Edit" onclick="openEditModal('${category}', ${item.id})">&#9998;</button>
                    <button class="btn-icon delete" title="Delete" onclick="deleteItem('${category}', ${item.id})">&#128465;</button>
                </td>
            </tr>`;
        });
    }

    tbody.innerHTML = html;
}

/** Update the count badges on all tabs */
function updateCounts() {
    for (const key of Object.keys(data.categories)) {
        const el = document.getElementById(`count-${key}`);
        if (el) {
            el.textContent = data.categories[key].length;
        }
    }
}

/** Escape HTML to prevent XSS */
function esc(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ===== MODAL MANAGEMENT =====

const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const form = document.getElementById('itemForm');

/** Determine which form fields to show based on category */
function configureFormFields(category) {
    const isSpecies = (category === 'adultBeetles' || category === 'larvae');
    const isProduct = (category === 'beetleJelly' || category === 'equipment');
    const isAdult = (category === 'adultBeetles');
    const hasStatus = (category === 'adultBeetles' || category === 'larvae');

    // Show/hide field groups
    document.getElementById('fields-species').style.display = isSpecies ? '' : 'none';
    document.getElementById('fields-product').style.display = isProduct ? '' : 'none';
    document.getElementById('fields-sex').style.display = isAdult ? '' : 'none';
    document.getElementById('fields-origin').style.display = isAdult ? '' : 'none';
    document.getElementById('fields-status').style.display = hasStatus ? '' : 'none';
    document.getElementById('fields-video').style.display = isProduct ? '' : 'none';

    // Configure status options based on category
    const statusSelect = document.getElementById('f-status');
    if (category === 'larvae') {
        // Larvae don't have "breeding" status
        statusSelect.innerHTML = `
            <option value="available">Available</option>
            <option value="sold">Sold</option>
            <option value="reserved">Reserved</option>`;
    } else {
        statusSelect.innerHTML = `
            <option value="available">Available</option>
            <option value="sold">Sold</option>
            <option value="breeding">Breeding</option>
            <option value="reserved">Reserved</option>`;
    }
}

/** Clear all form fields */
function clearForm() {
    document.getElementById('f-species').value = '';
    document.getElementById('f-commonName').value = '';
    document.getElementById('f-variation').value = '';
    document.getElementById('f-name').value = '';
    document.getElementById('f-description').value = '';
    document.getElementById('f-sex').value = 'Male';
    document.getElementById('f-origin').value = '';
    document.getElementById('f-quantity').value = '1';
    document.getElementById('f-price').value = '';
    document.getElementById('f-promoPrice').value = '';
    document.getElementById('f-status').value = 'available';
    document.getElementById('f-videoUrl').value = '';
}

/** Open modal to add a new item */
function openAddModal(category) {
    editingId = null;
    activeTab = category;
    modalTitle.textContent = 'Add New Item';
    configureFormFields(category);
    clearForm();
    modal.classList.add('open');
}

/** Open modal to edit an existing item */
function openEditModal(category, id) {
    const item = data.categories[category].find(i => i.id === id);
    if (!item) return;

    editingId = id;
    activeTab = category;
    modalTitle.textContent = 'Edit Item';
    configureFormFields(category);

    // Populate form fields from item data
    const isSpecies = (category === 'adultBeetles' || category === 'larvae');

    if (isSpecies) {
        document.getElementById('f-species').value = item.species || '';
        document.getElementById('f-commonName').value = item.commonName || '';
        document.getElementById('f-variation').value = item.variation || '';
    } else {
        document.getElementById('f-name').value = item.name || '';
        document.getElementById('f-description').value = item.description || '';
        document.getElementById('f-videoUrl').value = item.videoUrl || '';
    }

    if (category === 'adultBeetles') {
        document.getElementById('f-sex').value = item.sex || 'Male';
        document.getElementById('f-origin').value = item.origin || '';
    }

    document.getElementById('f-quantity').value = item.quantity ?? 0;
    document.getElementById('f-price').value = item.price ?? '';
    document.getElementById('f-promoPrice').value = item.promoPrice || '';

    if (category === 'adultBeetles' || category === 'larvae') {
        document.getElementById('f-status').value = item.status || 'available';
    }

    modal.classList.add('open');
}

/** Close the modal */
function closeModal() {
    modal.classList.remove('open');
    editingId = null;
}

// Close on overlay click
modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});

// Close on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) {
        closeModal();
    }
});

// ===== SAVE / DELETE =====

/** Save item from form (add or update) */
function saveItem(e) {
    if (e) e.preventDefault();

    const category = activeTab;
    const isSpecies = (category === 'adultBeetles' || category === 'larvae');
    const isProduct = (category === 'beetleJelly' || category === 'equipment');

    // Validate required fields
    if (isSpecies) {
        const species = document.getElementById('f-species').value.trim();
        const price = document.getElementById('f-price').value;
        if (!species) {
            alert('Species is required.');
            document.getElementById('f-species').focus();
            return;
        }
        if (!price && price !== 0) {
            alert('Price is required.');
            document.getElementById('f-price').focus();
            return;
        }
    } else {
        const name = document.getElementById('f-name').value.trim();
        const price = document.getElementById('f-price').value;
        if (!name) {
            alert('Name is required.');
            document.getElementById('f-name').focus();
            return;
        }
        if (!price && price !== 0) {
            alert('Price is required.');
            document.getElementById('f-price').focus();
            return;
        }
    }

    // Build the item object
    let item = {};

    if (editingId !== null) {
        // Editing: find existing item and keep its id
        item = data.categories[category].find(i => i.id === editingId);
        if (!item) {
            alert('Item not found.');
            return;
        }
    } else {
        // Adding: generate new id
        item.id = Date.now();
    }

    // Set fields from form
    if (isSpecies) {
        item.species = document.getElementById('f-species').value.trim();
        item.commonName = document.getElementById('f-commonName').value.trim();
        item.variation = document.getElementById('f-variation').value.trim();
    }

    if (isProduct) {
        item.name = document.getElementById('f-name').value.trim();
        item.description = document.getElementById('f-description').value.trim();
        item.videoUrl = document.getElementById('f-videoUrl').value.trim();
    }

    if (category === 'adultBeetles') {
        item.sex = document.getElementById('f-sex').value;
        item.origin = document.getElementById('f-origin').value.trim();
    }

    item.quantity = parseInt(document.getElementById('f-quantity').value, 10) || 0;
    item.price = parseInt(document.getElementById('f-price').value, 10) || 0;

    var promoPriceVal = document.getElementById('f-promoPrice').value.trim();
    item.promoPrice = promoPriceVal !== '' ? parseInt(promoPriceVal, 10) : null;

    if (category === 'adultBeetles' || category === 'larvae') {
        item.status = document.getElementById('f-status').value;
    }

    // If new item, push to array
    if (editingId === null) {
        data.categories[category].push(item);
    }

    saveData();
    renderTable(category);
    closeModal();
}

/** Delete an item after confirmation */
function deleteItem(category, id) {
    const confirmed = confirm('Are you sure you want to delete this item?');
    if (!confirmed) return;

    data.categories[category] = data.categories[category].filter(i => i.id !== id);
    saveData();
    renderTable(category);
}

// ===== DOWNLOAD / IMPORT =====

/** Download current data as livestock.json */
function downloadData() {
    data.lastUpdated = new Date().toISOString();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'livestock.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/** Trigger file input for importing data */
function importData() {
    document.getElementById('importFile').click();
}

/** Handle the imported file */
document.getElementById('importFile').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
        try {
            const imported = JSON.parse(event.target.result);

            // Basic validation: must have categories object
            if (!imported.categories) {
                alert('Invalid file format: missing "categories" property.');
                return;
            }

            // Confirm overwrite
            const confirmed = confirm(
                'This will replace all current data with the imported file. Continue?'
            );
            if (!confirmed) return;

            data = imported;

            // Ensure all category keys exist
            for (const key of Object.keys(defaultData.categories)) {
                if (!data.categories[key]) {
                    data.categories[key] = [];
                }
            }

            saveData();
            renderAllTables();
            alert('Data imported successfully.');
        } catch (err) {
            alert('Failed to parse JSON file: ' + err.message);
        }
    };
    reader.readAsText(file);

    // Reset input so the same file can be re-imported
    this.value = '';
});

// ===== INITIALIZATION =====

/** Render all tables (used on page load and after import) */
function renderAllTables() {
    for (const key of Object.keys(data.categories)) {
        renderTable(key);
    }
}

// Initial render
renderAllTables();
