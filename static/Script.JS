(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- Toast ---------- */
  const toast = $('#toast');
  let toastTimer;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
  }

  /* ---------- Theme ---------- */
  const root = document.documentElement;
  try { root.dataset.theme = localStorage.getItem('pm-theme') || 'light'; } catch { }
  $('#themeBtn').addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('pm-theme', root.dataset.theme); } catch { }
  });

  /* ---------- Rotating coach tips ---------- */
  const tips = [
    'Start every answer with the result, then explain how you got there.',
    'Practice 2 DSA problems daily. Consistency beats cramming.',
    'Keep your resume to one page. Lead with projects, not marks.',
    'In HR rounds, tell one real story per strength you claim.',
    'Ask the interviewer one smart question about the team at the end.'
  ];
  let t = 0; const tipEl = $('#tipText');
  setInterval(() => {
    tipEl.style.opacity = 0;
    setTimeout(() => { t = (t + 1) % tips.length; tipEl.textContent = tips[t]; tipEl.style.opacity = 1; }, 400);
  }, 5000);

  /* ---------- Tabs: Email / Mobile ---------- */
  const tabs = $('.tabs');
  $$('.tab').forEach(btn => btn.addEventListener('click', () => {
    const mode = btn.dataset.mode;
    tabs.dataset.mode = mode;
    $$('.tab').forEach(b => {
      const on = b === btn;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', on);
    });
    $('#emailForm').classList.toggle('hidden', mode !== 'email');
    $('#mobileForm').classList.toggle('hidden', mode !== 'mobile');
  }));

  /* ---------- Helpers ---------- */
  const setErr = (id, msg) => {
    $('#' + id).textContent = msg;
    const f = $('#' + id).previousElementSibling;
    if (f && f.classList.contains('field')) f.classList.toggle('bad', !!msg);
  };
  const busy = (btn, on, text) => {
    btn.classList.toggle('loading', on);
    if (text) btn.textContent = text;
  };
  const wait = ms => new Promise(r => setTimeout(r, ms));

  /* ---------- Email + Password ---------- */
 const pass = $('#pass');

