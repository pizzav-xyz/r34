export class SettingsPanel {
  constructor(element, { onSave, onTest }) {
    this.element = element;
    this.onSave = onSave;
    this.onTest = onTest;
  }

  open({ apiKey = '', userId = '' } = {}) {
    this._render(apiKey, userId);
    this.element.querySelector('.dialog-backdrop').classList.add('open');
  }

  close() {
    this.element.querySelector('.dialog-backdrop')?.classList.remove('open');
  }

  _render(apiKey, userId) {
    this.element.innerHTML = `
      <div class="dialog-backdrop">
        <div class="dialog">
          <div class="dialog-header">
            <h2 class="dialog-title">Settings</h2>
            <button class="icon-btn" id="close-dialog" aria-label="Close">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
          <div class="dialog-body">
            <div class="field">
              <label for="inp-apikey">API Key</label>
              <input type="text" id="inp-apikey" placeholder="Enter your API key" value="${apiKey}">
            </div>
            <div class="field">
              <label for="inp-userid">User ID</label>
              <input type="text" id="inp-userid" placeholder="Enter your user ID" value="${userId}">
            </div>
            <div class="field-hint">
              Get credentials from <a href="https://rule34.xxx/index.php?page=account&s=options" target="_blank" rel="noopener">rule34.xxx account options</a>
            </div>
            <div id="settings-status" class="status-msg"></div>
          </div>
          <div class="dialog-actions">
            <button class="btn-text" id="btn-test">Test</button>
            <button class="btn-filled" id="btn-save">Save</button>
          </div>
        </div>
      </div>`;

    this.element.querySelector('#close-dialog').addEventListener('click', () => this.close());
    this.element.querySelector('.dialog-backdrop').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) this.close();
    });
    this.element.querySelector('#btn-save').addEventListener('click', () => {
      const key = this.element.querySelector('#inp-apikey').value.trim();
      const uid = this.element.querySelector('#inp-userid').value.trim();
      this.onSave(key, uid);
      this.close();
    });
    this.element.querySelector('#btn-test').addEventListener('click', async () => {
      const key = this.element.querySelector('#inp-apikey').value.trim();
      const uid = this.element.querySelector('#inp-userid').value.trim();
      const status = this.element.querySelector('#settings-status');
      status.className = 'status-msg show';
      status.textContent = 'Testing...';
      status.style.background = 'var(--md-surface-container-high)';
      status.style.color = 'var(--md-on-surface)';
      try {
        await this.onTest(key, uid);
        status.className = 'status-msg show success';
        status.textContent = 'Connection OK';
      } catch (err) {
        status.className = 'status-msg show error';
        status.textContent = err.message || 'Connection failed';
      }
    });
  }

  showStatus(msg, type) {
    const s = this.element.querySelector('#settings-status');
    if (!s) return;
    s.className = `status-msg show ${type}`;
    s.textContent = msg;
  }
}