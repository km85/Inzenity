// Presentation for the existing, authenticated admin client. The dashboard reads
// the same collections as the management screens and never fetches its own data.
const sections = [
  ['Club directory', ['users','registrations','chapters','events','vehicleModels','vehicleYears','vehiclePowertrains']],
  ['Partners & store', ['officialPartners','sponsors','merchantPartners','vendors','merchandise','products','orders']],
  ['Content', ['banners','news','announcements']],
  ['Points & rewards', ['pointTransactions','rewards','redemptions','leaderboard']]
];
const icons = {
  dashboard:'layout-dashboard', users:'users', registrations:'clipboard-check', events:'calendar-days',
  chapters:'map-pin', vehicleModels:'car', vehicleYears:'calendar-check', vehiclePowertrains:'settings',
  officialPartners:'handshake', sponsors:'star', merchantPartners:'store', vendors:'map-pin',
  merchandise:'shopping-bag', products:'box', orders:'package', banners:'image', news:'newspaper',
  announcements:'megaphone', pointTransactions:'wallet', rewards:'gift', redemptions:'badge-check', leaderboard:'trophy'
};
const navLabels = {dashboard:'Dashboard',users:'Members',officialPartners:'Official partners',merchantPartners:'Merchants'};
const icon = name => '<svg class="ico" aria-hidden="true"><use href="#ico-'+name+'"></use></svg>';
function h(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function imageUrl(value) {
  if (!value) return '';
  if (/^data:image\/(png|jpeg|webp|gif);base64,/i.test(value)) return h(value);
  try {
    const url = new URL(value, location.href);
    if (['http:', 'https:'].includes(url.protocol)) return h(value);
  } catch {}
  return '';
}
function navLabel(key) { return navLabels[key] || baseConfigs[key].title; }
function navButton(key) {
  const active = adminState.tab === key;
  return '<button type="button" data-tab="'+key+'" class="sidebar-link '+(active?'active':'')+'" '+(active?'aria-current="page"':'')+'>'+icon(icons[key])+navLabel(key)+'</button>';
}
function setDrawer(open) {
  const mobile=matchMedia('(max-width: 850px)').matches;
  document.body.classList.toggle('drawer-open',mobile && open);
  document.body.classList.toggle('sidebar-collapsed',!mobile && !open);
  document.getElementById('drawerShade').hidden=!(mobile && open);
  document.getElementById('navToggle').setAttribute('aria-expanded',String(open));
}
function goToTab(key, create=false) {
  if (key!=='dashboard' && !baseConfigs[key]) return;
  adminState.tab=key;
  adminState.editingId=null;
  closeModal();
  closeQrModal();
  if (matchMedia('(max-width: 850px)').matches) setDrawer(false);
  renderCurrentTab();
  if (create) document.getElementById('newRecordButton')?.click();
}
function buildNav() {
  const nav=document.getElementById('sidebarNav');
  const openGroups = new Set(Array.from(nav.querySelectorAll('details[open]'),d=>d.dataset.group));
  nav.innerHTML=navButton('dashboard')+sections.map(([title,keys],i)=>{
    // Keep the frequent modules visible, with related reference data one click away.
    const primary = [['users','events'], ['officialPartners','sponsors','merchandise'], ['news'], []][i];
    const other=keys.filter(k=>!primary.includes(k));
    return primary.map(navButton).join('')+'<details data-group="'+i+'" '+(other.includes(adminState.tab)||openGroups.has(String(i))?'open':'')+'><summary>'+icon(['car','store','panels-top-left','award'][i])+title+icon('chevron-down')+'</summary>'+other.map(navButton).join('')+'</details>';
  }).join('');
}
function bindDashboardNavigation() {
  document.addEventListener('click',event=>{
    const target=event.target.closest('[data-tab],[data-go],[data-create]');
    if (target) goToTab(target.dataset.tab || target.dataset.go || target.dataset.create,!!target.dataset.create);
  });
  const toggle=document.getElementById('navToggle');
  toggle.onclick=()=>setDrawer(toggle.getAttribute('aria-expanded')!=='true');
  document.getElementById('drawerShade').onclick=()=>setDrawer(false);
  const media=matchMedia('(max-width: 850px)');
  const sync=()=>setDrawer(!media.matches);
  media.addEventListener('change',sync);sync();
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape') {
      closeModal();closeQrModal();
      if(document.body.classList.contains('drawer-open')){setDrawer(false);toggle.focus();}
    }
  });
}
function metric(key,label,value,targetLabel) {
  return '<button class="summary-tile" data-go="'+key+'"><span class="tile-icon">'+icon(icons[key])+'</span><span><span class="metric-label">'+label+'</span><strong>'+value.toLocaleString()+'</strong><small>'+targetLabel+'</small></span></button>';
}
function renderClubTotals() {
  const a=adminState.items;
  document.getElementById('stats').innerHTML=[
    metric('users','Members',a.users.filter(x=>x.role==='member').length,'Member accounts'),
    metric('events','Events',a.events.length,'Club calendar'),
    metric('officialPartners','Partners',a.officialPartners.length,'Official directory'),
    metric('sponsors','Sponsors',a.sponsors.length,'Sponsor directory'),
    metric('merchandise','Merchandise',a.merchandise.length,'Store items')
  ].join('');
}
function card(title,glyph,key,body) {
  return '<article class="v2card"><header><h2>'+icon(glyph)+title+'</h2>'+(key?'<button class="view-all" data-go="'+key+'">View all '+icon('arrow-up-right')+'</button>':'')+'</header>'+body+'</article>';
}
function dateLabel(date,opts) {
  const t=new Date(date);
  return date && Number.isFinite(t.valueOf()) ? t.toLocaleDateString('en-GB',opts) : '—';
}
function statusLabel(s) {
  const state=['approved','pending','rejected','active','completed'].includes(s)?s:'neutral';
  return '<span class="status-tag '+state+'">'+h(s || '—')+'</span>';
}
function renderOverview() {
  const a=adminState.items;
  const regs=[...a.registrations].sort((x,y)=>Date.parse(y.submittedAt)-Date.parse(x.submittedAt)).slice(0,5);
  const start=new Date();start.setHours(0,0,0,0);
  const events=a.events.filter(e=>new Date(e.date)>=start).sort((x,y)=>Date.parse(x.date)-Date.parse(y.date)).slice(0,3);
  const regTable=regs.length?'<div class="table-wrap"><table><thead><tr><th>Name</th><th>Chapter</th><th>Vehicle</th><th>Status</th></tr></thead><tbody>'+regs.map(r=>'<tr><td><b>'+h(r.fullName)+'</b><small class="sub">'+dateLabel(r.submittedAt,{day:'numeric',month:'short'})+'</small></td><td>'+h(r.chapter||'—')+'</td><td>'+h([r.vehicleModel,r.vehicleYear].filter(Boolean).join(' ')||'—')+'</td><td>'+statusLabel(r.status)+'</td></tr>').join('')+'</tbody></table></div>':'<p class="empty-state">No registrations yet.</p>';
  const calendar=events.length?events.map(e=>'<button class="event-line" data-go="events"><span class="date-tile"><small>'+dateLabel(e.date,{month:'short'})+'</small><b>'+dateLabel(e.date,{day:'2-digit'})+'</b></span><span><b>'+h(e.title)+'</b><small>'+h(e.location||'Location pending')+'</small></span>'+icon('chevron-right')+'</button>').join(''):'<p class="empty-state">No upcoming events.</p>';
  const partners=[...a.officialPartners.map(p=>({...p,key:'officialPartners'})),...a.sponsors.map(p=>({...p,key:'sponsors'}))].slice(0,6);
  const tiles=partners.length?'<div class="partner-list">'+partners.map(p=>'<button data-go="'+p.key+'">'+(imageUrl(p.logo)?'<img src="'+imageUrl(p.logo)+'" alt="">':'')+'<span>'+h(p.name)+'</span></button>').join('')+'</div>':'<p class="empty-state">No partner or sponsor records yet.</p>';
  const content='<div class="content-list">'+['banners','news','announcements'].map(k=>'<button data-go="'+k+'">'+icon(icons[k])+'<b>'+navLabel(k)+'</b><small>'+a[k].length+(a[k].length===1?' record':' records')+'</small></button>').join('')+'</div>';
  const actions='<div class="quick-actions">'+[['users','Add member'],['events','Create event'],['news','Add news'],['merchandise','Add merchandise']].map(([k,t])=>'<button data-create="'+k+'">'+icon('plus')+t+'</button>').join('')+'</div>';
  document.getElementById('tableArea').innerHTML='<div class="overview-top">'+card('Latest registrations','users','registrations',regTable)+card('Upcoming events','calendar-days','events',calendar)+'</div><div class="overview-bottom">'+card('Partners & sponsors','handshake','officialPartners',tiles)+card('Content & publishing','file-text',null,content)+card('Quick actions','layers',null,actions)+'</div>';
}
