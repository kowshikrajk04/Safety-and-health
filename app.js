/**
 * SafePulse AI – app.js
 *
 * AWS Integration Points:
 *  - AI_LAMBDA_ENDPOINT  : Replace with API Gateway URL → AWS Lambda (AI chat responses)
 *  - PROFILE_API         : Replace with API Gateway URL → AWS Lambda + DynamoDB (user profile storage)
 *  - SNS_ALERT_ENDPOINT  : Replace with API Gateway URL → AWS Lambda + SNS (emergency SMS alerts)
 *  - LOCATION_API        : Replace with API Gateway URL → AWS Lambda + Location Service (safe routes)
 */

// ─── AUTH ────────────────────────────────────────────────────────────────────
const AUTH_KEY = 'sp_auth';

function getAuthUser() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY)); } catch { return null; }
}

function setAuthUser(user) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
}

/** Call on every protected page to redirect unauthenticated users. */
function requireAuth() {
  if (!getAuthUser()) {
    location.replace('login.html');
  }
}

function logout() {
  clearAuth();
  location.replace('login.html');
}

// ─── NAV ────────────────────────────────────────────────────────────────────
(function initNav() {
  const hamburger = document.querySelector('.hamburger');
  const navLinks  = document.querySelector('.nav-links');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
  }
  // Mark active link
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    if (a.getAttribute('href') === path) a.classList.add('active');
  });

  // Show logged-in user label and wire logout button
  const user = getAuthUser();
  const userLabel = document.getElementById('navUserLabel');
  if (userLabel && user) userLabel.textContent = user.username || user.email;
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', logout);
})();

// ─── UTILS ──────────────────────────────────────────────────────────────────
function timestamp() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function showAlert(containerId, message, type = 'info') {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `<div class="alert alert-${type}"><span>${message}</span></div>`;
  setTimeout(() => { el.innerHTML = ''; }, 5000);
}

// ─── HOME PAGE ───────────────────────────────────────────────────────────────
function initHome() {
  if (!document.getElementById('healthScoreValue')) return;

  // Animate health score counter
  const scoreEl = document.getElementById('healthScoreValue');
  const target  = 78;
  let current   = 0;
  const step    = () => {
    current = Math.min(current + 2, target);
    scoreEl.textContent = current;
    if (current < target) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);

  // Animate progress bars
  document.querySelectorAll('[data-progress]').forEach(bar => {
    setTimeout(() => { bar.style.width = bar.dataset.progress + '%'; }, 300);
  });
}

