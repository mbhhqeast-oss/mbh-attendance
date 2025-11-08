// supervisor.js
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyN2vCpQygD_pizssPlLCMFHLO73B_sjKJyMUNCYHdEkBspK7KeLg1pQ_IaoL07s8TDJg/exec';
const $ = id => document.getElementById(id);

const user = JSON.parse(localStorage.getItem('user') || 'null');
if (!user) { window.location.href = 'index.html'; }
$('supName').textContent = `${user.Name || user.Name || user.Employee_ID} — Supervisor`;

// Load pending leaves
async function loadPendingLeaves(){
  try {
    const res = await fetch(SCRIPT_URL, { method:'POST', body: JSON.stringify({ action:'getPendingLeaves' })});
    const j = await res.json();
    const rows = (j && j.leaves) || [];
    const tbody = document.querySelector('#pendingLeavesTable tbody');
    tbody.innerHTML = '';
    rows.forEach(l => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${l.Leave_ID}</td>
                      <td>${l.Employee_Name||l.Employee_ID}</td>
                      <td>${l.Leave_Type}</td>
                      <td>${l.Start_Date} → ${l.End_Date}</td>
                      <td>${l.Total_Days}</td>
                      <td>${l.Reason||''}</td>
                      <td>
                        <button class="btn-small btn-approve" data-id="${l.Leave_ID}">Approve</button>
                        <button class="btn-small btn-reject" data-id="${l.Leave_ID}">Reject</button>
                      </td>`;
      tbody.appendChild(tr);
    });
  } catch(err){ console.error(err); }
}

// Handle approve/reject clicks (event delegation)
document.querySelector('#pendingLeavesTable').addEventListener('click', async (ev) => {
  const btn = ev.target.closest('button');
  if (!btn) return;
  const id = btn.getAttribute('data-id');
  if (!id) return;
  if (btn.classList.contains('btn-approve')) {
    const comment = prompt('Optional approval comment:') || '';
    const res = await fetch(SCRIPT_URL, { method:'POST', body: JSON.stringify({ action:'approveLeave', leaveId: id, supervisorId: user.Employee_ID, comments: comment })});
    const j = await res.json();
    if (j.success) { alert('Approved'); loadPendingLeaves(); } else alert('Error: '+(j.error||''));
  } else if (btn.classList.contains('btn-reject')) {
    const comment = prompt('Reason for rejection (required):');
    if (!comment) return alert('Rejection requires comment');
    const res = await fetch(SCRIPT_URL, { method:'POST', body: JSON.stringify({ action:'rejectLeave', leaveId: id, supervisorId: user.Employee_ID, comments: comment })});
    const j = await res.json();
    if (j.success) { alert('Rejected'); loadPendingLeaves(); } else alert('Error: '+(j.error||''));
  }
});

// Load missed punches for today (employees checked-in but no checkout)
async function loadMissedPunches(){
  try {
    // Use supervisor's ID to get team attendance (backend helper)
    const today = new Date().toISOString().slice(0,10);
    const res = await fetch(SCRIPT_URL, { method:'POST', body: JSON.stringify({ action:'getTeamAttendance', supervisorId: user.Employee_ID, date: today })});
    const j = await res.json();
    const rows = j.attendance || [];
    const tbody = document.querySelector('#missedTable tbody');
    tbody.innerHTML = '';
    rows.forEach(r => {
      if (!r.Check_Out_Time) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${r.Attendance_ID}</td><td>${r.Employee_Name}</td><td>${r.Check_In_Time||'-'}</td><td>${r.Check_Out_Time||'-'}</td>
          <td><button class="btn-small" data-att="${r.Attendance_ID}">Add Punch</button></td>`;
        tbody.appendChild(tr);
      }
    });
  } catch(err){ console.error(err); }
}

// Add punch (manual) - prompts for in/out and timestamp
document.querySelector('#missedTable').addEventListener('click', async (ev) => {
  const btn = ev.target.closest('button');
  if (!btn) return;
  const att = btn.getAttribute('data-att');
  if (!att) return;
  const which = prompt('Type "in" to set Check_In_Time or "out" to set Check_Out_Time:');
  if (!which) return;
  const time = prompt('Enter timestamp (YYYY-MM-DD HH:MM) or leave blank for now (will use current time):') || new Date().toString();
  const field = which.toLowerCase().startsWith('in') ? 'Check_In_Time' : 'Check_Out_Time';
  const res = await fetch(SCRIPT_URL, { method:'POST', body: JSON.stringify({ action:'editAttendance', attendanceId: att, field, newValue: time, supervisorId: user.Employee_ID, reason: 'Supervisor manual punch' })});
  const j = await res.json();
  if (j.success) { alert('Saved'); loadMissedPunches(); } else alert('Error: '+(j.error||''));
});

document.getElementById('logout').addEventListener('click', () => {
  localStorage.removeItem('user');
  window.location.href = 'index.html';
});

// initial load
loadPendingLeaves();
loadMissedPunches();
