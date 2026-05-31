/* =====================================================
   BasuralMap — main.js
   Dependencies: Leaflet, Chart.js, GSAP + ScrollTrigger, AOS
   ===================================================== */

// ---- ROUTING ----
const VIEWS = ['home','map','report','panel','satellite'];
let leafletMap, reportMap, panelMap, chartsInit = false;

function go(v) {
  VIEWS.forEach(x => {
    const el = document.getElementById('view-'+x);
    if (el) el.classList.toggle('active', x === v);
  });
  document.querySelectorAll('#navlinks a').forEach(a =>
    a.classList.toggle('active', a.dataset.v === v)
  );
  window.scrollTo({ top: 0, behavior: 'smooth' });
  closeMobileMenu();

  if (v === 'home')       initHome();
  if (v === 'map')        setTimeout(initLeafletMap, 80);
  if (v === 'report')     setTimeout(initReportMap, 80);
  if (v === 'panel')      setTimeout(initPanel, 80);
  if (v === 'satellite')  setTimeout(initCompare, 80);
}

// ---- MOBILE MENU ----
function toggleMenu() {
  const btn = document.getElementById('hamburger');
  const menu = document.getElementById('mobileMenu');
  btn.classList.toggle('open');
  menu.classList.toggle('open');
}
function closeMobileMenu() {
  document.getElementById('hamburger').classList.remove('open');
  document.getElementById('mobileMenu').classList.remove('open');
}

// ---- HEADER SCROLL ----
window.addEventListener('scroll', () => {
  document.getElementById('header').classList.toggle('scrolled', scrollY > 20);
});

// ---- HOME ----
function initHome() {
  initHeroCanvas();
  animateCounters();
  animateProgressBars();
  AOS.refresh();
}