// ─── EMERGENCY DASHBOARD ─────────────────────────────────────────────────────
function initEmergency() {
  if (!document.getElementById('sosBtn')) return;

  const sosBtn    = document.getElementById('sosBtn');
  const alertLog  = document.getElementById('alertLog');
  const locStatus = document.getElementById('locStatus');

  // SOS
  sosBtn.addEventListener('click', triggerSOS);

  function triggerSOS() {
    const entry = document.createElement('div');
    entry.className = 'alert alert-danger';
    entry.innerHTML = `<span>🚨 SOS triggered at ${timestamp()} — notifying emergency contacts</span>`;
    alertLog.prepend(entry);

    // AWS SNS_ALERT_ENDPOINT integration point
    // fetch(SNS_ALERT_ENDPOINT, { method: 'POST', body: JSON.stringify({ type: 'SOS', time: new Date() }) });

    getLocation();
  }

  // Geolocation
  function getLocation() {
    if (!navigator.geolocation) {
      locStatus.textContent = 'Geolocation not supported by this browser.';
      return;
    }
    locStatus.textContent = 'Acquiring location…';
    navigator.geolocation.getCurrentPosition(
      pos => {
        locStatus.textContent = `📍 Lat: ${pos.coords.latitude.toFixed(5)}, Lng: ${pos.coords.longitude.toFixed(5)}`;
      },
      () => {
        locStatus.textContent = '⚠️ Location permission denied. Enable location access to share coordinates.';
      }
    );
  }

  document.getElementById('shareLocBtn')?.addEventListener('click', getLocation);

  // Emergency contacts – localStorage persistence
  loadContacts();

  document.getElementById('addContactBtn')?.addEventListener('click', () => {
    const name  = document.getElementById('contactName').value.trim();
    const phone = document.getElementById('contactPhone').value.trim();
    if (!name || !phone) return;
    const contacts = getContacts();
    contacts.push({ name, phone });
    saveContacts(contacts);
    renderContacts();
    document.getElementById('contactName').value  = '';
    document.getElementById('contactPhone').value = '';
  });

  function getContacts() {
    return JSON.parse(localStorage.getItem('sp_contacts') || '[]');
  }
  function saveContacts(c) { localStorage.setItem('sp_contacts', JSON.stringify(c)); }
  function loadContacts() {
    const contacts = getContacts();
    if (contacts.length === 0) {
      saveContacts([
        { name: 'Guardian – [Name]', phone: '+1-555-0100' },
        { name: 'Doctor – [Name]',   phone: '+1-555-0101' },
        { name: 'Neighbour – [Name]',phone: '+1-555-0102' }
      ]);
    }
    renderContacts();
  }
  function renderContacts() {
    const list = document.getElementById('contactList');
    if (!list) return;
    list.innerHTML = getContacts().map((c, i) => `
      <div class="card" style="display:flex;align-items:center;justify-content:space-between;padding:0.85rem 1.1rem;">
        <div>
          <div style="font-weight:600">${c.name}</div>
          <div style="color:var(--cyan);font-size:0.85rem">${c.phone}</div>
        </div>
        <button class="btn btn-sm btn-outline" onclick="removeContact(${i})">Remove</button>
      </div>`).join('');
  }
  window.removeContact = (i) => {
    const c = getContacts(); c.splice(i, 1); saveContacts(c); renderContacts();
  };

  // Fake call
  const overlay = document.getElementById('fakeCallOverlay');
  document.getElementById('fakeCallBtn')?.addEventListener('click', () => {
    overlay?.classList.add('show');
  });
  document.getElementById('declineCallBtn')?.addEventListener('click', () => {
    overlay?.classList.remove('show');
  });

  // Safe route
  document.getElementById('safeRouteBtn')?.addEventListener('click', () => {
    const el = document.getElementById('routeStatus');
    if (!el) return;
    el.textContent = 'Calculating safe route…';
    setTimeout(() => {
      el.textContent = '✅ Safe route found: Via Main St → Park Ave → Hospital Rd (2.4 km, ~6 min)';
      // AWS LOCATION_API integration point
      // fetch(LOCATION_API, { method: 'POST', body: JSON.stringify({ origin: locStatus.textContent }) })
      //   .then(r => r.json()).then(d => { el.textContent = d.route; });
    }, 1500);
  });

  // Voice trigger (Web Speech API)
  if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.continuous = true;
    recognition.onresult = (e) => {
      const transcript = e.results[e.results.length - 1][0].transcript.toLowerCase();
      if (transcript.includes('help')) triggerSOS();
    };
    document.getElementById('voiceBtn')?.addEventListener('click', () => {
      recognition.start();
      showAlert('voiceAlert', '🎙️ Listening… say "help" to trigger SOS', 'info');
    });
  } else {
    const vb = document.getElementById('voiceBtn');
    if (vb) { vb.disabled = true; vb.title = 'Speech recognition not supported'; }
  }
}

