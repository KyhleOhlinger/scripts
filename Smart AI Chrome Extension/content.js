// Unified content script for AI platforms and Google integration
let questionToInject = null;
let retryCount = 0;
const maxRetries = 10;
let injectionProcessed = false;

// Platform URLs
const PLATFORM_URLS = {
    chatgpt: 'https://chat.openai.com/',
    gemini: 'https://gemini.google.com/'
};

// Listen for messages from popup and background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'injectQuestion') {
        injectionProcessed = false;
        questionToInject = request.question;
        retryCount = 0;
        setTimeout(injectQuestionIntoPage, 1000);
        sendResponse({ success: true });
    } else if (request.action === 'showAIPopup') {
        showGoogleAIPopup();
        sendResponse({ success: true });
    }
});

// Initialize based on current URL
function initialize() {
    const url = window.location.href;
    
    if (url.includes('google.com') && !url.includes('chat.openai.com') && !url.includes('gemini.google.com')) {
        initializeGoogleIntegration();
    } else if (url.includes('chat.openai.com') || url.includes('chatgpt.com') || url.includes('gemini.google.com')) {
        setTimeout(checkForStoredQuery, 1000);
    }
}

// Google integration
function initializeGoogleIntegration() {
    setTimeout(() => {
        const searchInput = findGoogleSearchInput();
        if (searchInput) {
            addGoogleAIButton(searchInput);
        }
    }, 1000);
}

function findGoogleSearchInput() {
    const selectors = ['input[name="q"]', 'textarea[name="q"]', '#APjFqb', '.gLFyf'];
    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element && element.offsetWidth > 0) return element;
    }
    return null;
}

function addGoogleAIButton(searchInput) {
    if (document.querySelector('.ai-trigger-btn')) return;
    
    const container = searchInput.parentElement;
    container.style.position = 'relative';
    
    const button = document.createElement('button');
    button.className = 'ai-trigger-btn';
    button.innerHTML = '🤖 AI';
    button.style.cssText = `
        position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
        background: linear-gradient(135deg, #667eea, #764ba2); color: white;
        border: none; border-radius: 6px; padding: 6px 10px; cursor: pointer;
        font-size: 12px; z-index: 1000; transition: all 0.2s;
    `;
    
    button.onclick = (e) => {
        e.preventDefault();
        showGoogleAIPopup();
    };
    
    container.appendChild(button);
    
    // Keyboard shortcut
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.altKey || e.metaKey)) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            showGoogleAIPopup();
            return false;
        }
    }, true);
}

function showGoogleAIPopup() {
    const searchInput = findGoogleSearchInput();
    const query = searchInput ? searchInput.value.trim() : '';
    
    if (!query) {
        showSimpleAlert('Please enter a search query first');
        return;
    }
    
    createGoogleAIPopup(query);
}

function createGoogleAIPopup(query) {
    // Remove existing popup if any
    const existing = document.getElementById('quick-ai-popup');
    if (existing) existing.remove();
    
    const popup = document.createElement('div');
    popup.id = 'quick-ai-popup';
    popup.innerHTML = `
        <div class="ai-popup-overlay"></div>
        <div class="ai-popup-content">
            <div class="ai-popup-header">
                <span class="ai-popup-icon">🤖</span>
                <span class="ai-popup-title">Ask AI Instead</span>
                <button class="ai-popup-close">×</button>
            </div>
            <div class="ai-popup-body">
                <p class="ai-popup-description">Send your search to an AI assistant:</p>
                <div class="ai-popup-buttons">
                    <button class="ai-popup-btn ai-chatgpt-btn" data-platform="chatgpt">
                        🤖 ChatGPT
                    </button>
                    <button class="ai-popup-btn ai-gemini-btn" data-platform="gemini">
                        ✨ Gemini
                    </button>
                </div>
                <div class="ai-popup-footer">
                    <small>Your search: "<span class="search-preview">${query.substring(0, 50)}${query.length > 50 ? '...' : ''}</span>"</small>
                </div>
            </div>
        </div>
    `;
    
    // Add styles
    popup.innerHTML += `
        <style>
            #quick-ai-popup {
                position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            .ai-popup-overlay {
                position: absolute; top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0, 0, 0, 0.5); cursor: pointer;
            }
            .ai-popup-content {
                position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
                background: white; border-radius: 12px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                width: 320px; overflow: hidden;
            }
            .ai-popup-header {
                display: flex; align-items: center; padding: 16px 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;
            }
            .ai-popup-icon { font-size: 20px; margin-right: 8px; }
            .ai-popup-title { font-weight: 600; font-size: 16px; flex: 1; }
            .ai-popup-close {
                background: none; border: none; color: white; font-size: 24px;
                cursor: pointer; padding: 0; width: 24px; height: 24px;
                display: flex; align-items: center; justify-content: center;
                border-radius: 50%; transition: background 0.2s;
            }
            .ai-popup-close:hover { background: rgba(255, 255, 255, 0.2); }
            .ai-popup-body { padding: 20px; }
            .ai-popup-description { margin: 0 0 16px 0; color: #374151; font-size: 14px; }
            .ai-popup-buttons { display: flex; gap: 10px; margin-bottom: 16px; }
            .ai-popup-btn {
                flex: 1; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 8px;
                background: white; cursor: pointer; font-size: 14px; font-weight: 500;
                transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 6px;
            }
            .ai-popup-btn:hover { border-color: #667eea; background: #f0f4ff; }
            .ai-chatgpt-btn:hover { border-color: #10b981; background: #f0fdf4; }
            .ai-gemini-btn:hover { border-color: #f59e0b; background: #fffbeb; }
            .ai-popup-footer {
                color: #6b7280; font-size: 12px; background: #f9fafb; padding: 12px;
                margin: -20px -20px 0 -20px; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;
            }
            .search-preview { font-weight: 500; color: #374151; }
        </style>
    `;
    
    document.body.appendChild(popup);
    
    // Add event listeners
    popup.querySelector('.ai-popup-overlay').onclick = () => popup.remove();
    popup.querySelector('.ai-popup-close').onclick = () => popup.remove();
    
    popup.querySelectorAll('.ai-popup-btn').forEach(btn => {
        btn.onclick = () => {
            const platform = btn.dataset.platform;
            popup.remove();
            sendToAIPlatform(query, platform);
        };
    });
}

