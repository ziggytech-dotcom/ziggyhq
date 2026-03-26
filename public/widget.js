;(function () {
  'use strict'

  const script = document.currentScript || document.querySelector('script[data-key]')
  if (!script) return

  const orgKey = script.getAttribute('data-key')
  const apiBase = script.src.replace('/widget.js', '')
  if (!orgKey) return

  // Inject styles
  const style = document.createElement('style')
  style.textContent = `
    #ziggy-widget-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9998;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: #ff006e;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 24px rgba(255,0,110,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    #ziggy-widget-btn:hover {
      transform: scale(1.08);
      box-shadow: 0 6px 32px rgba(255,0,110,0.5);
    }
    #ziggy-widget-btn svg { width: 24px; height: 24px; }
    #ziggy-widget-overlay {
      position: fixed;
      inset: 0;
      z-index: 9998;
      background: rgba(0,0,0,0.5);
      opacity: 0;
      transition: opacity 0.25s;
      pointer-events: none;
    }
    #ziggy-widget-overlay.open {
      opacity: 1;
      pointer-events: auto;
    }
    #ziggy-widget-panel {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
      width: 360px;
      max-width: calc(100vw - 32px);
      background: #1a1a1a;
      border: 1px solid #2d2d2d;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.6);
      transform: translateY(20px) scale(0.95);
      opacity: 0;
      pointer-events: none;
      transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s;
    }
    #ziggy-widget-panel.open {
      transform: translateY(0) scale(1);
      opacity: 1;
      pointer-events: auto;
    }
    .zw-header {
      background: #ff006e;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .zw-header-title { color: #fff; font-size: 15px; font-weight: 700; }
    .zw-header-sub { color: rgba(255,255,255,0.8); font-size: 12px; margin-top: 2px; }
    .zw-close { background: none; border: none; cursor: pointer; color: rgba(255,255,255,0.8); padding: 4px; }
    .zw-close svg { width: 20px; height: 20px; }
    .zw-body { padding: 20px; }
    .zw-field { margin-bottom: 14px; }
    .zw-label { display: block; font-size: 12px; color: #b3b3b3; margin-bottom: 6px; font-family: sans-serif; }
    .zw-input {
      width: 100%; box-sizing: border-box;
      padding: 10px 12px;
      background: #0a0a0a;
      border: 1px solid #2d2d2d;
      border-radius: 8px;
      color: #ededed;
      font-size: 14px;
      font-family: sans-serif;
      outline: none;
      transition: border-color 0.15s;
    }
    .zw-input:focus { border-color: #ff006e; }
    .zw-radio-group { display: flex; gap: 8px; flex-wrap: wrap; }
    .zw-radio-item {
      display: flex; align-items: center; gap: 6px;
      padding: 6px 12px;
      border: 1px solid #2d2d2d;
      border-radius: 20px;
      cursor: pointer;
      font-size: 12px;
      color: #b3b3b3;
      font-family: sans-serif;
      transition: all 0.15s;
      background: transparent;
    }
    .zw-radio-item.selected { border-color: #ff006e; color: #ff006e; background: rgba(255,0,110,0.08); }
    .zw-radio-item input { display: none; }
    .zw-submit {
      width: 100%; padding: 12px;
      background: #ff006e;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      font-family: sans-serif;
      transition: background 0.15s;
      margin-top: 4px;
    }
    .zw-submit:hover { background: rgba(255,0,110,0.9); }
    .zw-submit:disabled { opacity: 0.6; cursor: not-allowed; }
    .zw-success { text-align: center; padding: 32px 20px; }
    .zw-success-icon { font-size: 40px; margin-bottom: 12px; }
    .zw-success-title { color: #fff; font-size: 16px; font-weight: 700; font-family: sans-serif; margin-bottom: 6px; }
    .zw-success-sub { color: #b3b3b3; font-size: 13px; font-family: sans-serif; }
    .zw-error { color: #ff006e; font-size: 12px; margin-top: 8px; font-family: sans-serif; }
    @media (max-width: 480px) {
      #ziggy-widget-panel { bottom: 0; right: 0; left: 0; max-width: 100%; border-radius: 16px 16px 0 0; }
      #ziggy-widget-btn { bottom: 20px; right: 16px; }
    }
  `
  document.head.appendChild(style)

  // Build DOM
  const overlay = document.createElement('div')
  overlay.id = 'ziggy-widget-overlay'
  document.body.appendChild(overlay)

  const btn = document.createElement('button')
  btn.id = 'ziggy-widget-btn'
  btn.innerHTML = '<svg fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>'
  btn.setAttribute('aria-label', 'Open contact form')
  document.body.appendChild(btn)

  const panel = document.createElement('div')
  panel.id = 'ziggy-widget-panel'
  panel.setAttribute('role', 'dialog')
  panel.setAttribute('aria-label', 'Contact form')
  panel.innerHTML = `
    <div class="zw-header">
      <div>
        <div class="zw-header-title">Get in Touch</div>
        <div class="zw-header-sub">We'll get back to you shortly</div>
      </div>
      <button class="zw-close" id="ziggy-widget-close" aria-label="Close">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>
    <div class="zw-body" id="ziggy-widget-body">
      <form id="ziggy-widget-form" novalidate>
        <div class="zw-field">
          <label class="zw-label" for="zw-name">Full Name *</label>
          <input class="zw-input" id="zw-name" name="full_name" placeholder="Jane Smith" required autocomplete="name" />
        </div>
        <div class="zw-field">
          <label class="zw-label" for="zw-email">Email</label>
          <input class="zw-input" id="zw-email" name="email" type="email" placeholder="jane@example.com" autocomplete="email" />
        </div>
        <div class="zw-field">
          <label class="zw-label" for="zw-phone">Phone</label>
          <input class="zw-input" id="zw-phone" name="phone" type="tel" placeholder="(702) 555-1234" autocomplete="tel" />
        </div>
        <div class="zw-field">
          <label class="zw-label">I'm looking to</label>
          <div class="zw-radio-group" id="zw-intent-group">
            <label class="zw-radio-item" data-value="Buy">
              <input type="radio" name="intent" value="Buy"> Buy
            </label>
            <label class="zw-radio-item" data-value="Sell">
              <input type="radio" name="intent" value="Sell"> Sell
            </label>
            <label class="zw-radio-item" data-value="Both">
              <input type="radio" name="intent" value="Both"> Both
            </label>
          </div>
        </div>
        <div class="zw-field">
          <label class="zw-label" for="zw-price">Price Range</label>
          <select class="zw-input" id="zw-price" name="price_range">
            <option value="">Select range</option>
            <option value="under_300k">Under $300K</option>
            <option value="300k_500k">$300K – $500K</option>
            <option value="500k_750k">$500K – $750K</option>
            <option value="750k_1m">$750K – $1M</option>
            <option value="over_1m">Over $1M</option>
          </select>
        </div>
        <div class="zw-field">
          <label class="zw-label" for="zw-message">Message</label>
          <textarea class="zw-input" id="zw-message" name="message" rows="2" placeholder="Tell us what you're looking for..."></textarea>
        </div>
        <div class="zw-error" id="zw-error" style="display:none"></div>
        <button class="zw-submit" type="submit" id="zw-submit">Send Message</button>
      </form>
    </div>
  `
  document.body.appendChild(panel)

  // Radio selection
  const intentGroup = panel.querySelector('#zw-intent-group')
  if (intentGroup) {
    intentGroup.querySelectorAll('.zw-radio-item').forEach((item) => {
      item.addEventListener('click', () => {
        intentGroup.querySelectorAll('.zw-radio-item').forEach((el) => el.classList.remove('selected'))
        item.classList.add('selected')
        const inp = item.querySelector('input')
        if (inp) inp.checked = true
      })
    })
  }

  function openPanel() {
    panel.classList.add('open')
    overlay.classList.add('open')
    btn.style.display = 'none'
  }
  function closePanel() {
    panel.classList.remove('open')
    overlay.classList.remove('open')
    btn.style.display = ''
  }

  btn.addEventListener('click', openPanel)
  overlay.addEventListener('click', closePanel)
  const closeBtn = panel.querySelector('#ziggy-widget-close')
  if (closeBtn) closeBtn.addEventListener('click', closePanel)

  const form = panel.querySelector('#ziggy-widget-form')
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      const data = new FormData(form)
      const payload = {
        org_key: orgKey,
        full_name: data.get('full_name'),
        email: data.get('email'),
        phone: data.get('phone'),
        intent: data.get('intent'),
        price_range: data.get('price_range'),
        message: data.get('message'),
      }
      if (!payload.full_name) {
        const err = panel.querySelector('#zw-error')
        if (err) { err.textContent = 'Please enter your name.'; err.style.display = 'block' }
        return
      }
      const submitBtn = panel.querySelector('#zw-submit')
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending...' }
      const errEl = panel.querySelector('#zw-error')
      if (errEl) errEl.style.display = 'none'

      try {
        const res = await fetch(`${apiBase}/api/widget/lead`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          const body = panel.querySelector('#ziggy-widget-body')
          if (body) {
            body.innerHTML = `
              <div class="zw-success">
                <div class="zw-success-icon">✅</div>
                <div class="zw-success-title">Message Sent!</div>
                <div class="zw-success-sub">Thanks ${payload.full_name}! We'll be in touch shortly.</div>
              </div>
            `
          }
        } else {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Send Message' }
          if (errEl) { errEl.textContent = 'Something went wrong. Please try again.'; errEl.style.display = 'block' }
        }
      } catch {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Send Message' }
        if (errEl) { errEl.textContent = 'Network error. Please try again.'; errEl.style.display = 'block' }
      }
    })
  }
})()
