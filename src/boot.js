const app = document.querySelector('#app');
function showError(error) {
  console.error('Game startup failed:', error);
  const panel = document.createElement('div');
  panel.style.cssText = 'position:fixed;inset:0;z-index:100;background:#14211b;color:#edf4de;display:grid;place-content:center;text-align:center;padding:24px;font:16px Arial';
  const title = document.createElement('h2'); title.textContent = 'Game could not load';
  const details = document.createElement('p'); details.textContent = error?.message || 'Please refresh or open the preview in a new tab.';
  const retry = document.createElement('button'); retry.textContent = 'RETRY'; retry.style.cssText = 'padding:16px;background:#c7ff5c;border:0;cursor:pointer'; retry.onclick = () => location.reload();
  panel.append(title, details, retry); app.replaceChildren(panel);
}
const timeout = setTimeout(() => {
  const status = document.querySelector('#boot-status p');
  if (status) status.textContent = 'Still loading… Check your connection and refresh if needed.';
}, 15000);
try { await import('./main.js'); } catch (error) { showError(error); } finally { clearTimeout(timeout); }