// ─── HEALTH DASHBOARD ────────────────────────────────────────────────────────
function initHealth() {
  if (!document.getElementById('heartRate')) return;

  // Simulate live heart rate
  const hrEl = document.getElementById('heartRate');
  setInterval(() => {
    hrEl.textContent = Math.floor(Math.random() * 20 + 65);
  }, 2000);

  // Water tracker
  let cups = parseInt(localStorage.getItem('sp_cups') || '0');
  const cupsEl = document.getElementById('cupsCount');
  const cupsBar = document.getElementById('cupsBar');
  function updateCups() {
    if (cupsEl) cupsEl.textContent = cups;
    if (cupsBar) cupsBar.style.width = Math.min((cups / 8) * 100, 100) + '%';
    localStorage.setItem('sp_cups', cups);
  }
  updateCups();
  document.getElementById('addCupBtn')?.addEventListener('click', () => {
    if (cups < 8) { cups++; updateCups(); }
  });

  // Steps
  const steps = Math.floor(Math.random() * 4000 + 5000);
  const stepsEl = document.getElementById('stepCount');
  const stepsBar = document.getElementById('stepsBar');
  if (stepsEl) stepsEl.textContent = steps.toLocaleString();
  if (stepsBar) stepsBar.style.width = Math.min((steps / 10000) * 100, 100) + '%';

  // Sleep
  const sleepEl = document.getElementById('sleepHours');
  const sleepBar = document.getElementById('sleepBar');
  const sleep = (Math.random() * 3 + 5).toFixed(1);
  if (sleepEl) sleepEl.textContent = sleep;
  if (sleepBar) sleepBar.style.width = Math.min((sleep / 8) * 100, 100) + '%';

  // Mood tracker
  const moodSuggestions = {
    Happy:    '😊 Keep it up! A 20-min walk will amplify your positive energy.',
    Calm:     '🧘 Great state for deep work. Try a 5-min meditation to maintain it.',
    Anxious:  '💨 Try box breathing: inhale 4s, hold 4s, exhale 4s, hold 4s. Repeat 4×.',
    Sad:      '🌤️ Reach out to someone you trust. Light exercise can lift your mood.',
    Energetic:'⚡ Channel that energy! Great time for a workout or creative project.'
  };
  document.querySelectorAll('.mood-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tip = document.getElementById('moodTip');
      if (tip) tip.textContent = moodSuggestions[btn.dataset.mood] || '';
    });
  });

  // Health chart (canvas)
  drawHealthChart();
}

function drawHealthChart() {
  const canvas = document.getElementById('healthChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width  = canvas.offsetWidth || 600;
  canvas.height = 200;

  const days  = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const steps = [6200, 8100, 7400, 9300, 5800, 10200, 7800];
  const max   = 12000;
  const pad   = { top: 20, right: 20, bottom: 40, left: 50 };
  const w     = canvas.width  - pad.left - pad.right;
  const h     = canvas.height - pad.top  - pad.bottom;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth   = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (h / 4) * i;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + w, y); ctx.stroke();
  }

  // Gradient fill
  const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + h);
  grad.addColorStop(0, 'rgba(10,102,255,0.4)');
  grad.addColorStop(1, 'rgba(10,102,255,0)');

  const pts = steps.map((s, i) => ({
    x: pad.left + (w / (days.length - 1)) * i,
    y: pad.top  + h - (s / max) * h
  }));

  // Area
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pad.top + h);
  pts.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(pts[pts.length - 1].x, pad.top + h);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.beginPath();
  pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.strokeStyle = '#0A66FF';
  ctx.lineWidth   = 2.5;
  ctx.stroke();

  // Dots
  pts.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fillStyle   = '#00C2FF';
    ctx.fill();
  });

  // X labels
  ctx.fillStyle  = 'rgba(255,255,255,0.4)';
  ctx.font       = '12px Segoe UI, sans-serif';
  ctx.textAlign  = 'center';
  days.forEach((d, i) => {
    ctx.fillText(d, pts[i].x, canvas.height - 8);
  });

  // Y label
  ctx.textAlign = 'right';
  ctx.fillText('Steps', pad.left - 6, pad.top + 4);
}

