// Optimized popup script
const form = document.getElementById('questionForm');
const questionTextarea = document.getElementById('question');
const submitBtn = form.querySelector('.submit-btn');

const PLATFORM_URLS = {
    chatgpt: 'https://chat.openai.com/',
    gemini: 'https://gemini.google.com/'
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await checkForPrefilledQuery();
    questionTextarea.focus();
    if (!questionTextarea.value) loadSavedQuestion();
    questionTextarea.addEventListener('input', debounce(saveQuestion, 500));
    

});

// Form submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const question = questionTextarea.value.trim();
    if (!question) {
        showError('Please enter a question');
        return;
    }
    
    const platform = form.querySelector('input[name="platform"]:checked').value;
    
    try {
        setLoadingState(true);
        await sendToPlatform(question, platform);
        clearSavedQuestion();
        setTimeout(() => window.close(), 500);
    } catch (error) {
        showError('Failed to send question. Please try again.');
        setLoadingState(false);
    }
});

async function sendToPlatform(question, platform) {
    try {
        // Check if extension context is valid
        if (!chrome?.runtime?.id) {
            throw new Error('Extension context invalidated');
        }
        
        const response = await chrome.runtime.sendMessage({
            action: 'openPlatformWithQuery',
            platform: platform,
            question: question,
            source: 'extension_popup'
        });
        
        if (!response?.success) throw new Error('Background script failed');
        
    } catch (error) {
        // Fallback: Direct approach with storage and tab creation
        try {
            if (chrome?.storage?.local) {
                await chrome.storage.local.set({
                    'quickai_prefilled_query': question,
                    'quickai_source': 'extension_popup',
                    'quickai_target_platform': platform,
                    'quickai_timestamp': Date.now()
                });
            }
            
            if (chrome?.tabs?.create) {
                await chrome.tabs.create({
                    url: PLATFORM_URLS[platform],
                    active: true
                });
            } else {
                window.open(PLATFORM_URLS[platform], '_blank');
            }
            
        } catch (fallbackError) {
            window.open(PLATFORM_URLS[platform], '_blank');
        }
    }
}

async function checkForPrefilledQuery() {
    try {
        if (!chrome?.storage?.local) return;
        
        const result = await chrome.storage.local.get([
            'quickai_prefilled_query', 
            'quickai_source', 
            'quickai_target_platform',
            'quickai_timestamp',
            'quickai_session_id'
        ]);
        
        const isDataFresh = result.quickai_timestamp && (Date.now() - result.quickai_timestamp) < 5000; // Very fresh data only
        const isFromGoogle = result.quickai_source === 'google';
        const hasSessionId = result.quickai_session_id;
        
        if (result.quickai_prefilled_query && isFromGoogle && isDataFresh && hasSessionId) {
            questionTextarea.value = result.quickai_prefilled_query;
            
            if (result.quickai_target_platform) {
                const radio = document.querySelector(`input[name="platform"][value="${result.quickai_target_platform}"]`);
                if (radio) radio.checked = true;
            }
            
            showGoogleSourceNotification();
            await chrome.storage.local.clear();
        } else if (!isDataFresh || !hasSessionId) {
            await chrome.storage.local.clear();
        }
    } catch (error) {
        // Ignore prefill errors
    }
}

function showGoogleSourceNotification() {
    const notification = document.createElement('div');
    notification.style.cssText = `
        background: #f0f9ff; border: 1px solid #7dd3fc; border-radius: 6px;
        margin-bottom: 12px; padding: 8px 12px; font-size: 13px; color: #0369a1;
    `;
    notification.innerHTML = `
        <span>🔍</span> Pre-filled from Google search
        <button onclick="this.parentElement.remove()" style="background:none;border:none;float:right;cursor:pointer;">×</button>
    `;
    
    form.parentNode.insertBefore(notification, form);
    setTimeout(() => notification.remove(), 5000);
}



// Utility functions
function setLoadingState(loading) {
    submitBtn.disabled = loading;
    submitBtn.textContent = loading ? 'Sending...' : 'Send Question';
}

function showError(message) {
    showMessage(message, '#fee2e2', '#dc2626');
}

function showSuccess(message) {
    showMessage(message, '#f0fdf4', '#16a34a');
}

function showMessage(message, bgColor, textColor) {
    const existing = document.querySelector('.temp-message');
    if (existing) existing.remove();
    
    const msg = document.createElement('div');
    msg.className = 'temp-message';
    msg.textContent = message;
    msg.style.cssText = `
        background: ${bgColor}; color: ${textColor}; padding: 8px 12px;
        border-radius: 6px; margin-bottom: 12px; font-size: 14px;
    `;
    
    form.insertBefore(msg, submitBtn);
    setTimeout(() => msg.remove(), 3000);
}

function saveQuestion() {
    const question = questionTextarea.value;
    if (question.trim()) {
        localStorage.setItem('quickai_saved_question', question);
    } else {
        localStorage.removeItem('quickai_saved_question');
    }
}

function loadSavedQuestion() {
    const saved = localStorage.getItem('quickai_saved_question');
    if (saved) questionTextarea.value = saved;
}

function clearSavedQuestion() {
    localStorage.removeItem('quickai_saved_question');
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        form.dispatchEvent(new Event('submit'));
    }
    if (e.key === 'Escape') {
        window.close();
    }
});

// Clean popup script - no debug code
