// login.js - uses your Apps Script endpoint
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyuJfWkabmeqshbEVWYFXg8MZB_tOIyK3zRcc5Ao1PDjtX-5aYY9PUq6Ev5oUZ6sDevcQ/exec';

const $ = id => document.getElementById(id);
const msg = $('msg');

function showMsg(t) { msg.textContent = t || ''; }

document.getElementById('loginForm').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  showMsg('Signing in...');

  const employeeId = $('employeeId').value.trim();
  const password = $('password').value;
  const remember = $('remember').checked;

  if (!employeeId || !password) { showMsg('Enter ID and password'); return; }

  try {
    const res = await fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'login', employeeId, password })
    });
    const j = await res.json();
    console.log('LOGIN_RESPONSE_DATA:', j);
sessionStorage.setItem('last_login_resp', JSON.stringify(j));


    if (j && j.success) {
      const user = j.user || {};
      // store minimal user object
      localStorage.setItem('user', JSON.stringify(user));
      if (remember) {
        localStorage.setItem('mbh_remember', JSON.stringify({ employeeId }));
      } else {
        localStorage.removeItem('mbh_remember');
      }

      // Redirect based on role field. Role comes from EMPLOYEES header "Role"
      const role = (user.Role || user.role || '').toString().toLowerCase();
      if (role === 'supervisor') {
        window.location.href = 'supervisor.html';
      } else if (role === 'admin') {
        window.location.href = 'admin.html';
      } else {
        // default employee
        window.location.href = 'attendance.html';
      }
    } else {
      showMsg(j && j.error ? j.error : 'Invalid credentials');
    }
  } catch (err) {
    console.error(err);
    showMsg('Network error, try again');
  }
});

// Auto-fill remembered ID
window.addEventListener('load', () => {
  try {
    const rem = JSON.parse(localStorage.getItem('mbh_remember') || 'null');
    if (rem && rem.employeeId) $('employeeId').value = rem.employeeId;
  } catch(e){}
});
