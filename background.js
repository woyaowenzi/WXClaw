// Background service worker
chrome.runtime.onInstalled.addListener(() => {
  console.log('abc-extension 已安装');
  
  // Create context menu
  chrome.contextMenus.create({
    id: 'aiSummarize',
    title: '🤖 AI 总结此页面',
    contexts: ['page', 'selection']
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'aiSummarize') {
    // Get page content
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => document.body.innerText.slice(0, 3000)
    });
    
    const content = results[0].result;
    
    // Get API key from storage
    const data = await chrome.storage.local.get(['minimaxApiKey']);
    const apiKey = data.minimaxApiKey;
    
    if (!apiKey) {
      chrome.tabs.sendMessage(tab.id, { error: '请先在插件中设置 API Key' });
      return;
    }
    
    // Call MiniMax API
    try {
      const response = await fetch('https://api.minimax.chat/v1/text/chatcompletion_v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'MiniMax-M2.5',
          messages: [{
            role: 'user',
            content: `请用50字总结以下网页内容：\n\n${content}`
          }]
        })
      });

      const result = await response.json();
      const summary = result.choices?.[0]?.message?.content || '总结失败';
      
      // Show floating panel via message to content script
      chrome.tabs.sendMessage(tab.id, { type: 'showFloating', data: { type: 'summary', content: summary } });
    } catch (e) {
      chrome.tabs.sendMessage(tab.id, { type: 'showFloating', data: { type: 'error', content: e.message } });
    }
  }
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getBookmarks') {
    chrome.bookmarks.getTree().then(sendResponse);
    return true;
  }
});
