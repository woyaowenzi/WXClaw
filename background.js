// Background service worker
chrome.runtime.onInstalled.addListener(() => {
  console.log('abc-extension 已安装');
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getBookmarks') {
    chrome.bookmarks.getTree().then(sendResponse);
    return true;
  }
});
