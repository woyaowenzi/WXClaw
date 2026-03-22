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
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => alert('请先在插件中设置 API Key')
      });
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
      
      // Inject floating panel directly
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (summaryText) => {
          const existing = document.getElementById('ai-summary-floating');
          if (existing) existing.remove();
          
          const panel = document.createElement('div');
          panel.id = 'ai-summary-floating';
          panel.style.cssText = 'position:fixed;top:20px;right:20px;width:360px;background:white;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.15);z-index:999999;font-family:-apple-system,sans-serif;';
          
          panel.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:#4285f4;color:white;border-radius:12px 12px 0 0;">
              <span style="font-weight:600;">🤖 AI 总结</span>
              <button onclick="this.closest('#ai-summary-floating').remove()" style="background:none;border:none;color:white;font-size:20px;cursor:pointer;">×</button>
            </div>
            <div style="padding:16px;font-size:14px;line-height:1.6;color:#333;max-height:320px;overflow-y:auto;">${summaryText}</div>
          `;
          
          document.body.appendChild(panel);
          setTimeout(() => panel.remove(), 30000);
        },
        args: [summary]
      });
    } catch (e) {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (errMsg) => alert('错误: ' + errMsg),
        args: [e.message]
      });
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
