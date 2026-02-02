// Configuration
console.log('🚀 Script.js loaded - Version 2.0 - DEBUG MODE');

const CONFIG = {
    N8N_WEBHOOK: 'https://bsmteam.app.n8n.cloud/webhook/65ce59cc-e7f3-497b-9a11-068d578caff6',
    N8N_PUBLISH_WEBHOOK: 'https://bsmteam.app.n8n.cloud/webhook/2a8b5dcf-f1b8-4683-b73a-f2e9f7adc498',
    WEBAPP_URL: 'https://script.google.com/macros/s/AKfycbx6O3c8JmVhn21GplhpCho6P2ploarzqbVRGzHNRu8sHj82tDzTOwsThpE5_4CULYCT/exec',
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

// Initialize
async function init() {
    await loadSpreadsheetData();
    await loadAccounts();
    createForm();
    setupEventListeners();
}

// Load Spreadsheet Data
async function loadSpreadsheetData() {
    try {
        console.log('🔄 Fetching spreadsheet data from:', CONFIG.WEBAPP_URL);
        const response = await fetch(CONFIG.WEBAPP_URL);
        const data = await response.json();
        
        console.log('📥 Raw response:', data);
        console.log('📥 Raw response type:', typeof data);
        console.log('📥 Is array?', Array.isArray(data));
        
        if (data && data.length > 0) {
            spreadsheetData = data;
            
            console.log('📋 First row data:', data[0]);
            console.log('📋 First row keys:', Object.keys(data[0]));
            console.log('📋 pageTitle property:', data[0].pageTitle);
            console.log('📋 area property:', data[0].area);
            
            // Set CONFIG values from first row
            const firstRow = data[0];
            CONFIG.GHL_LOCATION_ID = firstRow.ghlLocationId || '';
            CONFIG.GHL_TOKEN = firstRow.ghlApiKey || '';
            CONFIG.GHL_USER_ID = firstRow.ghlLocationId || ''; // Using locationId as userId fallback
            
            console.log('✅ Spreadsheet data loaded:', data.length, 'rows');
            console.log('✅ CONFIG.GHL_LOCATION_ID:', CONFIG.GHL_LOCATION_ID);
            console.log('✅ CONFIG.GHL_TOKEN:', CONFIG.GHL_TOKEN);
        } else {
            console.error('❌ No data returned from spreadsheet');
        }
    } catch (error) {
        console.error('❌ Error loading spreadsheet data:', error);
        alert('Error loading spreadsheet data. Please check your webapp URL.');
    }
}

// Load GHL Accounts
async function loadAccounts() {
    // Transform spreadsheet data into accounts format for dropdown compatibility
    accounts = spreadsheetData.map((row, index) => ({
        id: `page-${index}`,
        name: row.pageTitle || '',
        platform: row.area || 'Page'  // Use area as platform label
    }));
    
    console.log('✅ Accounts array populated:', accounts.length, 'items');
    console.log('📋 Accounts:', accounts);
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
    console.log('🎨 Rendering form, accounts array:', accounts);
    console.log('🎨 Accounts length:', accounts.length);
    
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
                                ${(() => {
                                    const optionsHTML = accounts.map(acc => `
                                        <div class="multiselect-option" data-option-id="${acc.id}" data-option-name="${acc.name} (${acc.platform})">
                                            ${acc.name} (${acc.platform})
                                        </div>
                                    `).join('');
                                    console.log('🔧 Generated options HTML length:', optionsHTML.length);
                                    console.log('🔧 Options HTML preview:', optionsHTML.substring(0, 200));
                                    return optionsHTML;
                                })()}
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
                            
                            <div class="media-input" data-media-input="video">
                                <textarea 
                                    class="form-input textarea-input" 
                                    data-field="videoPrompt" 
                                    placeholder="Enter video generation prompt..."
                                    rows="3"
                                    style="display: block;"
                                ></textarea>
                                <div class="upload-placeholder" style="display: none;">
                                    <div class="upload-icon">
                                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                                            <path d="M24 16v16m8-8H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                            <rect x="8" y="8" width="32" height="32" rx="4" stroke="currentColor" stroke-width="2"/>
                                        </svg>
                                    </div>
                                    <div class="upload-text">Video upload coming soon...</div>
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
                            
                            <div class="media-input" data-media-input="image">
                                <textarea 
                                    class="form-input textarea-input" 
                                    data-field="imagePrompt" 
                                    placeholder="Enter image generation prompt..."
                                    rows="3"
                                    style="display: block;"
                                ></textarea>
                                <div class="upload-placeholder" style="display: none;">
                                    <div class="upload-icon">
                                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                                            <path d="M24 16v16m8-8H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                            <rect x="8" y="8" width="32" height="32" rx="4" stroke="currentColor" stroke-width="2"/>
                                        </svg>
                                    </div>
                                    <div class="upload-text">Image upload coming soon...</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Post Prompt -->
                <div class="form-section full-width">
                    <label class="section-label">
                        Post Prompt
                        <span class="required-indicator">*</span>
                    </label>
                    <textarea 
                        class="form-input textarea-input" 
                        data-field="postPrompt" 
                        placeholder="Enter post generation prompt..."
                        rows="4"
                    ></textarea>
                </div>
            </div>

            <!-- Drafts Section -->
            <div class="drafts-section" data-drafts-section="${form.id}">
                <div class="drafts-header">
                    <h3 class="drafts-title">Generated Drafts</h3>
                </div>
                <div class="drafts-container" data-drafts-container="${form.id}">
                    <div class="drafts-empty">
                        <div class="drafts-empty-icon">📝</div>
                        <div class="drafts-empty-text">No drafts generated yet</div>
                        <div class="drafts-empty-hint">Submit the form to generate drafts</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    formsContainer.insertAdjacentHTML('beforeend', formHTML);
    setupFormEventListeners(form.id);
}

// Setup Form Event Listeners
function setupFormEventListeners(formId) {
    const formItem = document.querySelector(`[data-form-id="${formId}"]`);
    const form = forms.find(f => f.id === formId);
    
    if (!formItem || !form) return;
    
    // Page Mode Radio
    const pageModeInputs = formItem.querySelectorAll('[data-field="pageMode"]');
    pageModeInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            form.pageMode = e.target.value;
            const pageSelect = formItem.querySelector(`[data-multiselect="${formId}"]`);
            if (pageSelect) {
                pageSelect.style.opacity = form.pageMode === 'all' ? '0.5' : '1';
                pageSelect.style.pointerEvents = form.pageMode === 'all' ? 'none' : 'auto';
            }
        });
    });
    
    // Multi-select Setup
    setupMultiSelect(formId);
    
    // Platforms Checkboxes
    const platformInputs = formItem.querySelectorAll('[data-field="platforms"]');
    platformInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            if (e.target.checked) {
                form.platforms.push(e.target.value);
            } else {
                form.platforms = form.platforms.filter(p => p !== e.target.value);
            }
        });
    });
    
    // Media Enable Checkboxes
    const mediaEnableInputs = formItem.querySelectorAll('[data-media-type]');
    mediaEnableInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            const mediaType = e.target.dataset.mediaType;
            const isEnabled = e.target.checked;
            
            if (mediaType === 'video') {
                form.videoEnabled = isEnabled;
            } else if (mediaType === 'image') {
                form.imageEnabled = isEnabled;
            }
            
            const mediaConfig = formItem.querySelector(`[data-media-config="${mediaType}"]`);
            if (mediaConfig) {
                mediaConfig.style.display = isEnabled ? 'block' : 'none';
            }
        });
    });
    
    // Media Type Radio
    const videoTypeInputs = formItem.querySelectorAll(`[name="videoType-${formId}"]`);
    videoTypeInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            form.videoType = e.target.value;
            toggleMediaInput(formItem, 'video', e.target.value);
        });
    });
    
    const imageTypeInputs = formItem.querySelectorAll(`[name="imageType-${formId}"]`);
    imageTypeInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            form.imageType = e.target.value;
            toggleMediaInput(formItem, 'image', e.target.value);
        });
    });
    
    // Text Inputs
    const videoPromptInput = formItem.querySelector('[data-field="videoPrompt"]');
    if (videoPromptInput) {
        videoPromptInput.addEventListener('input', (e) => {
            form.videoPrompt = e.target.value;
        });
    }
    
    const imagePromptInput = formItem.querySelector('[data-field="imagePrompt"]');
    if (imagePromptInput) {
        imagePromptInput.addEventListener('input', (e) => {
            form.imagePrompt = e.target.value;
        });
    }
    
    const postPromptInput = formItem.querySelector('[data-field="postPrompt"]');
    if (postPromptInput) {
        postPromptInput.addEventListener('input', (e) => {
            form.postPrompt = e.target.value;
        });
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
    
    // Deselect the option
    const option = document.querySelector(`[data-multiselect-options="${formId}"] [data-option-id="${pageId}"]`);
    if (option) {
        option.classList.remove('selected');
    }
    
    renderMultiSelectTags(formId);
}

