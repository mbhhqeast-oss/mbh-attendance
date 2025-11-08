const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyuJfWkabmeqshbEVWYFXg8MZB_tOIyK3zRcc5Ao1PDjtX-5aYY9PUq6Ev5oUZ6sDevcQ/exec';

document.getElementById('checkinBtn').addEventListener('click', async () => {
  const empId = document.getElementById('empId').value.trim();
  const storeId = document.getElementById('storeId').value.trim();
  const output = document.getElementById('output');

  if (!empId || !storeId) {
    output.textContent = 'Please fill both fields.';
    return;
  }

  try {
    const pos = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });
    const { latitude, longitude } = pos.coords;

    const res = await fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'checkin',
        employeeId: empId,
        storeId: storeId,
        lat: latitude,
        lng: longitude,
        distance: 0
      })
    });
    const data = await res.json();
    output.textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    output.textContent = 'Error: ' + err.message;
  }
});
