const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyuJfWkabmeqshbEVWYFXg8MZB_tOIyK3zRcc5Ao1PDjtX-5aYY9PUq6Ev5oUZ6sDevcQ/exec';
const $ = id => document.getElementById(id);

const user = JSON.parse(localStorage.getItem('user') || 'null');
if (!user) window.location.href = 'index.html';

const empId = user.Employee_ID || user.employeeId;
const storeId = user.Store_ID || user.storeId || 'MBHKHI01'; // fallback for testing
$('status').textContent = `Welcome ${user.Name || user.name || empId}`;

async function check(action) {
  try {
    $('status').textContent = action === 'checkin' ? 'Checking in...' : 'Checking out...';

    const pos = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject));
    const { latitude, longitude } = pos.coords;

    const res = await fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({
        action,
        employeeId: empId,
        storeId,
        lat: latitude,
        lng: longitude,
        distance: 0
      })
    });
    const j = await res.json();
    console.log(j);
    $('status').textContent = j.success
      ? (action === 'checkin' ? 'Checked In ✅' : 'Checked Out ✅')
      : (j.error || 'Action failed');
    loadHistory();
  } catch (err) {
    $('status').textContent = 'GPS or Network error';
  }
}

$('checkIn').onclick = () => check('checkin');
$('checkOut').onclick = () => check('checkout');

$('logout').onclick = () => {
  localStorage.removeItem('user');
  window.location.href = 'index.html';
};

async function loadHistory() {
  try {
    const res = await fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'getAttendanceHistory',
        employeeId: empId,
        startDate: '',
        endDate: ''
      })
    });
    const j = await res.json();
    const list = j.records || j.data || [];
    const div = $('history');
    if (!list.length) { div.innerHTML = '<p>No records</p>'; return; }

    div.innerHTML = list
      .slice(-5)
      .reverse()
      .map(r => `<div class="rec">${r.Date || r.date} — ${r.Status || r.status || ''}</div>`)
      .join('');
  } catch (err) {
    console.error(err);
  }
}

loadHistory();
