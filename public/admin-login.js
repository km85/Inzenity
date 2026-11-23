const form = document.getElementById('adminLoginForm');
form.addEventListener('submit', async event => {
  event.preventDefault();
  const button = form.querySelector('button');
  if (button.disabled) return;
  button.disabled = true;
  const status = document.getElementById('loginStatus');
  status.textContent = 'Signing in…';
  try {
    if (location.protocol !== "https:") throw new Error("HTTPS required");
    const fields = new FormData(form);
    const result = await fetch('/api/auth/login', {
      method: 'POST', credentials: 'same-origin', cache: 'no-store',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({username: fields.get('username'), password: fields.get('password'), scope:'admin'})
    });
    if (!result.ok) {
      status.textContent = [401,403].includes(result.status) ? 'Sign-in unsuccessful. Check your admin credentials.' : 'The service is unavailable. Try again.';
      return;
    }
    form.reset();
    location.replace('/admin.html');
  } catch {
    status.textContent = 'The server could not be reached. Try again.';
  } finally {
    button.disabled = false;
  }
});

form.querySelector('button').disabled = false;
