# Smart AI Query Helper 🤖

A powerful Chrome extension that streamlines your workflow by instantly sending questions to ChatGPT or Google Gemini with seamless auto-injection and Google search integration.

## Installation

### Quick Setup (Recommended)

1. **Open Chrome Extensions**: Navigate to `chrome://extensions/`
2. **Enable Developer Mode**: Toggle the switch in the top-right corner
3. **Load Extension**: Click "Load unpacked" and select this folder
4. **Pin to Toolbar**: Click the puzzle icon and pin the extension

### Alternative: Manual Package

1. Go to `chrome://extensions/`
2. Click "Pack extension" and select this folder
3. Install the generated `.crx` file

## Usage Guide

### Method 1: Extension Popup

1. **Click the extension icon** in your Chrome toolbar
2. **Type your question** in the text area
3. **Select AI platform**: ChatGPT or Gemini
4. **Submit**: Click "Send Question" or press `Ctrl/Cmd + Enter`
5. **Auto-injection**: Your question appears automatically in the AI platform

### Method 2: Google Search Integration

1. **Go to Google.com** and enter a search query
2. **Click the "🤖 AI" button** that appears in the search box
3. **Choose platform** from the popup selector
4. **Instant redirect**: Your search becomes an AI conversation

### Method 3: Quick Keyboard Access

- **`Alt/Cmd + Enter`**: While typing in Google search - shows AI platform selector
- **`Ctrl/Cmd + Enter`**: In extension popup - submits the question
- **`Escape`**: Closes the extension popup

## Technical Architecture

### File Structure
```
send_to_gpt_extension/
├── manifest.json         # Extension configuration & permissions
├── popup.html            # Main UI structure
├── popup.js              # UI logic & form handling
├── styles.css            # Modern styling & animations  
├── background.js         # Service worker & tab management
├── content.js            # Unified injection & Google integration
├── icons/                # Extension icons (16, 32, 48, 128px)
└── README.md             # Documentation
```

### Core Components

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| **Background Script** | Tab management & storage | Session-based data handling |
| **Content Script** | Injection & Google UI | Unified platform support |
| **Popup Interface** | User interaction | Auto-save & smart prefilling |

### Platform Support

| Platform | URL Pattern | Injection Method | 
|----------|-------------|------------------|
| **ChatGPT** | `chat.openai.com/*` | Textarea targeting | 
| **Gemini** | `gemini.google.com/*` | ContentEditable injection | 
| **Google** | `www.google.com/*` | Search integration | 


### Required Permissions
```json
{
  "permissions": ["activeTab", "scripting", "storage", "clipboardWrite"],
  "host_permissions": [
    "https://chat.openai.com/*",
    "https://gemini.google.com/*", 
    "https://www.google.com/*"
  ]
}
```

### Customization Points

#### Adding New AI Platforms
```javascript
// In popup.js - Add platform URL
const PLATFORM_URLS = {
    chatgpt: 'https://chat.openai.com/',
    gemini: 'https://gemini.google.com/',
    newplatform: 'https://new-ai-platform.com/' // Add here
};

// In content.js - Add injection selectors
if (url.includes('new-ai-platform.com')) {
    selectors = ['textarea[placeholder*="Ask"]', /* add selectors */];
}
```