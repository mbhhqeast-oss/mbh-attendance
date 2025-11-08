const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyN2vCpQygD_pizssPlLCMFHLO73B_sjKJyMUNCYHdEkBspK7KeLg1pQ_IaoL07s8TDJg/exec';
const $ = id => document.getElementById(id);

const user = JSON.parse(localStorage.getItem('user') || 'null');
if (!user) { window.location.href = 'index.html'; }
$('adminName').textContent = `${user.Name || user.Employee_ID} — Admin`;

async function loadSummary(){
  try {
    const res = await fetch(SCRIPT_URL, { method:'POST', body: JSON.stringify({ action:'getSystemSummary' }) });
    const j = await res.json();
    if (j.success){
      $('totalEmployees').textContent = j.totalEmployees;
      $('totalStores').textContent = j.totalStores;
      $('leavesApproved').textContent = j.leavesApprovedMonth;
      $('payrollsProcessed').textContent = j.payrollsProcessed;
    }
  } catch(err){ console.error(err); }
}

async function loadEmployees(){
  try {
    const res = await fetch(SCRIPT_URL, { method:'POST', body: JSON.stringify({ action:'getAllEmployees' }) });
    const j = await res.json();
    const tbody = document.querySelector('#empTable tbody');
    tbody.innerHTML = '';
    (j.employees || []).forEach(e => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${e.Employee_ID}</td><td>${e.Name}</td><td>${e.Store_Name}</td><td>${e.Role}</td><td>${e.Status}</td>`;
      tbody.appendChild(tr);
    });
  } catch(err){ console.error(err); }
}

document.getElementById('logout').addEventListener('click', ()=>{
  localStorage.removeItem('user');
  window.location.href = 'index.html';
});

loadSummary();
loadEmployees();
