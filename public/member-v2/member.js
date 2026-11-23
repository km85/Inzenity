// Member presentation and navigation. The existing app owns authentication and records.
function words(id, en) { return state.language === "id" ? id : en; }
function escapeMember(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
const memberIcons = {
  home:'<path d="m3 11 9-8 9 8M5 10v11h5v-6h4v6h5V10"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 10h18m-13 5 2 2 5-5"/>',
  car:'<path d="m4 11 2-6h12l2 6m-17 1 2-2h14l2 2v6H3zm2 6v2m14-2v2M6 14h2m8 0h2"/>',
  user:'<circle cx="12" cy="7" r="4"/><path d="M4 21v-2a8 6 0 0 1 16 0v2z"/>',
  users:'<circle cx="9" cy="8" r="3.5"/><path d="M2 20v-2c0-6 14-6 14 0v2m0-15c5-1 6 6 1 7m1 2c3 0 4 2 4 5"/>',
  gift:'<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v9h14v-9m-7-4v13m0-13C4 9 5 1 9 3l3 5c8 1 7-7 3-5z"/>',
  store:'<path d="M2 3h3l3 12h11l2-9H6"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/>',
  bell:'<path d="M4 17h16l-2-3v-4a6 6 0 0 0-12 0v4zm6 3a2 2 0 0 0 4 0"/>',
  menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
  points:'<ellipse cx="10" cy="7" rx="7" ry="3"/><path d="M3 7v4c0 4 14 4 14 0V7M3 11v4c0 4 14 4 14 0m3-5v7c0 3-5 4-10 4"/>',
  chevron:'<path d="m9 5 7 7-7 7"/>'
};
function memberIcon(name) {
  return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">'+memberIcons[name]+'</svg>';
}
function memberApiOrigin() {
  const origin = window.INZENITY_MEMBER_API_ORIGIN;
  if (!origin && !window.INZENITY_PACKAGED_MEMBER && !window.Capacitor?.isNativePlatform?.()) return "";
  let parsed;
  try { parsed = new URL(origin); } catch {}
  if (!parsed || parsed.protocol !== "https:" || parsed.origin !== origin) {
    throw new Error(words("Alamat HTTPS server aplikasi belum dikonfigurasi.", "The app needs an approved HTTPS backend origin."));
  }
  return parsed.origin;
}
let pendingMemberRequests = 0;
function changeProgress(delta) {
  pendingMemberRequests += delta;
  document.querySelector("#requestProgress").classList.toggle("hidden", pendingMemberRequests === 0);
}
function showNotice(message) {
  const el = document.querySelector("#connectionNotice");
  el.querySelector("span").textContent = message;
  el.classList.toggle("hidden", !message);
}
function memberEntryHash() {
  const q = new URLSearchParams(location.search);
  return q.get("checkin") === "1" && /^\d+$/.test(q.get("event") || "") ? "#event-"+q.get("event") : "";
}
function checkInValue(value, id) {
  if (!/^https?:\/\//i.test(value)) return value;
  const q = new URL(value).searchParams;
  if (q.get("event") !== String(id) || !q.get("token")) throw new Error(words("QR tidak sesuai acara.", "This QR link does not match the event."));
  return q.get("token");
}
async function enterMemberApp(hash) {
  showApp();
  try {
    await Promise.all([loadData(), loadReferenceData(), loadMemberPhase2Data()]);
    if (!state.user) return;
    await loadProfile();
    if (!state.user) return;
    renderChrome();
    startHeroRotation();
    if (location.hash !== hash) location.hash = hash;
    navigate(hash);
  } catch (err) { showNotice(err.message); }
}
function memberOverview() {
  const user = state.profile || state.user;
  const vehicle = state.vehicle || {};
  const chapter = state.chapters.find(c => String(c.id) === String(user.chapterId));
  const next = state.events.filter(e => new Date(e.date) >= new Date(new Date().setHours(0,0,0,0))).sort((a,b) => new Date(a.date)-new Date(b.date))[0];
  const actions = [["events","calendar",t("events")],["chapter","users",t("chapter")],["benefits","gift",words("Benefit","Benefits")],["merchandise","store",t("merchandise")]];
  function row(route, lead, label, title, detail) {
    return `<a class="v2-row" href="#${route}">${lead}<span><small>${escapeMember(label)}</small><strong>${escapeMember(title)}</strong>${detail ? '<small>'+escapeMember(detail)+'</small>' : ''}</span>${memberIcon("chevron")}</a>`;
  }
  const photo = /^data:image\/(png|jpeg|webp|gif);base64,/i.test(state.avatarPhoto) ? '<img src="'+escapeMember(state.avatarPhoto)+'" alt="">' : memberIcon("user");
  const carPhoto = /^data:image\/(png|jpeg|webp|gif);base64,/i.test(state.carPhoto) ? state.carPhoto : "/member-v2/black.webp";
  return `<div class="v2-hero"><h1>Inzenity Indonesia</h1><p>Drive Together.<br>Grow Together.</p></div>
    <a href="#profile" class="v2-pass"><span class="pass-avatar">${photo}</span><span><strong>${escapeMember(user.name)}</strong><small>${escapeMember(user.memberNumber || words("Anggota INZENITY","INZENITY member"))}</small></span><b>INZENITY</b></a>
    <div class="v2-quick">${actions.map(([url,icon,title])=>`<a href="#${url}">${memberIcon(icon)}<span>${escapeMember(title)}</span></a>`).join("")}</div>
    ${row("vehicle",'<img src="'+escapeMember(carPhoto)+'" alt="">',words("Kendaraan saya","My vehicle"),vehicle.nickname || vehicle.model || words("Tambah kendaraan","Add your vehicle"),[vehicle.year,vehicle.plateNumber].filter(Boolean).join(" · "))}
    ${row("benefits",memberIcon("points"),t("myPoints"),String(state.pointsBalance)+" "+t("pointsLabel"),"")}
    <div class="v2-heading"><h2>${words("Acara mendatang","Upcoming events")}</h2><a href="#events">${words("Lihat semua","See all")}</a></div>
    ${next ? row("event-"+Number(next.id),'<img src="/member-v2/meetup.webp" alt="">',next.category,next.title,[formatShortDate(next.date),next.location].filter(Boolean).join(" · ")) : '<p class="v2-empty">'+words("Belum ada acara mendatang.","No upcoming events.")+'</p>'}
    <div class="v2-heading"><h2>${words("Chapter saya","My chapter")}</h2></div>
    ${row("chapter",'<img src="/member-v2/hero.webp" alt="">',t("chapter"),chapter?.name || words("Pilih chapter","Choose your chapter"),"")}`;
}
function navigateMemberTool(hash) {
  const fields = {"#vehicle":"#carNickname","#profile":"#fullName","#chapter":"#chapterId","#benefits":".points-balance","#orders":".order-history"};
  if (fields[hash]) {
    setActiveScreen("my-zenix");
    document.querySelector(`.member-nav-link[href="${hash}"]`)?.classList.add("active");
    const section = document.querySelector("#screen-my-zenix "+fields[hash]);
    (section?.closest("article") || section)?.scrollIntoView({block:"start"});
    return true;
  }
  const label = {"#notifications":words("Notifikasi","Notifications"),"#plate":words("Cari plat kendaraan","Plate search"),"#sos":"Emergency SOS"}[hash];
  if (!label) return false;
  setActiveScreen("tools");
  window.scrollTo(0,0);
  const screen = document.querySelector("#screen-tools");
  const tools = document.createElement("article");
  tools.className = "member-card v2-tools";
  tools.innerHTML = '<h2>'+label+'</h2><form method="post"></form><p role="status"></p>';
  screen.textContent = "";
  screen.appendChild(tools);
  const form=tools.querySelector("form"), message=tools.querySelector("[role=status]");
  const button=document.createElement("button");
  button.className="primary-button";
  let enabled;
  if (hash === "#notifications") {
    button.disabled=true;
    button.textContent=words("Memuat…","Loading…");
    api("/api/notifications/status").then(data=>{
      enabled=data.notifications_enabled;
      updatePreference();
      button.disabled=false;
    }).catch(err=>{ message.textContent=err.message; showNotice(err.message); });
  } else if (hash === "#plate") {
    form.innerHTML='<label for="plateQuery">'+words("Nomor plat (minimal 3 karakter)","License plate (at least 3 characters)")+'</label><input id="plateQuery" name="plate" minlength="3" required maxlength="32">';
    button.textContent=words("Cari","Search");
  } else {
    form.innerHTML='<p>'+words("Kirim permintaan bantuan ke admin dan anggota chapter Anda.","Send a help request to club admins and members of your chapter.")+'</p>';
    button.textContent=words("Kirim SOS","Send SOS");
  }
  form.append(button);
  function updatePreference() {
    message.textContent=enabled ? words("Notifikasi aktif","Notifications enabled") : words("Notifikasi nonaktif","Notifications disabled");
    button.textContent=enabled ? words("Nonaktifkan","Turn off") : words("Aktifkan","Turn on");
  }
  form.onsubmit=async event=>{
    event.preventDefault();
    if (button.disabled) return;
    if (hash === "#sos" && !confirm(words("Kirim permintaan SOS sekarang?","Send a club SOS now?"))) return;
    button.disabled=true;
    let sent=false;
    try {
      if (hash === "#notifications") {
        const result=await api("/api/notifications/toggle",{method:"POST",body:JSON.stringify({enabled:!enabled})});
        enabled=result.notifications_enabled; updatePreference();
      } else if (hash === "#plate") {
        const result=await api("/api/plate-search?plate="+encodeURIComponent(form.elements.plate.value.trim()));
        message.textContent=result.results.map(r=>[r.plate_number,r.member_name,r.chapter,r.vehicle_model].filter(Boolean).join(" · ")).join("\n") || words("Tidak ada hasil.","No matching vehicles.");
      } else {
        const result=await api("/api/emergency/alert",{method:"POST",body:"{}"});
        message.textContent=words("Permintaan SOS tercatat","SOS recorded")+" #"+result.alert_id; sent=true;
      }
    } catch (err) { message.textContent=err.message; }
    finally { button.disabled=sent; }
  };
  return true;
}
function installMemberChrome() {
  document.querySelectorAll("[data-icon]").forEach(el=>{el.innerHTML=memberIcon(el.dataset.icon);});
  document.querySelector("#retryReads").onclick=()=>location.reload();
  const offline=()=>showNotice(words("Anda offline. Perubahan memerlukan koneksi.","You are offline. Changes require a connection."));
  window.addEventListener("offline",offline);
  window.addEventListener("online",()=>showNotice(words("Koneksi kembali. Muat ulang data.","Connection restored. Refresh to load current data.")));
  if (!navigator.onLine) offline();
}
