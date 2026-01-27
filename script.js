// Configuration
const CONFIG = {
    N8N_WEBHOOK: 'https://bsmteam.app.n8n.cloud/webhook-test/65ce59cc-e7f3-497b-9a11-068d578caff6', // Replace with your n8n webhook
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
        page: '',
        platforms: [],
        postPrompt: '',
        geminiPrompt: ''
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

                <!-- Gemini Prompt -->
                <div class="form-section">
                    <label class="section-label">
                        Image Generation Prompt
                    </label>
                    <textarea 
                        class="form-textarea" 
                        data-field="geminiPrompt" 
                        placeholder="Describe the image you want generated (optional)..."
                    ></textarea>
                    <span class="optional-label">Optional</span>
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
        });
    });
}

// Update Form Data
function updateFormData(formId, input) {
    const form = forms.find(f => f.id === formId);
    const field = input.dataset.field;
    
    if (field === 'platforms') {
        const checkboxes = document.querySelectorAll(`[data-form-id="${formId}"] [data-field="platforms"]:checked`);
        form.platforms = Array.from(checkboxes).map(cb => cb.value);
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
    
    const form = forms.find(f => f.id === formId);
    form.page = '';
    form.platforms = [];
    form.postPrompt = '';
    form.geminiPrompt = '';
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
    if (!form.page || form.platforms.length === 0 || !form.postPrompt) {
        alert('Please fill all required fields (Page, Platforms, Post Prompt)');
        return;
    }
    
    alert(`Form ${formId} saved! Total forms saved: ${forms.filter(f => f.page).length}`);
}

// Submit All Forms
async function submitAllForms() {
    // Validate all forms
    const validForms = forms.filter(f => f.page && f.platforms.length > 0 && f.postPrompt);
    
    if (validForms.length === 0) {
        alert('Please complete at least one form before submitting');
        return;
    }
    
    if (!confirm(`Submit ${validForms.length} form(s)?`)) return;
    
    showLoading(true);
    
    try {
        // Send to n8n webhook
        const response = await fetch(CONFIG.N8N_WEBHOOK, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                forms: validForms,
                userId: CONFIG.GHL_USER_ID,
                locationId: CONFIG.GHL_LOCATION_ID
            })
        });
        
        if (!response.ok) {
            throw new Error('Submission failed');
        }
        
        alert('All forms submitted successfully!');
        
        // Reset
        forms = [];
        formsContainer.innerHTML = '';
        createForm();
        
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
