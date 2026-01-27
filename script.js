// Configuration
const CONFIG = {
    N8N_WEBHOOK: 'https://bsmteam.app.n8n.cloud/webhook/65ce59cc-e7f3-497b-9a11-068d578caff6',
    GHL_LOCATION_ID: 'WXQN7BcuGraEWbKThpHB',
    GHL_TOKEN: 'pit-6f2acdd2-7183-497d-927b-c34cedef658c',
    GHL_USER_ID: 'Jq6fypbCiDz2jmMSnjj3'
};

// State
let forms = [];
let currentFormIndex = 0;
let accounts = [];

// DOM Elements
const formsContainer = document.getElementById('formsContainer');
const formTabs = document.getElementById('formTabs');
const addFormBtn = document.getElementById('addFormBtn');
const submitAllBtn = document.getElementById('submitAllBtn');
const loadingOverlay = document.getElementById('loadingOverlay');

// Initialize
async function init() {
    await loadAccounts();
    createForm();
    setupEventListeners();
}

// Load GHL Accounts
async function loadAccounts() {
    try {
        const response = await fetch(
            `https://services.leadconnectorhq.com/social-media-posting/${CONFIG.GHL_LOCATION_ID}/accounts`,
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.GHL_TOKEN}`,
                    'Version': '2021-07-28'
                }
            }
        );
        
        const data = await response.json();
        accounts = data.results.accounts || [];
    } catch (error) {
        console.error('Error loading accounts:', error);
        alert('Error loading social media accounts');
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
        page: '',
        platforms: [],
        postPrompt: '',
        videoEnabled: false,
        videoType: 'prompt',
        videoPrompt: '',
        imageEnabled: false,
        imageType: 'prompt',
        imagePrompt: ''
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
                        Select Page
                        <span class="required-indicator">*</span>
                    </label>
                    <div class="select-wrapper">
                        <select class="form-select" data-field="page" required>
                            <option value="">Choose a page...</option>
                            ${accounts.map(acc => `
                                <option value="${acc.id}">${acc.name} (${acc.platform})</option>
                            `).join('')}
                        </select>
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
                            <input type="checkbox" class="checkbox-input" data-field="videoEnabled" data-media-type="video">
                            <span class="checkbox-label">Video</span>
                        </label>
                        
                        <div class="media-config" data-media-config="video" style="display: none;">
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
                            <input type="checkbox" class="checkbox-input" data-field="imageEnabled" data-media-type="image">
                            <span class="checkbox-label">Image</span>
                        </label>
                        
                        <div class="media-config" data-media-config="image" style="display: none;">
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
                        Post Content Prompt
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

            <!-- Form Actions -->
            <div class="form-actions">
                <button class="form-btn btn-previous" onclick="previousForm()" ${form.id === 1 ? 'disabled' : ''}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M10 12L6 8l4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Previous
                </button>
                <button class="form-btn btn-clear" onclick="clearForm(${form.id})">
                    Clear
                </button>
                <button class="form-btn btn-send" onclick="saveForm(${form.id})">
                    Send Form
                </button>
                <button class="form-btn btn-next" onclick="nextForm()">
                    Next
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M6 12l4-4-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </div>
        </div>
    `;
    
    formsContainer.insertAdjacentHTML('beforeend', formHTML);
    attachFormListeners(form.id);
}

// Attach Form Listeners
function attachFormListeners(formId) {
    const formElement = document.querySelector(`[data-form-id="${formId}"]`);
    const inputs = formElement.querySelectorAll('[data-field]');
    
    inputs.forEach(input => {
        input.addEventListener('change', (e) => {
            updateFormData(formId, e.target);
            
            // Handle page mode change
            if (e.target.dataset.field === 'pageMode') {
                togglePageDropdown(formId, e.target.value);
            }
            
            // Handle media enable/disable
            if (e.target.dataset.mediaType) {
                toggleMediaConfig(formId, e.target.dataset.mediaType, e.target.checked);
            }
            
            // Handle media type change (prompt vs upload)
            if (e.target.dataset.field === 'videoType' || e.target.dataset.field === 'imageType') {
                const mediaType = e.target.dataset.field === 'videoType' ? 'video' : 'image';
                toggleMediaInput(formId, mediaType, e.target.value);
            }
        });
    });
}

// Toggle page dropdown based on mode
function togglePageDropdown(formId, mode) {
    const formElement = document.querySelector(`[data-form-id="${formId}"]`);
    const pageSelect = formElement.querySelector('[data-field="page"]');
    
    if (mode === 'all') {
        pageSelect.disabled = true;
        pageSelect.style.opacity = '0.4';
        pageSelect.style.cursor = 'not-allowed';
        pageSelect.value = '';
    } else {
        pageSelect.disabled = false;
        pageSelect.style.opacity = '1';
        pageSelect.style.cursor = 'pointer';
    }
}

// Toggle media configuration visibility
function toggleMediaConfig(formId, mediaType, enabled) {
    const formElement = document.querySelector(`[data-form-id="${formId}"]`);
    const mediaConfig = formElement.querySelector(`[data-media-config="${mediaType}"]`);
    
    mediaConfig.style.display = enabled ? 'block' : 'none';
    
    // Reset media type to prompt when disabling
    if (!enabled) {
        const promptRadio = formElement.querySelector(`[data-field="${mediaType}Type"][value="prompt"]`);
        if (promptRadio) {
            promptRadio.checked = true;
            toggleMediaInput(formId, mediaType, 'prompt');
        }
    }
}

// Toggle between prompt and upload input
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
            form.page = '';
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
    form.page = '';
    form.platforms = [];
    form.postPrompt = '';
    form.videoEnabled = false;
    form.videoType = 'prompt';
    form.videoPrompt = '';
    form.imageEnabled = false;
    form.imageType = 'prompt';
    form.imagePrompt = '';
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

// Save Form
function saveForm(formId) {
    const form = forms.find(f => f.id === formId);
    
    // Validate
    if (form.pageMode === 'select' && !form.page) {
        alert('Please select a page');
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
    
    alert(`Form ${formId} saved! Total forms saved: ${forms.filter(f => (f.pageMode === 'all' || f.page) && f.postPrompt).length}`);
}

// Submit All Forms
async function submitAllForms() {
    // Validate all forms
    const validForms = forms.filter(f => {
        const hasValidPage = f.pageMode === 'all' || f.page;
        return hasValidPage && f.platforms.length > 0 && f.postPrompt;
    });
    
    if (validForms.length === 0) {
        alert('Please complete at least one form before submitting');
        return;
    }
    
    if (!confirm(`Submit ${validForms.length} form(s)?`)) return;
    
    showLoading(true);
    
    try {
        const payload = {
            forms: validForms,
            userId: CONFIG.GHL_USER_ID,
            locationId: CONFIG.GHL_LOCATION_ID
        };

        console.log('Sending payload:', payload);
        
        // Send to n8n webhook
        const response = await fetch(CONFIG.N8N_WEBHOOK, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        // Get response text for better error messages
        const responseText = await response.text();
        
        if (!response.ok) {
            console.error('Server error:', responseText);
            throw new Error(`Server returned ${response.status}: ${responseText}`);
        }
        
        console.log('Success response:', responseText);
        alert('All forms submitted successfully!');
        
        // Reset
        forms = [];
        formsContainer.innerHTML = '';
        createForm();
        
    } catch (error) {
        console.error('Error submitting forms:', error);
        alert(`Error submitting forms: ${error.message}`);
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