// ─── AI ASSISTANT ────────────────────────────────────────────────────────────
function initAssistant() {
  const messagesEl = document.getElementById('chatMessages');
  const inputEl    = document.getElementById('chatInput');
  const sendBtn    = document.getElementById('sendBtn');
  if (!messagesEl) return;

  const responses = {
    'i am in danger': `🚨 <strong>Emergency detected.</strong><br>
      1. Call emergency services immediately: <strong>911</strong><br>
      2. <a href="emergency.html">Open Emergency Dashboard</a> and press SOS.<br>
      3. Share your location with a trusted contact.<br>
      4. Stay in a visible, public area if possible.`,
    'i feel anxious': `💨 <strong>Breathing exercise for anxiety:</strong><br>
      Box Breathing — inhale 4s → hold 4s → exhale 4s → hold 4s. Repeat 4 times.<br>
      <a href="health.html">Visit Health Dashboard</a> for more wellness tools.`,
    'find nearest hospital': `🏥 <strong>Nearby Hospitals (simulated):</strong><br>
      • City General Hospital — 0.8 km — 📞 +1-555-2000<br>
      • St. Mary's Medical Center — 1.4 km — 📞 +1-555-2100<br>
      • Riverside Clinic — 2.1 km — 📞 +1-555-2200<br>
      <a href="emergency.html">Open Emergency Dashboard</a> for full details.`,
    'give breathing exercises': `🧘 <strong>Breathing Exercises:</strong><br>
      <strong>1. Box Breathing:</strong> Inhale 4s → Hold 4s → Exhale 4s → Hold 4s<br>
      <strong>2. 4-7-8 Technique:</strong> Inhale 4s → Hold 7s → Exhale 8s<br>
      <strong>3. Diaphragmatic:</strong> Breathe deep into belly, not chest. 5 min daily.<br>
      Repeat each 4–6 cycles for best effect.`
  };

  function addMessage(text, role) {
    const div = document.createElement('div');
    div.className = `chat-bubble ${role}`;
    div.innerHTML = `<div>${text}</div><div class="ts">${timestamp()}</div>`;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function handleInput(raw) {
    const msg = raw.trim();
    if (!msg) return;
    addMessage(msg, 'user');
    const key = msg.toLowerCase();

    // AWS AI_LAMBDA_ENDPOINT integration point
    // fetch(AI_LAMBDA_ENDPOINT, { method:'POST', body: JSON.stringify({ message: msg }) })
    //   .then(r => r.json()).then(d => addMessage(d.reply, 'ai'));

    const reply = responses[key] ||
      `I'm here to help. Try asking:<br>
       • "I am in danger"<br>
       • "I feel anxious"<br>
       • "Find nearest hospital"<br>
       • "Give breathing exercises"`;
    setTimeout(() => addMessage(reply, 'ai'), 600);
  }

  sendBtn?.addEventListener('click', () => {
    handleInput(inputEl.value);
    inputEl.value = '';
  });
  inputEl?.addEventListener('keydown', e => {
    if (e.key === 'Enter') { handleInput(inputEl.value); inputEl.value = ''; }
  });

  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => handleInput(chip.textContent));
  });

  // Welcome message
  addMessage('👋 Hi! I\'m SafePulse AI. Ask me about emergencies, health tips, or nearby hospitals.', 'ai');
}

// ─── PROFILE PAGE ────────────────────────────────────────────────────────────
function initProfile() {
  const form = document.getElementById('profileForm');
  if (!form) return;

  const fields = ['fullName','bloodGroup','allergies','medNotes','guardianName','guardianPhone',
                  'guardianRel','doctorName','doctorPhone','emergency1','emergency2'];

  // Load saved data
  const saved = JSON.parse(localStorage.getItem('sp_profile') || '{}');
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el && saved[id]) el.value = saved[id];
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    let valid = true;

    // Validate required fields
    ['fullName','bloodGroup'].forEach(id => {
      const el  = document.getElementById(id);
      const err = document.getElementById(id + 'Error');
      if (!el.value.trim()) {
        if (err) err.classList.add('show');
        valid = false;
      } else {
        if (err) err.classList.remove('show');
      }
    });

    if (!valid) return;

    const data = {};
    fields.forEach(id => {
      const el = document.getElementById(id);
      if (el) data[id] = el.value;
    });
    localStorage.setItem('sp_profile', JSON.stringify(data));

    // AWS PROFILE_API integration point
    // fetch(PROFILE_API, { method:'PUT', body: JSON.stringify(data) });

    showAlert('profileAlert', '✅ Profile saved successfully!', 'success');
  });
}