// Render Tabs
function renderTabs() {
    formTabs.innerHTML = forms.map((form, index) => `
        <button 
            class="tab-btn ${index === currentFormIndex ? 'active' : ''}" 
            onclick="switchToForm(${index})"
        >
            Form ${form.id}
        </button>
    `).join('');
}

// Switch to Form
function switchToForm(index) {
    currentFormIndex = index;
    
    document.querySelectorAll('.form-item').forEach((item, i) => {
        item.style.display = i === index ? 'block' : 'none';
    });
    
    renderTabs();
}

// Delete Form
function deleteForm(formId) {
    if (!confirm('Delete this form?')) return;
    
    const index = forms.findIndex(f => f.id === formId);
    if (index === -1) return;
    
    forms.splice(index, 1);
    
    const formItem = document.querySelector(`[data-form-id="${formId}"]`);
    if (formItem) {
        formItem.remove();
    }
    
    if (forms.length === 0) {
        createForm();
    } else {
        if (currentFormIndex >= forms.length) {
            currentFormIndex = forms.length - 1;
        }
        switchToForm(currentFormIndex);
    }
    
    renderTabs();
}

// Transform n8n Response
// Transform n8n Response
function transformN8nResponse(n8nData, form) {
    console.log('🔄 Transforming n8n response:', n8nData);
    
    // Handle array response
    if (Array.isArray(n8nData) && n8nData.length > 0) {
        n8nData = n8nData[0];
    }
    
    // Extract text from content array or single content string
    let text = '';
    if (n8nData.content && Array.isArray(n8nData.content)) {
        text = n8nData.content.join('\n\n');
        console.log('  📝 Content (from array):', text.substring(0, 50) + '...');
    } else if (n8nData.content && typeof n8nData.content === 'string') {
        text = n8nData.content;
        console.log('  📝 Content (string):', text.substring(0, 50) + '...');
    } else if (n8nData.text) {
        text = n8nData.text;
        console.log('  📝 Content (from text):', text.substring(0, 50) + '...');
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
        console.log('  📋 PageTitle (array):', title);
        title = title[0] || 'Draft';
    }
    console.log('  📋 Title (final):', title);
    
    // Get pageId and handle if it comes as array
    let pageId = n8nData.pageID || n8nData.pageId || null;
    if (Array.isArray(pageId)) {
        console.log('  🆔 PageID (array):', pageId);
        pageId = pageId[0] || null;
    }
    console.log('  🆔 PageID (final):', pageId, typeof pageId);
    
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
// Add Draft
function addDraft(formId, draftData) {
    console.log('📝 addDraft called with:', { formId, draftData });
    const form = forms.find(f => f.id === formId);
    
    if (!form) {
        console.error('❌ Form not found:', formId);
        return;
    }
    
    const draft = {
        id: draftData.pageId || Date.now() + Math.random(), // Use pageId if available
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
    const form = forms.find(f => f.id === formId);
    if (!form) return;
    
    const container = document.querySelector(`[data-drafts-container="${formId}"]`);
    if (!container) return;
    
    if (form.drafts.length === 0) {
        container.innerHTML = `
            <div class="drafts-empty">
                <div class="drafts-empty-icon">📝</div>
                <div class="drafts-empty-text">No drafts generated yet</div>
                <div class="drafts-empty-hint">Submit the form to generate drafts</div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = form.drafts.map(draft => {
        if (draft.editing) {
            return renderDraftEditMode(formId, draft);
        } else {
            return renderDraftViewMode(formId, draft);
        }
    }).join('');
}

// Render Draft View Mode
function renderDraftViewMode(formId, draft) {
    return `
        <div class="draft-item" data-draft-id="${draft.id}">
            <div class="draft-header">
                <h4 class="draft-title">${escapeHtml(draft.title)}</h4>
                <div class="draft-actions">
                    <button class="draft-action-btn" onclick="editDraft(${formId}, '${draft.id}')" title="Edit">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M11.5 2.5l2 2L6 12H4v-2l7.5-7.5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                    <button class="draft-action-btn" onclick="publishDraft(${formId}, '${draft.id}')" title="Publish">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M8 2v12m4-4l-4 4-4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                    <button class="draft-action-btn draft-action-delete" onclick="deleteDraft(${formId}, '${draft.id}')" title="Delete">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                        </svg>
                    </button>
                </div>
            </div>
            
            ${draft.image ? `
                <div class="draft-media">
                    <img src="${draft.image}" alt="Draft image" class="draft-image">
                </div>
            ` : ''}
            
            ${draft.video ? `
                <div class="draft-media">
                    <video src="${draft.video}" controls class="draft-video"></video>
                </div>
            ` : ''}
            
            <div class="draft-content">
                <p class="draft-text">${escapeHtml(draft.text)}</p>
            </div>
            
            <div class="draft-meta">
                <div class="draft-platforms">
                    ${draft.platforms ? draft.platforms.map(p => `<span class="draft-platform-tag">${p}</span>`).join('') : ''}
                </div>
            </div>
        </div>
    `;
}

// Render Draft Edit Mode
function renderDraftEditMode(formId, draft) {
    return `
        <div class="draft-item draft-editing" data-draft-id="${draft.id}">
            <div class="draft-header">
                <h4 class="draft-title">${escapeHtml(draft.title)} - Editing</h4>
                <div class="draft-actions">
                    <button class="draft-action-btn draft-action-save" onclick="saveDraftEdit(${formId}, ${draft.id})" title="Save & Regenerate">
                        Save
                    </button>
                    <button class="draft-action-btn" onclick="cancelDraftEdit(${formId}, ${draft.id})" title="Cancel">
                        Cancel
                    </button>
                </div>
            </div>
            
            <div class="draft-edit-form">
                <!-- Media Options -->
                <div class="form-section media-section">
                    <label class="section-label">Media Options</label>
                    
                    <!-- Video Option -->
                    <div class="media-option">
                        <label class="checkbox-item media-checkbox">
                            <input type="checkbox" class="checkbox-input" 
                                onchange="updateDraftEditData(${formId}, ${draft.id}, 'videoEnabled', this.checked)"
                                data-media-type="video"
                                ${draft.editData.videoEnabled ? 'checked' : ''}>
                            <span class="checkbox-label">Video</span>
                        </label>
                        
                        <div class="media-config" style="display: ${draft.editData.videoEnabled ? 'block' : 'none'};">
                            <div class="media-type-selector">
                                <label class="radio-item">
                                    <input type="radio" name="videoType-edit-${draft.id}" 
                                        onchange="updateDraftEditData(${formId}, ${draft.id}, 'videoType', 'prompt')"
                                        value="prompt" 
                                        ${draft.editData.videoType === 'prompt' ? 'checked' : ''}>
                                    <span class="radio-label">Prompt</span>
                                </label>
                                <label class="radio-item">
                                    <input type="radio" name="videoType-edit-${draft.id}" 
                                        onchange="updateDraftEditData(${formId}, ${draft.id}, 'videoType', 'upload')"
                                        value="upload"
                                        ${draft.editData.videoType === 'upload' ? 'checked' : ''}>
                                    <span class="radio-label">Upload</span>
                                </label>
                            </div>
                            
                            <div class="media-input">
                                <textarea 
                                    class="form-input textarea-input" 
                                    oninput="updateDraftEditData(${formId}, ${draft.id}, 'videoPrompt', this.value)"
                                    placeholder="Enter video generation prompt..."
                                    rows="3"
                                    style="display: ${draft.editData.videoType === 'prompt' ? 'block' : 'none'};"
                                >${escapeHtml(draft.editData.videoPrompt || '')}</textarea>
                                <div class="upload-placeholder" style="display: ${draft.editData.videoType === 'upload' ? 'flex' : 'none'};">
                                    <div class="upload-icon">
                                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                                            <path d="M24 16v16m8-8H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                            <rect x="8" y="8" width="32" height="32" rx="4" stroke="currentColor" stroke-width="2"/>
                                        </svg>
                                    </div>
                                    <div class="upload-text">Video upload coming soon...</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Image Option -->
                    <div class="media-option">
                        <label class="checkbox-item media-checkbox">
                            <input type="checkbox" class="checkbox-input" 
                                onchange="updateDraftEditData(${formId}, ${draft.id}, 'imageEnabled', this.checked)"
                                data-media-type="image"
                                ${draft.editData.imageEnabled ? 'checked' : ''}>
                            <span class="checkbox-label">Image</span>
                        </label>
                        
                        <div class="media-config" style="display: ${draft.editData.imageEnabled ? 'block' : 'none'};">
                            <div class="media-type-selector">
                                <label class="radio-item">
                                    <input type="radio" name="imageType-edit-${draft.id}" 
                                        onchange="updateDraftEditData(${formId}, ${draft.id}, 'imageType', 'prompt')"
                                        value="prompt"
                                        ${draft.editData.imageType === 'prompt' ? 'checked' : ''}>
                                    <span class="radio-label">Prompt</span>
                                </label>
                                <label class="radio-item">
                                    <input type="radio" name="imageType-edit-${draft.id}" 
                                        onchange="updateDraftEditData(${formId}, ${draft.id}, 'imageType', 'upload')"
                                        value="upload"
                                        ${draft.editData.imageType === 'upload' ? 'checked' : ''}>
                                    <span class="radio-label">Upload</span>
                                </label>
                            </div>
                            
                            <div class="media-input">
                                <textarea 
                                    class="form-input textarea-input" 
                                    oninput="updateDraftEditData(${formId}, ${draft.id}, 'imagePrompt', this.value)"
                                    placeholder="Enter image generation prompt..."
                                    rows="3"
                                    style="display: ${draft.editData.imageType === 'prompt' ? 'block' : 'none'};"
                                >${escapeHtml(draft.editData.imagePrompt || '')}</textarea>
                                <div class="upload-placeholder" style="display: ${draft.editData.imageType === 'upload' ? 'flex' : 'none'};">
                                    <div class="upload-icon">
                                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                                            <path d="M24 16v16m8-8H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                            <rect x="8" y="8" width="32" height="32" rx="4" stroke="currentColor" stroke-width="2"/>
                                        </svg>
                                    </div>
                                    <div class="upload-text">Image upload coming soon...</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Post Prompt -->
                <div class="form-section full-width">
                    <label class="section-label">
                        Post Prompt
                        <span class="required-indicator">*</span>
                    </label>
                    <textarea 
                        class="form-input textarea-input" 
                        oninput="updateDraftEditData(${formId}, ${draft.id}, 'postPrompt', this.value)"
                        placeholder="Enter post generation prompt..."
                        rows="4"
                    >${escapeHtml(draft.editData.postPrompt || '')}</textarea>
                </div>
            </div>
        </div>
    `;
}

// Edit Draft
function editDraft(formId, draftId) {
    const form = forms.find(f => f.id === formId);
    const draft = form.drafts.find(d => d.id === draftId);
    
    if (!draft) return;
    
    draft.editing = true;
    renderDrafts(formId);
    
    // Setup media toggle listeners for edit mode
    setTimeout(() => {
        const draftItem = document.querySelector(`[data-draft-id="${draftId}"]`);
        if (!draftItem) return;
        
        const mediaCheckboxes = draftItem.querySelectorAll('[data-media-type]');
        mediaCheckboxes.forEach(checkbox => {
            const mediaType = checkbox.dataset.mediaType;
            const mediaConfig = draftItem.querySelector(`[data-media-type="${mediaType}"]`).closest('.media-option').querySelector('.media-config');
            
            checkbox.addEventListener('change', (e) => {
                if (mediaConfig) {
                    mediaConfig.style.display = e.target.checked ? 'block' : 'none';
                }
            });
        });
        
        // Setup radio button listeners for media type
        const videoTypeRadios = draftItem.querySelectorAll(`[name="videoType-edit-${draftId}"]`);
        videoTypeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                const mediaInput = draftItem.querySelector('[name="videoType-edit-' + draftId + '"]').closest('.media-config').querySelector('.media-input');
                toggleMediaInputInEdit(mediaInput, e.target.value);
            });
        });
        
        const imageTypeRadios = draftItem.querySelectorAll(`[name="imageType-edit-${draftId}"]`);
        imageTypeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                const mediaInput = draftItem.querySelector('[name="imageType-edit-' + draftId + '"]').closest('.media-config').querySelector('.media-input');
                toggleMediaInputInEdit(mediaInput, e.target.value);
            });
        });
    }, 0);
}

// Cancel Draft Edit
function cancelDraftEdit(formId, draftId) {
    const form = forms.find(f => f.id === formId);
    const draft = form.drafts.find(d => d.id === draftId);
    
    if (!draft) return;
    
    draft.editing = false;
    renderDrafts(formId);
}

// Update Draft Edit Data
function updateDraftEditData(formId, draftId, field, value) {
    const form = forms.find(f => f.id === formId);
    const draft = form.drafts.find(d => d.id === draftId);
    
    if (!draft) return;
    
    draft.editData[field] = value;
    
    // Handle media enable/disable
    if (field === 'videoEnabled' || field === 'imageEnabled') {
        const draftItem = document.querySelector(`[data-draft-id="${draftId}"]`);
        if (!draftItem) return;
        
        const mediaType = field === 'videoEnabled' ? 'video' : 'image';
        const checkbox = draftItem.querySelector(`[data-media-type="${mediaType}"]`);
        if (!checkbox) return;
        
        const mediaConfig = checkbox.closest('.media-option').querySelector('.media-config');
        if (mediaConfig) {
            mediaConfig.style.display = value ? 'block' : 'none';
        }
    }
    
    // Handle media type change
    if (field === 'videoType' || field === 'imageType') {
        const draftItem = document.querySelector(`[data-draft-id="${draftId}"]`);
        if (!draftItem) return;
        
        const radioName = field === 'videoType' ? `videoType-edit-${draftId}` : `imageType-edit-${draftId}`;
        const mediaInput = draftItem.querySelector(`[name="${radioName}"]`).closest('.media-config').querySelector('.media-input');
        
        if (mediaInput) {
            toggleMediaInputInEdit(mediaInput, value);
        }
    }
}

// Toggle Media Input in Edit Mode
function toggleMediaInputInEdit(mediaInputContainer, inputType) {
    if (!mediaInputContainer) return;
    
    const promptTextarea = mediaInputContainer.querySelector('.textarea-input');
    const uploadPlaceholder = mediaInputContainer.querySelector('.upload-placeholder');
    
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

// Delete Draft
function deleteDraft(formId, draftId) {
    if (!confirm('Delete this draft?')) return;
    
    const form = forms.find(f => f.id === formId);
    if (!form) return;
    
    form.drafts = form.drafts.filter(d => d.id !== draftId);
    renderDrafts(formId);
}

// Publish Draft
async function publishDraft(formId, draftId) {
    const form = forms.find(f => f.id === formId);
    const draft = form.drafts.find(d => d.id === draftId);
    
    if (!draft) return;
    
    // Get platforms from form since draft doesn't store them
    const platforms = form.platforms || [];
    
    if (!confirm(`Publish draft for "${draft.title}"?`)) return;
    
    showLoading(true);
    
    try {
        // Find matching spreadsheet row by title
        const spreadsheetRow = spreadsheetData.find(row => 
            row.pageTitle === draft.title
        ) || {};
        
        // Build payload with draft data + spreadsheet data
        const payload = {
            pageTitle: draft.title,
            text: draft.text,
            image: draft.image,
            video: draft.video,
            platforms: platforms,
            locationId: CONFIG.GHL_LOCATION_ID,
            userId: CONFIG.GHL_USER_ID,
            ghlApiKey: CONFIG.GHL_TOKEN,
            // Include all spreadsheet data (only columns with values)
            ...spreadsheetRow
        };
        
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
        deleteDraft(formId, draftId);
        
    } catch (error) {
        console.error('Error publishing draft:', error);
        alert('Error publishing draft. Please try again.');
    } finally {
        showLoading(false);
    }
}

// Toggle Media Input
function toggleMediaInput(formItem, mediaType, inputType) {
    const mediaInput = formItem.querySelector(`[data-media-input="${mediaType}"]`);
    if (!mediaInput) return;
    
    const promptTextarea = mediaInput.querySelector('.textarea-input');
    const uploadPlaceholder = mediaInput.querySelector('.upload-placeholder');
    
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
        // Prepare payload similar to main form submission
        const payload = {
            ...form,
            postPrompt: draft.editData.postPrompt,
            videoEnabled: draft.editData.videoEnabled,
            videoType: draft.editData.videoType,
            videoPrompt: draft.editData.videoPrompt,
            imageEnabled: draft.editData.imageEnabled,
            imageType: draft.editData.imageType,
            imagePrompt: draft.editData.imagePrompt,
            userId: CONFIG.GHL_USER_ID,
            locationId: CONFIG.GHL_LOCATION_ID
        };
        
        // Remove drafts from payload
        delete payload.drafts;
        
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
        const cleanForms = validForms.map(form => {
            const { drafts, ...formData } = form;
            return formData;
        });
        
        const response = await fetch(CONFIG.N8N_WEBHOOK, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                forms: cleanForms,
                userId: CONFIG.GHL_USER_ID,
                locationId: CONFIG.GHL_LOCATION_ID
            })
        });
        
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
