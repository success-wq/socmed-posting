// Configuration
const CONFIG = {
    WEBAPP_URL: 'https://script.google.com/macros/s/AKfycbx6O3c8JmVhn21GplhpCho6P2ploarzqbVRGzHNRu8sHj82tDzTOwsThpE5_4CULYCT/exec',
    N8N_WEBHOOK: 'https://bsmteam.app.n8n.cloud/webhook/65ce59cc-e7f3-497b-9a11-068d578caff6',
    N8N_PUBLISH_WEBHOOK: 'https://bsmteam.app.n8n.cloud/webhook/2a8b5dcf-f1b8-4683-b73a-f2e9f7adc498',
    GHL_LOCATION_ID: '',
    GHL_TOKEN: '',
    GHL_USER_ID: ''
};

// State
let forms = [];
let currentFormIndex = 0;
let accounts = [];
let spreadsheetData = [];

// DOM Elements
const formsContainer = document.getElementById('formsContainer');
const formTabs = document.getElementById('formTabs');
const addFormBtn = document.getElementById('addFormBtn');
const submitAllBtn = document.getElementById('submitAllBtn');
const loadingOverlay = document.getElementById('loadingOverlay');

// Load Spreadsheet Data
async function loadSpreadsheetData() {
    try {
        console.log('🔄 Fetching spreadsheet data from:', CONFIG.WEBAPP_URL);
        const response = await fetch(CONFIG.WEBAPP_URL);
        const data = await response.json();
        
        console.log('📥 Raw response:', data);
        
        if (data && data.length > 0) {
            spreadsheetData = data;
            
            // Set CONFIG values from first row
            const firstRow = data[0];
            CONFIG.GHL_LOCATION_ID = firstRow.ghlLocationId || '';
            CONFIG.GHL_TOKEN = firstRow.ghlApiKey || '';
            CONFIG.GHL_USER_ID = firstRow.ghlLocationId || '';
            
            console.log('✅ Spreadsheet data loaded:', data.length, 'rows');
        } else {
            console.error('❌ No data returned from spreadsheet');
        }
    } catch (error) {
        console.error('❌ Error loading spreadsheet data:', error);
        alert('Error loading spreadsheet data. Please check your webapp URL.');
    }
}

// Initialize
async function init() {
    await loadSpreadsheetData();
    await loadAccounts();
    createForm();
    setupEventListeners();
}

// Load GHL Accounts
async function loadAccounts() {
    try {
        console.log('📋 Loading accounts from spreadsheet data...');
        
        // Transform spreadsheet data to accounts array
        accounts = spreadsheetData.map((row, index) => ({
            id: `page-${index}`,
            name: row.pageTitle || '',
            platform: row.area || 'Page'
        }));
        
        console.log('✅ Accounts array populated:', accounts.length, 'items');
        console.log('📋 Accounts:', accounts);
        
    } catch (error) {
        console.error('❌ Error loading accounts:', error);
        accounts = [];
    }
}

// Setup Event Listeners
function setupEventListeners() {
    addFormBtn.addEventListener('click', createForm);
    submitAllBtn.addEventListener('click', submitAllForms);
}

// Create Form
function createForm() {
    const formId = forms.length + 1;
    const form = {
        id: formId,
        pageMode: 'select',
        pages: [],
        pageTitles: [],
        platforms: [],
        postPrompt: '',
        videoEnabled: false,
        videoType: 'prompt',
        videoPrompt: '',
        imageEnabled: false,
        imageType: 'prompt',
        imagePrompt: '',
        drafts: []
    };
    
    forms.push(form);
    renderForm(form);
    renderTabs();
    switchToForm(formId - 1);
}

