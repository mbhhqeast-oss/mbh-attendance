// admin.js - replacement to compute summary from existing endpoints
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyN2vCpQygD_pizssPlLCMFHLO73B_sjKJyMUNCYHdEkBspK7KeLg1pQ_IaoL07s8TDJg/exec';
const $ = id => document.getElementById(id);

const user = JSON.parse(localStorage.getItem('user') || 'null');
if (!user) { window.location.href = 'index.html'; }
$('adminName').textContent = `${user.Name || user.Employee_ID} — Admin`;

// helper: safe fetch JSON
async function postJSON(payload){
  try {
    const res = await fetch(SCRIPT_URL, { method:'POST', body: JSON.stringify(payload) });
    const j = await res.json();
    return j;
  } catch(err){
    console.error('postJSON error', err, payload);
    return null;
  }
}

// helper: exportCSV action (returns CSV text)
async function exportCSV(sheetName){
  try {
    const res = await fetch(SCRIPT_URL, { method:'POST', body: JSON.stringify({ action:'exportCSV', sheetName }) });
    const txt = await res.text();
    return txt;
  } catch(err){
    console.error('exportCSV error', sheetName, err);
    return null;
  }
}

function parseCSV(csvText){
  if (!csvText) return [];
  const lines = csvText.split('\n').map(l => l.trim()).filter(Boolean);
  if (!lines.length) return [];
  const headers = lines[0].replace(/^"|"$/g,'').split('","');
  const rows = lines.slice(1).map(l => l.replace(/^"|"$/g,'').split('","'));
  return rows.map(r => {
    const obj = {};
    headers.forEach((h,i)=> obj[h] = (r[i] || '').trim());
    return obj;
  });
}

async function loadSummary(){
  // default placeholders
  $('totalEmployees').textContent = '--';
  $('totalStores').textContent = '--';
  $('leavesApproved').textContent = '--';
  $('payrollsProcessed').textContent = '--';

  // 1) total employees (via getAllEmployees)
  const empResp = await postJSON({ action:'getAllEmployees' });
  const employees = (empResp && empResp.employees) || [];
  $('totalEmployees').textContent = employees.length;

  // 2) total active stores (via exportCSV STORES)
  const storesCsv = await exportCSV('STORES');
  const stores = parseCSV(storesCsv);
  const activeStores = stores.filter(s => (s.Status || s.status || '').toLowerCase() !== 'inactive');
  $('totalStores').textContent = activeStores.length;

  // 3) leaves approved this month (via exportCSV LEAVES)
  const leavesCsv = await exportCSV('LEAVES');
  const leaves = parseCSV(leavesCsv);
  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth() + 1; // 1-12
  // Count leaves whose Reviewed_Date is in current month and Status is Approved OR Start_Date within current month and Status Approved
  const approvedThisMonth = leaves.filter(l => {
    const status = (l.Status || l.status || '').toLowerCase();
    if (status !== 'approved') return false;
    // prefer Reviewed_Date
    const rd = l.Reviewed_Date || l.ReviewedDate || l.Reviewed_Date;
    const sd = l.Start_Date || l.StartDate;
    const dateToCheck = rd || sd || l.Applied_Date || l.Start_Date;
    if (!dateToCheck) return false;
    const d = new Date(dateToCheck);
    if (isNaN(d.getTime())) {
      // try YYYY-MM-DD
      const parts = (dateToCheck+'').match(/(\d{4})-(\d{2})-(\d{2})/);
      if (parts) {
        const y = Number(parts[1]), m = Number(parts[2]);
        return (y === curYear && m === curMonth);
      }
      return false;
    }
    return (d.getFullYear() === curYear && (d.getMonth()+1) === curMonth);
  }).length;
  $('leavesApproved').textContent = approvedThisMonth;

  // 4) payrolls processed - count PAYROLL entries with Status Paid or Approved in current year
  const payrollCsv = await exportCSV('PAYROLL');
  const payrolls = parseCSV(payrollCsv);
  const processed = payrolls.filter(p => {
    const st = (p.Status || p.status || '').toLowerCase();
    if (!st) return false;
    return (st === 'paid' || st === 'approved' || st === 'processed' || st === 'draft' ? false : st);
  }).length;
  // Better: count rows where Status === Paid
  const paidCount = payrolls.filter(p => (p.Status || p.status || '').toLowerCase() === 'paid').length;
  $('payrollsProcessed').textContent = paidCount;
}

async function loadEmployees(){
  try {
    const res = await postJSON({ action:'getAllEmployees' });
    const rows = (res && res.employees) || [];
    const tbody = document.querySelector('#empTable tbody');
    tbody.innerHTML = '';
    rows.forEach(e => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${e.Employee_ID}</td><td>${e.Name}</td><td>${e.Store_Name || ''}</td><td>${e.Role || ''}</td><td>${e.Status || ''}</td>`;
      tbody.appendChild(tr);
    });
  } catch(err){
    console.error(err);
  }
}

document.getElementById('logout').addEventListener('click', ()=>{
  localStorage.removeItem('user');
  window.location.href = 'index.html';
});

// Run
loadSummary();
loadEmployees();
