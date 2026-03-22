// Inject floating panel into page
(function() {
  const data = arguments[0];
  
  // Remove existing panel if any
  const existing = document.getElementById('ai-summary-floating');
  if (existing) existing.remove();
  
  // Create floating panel
  const panel = document.createElement('div');
  panel.id = 'ai-summary-floating';
  panel.className = 'show';
  
  // Add CSS
  const style = document.createElement('style');
  style.textContent = `
    #ai-summary-floating {
      position: fixed;
      top: 20px;
      right: 20px;
      width: 360px;
      max-height: 400px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      overflow: hidden;
    }
    .floating-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: #4285f4;
      color: white;
    }
    .floating-header h3 { margin: 0; font-size: 14px; font-weight: 600; }
    .floating-close {
      background: none;
      border: none;
      color: white;
      font-size: 20px;
      cursor: pointer;
      padding: 0;
      line-height: 1;
    }
    .floating-content {
      padding: 16px;
      max-height: 320px;
      overflow-y: auto;
      font-size: 14px;
      line-height: 1.6;
      color: #333;
    }
    .floating-error {
      padding: 16px;
      color: #d32f2f;
      background: #ffebee;
    }
  `;
  panel.appendChild(style);
  
  // Header
  const header = document.createElement('div');
  header.className = 'floating-header';
  header.innerHTML = '<h3>🤖 AI 总结</h3><button class="floating-close" onclick="this.closest(\'#ai-summary-floating\').remove()">×</button>';
  panel.appendChild(header);
  
  // Content
  const content = document.createElement('div');
  content.className = 'floating-content';
  
  if (data.type === 'summary') {
    content.textContent = data.content;
  } else if (data.type === 'error') {
    content.className = 'floating-error';
    content.textContent = '错误: ' + data.content;
  }
  
  panel.appendChild(content);
  
  // Auto-close after 30 seconds
  setTimeout(() => {
    if (panel.parentNode) panel.remove();
  }, 30000);
  
  document.body.appendChild(panel);
})();