// Render Form
function renderForm(form) {
    const formHTML = `
        <div class="form-item" data-form-id="${form.id}">
            <div class="form-header">
                <h2 class="form-title">Form ${form.id}</h2>
                ${forms.length > 1 ? `<button class="delete-form-btn" onclick="deleteForm(${form.id})">Delete Form</button>` : ''}
            </div>
            
            <div class="form-grid">
                <!-- Page Mode Selection -->
                <div class="form-section">
                    <label class="section-label">
                        Page Selection Mode
                        <span class="required-indicator">*</span>
                    </label>
                    <div class="radio-group">
                        <label class="radio-item">
                            <input type="radio" class="radio-input" name="pageMode-${form.id}" data-field="pageMode" value="select" checked>
                            <span class="radio-label">Select Pages</span>
                        </label>
                        <label class="radio-item">
                            <input type="radio" class="radio-input" name="pageMode-${form.id}" data-field="pageMode" value="all">
                            <span class="radio-label">All Pages</span>
                        </label>
                    </div>
                </div>

                <!-- Page Select -->
                <div class="form-section">
                    <label class="section-label">
                        Select Pages
                        <span class="required-indicator">*</span>
                    </label>
                    <div class="multiselect-wrapper" data-multiselect="${form.id}">
                        <div class="multiselect-display" data-multiselect-display="${form.id}">
                            <div class="multiselect-placeholder">Choose pages...</div>
                            <div class="multiselect-tags" data-multiselect-tags="${form.id}"></div>
                            <div class="multiselect-controls">
                                <button type="button" class="multiselect-clear" data-multiselect-clear="${form.id}" style="display: none;">
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                        <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                    </svg>
                                </button>
                                <div class="multiselect-arrow">
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                        <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                </div>
                            </div>
                        </div>
                        <div class="multiselect-dropdown" data-multiselect-dropdown="${form.id}">
                            <div class="multiselect-search">
                                <input 
                                    type="text" 
                                    class="multiselect-search-input" 
                                    data-multiselect-search="${form.id}"
                                    placeholder="Search pages..."
                                >
                            </div>
                            <div class="multiselect-options" data-multiselect-options="${form.id}">
                                ${accounts.map(acc => `
                                    <div class="multiselect-option" data-option-id="${acc.id}" data-option-name="${acc.name} (${acc.platform})">
                                        ${acc.name} (${acc.platform})
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Platforms -->
                <div class="form-section">
                    <label class="section-label">
                        Platforms
                        <span class="required-indicator">*</span>
                    </label>
                    <div class="checkbox-group">
                        <label class="checkbox-item">
                            <input type="checkbox" class="checkbox-input" data-field="platforms" value="facebook">
                            <span class="checkbox-label">Facebook</span>
                        </label>
                        <label class="checkbox-item">
                            <input type="checkbox" class="checkbox-input" data-field="platforms" value="linkedin">
                            <span class="checkbox-label">LinkedIn</span>
                        </label>
                        <label class="checkbox-item">
                            <input type="checkbox" class="checkbox-input" data-field="platforms" value="instagram">
                            <span class="checkbox-label">Instagram</span>
                        </label>
                    </div>
                </div>

                <!-- Media Options -->
                <div class="form-section media-section">
                    <label class="section-label">Media Options</label>
                    
                    <!-- Video Option -->
                    <div class="media-option">
                        <label class="checkbox-item media-checkbox">
                            <input type="checkbox" class="checkbox-input" data-field="videoEnabled" data-media-type="video" ${form.videoEnabled ? 'checked' : ''}>
                            <span class="checkbox-label">Video</span>
                        </label>
                        
                        <div class="media-config" data-media-config="video" style="display: ${form.videoEnabled ? 'block' : 'none'};">
                            <div class="media-type-selector">
                                <label class="radio-item">
                                    <input type="radio" class="radio-input" name="videoType-${form.id}" data-field="videoType" value="prompt" checked>
                                    <span class="radio-label">Prompt</span>
                                </label>
                                <label class="radio-item">
                                    <input type="radio" class="radio-input" name="videoType-${form.id}" data-field="videoType" value="upload">
                                    <span class="radio-label">Upload</span>
                                </label>
                            </div>
                            
                            <div class="media-input-container">
                                <textarea 
                                    class="form-textarea media-prompt" 
                                    data-field="videoPrompt" 
                                    data-prompt-type="video"
                                    placeholder="Describe the video you want generated..."
                                ></textarea>
                                <input 
                                    type="file" 
                                    class="file-input media-upload" 
                                    data-upload-type="video"
                                    accept="video/*"
                                    disabled
                                    style="display: none;"
                                >
                                <div class="upload-placeholder" data-upload-placeholder="video" style="display: none;">
                                    <span>Upload coming soon...</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Image Option -->
                    <div class="media-option">
                        <label class="checkbox-item media-checkbox">
                            <input type="checkbox" class="checkbox-input" data-field="imageEnabled" data-media-type="image" ${form.imageEnabled ? 'checked' : ''}>
                            <span class="checkbox-label">Image</span>
                        </label>
                        
                        <div class="media-config" data-media-config="image" style="display: ${form.imageEnabled ? 'block' : 'none'};">
                            <div class="media-type-selector">
                                <label class="radio-item">
                                    <input type="radio" class="radio-input" name="imageType-${form.id}" data-field="imageType" value="prompt" checked>
                                    <span class="radio-label">Prompt</span>
                                </label>
                                <label class="radio-item">
                                    <input type="radio" class="radio-input" name="imageType-${form.id}" data-field="imageType" value="upload">
                                    <span class="radio-label">Upload</span>
                                </label>
                            </div>
                            
                            <div class="media-input-container">
                                <textarea 
                                    class="form-textarea media-prompt" 
                                    data-field="imagePrompt" 
                                    data-prompt-type="image"
                                    placeholder="Describe the image you want generated..."
                                ></textarea>
                                <input 
                                    type="file" 
                                    class="file-input media-upload" 
                                    data-upload-type="image"
                                    accept="image/*"
                                    disabled
                                    style="display: none;"
                                >
                                <div class="upload-placeholder" data-upload-placeholder="image" style="display: none;">
                                    <span>Upload coming soon...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Post Prompt -->
                <div class="form-section">
                    <label class="section-label">
                        Post Prompt
                        <span class="required-indicator">*</span>
                    </label>
                    <textarea 
                        class="form-textarea" 
                        data-field="postPrompt" 
                        placeholder="Describe what you want to post..."
                        required
                    ></textarea>
                </div>
            </div>

            <!-- Drafts Section -->
            <div class="drafts-section">
                <div class="drafts-header">Generated Drafts</div>
                <div class="drafts-container" data-drafts-container="${form.id}">
                    <div class="empty-drafts">No drafts generated yet</div>
                </div>
            </div>

            <!-- Form Actions -->
            <div class="form-actions">
                <button class="form-btn btn-previous" onclick="previousForm()" ${currentFormIndex === 0 ? 'disabled' : ''}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M12 5l-5 5 5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Previous
                </button>
                <button class="form-btn btn-clear" onclick="clearForm(${form.id})">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M5 5l10 10M15 5l-10 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    Clear
                </button>
                <button class="form-btn btn-send" onclick="saveForm(${form.id})">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M18 10l-8-8-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Send to n8n
                </button>
                <button class="form-btn btn-next" onclick="nextForm()">
                    Next
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M8 5l5 5-5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </div>
        </div>
    `;
    
    formsContainer.insertAdjacentHTML('beforeend', formHTML);
    
    // Setup event listeners for this form
    const formElement = document.querySelector(`[data-form-id="${form.id}"]`);
    
    // Radio buttons for page mode
    formElement.querySelectorAll('[data-field="pageMode"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            updateFormData(form.id, e.target);
            togglePageDropdown(form.id, e.target.value);
        });
    });
    
    // Multi-select setup
    setupMultiSelect(form.id);
    
    // Platform checkboxes
    formElement.querySelectorAll('[data-field="platforms"]').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            updateFormData(form.id, e.target);
        });
    });
    
    // Media checkboxes
    formElement.querySelectorAll('[data-media-type]').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const mediaType = e.target.dataset.mediaType;
            toggleMediaConfig(form.id, mediaType, e.target.checked);
            updateFormData(form.id, e.target);
        });
    });
    
    // Media type radio buttons
    formElement.querySelectorAll('[data-field="videoType"], [data-field="imageType"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const mediaType = e.target.name.includes('video') ? 'video' : 'image';
            toggleMediaInput(form.id, mediaType, e.target.value);
            updateFormData(form.id, e.target);
        });
    });
    
    // Textareas
    formElement.querySelectorAll('textarea').forEach(textarea => {
        textarea.addEventListener('input', (e) => {
            updateFormData(form.id, e.target);
        });
    });
}

// Toggle Page Dropdown
function togglePageDropdown(formId, mode) {
    const formElement = document.querySelector(`[data-form-id="${formId}"]`);
    const multiselectDisplay = formElement.querySelector(`[data-multiselect-display="${formId}"]`);
    
    if (mode === 'all') {
        multiselectDisplay.classList.add('disabled');
        multiselectDisplay.style.pointerEvents = 'none';
        // Clear selected pages
        const form = forms.find(f => f.id === formId);
        form.pages = [];
        form.pageTitles = [];
        renderMultiSelectTags(formId);
    } else {
        multiselectDisplay.classList.remove('disabled');
        multiselectDisplay.style.pointerEvents = 'auto';
    }
}

// Setup Multi-Select
function setupMultiSelect(formId) {
    const display = document.querySelector(`[data-multiselect-display="${formId}"]`);
    const dropdown = document.querySelector(`[data-multiselect-dropdown="${formId}"]`);
    const searchInput = document.querySelector(`[data-multiselect-search="${formId}"]`);
    const optionsContainer = document.querySelector(`[data-multiselect-options="${formId}"]`);
    const clearBtn = document.querySelector(`[data-multiselect-clear="${formId}"]`);
    const arrow = display.querySelector('.multiselect-arrow');
    
    // Toggle dropdown
    display.addEventListener('click', (e) => {
        if (display.classList.contains('disabled')) return;
        
        const isOpen = dropdown.classList.contains('open');
        
        // Close all other dropdowns
        document.querySelectorAll('.multiselect-dropdown.open').forEach(d => {
            d.classList.remove('open');
        });
        document.querySelectorAll('.multiselect-display.open').forEach(d => {
            d.classList.remove('open');
        });
        document.querySelectorAll('.multiselect-arrow.open').forEach(a => {
            a.classList.remove('open');
        });
        
        if (!isOpen) {
            dropdown.classList.add('open');
            display.classList.add('open');
            arrow.classList.add('open');
            searchInput.focus();
        }
    });
    
    // Search functionality
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const options = optionsContainer.querySelectorAll('.multiselect-option');
        let hasVisibleOptions = false;
        
        options.forEach(option => {
            const text = option.textContent.toLowerCase();
            if (text.includes(searchTerm)) {
                option.classList.remove('hidden');
                hasVisibleOptions = true;
            } else {
                option.classList.add('hidden');
            }
        });
        
        // Show/hide no results message
        let noResultsMsg = optionsContainer.querySelector('.multiselect-no-results');
        if (!hasVisibleOptions) {
            if (!noResultsMsg) {
                noResultsMsg = document.createElement('div');
                noResultsMsg.className = 'multiselect-no-results';
                noResultsMsg.textContent = 'No pages found';
                optionsContainer.appendChild(noResultsMsg);
            }
        } else if (noResultsMsg) {
            noResultsMsg.remove();
        }
    });
    
    // Option selection
    optionsContainer.addEventListener('click', (e) => {
        const option = e.target.closest('.multiselect-option');
        if (!option || option.classList.contains('hidden')) return;
        
        const optionId = option.dataset.optionId;
        const optionName = option.dataset.optionName;
        const form = forms.find(f => f.id === formId);
        
        if (option.classList.contains('selected')) {
            // Deselect
            option.classList.remove('selected');
            const index = form.pages.indexOf(optionId);
            if (index > -1) {
                form.pages.splice(index, 1);
                form.pageTitles.splice(index, 1);
            }
        } else {
            // Select
            option.classList.add('selected');
            form.pages.push(optionId);
            const account = accounts.find(acc => acc.id === optionId);
            if (account) {
                form.pageTitles.push(account.name);
            }
        }
        
        renderMultiSelectTags(formId);
    });
    
    // Clear all
    clearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const form = forms.find(f => f.id === formId);
        form.pages = [];
        form.pageTitles = [];
        
        // Deselect all options
        optionsContainer.querySelectorAll('.multiselect-option.selected').forEach(opt => {
            opt.classList.remove('selected');
        });
        
        renderMultiSelectTags(formId);
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest(`[data-multiselect="${formId}"]`)) {
            dropdown.classList.remove('open');
            display.classList.remove('open');
            arrow.classList.remove('open');
            searchInput.value = '';
            
            // Reset search
            optionsContainer.querySelectorAll('.multiselect-option').forEach(opt => {
                opt.classList.remove('hidden');
            });
            const noResultsMsg = optionsContainer.querySelector('.multiselect-no-results');
            if (noResultsMsg) noResultsMsg.remove();
        }
    });
}

// Render Multi-Select Tags
function renderMultiSelectTags(formId) {
    const form = forms.find(f => f.id === formId);
    const tagsContainer = document.querySelector(`[data-multiselect-tags="${formId}"]`);
    const placeholder = document.querySelector(`[data-multiselect-display="${formId}"] .multiselect-placeholder`);
    const clearBtn = document.querySelector(`[data-multiselect-clear="${formId}"]`);
    
    if (form.pages.length === 0) {
        tagsContainer.innerHTML = '';
        placeholder.style.display = 'block';
        clearBtn.style.display = 'none';
        return;
    }
    
    placeholder.style.display = 'none';
    clearBtn.style.display = 'flex';
    
    tagsContainer.innerHTML = form.pages.map((pageId, index) => {
        const pageName = form.pageTitles[index] || 'Unknown';
        
        return `
            <div class="multiselect-tag">
                <span>${pageName}</span>
                <button type="button" class="multiselect-tag-remove" onclick="removeMultiSelectTag(${formId}, '${pageId}')">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </button>
            </div>
        `;
    }).join('');
}

// Remove Multi-Select Tag
function removeMultiSelectTag(formId, pageId) {
    const form = forms.find(f => f.id === formId);
    const index = form.pages.indexOf(pageId);
    
    if (index > -1) {
        form.pages.splice(index, 1);
        form.pageTitles.splice(index, 1);
    }
    
    // Deselect in dropdown
    const option = document.querySelector(`[data-multiselect-options="${formId}"] [data-option-id="${pageId}"]`);
    if (option) option.classList.remove('selected');
    
    renderMultiSelectTags(formId);
}

// Toggle Media Config
function toggleMediaConfig(formId, mediaType, show) {
    const formElement = document.querySelector(`[data-form-id="${formId}"]`);
    const mediaConfig = formElement.querySelector(`[data-media-config="${mediaType}"]`);
    mediaConfig.style.display = show ? 'block' : 'none';
}

// Toggle Media Input
function toggleMediaInput(formId, mediaType, inputType) {
    const formElement = document.querySelector(`[data-form-id="${formId}"]`);
    const promptTextarea = formElement.querySelector(`[data-prompt-type="${mediaType}"]`);
    const uploadPlaceholder = formElement.querySelector(`[data-upload-placeholder="${mediaType}"]`);
    
    if (inputType === 'prompt') {
        promptTextarea.style.display = 'block';
        uploadPlaceholder.style.display = 'none';
    } else {
        promptTextarea.style.display = 'none';
        uploadPlaceholder.style.display = 'flex';
    }
}

// Update Form Data
function updateFormData(formId, input) {
    const form = forms.find(f => f.id === formId);
    const field = input.dataset.field;
    
    if (field === 'platforms') {
        const checkboxes = document.querySelectorAll(`[data-form-id="${formId}"] [data-field="platforms"]:checked`);
        form.platforms = Array.from(checkboxes).map(cb => cb.value);
    } else if (field === 'pageMode') {
        form.pageMode = input.value;
        if (input.value === 'all') {
            form.pages = [];
            form.pageTitles = [];
        }
    } else if (field === 'videoEnabled') {
        form.videoEnabled = input.checked;
    } else if (field === 'imageEnabled') {
        form.imageEnabled = input.checked;
    } else if (field === 'videoType') {
        form.videoType = input.value;
    } else if (field === 'imageType') {
        form.imageType = input.value;
    } else {
        form[field] = input.value;
    }
}

// Render Tabs
function renderTabs() {
    formTabs.innerHTML = forms.map((form, index) => `
        <button class="form-tab ${index === currentFormIndex ? 'active' : ''}" onclick="switchToForm(${index})">
            Form ${form.id}
        </button>
    `).join('');
}

// Switch Form
function switchToForm(index) {
    currentFormIndex = index;
    
    document.querySelectorAll('.form-item').forEach((item, i) => {
        item.classList.toggle('active', i === index);
    });
    
    renderTabs();
}

// Previous Form
function previousForm() {
    if (currentFormIndex > 0) {
        switchToForm(currentFormIndex - 1);
    }
}

// Next Form
function nextForm() {
    if (currentFormIndex < forms.length - 1) {
        switchToForm(currentFormIndex + 1);
    } else {
        createForm();
    }
}

// Clear Form
function clearForm(formId) {
    const formElement = document.querySelector(`[data-form-id="${formId}"]`);
    formElement.querySelectorAll('select, textarea').forEach(el => el.value = '');
    formElement.querySelectorAll('input[type="checkbox"]').forEach(el => el.checked = false);
    
    // Reset radio to "select pages"
    const selectRadio = formElement.querySelector('[data-field="pageMode"][value="select"]');
    if (selectRadio) {
        selectRadio.checked = true;
        togglePageDropdown(formId, 'select');
    }
    
    // Reset media options
    const videoPromptRadio = formElement.querySelector('[data-field="videoType"][value="prompt"]');
    const imagePromptRadio = formElement.querySelector('[data-field="imageType"][value="prompt"]');
    if (videoPromptRadio) videoPromptRadio.checked = true;
    if (imagePromptRadio) imagePromptRadio.checked = true;
    
    // Hide media configs
    formElement.querySelectorAll('[data-media-config]').forEach(el => el.style.display = 'none');
    
    const form = forms.find(f => f.id === formId);
    form.pageMode = 'select';
    form.pages = [];
    form.pageTitles = [];
    form.platforms = [];
    form.postPrompt = '';
    form.videoEnabled = false;
    form.videoType = 'prompt';
    form.videoPrompt = '';
    form.imageEnabled = false;
    form.imageType = 'prompt';
    form.imagePrompt = '';
    
    // Clear multi-select
    const optionsContainer = formElement.querySelector(`[data-multiselect-options="${formId}"]`);
    if (optionsContainer) {
        optionsContainer.querySelectorAll('.multiselect-option.selected').forEach(opt => {
            opt.classList.remove('selected');
        });
    }
    renderMultiSelectTags(formId);
    
    // Clear drafts
    form.drafts = [];
    renderDrafts(formId);
}

// Delete Form
function deleteForm(formId) {
    if (forms.length === 1) {
        alert('You must have at least one form');
        return;
    }
    
    if (!confirm('Delete this form?')) return;
    
    forms = forms.filter(f => f.id !== formId);
    document.querySelector(`[data-form-id="${formId}"]`).remove();
    
    if (currentFormIndex >= forms.length) {
        currentFormIndex = forms.length - 1;
    }
    
    renderTabs();
    switchToForm(currentFormIndex);
}

// Save Form (Send to n8n)
async function saveForm(formId) {
    const form = forms.find(f => f.id === formId);
    
    // Validate
    if (form.pageMode === 'select' && form.pages.length === 0) {
        alert('Please select at least one page');
        return;
    }
    
    if (form.platforms.length === 0) {
        alert('Please select at least one platform');
        return;
    }
    
    if (!form.postPrompt) {
        alert('Please enter a post prompt');
        return;
    }
    
    showLoading(true);
    
    try {
        // Prepare clean payload without drafts
        const { drafts, ...formData } = form;
        
        // Send to n8n webhook using original structure
        const response = await fetch(CONFIG.N8N_WEBHOOK, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...formData,
                userId: CONFIG.GHL_USER_ID,
                locationId: CONFIG.GHL_LOCATION_ID
            })
        });
        
        if (!response.ok) {
            throw new Error('Submission failed');
        }
        
        const result = await response.json();
        console.log('📥 Received from n8n:', result);
        
        // Transform and add drafts to form
        if (result) {
            // Handle array response (one per pageTitle)
            let resultsArray = Array.isArray(result) ? result : [result];
            
            console.log(`✅ Adding ${resultsArray.length} draft(s) to form ${formId}`);
            
            resultsArray.forEach(draftData => {
                const transformedResult = transformN8nResponse(draftData, form);
                addDraft(formId, transformedResult);
            });
        } else {
            console.warn('⚠️ No result received from n8n');
        }
        
        alert('Form sent to n8n successfully!');
        
    } catch (error) {
        console.error('Error sending form:', error);
        alert('Error sending form. Please try again.');
    } finally {
        showLoading(false);
    }
}

// Transform n8n Response to UI Format
function transformN8nResponse(n8nData, form) {
    console.log('🔄 Transforming n8n response:', n8nData);
    
    // Handle array response
    if (Array.isArray(n8nData) && n8nData.length > 0) {
        n8nData = n8nData[0];
    }
    
    // Extract text from content array
    let text = '';
    if (n8nData.content && Array.isArray(n8nData.content)) {
        text = n8nData.content.join('\n\n');
    } else if (n8nData.text) {
        text = n8nData.text;
    }
    
    // Extract video URL from video array
    let video = null;
    if (n8nData.video && Array.isArray(n8nData.video) && n8nData.video.length > 0) {
        video = n8nData.video[0].uri || n8nData.video[0].url || n8nData.video[0];
    } else if (n8nData.video && typeof n8nData.video === 'string') {
        video = n8nData.video;
    }
    
    // Extract image URL from image array
    let image = null;
    if (n8nData.image && Array.isArray(n8nData.image) && n8nData.image.length > 0) {
        const imageData = n8nData.image[0].uri || n8nData.image[0].url || n8nData.image[0];
        // If it's raw base64 (no data: prefix), convert to data URL
        if (imageData && !imageData.startsWith('http') && !imageData.startsWith('data:')) {
            image = `data:image/png;base64,${imageData}`;
        } else {
            image = imageData;
        }
    } else if (n8nData.image && typeof n8nData.image === 'string') {
        // If it's raw base64 (no data: prefix), convert to data URL
        if (!n8nData.image.startsWith('http') && !n8nData.image.startsWith('data:')) {
            image = `data:image/png;base64,${n8nData.image}`;
        } else {
            image = n8nData.image;
        }
    }
    
    // Get title from webhook response only (no fallback to form.pageTitles array)
    let title = n8nData.pageTitle || n8nData.title || 'Draft';
    
    // Handle if pageTitle comes as array
    if (Array.isArray(title)) {
        title = title[0] || 'Draft';
    }
    
    // Get pageId and handle if it comes as array
    let pageId = n8nData.pageID || n8nData.pageId || null;
    if (Array.isArray(pageId)) {
        pageId = pageId[0] || null;
    }
    
    const transformed = {
        pageId: pageId,
        title: title,
        text: text,
        image: image,
        video: video
    };
    
    console.log('✅ Transformed result:', transformed);
    return transformed;
}

// Add Draft
function addDraft(formId, draftData) {
    console.log('📝 addDraft called with:', { formId, draftData });
    const form = forms.find(f => f.id === formId);
    
    if (!form) {
        console.error('❌ Form not found:', formId);
        return;
    }
    
    const draft = {
        id: `${draftData.pageId}_${Date.now()}`,
        pageId: draftData.pageId,  // Add this line too
        title: draftData.title || draftData.pageTitle || 'Draft',
        text: draftData.text || '',
        image: draftData.image || null,
        video: draftData.video || null,
        expanded: false,
        editing: false,
        editData: {
            videoEnabled: false,
            videoType: 'prompt',
            videoPrompt: '',
            imageEnabled: false,
            imageType: 'prompt',
            imagePrompt: '',
            postPrompt: draftData.text || ''
        }
    };
    
    console.log('📝 Draft object created:', draft);
    form.drafts.push(draft);
    console.log('📝 Total drafts for form:', form.drafts.length);
    renderDrafts(formId);
}

// Render Drafts
function renderDrafts(formId) {
    console.log('🎨 renderDrafts called for form:', formId);
    const form = forms.find(f => f.id === formId);
    const container = document.querySelector(`[data-drafts-container="${formId}"]`);
    
    if (!container) {
        console.error('❌ Drafts container not found for form:', formId);
        return;
    }
    
    console.log('📋 Form drafts:', form.drafts);
    
    if (!form.drafts || form.drafts.length === 0) {
        console.log('ℹ️ No drafts to display');
        container.innerHTML = '<div class="empty-drafts">No drafts generated yet</div>';
        return;
    }
    
    console.log(`✅ Rendering ${form.drafts.length} draft(s)`);
    
    container.innerHTML = form.drafts.map(draft => `
        <div class="draft-item ${draft.editing ? 'editing' : ''}" data-draft-id="${draft.id}">
            <div class="draft-header" onclick="toggleDraft(${formId}, '${draft.id}')">
                <div class="draft-title">${escapeHtml(draft.title)}</div>
                <div class="draft-actions">
                    <button class="draft-action-btn publish-btn" onclick="event.stopPropagation(); publishDraft(${formId}, '${draft.id}')">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M8 1v14M3 8l5 5 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Publish
                    </button>
                    <button class="draft-action-btn edit-btn" onclick="event.stopPropagation(); toggleEditDraft(${formId}, '${draft.id}')">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M11 1l4 4-9 9H2v-4l9-9z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        ${draft.editing ? 'Cancel' : 'Edit'}
                    </button>
                    <button class="draft-toggle-btn" onclick="event.stopPropagation(); toggleDraft(${formId}, '${draft.id}')">
                        ${draft.expanded ? 'Hide' : 'Show'}
                    </button>
                </div>
            </div>
            <div class="draft-content ${draft.expanded ? 'expanded' : ''}">
                <div class="draft-layout">
                    <div class="draft-content-main">
                        <div class="draft-content-inner">
                            ${draft.text ? `<div class="draft-text">${escapeHtml(draft.text)}</div>` : ''}
                            ${(draft.image || draft.video) ? `
                                <div class="draft-media">
                                    ${draft.image ? `
                                        <div class="draft-media-item">
                                            <img src="${draft.image}" alt="Generated image" />
                                        </div>
                                    ` : ''}
                                    ${draft.video ? `
                                        <div class="draft-media-item">
                                            <video controls>
                                                <source src="${draft.video}" type="video/mp4">
                                                Your browser does not support the video tag.
                                            </video>
                                        </div>
                                    ` : ''}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    ${draft.editing ? `
                        <div class="draft-edit-form">
                            <h3 class="edit-form-title">Edit Draft</h3>
                            
                            <!-- Video Option -->
                            <div class="edit-media-option">
                                <label class="edit-checkbox-item">
                                    <input type="checkbox" class="edit-checkbox-input" data-draft-field="videoEnabled" ${draft.editData.videoEnabled ? 'checked' : ''} onchange="updateDraftEditData(${formId}, '${draft.id}', this)">
                                    <span class="edit-checkbox-label">Video</span>
                                </label>
                                
                                <div class="edit-media-config" data-edit-media-config="video" style="display: ${draft.editData.videoEnabled ? 'block' : 'none'};">
                                    <div class="edit-media-type-selector">
                                        <label class="edit-radio-item">
                                            <input type="radio" class="edit-radio-input" name="videoType-${formId}-${draft.id}" data-draft-field="videoType" value="prompt" ${draft.editData.videoType === 'prompt' ? 'checked' : ''} onchange="updateDraftEditData(${formId}, '${draft.id}', this); toggleEditMediaInput(${formId}, '${draft.id}', 'video', 'prompt')">
                                            <span class="edit-radio-label">Prompt</span>
                                        </label>
                                        <label class="edit-radio-item">
                                            <input type="radio" class="edit-radio-input" name="videoType-${formId}-${draft.id}" data-draft-field="videoType" value="upload" ${draft.editData.videoType === 'upload' ? 'checked' : ''} onchange="updateDraftEditData(${formId}, '${draft.id}', this); toggleEditMediaInput(${formId}, '${draft.id}', 'video', 'upload')">
                                            <span class="edit-radio-label">Upload</span>
                                        </label>
                                    </div>
                                    
                                    <div class="edit-media-input-container">
                                        <textarea 
                                            class="edit-form-textarea" 
                                            data-draft-field="videoPrompt" 
                                            data-edit-prompt-type="video"
                                            placeholder="Describe the video you want generated..."
                                            style="display: ${draft.editData.videoType === 'prompt' ? 'block' : 'none'};"
                                            oninput="updateDraftEditData(${formId}, '${draft.id}', this)"
                                        >${draft.editData.videoPrompt}</textarea>
                                        <div class="edit-upload-placeholder" data-edit-upload-placeholder="video" style="display: ${draft.editData.videoType === 'upload' ? 'flex' : 'none'};">
                                            <span>Upload coming soon...</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Image Option -->
                            <div class="edit-media-option">
                                <label class="edit-checkbox-item">
                                    <input type="checkbox" class="edit-checkbox-input" data-draft-field="imageEnabled" ${draft.editData.imageEnabled ? 'checked' : ''} onchange="updateDraftEditData(${formId}, '${draft.id}', this)">
                                    <span class="edit-checkbox-label">Image</span>
                                </label>
                                
                                <div class="edit-media-config" data-edit-media-config="image" style="display: ${draft.editData.imageEnabled ? 'block' : 'none'};">
                                    <div class="edit-media-type-selector">
                                        <label class="edit-radio-item">
                                            <input type="radio" class="edit-radio-input" name="imageType-${formId}-${draft.id}" data-draft-field="imageType" value="prompt" ${draft.editData.imageType === 'prompt' ? 'checked' : ''} onchange="updateDraftEditData(${formId}, '${draft.id}', this); toggleEditMediaInput(${formId}, '${draft.id}', 'image', 'prompt')">
                                            <span class="edit-radio-label">Prompt</span>
                                        </label>
                                        <label class="edit-radio-item">
                                            <input type="radio" class="edit-radio-input" name="imageType-${formId}-${draft.id}" data-draft-field="imageType" value="upload" ${draft.editData.imageType === 'upload' ? 'checked' : ''} onchange="updateDraftEditData(${formId}, '${draft.id}', this); toggleEditMediaInput(${formId}, '${draft.id}', 'image', 'upload')">
                                            <span class="edit-radio-label">Upload</span>
                                        </label>
                                    </div>
                                    
                                    <div class="edit-media-input-container">
                                        <textarea 
                                            class="edit-form-textarea" 
                                            data-draft-field="imagePrompt" 
                                            data-edit-prompt-type="image"
                                            placeholder="Describe the image you want generated..."
                                            style="display: ${draft.editData.imageType === 'prompt' ? 'block' : 'none'};"
                                            oninput="updateDraftEditData(${formId}, '${draft.id}', this)"
                                        >${draft.editData.imagePrompt}</textarea>
                                        <div class="edit-upload-placeholder" data-edit-upload-placeholder="image" style="display: ${draft.editData.imageType === 'upload' ? 'flex' : 'none'};">
                                            <span>Upload coming soon...</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Post Prompt -->
                            <div class="edit-form-section">
                                <label class="edit-section-label">
                                    Post Prompt
                                    <span class="required-indicator">*</span>
                                </label>
                                <textarea 
                                    class="edit-form-textarea" 
                                    data-draft-field="postPrompt" 
                                    placeholder="Describe what you want to post..."
                                    required
                                    oninput="updateDraftEditData(${formId}, '${draft.id}', this)"
                                >${draft.editData.postPrompt}</textarea>
                            </div>

                            <button class="save-edit-btn" onclick="saveDraftEdit(${formId}, '${draft.id}')">
                                Save Changes
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

// Toggle Draft
function toggleDraft(formId, draftId) {
    const form = forms.find(f => f.id === formId);
    const draft = form.drafts.find(d => d.id === draftId);
    
    if (!draft) return;
    
    draft.expanded = !draft.expanded;
    renderDrafts(formId);
}

// Publish Draft
async function publishDraft(formId, draftId) {
    const form = forms.find(f => f.id === formId);
    const draft = form.drafts.find(d => d.id === draftId);
    
    if (!draft) return;
    
    if (!confirm('Publish this draft?')) return;
    
    showLoading(true);
    
    try {
        const payload = {
            pageTitle: draft.title,
            textContent: draft.text
        };
        
        if (draft.video) {
            payload.video = draft.video;
        }
        
        if (draft.image) {
            payload.image = draft.image;
        }
        
        // Add hidden fields from spreadsheet row
        if (draft.pageId && draft.pageId.toString().startsWith('page-')) {
            const pageIndex = parseInt(draft.pageId.replace('page-', ''));
            const rowData = spreadsheetData[pageIndex];
            if (rowData) {
                payload.area = rowData.area || '';
                payload.metaPageId = rowData.metaPageId || '';
                payload.ghlLocationId = rowData.ghlLocationId || '';
                payload.ghlApiKey = rowData.ghlApiKey || '';
            }
        }
        
        payload.platforms = form.platforms || [];

        console.log('📤 Publishing draft:', payload);
        
        const response = await fetch(CONFIG.N8N_PUBLISH_WEBHOOK, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            throw new Error('Publish failed');
        }
        
        alert('Draft published successfully!');
        
    } catch (error) {
        console.error('Error publishing draft:', error);
        alert('Error publishing draft. Please try again.');
    } finally {
        showLoading(false);
    }
}

// Toggle Edit Draft
function toggleEditDraft(formId, draftId) {
    const form = forms.find(f => f.id === formId);
    const draft = form.drafts.find(d => d.id === draftId);
    
    if (!draft) return;
    
    draft.editing = !draft.editing;
    
    // Expand draft when entering edit mode
    if (draft.editing && !draft.expanded) {
        draft.expanded = true;
    }
    
    renderDrafts(formId);
}

// Update Draft Edit Data
function updateDraftEditData(formId, draftId, input) {
    const form = forms.find(f => f.id === formId);
    const draft = form.drafts.find(d => d.id === draftId);
    
    if (!draft) return;
    
    const field = input.dataset.draftField;
    
    if (field === 'videoEnabled' || field === 'imageEnabled') {
        draft.editData[field] = input.checked;
        
        // Show/hide media config
        const mediaType = field.replace('Enabled', '');
        const draftItem = document.querySelector(`[data-draft-id="${draftId}"]`);
        const mediaConfig = draftItem.querySelector(`[data-edit-media-config="${mediaType}"]`);
        if (mediaConfig) {
            mediaConfig.style.display = input.checked ? 'block' : 'none';
        }
    } else if (field === 'videoType' || field === 'imageType') {
        draft.editData[field] = input.value;
    } else {
        draft.editData[field] = input.value;
    }
}

// Toggle Edit Media Input
function toggleEditMediaInput(formId, draftId, mediaType, inputType) {
    const draftItem = document.querySelector(`[data-draft-id="${draftId}"]`);
    if (!draftItem) return;
    
    const promptTextarea = draftItem.querySelector(`[data-edit-prompt-type="${mediaType}"]`);
    const uploadPlaceholder = draftItem.querySelector(`[data-edit-upload-placeholder="${mediaType}"]`);
    
    if (promptTextarea && uploadPlaceholder) {
        if (inputType === 'prompt') {
            promptTextarea.style.display = 'block';
            uploadPlaceholder.style.display = 'none';
        } else {
            promptTextarea.style.display = 'none';
            uploadPlaceholder.style.display = 'flex';
        }
    }
}

// Save Draft Edit
async function saveDraftEdit(formId, draftId) {
    const form = forms.find(f => f.id === formId);
    const draft = form.drafts.find(d => d.id === draftId);
    
    if (!draft) return;
    
    // Validate post prompt is required
    if (!draft.editData.postPrompt || draft.editData.postPrompt.trim() === '') {
        alert('Post prompt is required');
        return;
    }
    
    if (!confirm('Regenerate draft with new settings?')) return;
    
    showLoading(true);
    
    try {
        // Prepare payload with forms array structure for n8n
        // Send ONLY this specific draft's data, not all forms
        const payload = {
            forms: [{
                id: form.id,
                pageMode: 'select',
                pages: [draft.pageId],  // Only this draft's page ID (use pageId, not id)
                pageTitles: [draft.title],    // Only this draft's title
                platforms: form.platforms,    // Platforms from form
                postPrompt: draft.editData.postPrompt,
                videoEnabled: draft.editData.videoEnabled,
                videoType: draft.editData.videoType,
                videoPrompt: draft.editData.videoPrompt,
                imageEnabled: draft.editData.imageEnabled,
                imageType: draft.editData.imageType,
                imagePrompt: draft.editData.imagePrompt
            }],
            userId: CONFIG.GHL_USER_ID,
            locationId: CONFIG.GHL_LOCATION_ID
        };
        
        console.log('📤 Regenerating draft:', payload);
        
        const response = await fetch(CONFIG.N8N_WEBHOOK, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            throw new Error('Regeneration failed');
        }
        
        const result = await response.json();
        console.log('📥 Received from n8n:', result);
        
        // Transform and update the existing draft
        if (result) {
            const transformedResult = transformN8nResponse(result, form);
            
            // Update draft with new content
            draft.text = transformedResult.text;
            draft.image = transformedResult.image;
            draft.video = transformedResult.video;
            
            // Exit edit mode
            draft.editing = false;
            
            renderDrafts(formId);
            alert('Draft regenerated successfully!');
        }
        
    } catch (error) {
        console.error('Error regenerating draft:', error);
        alert('Error regenerating draft. Please try again.');
    } finally {
        showLoading(false);
    }
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Submit All Forms
async function submitAllForms() {
    // Validate all forms
    const validForms = forms.filter(f => {
        const hasValidPage = f.pageMode === 'all' || f.pages.length > 0;
        return hasValidPage && f.platforms.length > 0 && f.postPrompt;
    });
    
    if (validForms.length === 0) {
        alert('Please complete at least one form before submitting');
        return;
    }
    
    if (!confirm(`Submit ${validForms.length} form(s)?`)) return;
    
    showLoading(true);
    
    try {
        // Prepare clean forms without drafts using original structure
// Prepare clean forms without drafts and add spreadsheet data
        const cleanForms = validForms.map(form => {
            const { drafts, ...formData } = form;
            
            // Add spreadsheet data arrays matching each page
            const spreadsheetArrays = {
                areas: [],
                metaPageIds: [],
                ghlLocationIds: [],
                ghlApiKeys: []
            };
            
            // For each page in the form, find matching spreadsheet row
            form.pageTitles.forEach((pageTitle, index) => {
                const spreadsheetRow = spreadsheetData.find(row => 
                    row.pageTitle === pageTitle
                ) || {};
                
                // Add data to arrays (in same order as pages/pageTitles)
                spreadsheetArrays.areas.push(spreadsheetRow.area || '');
                spreadsheetArrays.metaPageIds.push(spreadsheetRow.metaPageId || '');
                spreadsheetArrays.ghlLocationIds.push(spreadsheetRow.ghlLocationId || '');
                spreadsheetArrays.ghlApiKeys.push(spreadsheetRow.ghlApiKey || '');
            });
            
            return {
                ...formData,
                ...spreadsheetArrays
            };
        });
        
            // Calculate dynamic timeout based on number of items
            const itemCount = cleanForms.reduce((total, form) => total + (form.pages?.length || 1), 0);
            const timeoutMs = 30000 + (itemCount * 1500000);
            console.log(`⏱️ Timeout set for ${itemCount} items: ${timeoutMs/1000}s`);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        
        const response = await fetch(CONFIG.N8N_WEBHOOK, {
            method: 'POST',
            signal: controller.signal,  // ← ADD THIS LINE (after line 1370)
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                forms: cleanForms,
                userId: CONFIG.GHL_USER_ID,
                locationId: CONFIG.GHL_LOCATION_ID
            })
        });

        clearTimeout(timeoutId);  // ← ADD THIS LINE
        
        if (!response.ok) {
            throw new Error('Submission failed');
        }
        
        const result = await response.json();
        console.log('📥 Received from n8n (bulk):', result);
        
        // Process results and add drafts
        if (result) {
            // Handle different response formats
            let resultsArray = [];
            
            if (Array.isArray(result)) {
                // If response is an array, use it directly
                resultsArray = result;
            } else if (result.results && Array.isArray(result.results)) {
                // If response has a results property with an array
                resultsArray = result.results;
            } else {
                // Single result, wrap in array
                resultsArray = [result];
            }
            
            console.log(`📦 Processing ${resultsArray.length} result(s)`);
            
            // Check if results are grouped by form or flat (single form)
            if (resultsArray.length > 0 && resultsArray[0].formIndex !== undefined) {
                // Results have formIndex, group by form
                resultsArray.forEach(item => {
                    const formIndex = item.formIndex;
                    if (validForms[formIndex]) {
                        const transformedResult = transformN8nResponse(item, validForms[formIndex]);
                        addDraft(validForms[formIndex].id, transformedResult);
                    }
                });
            } else {
                // Flat results, assume single form with multiple pageTitles
                if (validForms.length > 0) {
                    const targetForm = validForms[0];
                    resultsArray.forEach(draftData => {
                        const transformedResult = transformN8nResponse(draftData, targetForm);
                        addDraft(targetForm.id, transformedResult);
                    });
                }
            }
        }
        
        alert('All forms submitted successfully!');
        
    } catch (error) {
        console.error('Error submitting forms:', error);
        alert('Error submitting forms. Please try again.');
    } finally {
        showLoading(false);
    }
}

// Show/Hide Loading
function showLoading(show) {
    loadingOverlay.style.display = show ? 'flex' : 'none';
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);






