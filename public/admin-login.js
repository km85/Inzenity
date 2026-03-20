async function request(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    ...options
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

document.getElementById("adminLoginForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      username: form.get("username"),
      password: form.get("password"),
      scope: "admin"
    })
  });
  window.location.href = "/admin";
});