// Hero canvas — floating particles
function initHeroCanvas() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas || canvas.dataset.init) return;
  canvas.dataset.init = 1;
  const ctx = canvas.getContext('2d');
  let W, H, pts;

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function makePts() {
    pts = Array.from({length: 48}, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35,
      r: Math.random() * 2 + 1,
      a: Math.random()
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    pts.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(31,157,87,${p.a * .3})`;
      ctx.fill();
    });
    // draw lines between close pts
    for (let i = 0; i < pts.length; i++) {
      for (let j = i+1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
        const d = Math.sqrt(dx*dx + dy*dy);
        if (d < 120) {
          ctx.beginPath();
          ctx.moveTo(pts[i].x, pts[i].y);
          ctx.lineTo(pts[j].x, pts[j].y);
          ctx.strokeStyle = `rgba(31,157,87,${(1 - d/120) * .08})`;
          ctx.lineWidth = .8;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }

  resize(); makePts(); draw();
  window.addEventListener('resize', () => { resize(); makePts(); });
}

// Counter animation
const countersDone = new Set();
function animateCounters() {
  document.querySelectorAll('.stat-num[data-count]').forEach(el => {
    if (countersDone.has(el)) return;
    countersDone.add(el);
    const target = +el.dataset.count;
    const fmt = el.dataset.fmt;
    const suffix = el.dataset.suffix || '';
    let s = 0, steps = 55;
    const step = target / steps;
    const t = setInterval(() => {
      s += step;
      if (s >= target) { s = target; clearInterval(t); }
      if (fmt === 'k') {
        el.textContent = (s/1000).toFixed(1).replace('.0','') + 'k' + suffix;
      } else {
        el.textContent = Math.round(s).toLocaleString('es-AR') + suffix;
      }
    }, 22);
  });
}

// IntersectionObserver for counters + progress bars
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    animateCounters();
    animateProgressBars();
    io.unobserve(e.target);
  });
}, { threshold: .3 });
document.querySelectorAll('.stats-band,.stats-grid').forEach(el => io.observe(el));

function animateProgressBars() {
  document.querySelectorAll('.prog-bar span[style*="width:0"],.prog-bar span:not([style])').forEach(s => {});
  // trigger CSS transitions
  document.querySelectorAll('.prog-bar span').forEach(s => {
    if (s.dataset.done) return;
    s.dataset.done = 1;
    requestAnimationFrame(() => {
      const w = s.style.width || '0%';
      s.style.width = '0%';
      setTimeout(() => { s.style.width = w || '78%'; }, 100);
    });
  });
}

// GSAP hero animations — run once on load
window.addEventListener('load', () => {
  AOS.init({ duration: 700, easing: 'ease-out-cubic', once: true, offset: 60 });

  if (typeof gsap !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    gsap.from('.hero-text .badge', { duration: .8, y: 20, opacity: 0, ease: 'power3.out' });
    gsap.from('.hero-h1', { duration: .9, y: 30, opacity: 0, ease: 'power3.out', delay: .15 });
    gsap.from('.hero-p', { duration: .8, y: 20, opacity: 0, ease: 'power3.out', delay: .3 });
    gsap.from('.hero-cta .btn', {
      duration: .7, y: 16, opacity: 0, stagger: .1, ease: 'power3.out', delay: .45
    });
    gsap.from('.hero-map-card', {
      duration: 1.1, x: 40, opacity: 0, ease: 'power3.out', delay: .25,
      rotateY: -8, transformOrigin: 'left center'
    });

    // Scroll-triggered stat bars
    ScrollTrigger.create({
      trigger: '.stats-band',
      start: 'top 75%',
      onEnter: () => { animateCounters(); animateProgressBars(); }
    });
  }
  initHome();
});

// ---- LEAFLET MAP (public map) ----
const BASURALES = [
  { lat: -34.6037, lng: -58.3816, title: 'Calle 14 y Camino Real', loc: 'Berazategui, Buenos Aires', type: 'Domiciliario', status: 'critico', color: '#cf2e3f' },
  { lat: -34.5511, lng: -58.4597, title: 'Av. Rivadavia 4500', loc: 'CABA, Buenos Aires', type: 'Residuos urbanos', status: 'activo', color: '#1f9d57' },
  { lat: -34.6700, lng: -58.4100, title: 'Riachuelo sector B', loc: 'Avellaneda, Buenos Aires', type: 'Domiciliario', status: 'limpieza', color: '#0d7d82' },
  { lat: -34.6200, lng: -58.5000, title: 'Ruta 3 km 42', loc: 'Lomas de Zamora', type: 'Electrónicos', status: 'activo', color: '#1f9d57' },
  { lat: -34.5900, lng: -58.3600, title: 'Barrio San Jorge', loc: 'Villa Lugano, CABA', type: 'Peligrosos', status: 'critico', color: '#cf2e3f' },
  { lat: -34.6400, lng: -58.4500, title: 'Camino Real km 8', loc: 'Quilmes', type: 'Escombros', status: 'cerrado', color: '#0d4733' },
  { lat: -31.4135, lng: -64.1811, title: 'Parque San Martín', loc: 'Córdoba Capital', type: 'Orgánicos', status: 'activo', color: '#1f9d57' },
  { lat: -32.9468, lng: -60.6393, title: 'Zona industrial norte', loc: 'Rosario, Santa Fe', type: 'Peligrosos', status: 'critico', color: '#cf2e3f' },
  { lat: -32.9000, lng: -68.8500, title: 'Acceso Godoy Cruz', loc: 'Mendoza', type: 'Escombros', status: 'activo', color: '#1f9d57' },
  { lat: -38.0023, lng: -57.5575, title: 'Costa atlántica', loc: 'Mar del Plata, Buenos Aires', type: 'Domiciliario', status: 'limpieza', color: '#0d7d82' },
  { lat: -26.8241, lng: -65.2226, title: 'Villa Urquiza sector 3', loc: 'San Miguel de Tucumán', type: 'Residuos urbanos', status: 'activo', color: '#1f9d57' },
  { lat: -24.7859, lng: -65.4116, title: 'Ruta 9 km 12', loc: 'San Salvador de Jujuy', type: 'Escombros', status: 'cerrado', color: '#0d4733' },
];

function makePinIcon(color) {
  return L.divIcon({
    html: `<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};border:2.5px solid #fff;box-shadow:0 6px 14px -3px rgba(0,0,0,.4);display:grid;place-items:center">
      <svg style="transform:rotate(45deg);width:12px;height:12px;color:#fff" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>
    </div>`,
    className: '',
    iconSize: [26, 36],
    iconAnchor: [13, 36],
    popupAnchor: [0, -38]
  });
}

function initLeafletMap() {
  if (leafletMap) { leafletMap.invalidateSize(); return; }
  leafletMap = L.map('leafletMap', { zoomControl: true, scrollWheelZoom: false })
    .setView([-34.6, -58.4], 7);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap © CARTO',
    subdomains: 'abcd', maxZoom: 19
  }).addTo(leafletMap);

  BASURALES.forEach(b => {
    const marker = L.marker([b.lat, b.lng], { icon: makePinIcon(b.color) })
      .addTo(leafletMap)
      .bindPopup(`
        <div class="popup-inner">
          <span class="ptag" style="background:${b.color}">${b.status.toUpperCase()}</span>
          <h4>${b.title}</h4>
          <div class="loc" style="display:flex;align-items:center;gap:5px;color:var(--ink-soft);font-size:13px;margin-bottom:6px">
            📍 ${b.loc}
          </div>
          <div class="prow">
            <span style="color:var(--ink-soft);font-size:12px">Tipo: <b style="color:var(--ink)">${b.type}</b></span>
          </div>
          <button onclick="toast('Viendo detalles de ${b.title}')" style="margin-top:10px;width:100%;padding:8px;border-radius:9px;background:var(--forest);color:#fff;font-size:13px;font-weight:600;border:none;cursor:pointer">Ver detalles</button>
        </div>
      `, { maxWidth: 240 });
    marker.dataset = { status: b.status, type: b.type };
    marker._bdata = b;
  });
}

function filterMap() {
  const est = document.getElementById('fEstado').value;
  const res = document.getElementById('fResiduo').value;
  if (!leafletMap) return;
  // simple filter: regenerate markers
  leafletMap.eachLayer(layer => {
    if (layer instanceof L.Marker) leafletMap.removeLayer(layer);
  });
  BASURALES.filter(b => {
    const okE = est === 'all' || b.status === est;
    const okR = res === 'all' || b.type.toLowerCase().includes(res);
    return okE && okR;
  }).forEach(b => {
    L.marker([b.lat, b.lng], { icon: makePinIcon(b.color) })
      .addTo(leafletMap)
      .bindPopup(`<div class="popup-inner"><h4>${b.title}</h4><p>${b.loc} — ${b.type}</p></div>`);
  });
}

// ---- REPORT MAP (mini) ----
function initReportMap() {
  if (reportMap) { reportMap.invalidateSize(); return; }
  const el = document.getElementById('reportMap');
  if (!el) return;
  reportMap = L.map('reportMap', { zoomControl: false, dragging: false, scrollWheelZoom: false })
    .setView([-34.6037, -58.3816], 15);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap © CARTO', maxZoom: 19
  }).addTo(reportMap);
  L.marker([-34.6037, -58.3816], { icon: makePinIcon('#cf2e3f') }).addTo(reportMap);
}

// ---- PANEL ----
function initPanel() {
  initPanelMap();
  if (!chartsInit) { initCharts(); chartsInit = true; }
}

function initPanelMap() {
  if (panelMap) { panelMap.invalidateSize(); return; }
  const el = document.getElementById('panelMap');
  if (!el) return;
  panelMap = L.map('panelMap', { zoomControl: false, scrollWheelZoom: false })
    .setView([-34.63, -58.43], 12);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '', maxZoom: 19
  }).addTo(panelMap);
  BASURALES.slice(0, 8).forEach(b => {
    L.marker([b.lat, b.lng], { icon: makePinIcon(b.color) }).addTo(panelMap);
  });
}

// ---- CHARTS ----
function initCharts() {
  const lineCtx = document.getElementById('chartLine');
  const donutCtx = document.getElementById('chartDonut');
  if (!lineCtx || !donutCtx) return;

  new Chart(lineCtx, {
    type: 'line',
    data: {
      labels: ['Enero','Febrero','Marzo','Abril','Mayo','Junio'],
      datasets: [
        {
          label: 'Nuevos reportes',
          data: [85, 102, 98, 130, 115, 145],
          borderColor: '#cf2e3f',
          backgroundColor: 'rgba(207,46,63,.08)',
          fill: true, tension: .42, pointRadius: 5,
          pointBackgroundColor: '#cf2e3f', pointBorderColor: '#fff', pointBorderWidth: 2
        },
        {
          label: 'Limpiezas ejecutadas',
          data: [60, 78, 85, 100, 108, 128],
          borderColor: '#1f9d57',
          backgroundColor: 'rgba(31,157,87,.08)',
          fill: true, tension: .42, pointRadius: 5,
          pointBackgroundColor: '#1f9d57', pointBorderColor: '#fff', pointBorderWidth: 2
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'top', labels: { font: { family: 'Hanken Grotesk', weight: '600', size: 12 }, boxWidth: 14, padding: 16 } } },
      scales: {
        x: { grid: { color: 'rgba(0,0,0,.04)' }, ticks: { font: { family: 'Hanken Grotesk', size: 12 } } },
        y: { grid: { color: 'rgba(0,0,0,.04)' }, ticks: { font: { family: 'Hanken Grotesk', size: 12 } } }
      }
    }
  });

  new Chart(donutCtx, {
    type: 'doughnut',
    data: {
      labels: ['Domiciliario','Escombros','Electrónicos','Orgánicos','Peligrosos'],
      datasets: [{
        data: [38, 22, 14, 18, 8],
        backgroundColor: ['#1f9d57','#c8881a','#0d7d82','#7c3aed','#cf2e3f'],
        borderColor: '#fff',
        borderWidth: 3,
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '68%',
      plugins: {
        legend: {
          position: 'right',
          labels: { font: { family: 'Hanken Grotesk', weight: '600', size: 12 }, boxWidth: 12, padding: 14 }
        }
      }
    }
  });
}

// ---- REPORT WIZARD ----
let currentStep = 1;
function nextStep(n) {
  document.getElementById('panel-' + currentStep).classList.remove('active');
  document.getElementById('step-' + currentStep).classList.remove('active');
  document.getElementById('step-' + currentStep).classList.add('done');
  currentStep = n;
  document.getElementById('panel-' + n).classList.add('active');
  document.getElementById('step-' + n).classList.add('active');
  document.getElementById('step-' + n).classList.remove('done');
  if (n === 2) setTimeout(initReportMap, 80);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function fillDrop() {
  const d = document.getElementById('dropzone');
  const preview = document.getElementById('photoPreview');
  d.classList.add('filled');
  document.getElementById('dropTitle').textContent = '✓ Foto lista para enviar';
  document.getElementById('dropSub').textContent = 'basural_evidencia.jpg · 2.4 MB';
  // show preview with placeholder image
  document.getElementById('previewImg').src = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&q=80';
  document.getElementById('previewName').textContent = 'basural_evidencia.jpg';
  preview.style.display = 'flex';
}

function clearPhoto() {
  const d = document.getElementById('dropzone');
  d.classList.remove('filled');
  document.getElementById('dropTitle').textContent = 'Subir o tomar foto';
  document.getElementById('dropSub').textContent = 'JPG, PNG o directo desde la cámara · máx. 10MB';
  document.getElementById('photoPreview').style.display = 'none';
}

function submitReport() {
  const tipos = [...document.querySelectorAll('.rchip.on')].map(c => c.textContent).join(', ');
  toast('✓ Reporte enviado' + (tipos ? ' · ' + tipos : ''));
  setTimeout(() => {
    currentStep = 1;
    document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.step').forEach(s => { s.classList.remove('active','done'); });
    document.getElementById('panel-1').classList.add('active');
    document.getElementById('step-1').classList.add('active');
    go('map');
  }, 1800);
}

// ---- SATELLITE COMPARE SLIDER ----
function initCompare() {
  const c = document.getElementById('compare');
  const b = document.getElementById('cmpBefore');
  const h = document.getElementById('cmpHandle');
  if (!c || c.dataset.init) return;
  c.dataset.init = 1;
  let drag = false;
  const move = x => {
    const r = c.getBoundingClientRect();
    let p = (x - r.left) / r.width * 100;
    p = Math.max(2, Math.min(98, p));
    b.style.clipPath = `inset(0 ${100-p}% 0 0)`;
    h.style.left = p + '%';
  };
  c.addEventListener('mousedown', e => { drag = true; move(e.clientX); });
  window.addEventListener('mousemove', e => { if (drag) move(e.clientX); });
  window.addEventListener('mouseup', () => drag = false);
  c.addEventListener('touchstart', e => { drag = true; move(e.touches[0].clientX); }, { passive: true });
  c.addEventListener('touchmove', e => { if (drag) move(e.touches[0].clientX); }, { passive: true });
  c.addEventListener('touchend', () => drag = false);
}

function satToggle(btn, label) {
  btn.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
}

// ---- VIDEO MODAL ----
function openVideoModal(id, title) {
  const modal = document.getElementById('videoModal');
  document.getElementById('modalFrame').src = `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
  document.getElementById('modalTitle').textContent = title;
  modal.classList.add('open');
}
function closeVideoModal(e) {
  if (e && e.target !== document.getElementById('videoModal') &&
      !e.target.classList.contains('modal-close')) return;
  const modal = document.getElementById('videoModal');
  modal.classList.remove('open');
  document.getElementById('modalFrame').src = '';
}

// ---- TOAST ----
let toastTimer;
function toast(msg) {
  const t = document.getElementById('toast');
  document.getElementById('toastMsg').textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

// ---- INIT ----
window.addEventListener('DOMContentLoaded', () => {
  go('home');
});
