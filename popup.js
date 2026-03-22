// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab).classList.add('active');
  });
});

// Bookmark management
document.getElementById('saveBookmark').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  await chrome.bookmarks.create({
    title: tab.title,
    url: tab.url
  });
  loadBookmarks();
  alert('书签已保存！');
});

async function loadBookmarks() {
  const bookmarks = await chrome.bookmarks.getTree();
  const list = document.getElementById('bookmark-list');
  list.innerHTML = '';
  
  function renderNodes(nodes) {
    nodes.forEach(node => {
      if (node.url) {
        const div = document.createElement('div');
        div.className = 'bookmark-item';
        div.textContent = node.title;
        div.onclick = () => chrome.tabs.create({ url: node.url });
        list.appendChild(div);
      }
      if (node.children) renderNodes(node.children);
    });
  }
  renderNodes(bookmarks);
}

loadBookmarks();

// Extract page capabilities
document.getElementById('extractContent').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const capabilities = {
        title: document.title,
        description: document.querySelector('meta[name="description"]')?.content || '',
        keywords: document.querySelector('meta[name="keywords"]')?.content || '',
        ogImage: document.querySelector('meta[property="og:image"]')?.content || '',
        links: Array.from(document.querySelectorAll('a')).slice(0, 10).map(a => ({
          text: a.innerText?.slice(0, 50),
          href: a.href
        })),
        images: Array.from(document.images).slice(0, 5).map(img => ({
          src: img.src,
          alt: img.alt
        })),
        scripts: Array.from(document.scripts).map(s => s.src).filter(s => s),
        forms: document.forms.length,
        iframes: document.getElementsByTagName('iframe').length
      };
      return capabilities;
    }
  });

  document.getElementById('extractResult').textContent = 
    JSON.stringify(results[0].result, null, 2);
});

// Load saved API key on startup
chrome.storage.local.get(['minimaxApiKey'], (result) => {
  if (result.minimaxApiKey) {
    document.getElementById('apiKey').value = result.minimaxApiKey;
  }
});

// Save API key when user types
document.getElementById('apiKey').addEventListener('change', (e) => {
  chrome.storage.local.set({ minimaxApiKey: e.target.value });
});

// AI Summarize (MiniMax)
document.getElementById('summarize').addEventListener('click', async () => {
  const apiKey = document.getElementById('apiKey').value;
  if (!apiKey) {
    alert('请输入 API Key');
    return;
  }
  
  // Auto-save for next time
  chrome.storage.local.set({ minimaxApiKey: apiKey });

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => document.body.innerText.slice(0, 3000)
  });

  const content = results[0].result;
  document.getElementById('summaryResult').textContent = '正在总结...';

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

    const data = await response.json();
    document.getElementById('summaryResult').textContent = 
      data.choices?.[0]?.message?.content || JSON.stringify(data);
  } catch (e) {
    document.getElementById('summaryResult').textContent = '错误: ' + e.message;
  }
});

// Listen for messages from background (context menu)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.summary) {
    alert('📝 AI 总结：\n\n' + request.summary);
  }
  if (request.error) {
    alert('❌ 错误：' + request.error);
  }
});
