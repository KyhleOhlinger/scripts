// Optimized background service worker
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.clear();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    try {
        if (message.action === 'openPlatformWithQuery') {
            // Handle both 'question' and 'query' parameters for consistency
            const query = message.question || message.query;
            const source = message.source || 'extension_popup';
            
            handleOpenPlatformWithQuery(message.platform, query, source)
                .then(() => {
                    sendResponse({ success: true });
                })
                .catch(error => {
                    sendResponse({ success: false, error: error.message });
                });
            return true; // Keep message channel open for async response
        }
        
        // Unknown action
        sendResponse({ success: false, error: 'Unknown action' });
    } catch (error) {
        sendResponse({ success: false, error: error.message });
    }
});

async function handleOpenPlatformWithQuery(platform, query, source = 'extension_popup') {
    const urls = {
        chatgpt: 'https://chat.openai.com/',
        gemini: 'https://gemini.google.com/'
    };
    
    const url = urls[platform];
    if (!url) throw new Error(`Unknown platform: ${platform}`);
    
    // Clear all storage first to prevent any stale data
    await chrome.storage.local.clear();
    
    // Create unique data with ID to prevent race conditions
    const storageData = {
        'quickai_prefilled_query': query,
        'quickai_source': source,
        'quickai_target_platform': platform,
        'quickai_timestamp': Date.now(),
        'quickai_session_id': Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    };
    
    // Wait a moment to ensure clear completed, then set fresh data
    await new Promise(resolve => setTimeout(resolve, 10));
    await chrome.storage.local.set(storageData);
    
    // Create new tab
    return chrome.tabs.create({
        url: url,
        active: true
    });
}