$('#togglePass').addEventListener('click', e => {
    const show = pass.type === 'password';

    pass.type = show ? 'text' : 'password';

    e.target.textContent = show ? 'Hide' : 'Show';
});

  function strength(p) {
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
    if (/\d/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return p ? Math.max(s, 1) : 0;
  }
  pass.addEventListener('input', () => { $('#meter').dataset.s = strength(pass.value); });

 
// yahase hoga
$('#emailForm').addEventListener('submit', e => {

    const email = $('#email').value.trim();
    const password = $('#pass').value;

    let ok = true;

    if (!/^\S+@\S+\.\S+$/.test(email)) {
        setErr('emailErr', 'Enter a valid email address.');
        ok = false;
    } else {
        setErr('emailErr', '');
    }

    if (password.length < 6) {
        setErr('passErr', 'Password must be at least 6 characters.');
        ok = false;
    } else {
        setErr('passErr', '');
    }

    if (!ok) {
        e.preventDefault();
        return;
    }

    const btn = e.submitter || $('#emailForm .primary');

    busy(btn, true, 'Signing in...');

    // Valid hai → Django ko form submit hone do
});

  /* ---------- Mobile OTP ---------- */
  const phone = $('#phone'), otpWrap = $('#otpWrap'), mBtn = $('#mobileBtn');
  const boxes = $$('#otp input');
  let otpSent = false, countdown;

  phone.addEventListener('input', () => { phone.value = phone.value.replace(/\D/g, ''); });

  boxes.forEach((b, i) => {
    b.addEventListener('input', () => {
      b.value = b.value.replace(/\D/g, '');
      if (b.value && boxes[i + 1]) boxes[i + 1].focus();
    });
    b.addEventListener('keydown', e => { if (e.key === 'Backspace' && !b.value && boxes[i - 1]) boxes[i - 1].focus(); });
    b.addEventListener('paste', e => {
      const d = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
      if (!d) return;
      e.preventDefault();
      d.split('').forEach((c, k) => boxes[k].value = c);
      boxes[Math.min(d.length, 5)].focus();
    });
  });

  function startTimer() {
    const rb = $('#resend'); let s = 30;
    rb.disabled = true; clearInterval(countdown);
    rb.textContent = `Resend code in ${s}s`;
    countdown = setInterval(() => {
      s--;
      if (s <= 0) { clearInterval(countdown); rb.disabled = false; rb.textContent = 'Resend code'; }
      else rb.textContent = `Resend code in ${s}s`;
    }, 1000);
  }
  async function sendOtp() {
    busy(mBtn, true, 'Sending...');
    await wait(800);                       // TODO: call your SMS/OTP API (Firebase Phone Auth, Twilio, MSG91)
    busy(mBtn, false, 'Verify and sign in');
    otpSent = true;
    $('#sentTo').textContent = '+91 ' + phone.value;
    otpWrap.classList.remove('hidden');
    boxes[0].focus(); startTimer();
    showToast('OTP sent. Demo code is 123456');
  }
  $('#resend').addEventListener('click', sendOtp);

  $('#mobileForm').addEventListener('submit', async e => {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(phone.value)) { setErr('phoneErr', 'Enter a valid 10-digit Indian mobile number.'); return; }
    setErr('phoneErr', '');
    if (!otpSent) return sendOtp();
    const code = boxes.map(b => b.value).join('');
    if (code.length < 6) { $('#otpErr').textContent = 'Enter all 6 digits.'; return; }
    busy(mBtn, true, 'Verifying...');
    await wait(800);                       // TODO: verify OTP on server
    busy(mBtn, false, 'Verify and sign in');
    if (code !== '123456') { $('#otpErr').textContent = 'Wrong code. Check the SMS and try again.'; return; }
    $('#otpErr').textContent = '';
    onLoginSuccess({ method: 'mobile', phone: phone.value });
  });

  /* ---------- Google / Facebook ---------- */
  // Real login: use Firebase Auth -> signInWithPopup(auth, new GoogleAuthProvider()) / FacebookAuthProvider()
  $$('.soc').forEach(btn => btn.addEventListener('click', async () => {
    const p = btn.dataset.provider;
    btn.disabled = true;
    showToast(`Connecting to ${p[0].toUpperCase() + p.slice(1)}...`);
    await wait(900);
    btn.disabled = false;
    onLoginSuccess({ method: p });
  }));

  /* ---------- After login ---------- */
  function onLoginSuccess(user) {
    showToast('Welcome back! Loading your prep dashboard...');
    console.log('Logged in:', user);
    // setTimeout(() => location.href = 'dashboard.html', 1200);
  }
})();

// New swap

// =========================
// FORGOT PASSWORD TEXT
// =========================

const forgotBubble = document.getElementById("forgotBubble");

if (forgotBubble) {

    const messages = [
        {
            title: "Keep moving forward",
            text: "Small steps today can build a stronger career tomorrow."
        },
        {
            title: "PlaceMate AI",
            text: "Practice smarter, build confidence and get placement ready."
        },
        {
            title: "Your journey matters",
            text: "Keep learning. Keep practicing. Keep growing."
        },
        {
            title: "Career preparation",
            text: "Your next opportunity could start with one good practice session."
        }
    ];

    let index = 0;

    setInterval(() => {

        forgotBubble.classList.add("swap-out");

        setTimeout(() => {

            index = (index + 1) % messages.length;

            document.getElementById("forgotBubbleTitle").textContent =
                messages[index].title;

            document.getElementById("forgotBubbleText").textContent =
                messages[index].text;

            forgotBubble.classList.remove("swap-out");

        }, 500);

    }, 2000);
}