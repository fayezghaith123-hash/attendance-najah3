document.getElementById('f').addEventListener('submit', async (e) => {
  e.preventDefault();
  const err = document.getElementById('err'); err.textContent = '';
  const r = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: document.getElementById('u').value, password: document.getElementById('p').value }) });
  if (r.ok) location.href = '/dashboard';
  else err.textContent = (await r.json().catch(() => ({}))).error || 'حدث خطأ';
});