// ─── INIT ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const page = location.pathname.split('/').pop() || 'index.html';

  // Login page: handle tab switching and form submissions
  if (page === 'login.html' || page === '') {
    initLoginPage();
    return; // no auth guard on login page
  }

  // All other pages require authentication
  requireAuth();

  initHome();
  initEmergency();
  initHealth();
  initAssistant();
  initProfile();
});

// ─── LOGIN PAGE ──────────────────────────────────────────────────────────────
function initLoginPage() {
  // If already logged in, skip straight to home
  if (getAuthUser()) { location.replace('index.html'); return; }

  const tabLogin   = document.getElementById('tabLogin');
  const tabSignup  = document.getElementById('tabSignup');
  const formLogin  = document.getElementById('formLogin');
  const formSignup = document.getElementById('formSignup');
  if (!tabLogin) return;

  function switchTab(tab) {
    const isLogin = tab === 'login';
    tabLogin.classList.toggle('active', isLogin);
    tabSignup.classList.toggle('active', !isLogin);
    tabLogin.setAttribute('aria-selected', isLogin);
    tabSignup.setAttribute('aria-selected', !isLogin);
    formLogin.classList.toggle('active', isLogin);
    formSignup.classList.toggle('active', !isLogin);
    document.getElementById('authAlert').innerHTML = '';
  }

  tabLogin.addEventListener('click',  () => switchTab('login'));
  tabSignup.addEventListener('click', () => switchTab('signup'));
  document.getElementById('switchToSignup')?.addEventListener('click', () => switchTab('signup'));
  document.getElementById('switchToLogin')?.addEventListener('click',  () => switchTab('login'));

  // ── Sign In ──
  formLogin.addEventListener('submit', e => {
    e.preventDefault();
    const email    = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    let valid = true;

    const emailErr = document.getElementById('loginEmailError');
    const passErr  = document.getElementById('loginPasswordError');
    emailErr.classList.remove('show');
    passErr.classList.remove('show');

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      emailErr.classList.add('show'); valid = false;
    }
    if (!password) { passErr.classList.add('show'); valid = false; }
    if (!valid) return;

    // Check against stored accounts (demo: any registered account or fallback demo)
    const accounts = JSON.parse(localStorage.getItem('sp_accounts') || '[]');
    const match = accounts.find(a => a.email === email && a.password === password);

    if (!match && !(email === 'demo@safepulse.ai' && password === 'demo123')) {
      showAuthAlert('Invalid email or password. Try demo@safepulse.ai / demo123', 'danger');
      return;
    }

    const user = match || { email, username: 'Demo User' };
    setAuthUser({ email: user.email, username: user.username });
    location.replace('index.html');
  });

  // ── Sign Up ──
  formSignup.addEventListener('submit', e => {
    e.preventDefault();
    const username = document.getElementById('signupUsername').value.trim();
    const email    = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    let valid = true;

    document.getElementById('signupUsernameError').classList.remove('show');
    document.getElementById('signupEmailError').classList.remove('show');
    document.getElementById('signupPasswordError').classList.remove('show');

    if (!username) { document.getElementById('signupUsernameError').classList.add('show'); valid = false; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      document.getElementById('signupEmailError').classList.add('show'); valid = false;
    }
    if (password.length < 6) { document.getElementById('signupPasswordError').classList.add('show'); valid = false; }
    if (!valid) return;

    const accounts = JSON.parse(localStorage.getItem('sp_accounts') || '[]');
    if (accounts.find(a => a.email === email)) {
      showAuthAlert('An account with this email already exists.', 'danger');
      return;
    }

    accounts.push({ username, email, password });
    localStorage.setItem('sp_accounts', JSON.stringify(accounts));
    setAuthUser({ email, username });
    location.replace('index.html');
  });

  function showAuthAlert(msg, type) {
    const el = document.getElementById('authAlert');
    if (el) el.innerHTML = `<div class="alert alert-${type}" style="margin-bottom:1rem;">${msg}</div>`;
  }
}