function showSimpleAlert(message) {
    const alert = document.createElement('div');
    alert.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 10001;
        background: #fee2e2; color: #dc2626; padding: 12px 20px; border-radius: 8px;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 14px;
        box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2); border: 1px solid #fecaca;
    `;
    alert.textContent = message;
    document.body.appendChild(alert);
    setTimeout(() => alert.remove(), 3000);
}

function sendToAIPlatform(query, platform) {
    try {
        if (!chrome?.runtime?.id) {
            window.open(PLATFORM_URLS[platform], '_blank');
            return;
        }
        
        chrome.runtime.sendMessage({
            action: 'openPlatformWithQuery',
            platform: platform,
            query: query,
            source: 'google'
        }).catch(() => {
            window.open(PLATFORM_URLS[platform], '_blank');
        });
    } catch (error) {
        window.open(PLATFORM_URLS[platform], '_blank');
    }
}

// AI platform injection
function injectQuestionIntoPage() {
    if (!questionToInject || retryCount >= maxRetries) {
        return;
    }
    
    const url = window.location.href;
    let selectors = [];
    
    if (url.includes('chat.openai.com') || url.includes('chatgpt.com')) {
        selectors = [
            '#prompt-textarea',
            'textarea[data-id="root"]',
            'textarea[placeholder*="Message"]',
            'div[contenteditable="true"][role="textbox"]',
            'textarea[rows]',
            'textarea'
        ];
    } else if (url.includes('gemini.google.com')) {
        selectors = [
            'div[contenteditable="true"][data-placeholder*="Enter a prompt"]',
            'div.ql-editor[contenteditable="true"]',
            'div[contenteditable="true"]',
            'textarea'
        ];
    }
    
    for (let selector of selectors) {
        const element = document.querySelector(selector);
        if (element && isVisible(element) && element.offsetParent !== null) {
            if (injectIntoElement(element, questionToInject)) {
                questionToInject = null;
                setTimeout(() => { injectionProcessed = false; }, 5000);
                return;
            }
        }
    }
    
    retryCount++;
    setTimeout(injectQuestionIntoPage, 1000);
}

function injectIntoElement(element, text) {
    try {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
        element.click();
        
        // Immediate aggressive clearing to prevent any remnant text
        if (element.tagName.toLowerCase() === 'textarea' || element.tagName.toLowerCase() === 'input') {
            element.value = '';
            element.textContent = '';
            element.innerHTML = '';
        } else if (element.contentEditable === 'true') {
            element.textContent = '';
            element.innerHTML = '';
        }
        
        // Short delay to ensure clearing is complete, then inject
        setTimeout(() => {
            if (element.tagName.toLowerCase() === 'textarea' || element.tagName.toLowerCase() === 'input') {
                element.focus();
                element.value = text;
                element.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
                element.dispatchEvent(new Event('change', { bubbles: true }));
                
            } else if (element.contentEditable === 'true') {
                element.focus();
                try {
                    document.execCommand('selectAll', false, null);
                    document.execCommand('delete', false, null);
                    document.execCommand('insertText', false, text);
                } catch (e) {
                    element.textContent = text;
                }
                
                element.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
                element.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }, 50);
        
        return true;
    } catch (error) {
        return false;
    }
}

function isVisible(element) {
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0' &&
           element.offsetWidth > 0 && 
           element.offsetHeight > 0;
}

// Storage and injection management

async function checkForStoredQuery() {
    try {
        if (!chrome?.storage?.local || injectionProcessed) return;
        
        const data = await chrome.storage.local.get([
            'quickai_prefilled_query',
            'quickai_source',
            'quickai_target_platform',
            'quickai_timestamp',
            'quickai_session_id'
        ]);
        
        const expectedPlatform = (window.location.href.includes('chat.openai.com') || window.location.href.includes('chatgpt.com')) ? 'chatgpt' : 
                                window.location.href.includes('gemini.google.com') ? 'gemini' : null;
        
        const isDataFresh = data.quickai_timestamp && (Date.now() - data.quickai_timestamp) < 10000;
        const hasSessionId = data.quickai_session_id; // Ensures data is from current session
        
        if (data.quickai_prefilled_query && 
            data.quickai_target_platform === expectedPlatform &&
            (data.quickai_source === 'google' || data.quickai_source === 'extension_popup') &&
            isDataFresh && hasSessionId) {
            
            injectionProcessed = true;
            questionToInject = data.quickai_prefilled_query;
            retryCount = 0;
            
            // Clear storage immediately to prevent re-reading
            await chrome.storage.local.clear();
            
            // Start injection after brief delay for page stability
            setTimeout(injectQuestionIntoPage, 300);
        }
        
    } catch (error) {
        // Ignore storage errors
    }
}

// Initialize when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}

// Reset injection flag on page navigation
window.addEventListener('beforeunload', () => {
    injectionProcessed = false;
});

// Reset injection flag periodically
setInterval(() => {
    if (injectionProcessed) {
        injectionProcessed = false;
    }
}, 30000);
