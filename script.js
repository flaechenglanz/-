// ══════════════════════════════════════════════════════════════════
// ⭐ PREIS-KONFIGURATION – HIER ALLE PREISE ÄNDERN ⭐
// Diese Werte werden automatisch sowohl für die Berechnung im
// Hintergrund als auch für die Anzeige der Preise auf der
// Preisrechner-Seite verwendet. Du musst NUR HIER etwas ändern.
// Alle Beträge in Euro. Dezimalzahlen mit Punkt schreiben (z.B. 1.5).
// ══════════════════════════════════════════════════════════════════
const PK_MIN_PRICE = 30; // Mindestpreis pro Auftrag

// Grundpreis pro Fenster (beidseitige Reinigung, nur Glas)
const PK_PRICES = {
  klein:  { ein: 2, label: "Kleine Fenster" },
  mittel: { ein: 4, label: "Mittelgroße Fenster" },
  gross:  { ein: 5, label: "Große Fenster" }
};

// Zuschläge als feste Euro-Beträge pro Fenster, abhängig von der Größenkategorie
const PK_SURCHARGE_AMOUNTS = {
  klein:  { dach: 1,   sprossen: 0.5, falz: 0.5 },
  mittel: { dach: 2,   sprossen: 1,   falz: 1 },
  gross:  { dach: 2.5, sprossen: 1.5, falz: 1.5 }
};

// Preise für große zusammenhängende Glasflächen (Wintergarten, Schaufenster etc.), pro m²
const PK_GLASS = { ein: 2, sprossenPercent: 0.5 };

const PK_SURCHARGE_LABELS = {
  dach: "Dachfenster-Zuschlag",
  sprossen: "Sprossen-Zuschlag",
  falz: "Falz/Rahmen/Fensterbank-Zuschlag"
};

function pkFormatEuroPlain(v){
  return v.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

// Überträgt die Werte oben automatisch in die sichtbaren Texte auf preisrechner.html
function pkSyncDisplayFromConfig(){
  const mindest = document.getElementById('pkp-note-mindestpreis');
  if (mindest) mindest.textContent = pkFormatEuroPlain(PK_MIN_PRICE);

  ["klein", "mittel", "gross"].forEach(cat => {
    const anzahlTotalEl = document.getElementById(`pkp-${cat}-anzahl-total`);
    if (anzahlTotalEl) anzahlTotalEl.textContent = pkFormatEuroPlain(PK_PRICES[cat].ein);
    Object.keys(PK_SURCHARGE_LABELS).forEach(key => {
      const amountEl = document.getElementById(`pkp-${cat}-${key}-amount`);
      if (amountEl) amountEl.textContent = "+" + pkFormatEuroPlain(PK_SURCHARGE_AMOUNTS[cat][key]);
    });
  });
  const wgTotalEl = document.getElementById('pkp-wg-m2-total');
  if (wgTotalEl) wgTotalEl.textContent = pkFormatEuroPlain(PK_GLASS.ein);
  const wgSprAmt = document.getElementById('pkp-wg-sprossen-amount');
  if (wgSprAmt) wgSprAmt.textContent = "+" + pkFormatEuroPlain(PK_GLASS.ein * PK_GLASS.sprossenPercent);

  const glassLabel = document.getElementById('pkp-glass-price-label');
  if (glassLabel) glassLabel.textContent = "Preis: " + pkFormatEuroPlain(PK_GLASS.ein) + "/m² (beidseitig)";
}

let mapInitialized = false;

function initRadiusMap() {
  if (mapInitialized) return;
  if (typeof L === 'undefined') return;

  const geocoderCss = document.createElement('link');
  geocoderCss.rel = 'stylesheet';
  geocoderCss.href = 'https://unpkg.com/leaflet-control-geocoder/dist/Control.Geocoder.css';
  document.head.appendChild(geocoderCss);

  const geocoderJs = document.createElement('script');
  geocoderJs.src = 'https://unpkg.com/leaflet-control-geocoder/dist/Control.Geocoder.js';
  geocoderJs.onload = function() {
    buildMap();
  };
  document.head.appendChild(geocoderJs);
}

function buildMap() {
  const tonwerkstrasseCoords = [52.2045, 8.7011];
  const map = L.map('radius-map').setView(tonwerkstrasseCoords, 12);

  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBL, and the GIS User Community'
  }).addTo(map);

  L.circle(tonwerkstrasseCoords, {
    color: '#1E72AF',
    fillColor: '#88C2EC',
    fillOpacity: 0.35,
    radius: 5000
  }).addTo(map);

  const geocoder = L.Control.geocoder({
    defaultMarkGeocode: false,
    placeholder: "Adresse eingeben...",
    errorMessage: "Adresse nicht gefunden."
  })
  .on('markgeocode', function(e) {
    const latlng = e.geocode.center;

    if (window.currentSearchMarker) {
      map.removeLayer(window.currentSearchMarker);
    }

    window.currentSearchMarker = L.marker(latlng, {
      icon: L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      })
    })
    .addTo(map)
    .bindPopup('<b>Gesuchte Adresse:</b><br>' + e.geocode.name)
    .openPopup();

    map.panTo(latlng);
  })
  .addTo(map);

  mapInitialized = true;
}

// ══════════════════════════════════════════════════════════════════
// ⭐ DYNAMISCHER SCROLL-EFFEKT (FUNKTIONIERT AUF ALLEN 4 SEITEN) ⭐
// ══════════════════════════════════════════════════════════════════
function injectRevealStyles() {
  if (document.getElementById('reveal-style-element')) return;
  const style = document.createElement('style');
  style.id = 'reveal-style-element';
  style.textContent = `
    .reveal {
      opacity: 0;
      clip-path: inset(-40px 100% -40px -40px);
      -webkit-clip-path: inset(-40px 100% -40px -40px);
      transform: translateX(-30px);
      transition: clip-path .9s cubic-bezier(.25,.75,.35,1),
                  -webkit-clip-path .9s cubic-bezier(.25,.75,.35,1),
                  transform .9s cubic-bezier(.25,.75,.35,1),
                  opacity .4s ease;
    }
    .reveal.is-visible {
      opacity: 1 !important;
      clip-path: inset(-40px -40px -40px -40px) !important;
      -webkit-clip-path: inset(-40px -40px -40px -40px) !important;
      transform: translateX(0) !important;
    }
    @media (max-width: 720px) {
      .reveal {
        opacity: 1 !important;
        clip-path: none !important;
        -webkit-clip-path: none !important;
        transform: none !important;
        transition: none !important;
      }
    }
  `;
  document.head.appendChild(style);
}

let revealObserver = null;

function applyRevealClasses() {
  // Erfasst alle spezifischen Elemente aus index.html, leistungen.html, referenzen.html & kontakt.html
  const selectors = [
    '.clean-card',
    '.clean-card-leistungen',
    '.glass-card',
    '.pricecalc-card',
    '.social-card',
    '.contact-card',
    '.ba-card',
    '.faq-item',
    '.ba-slider',
    '.hours-box',
    '.map-frame',
    '.cta-band',
    '.hero-grid > *',
    '.why-grid > *',
    '.about-grid > *',
    '.clean-grid > *',
    '.ba-slider-grid > *',
    '.social-proof-grid > *',
    '.check-list li',
    'section:not(.hero-banner)',
    'form'
  ];

  selectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      // Verhindert, dass Header oder Footer animiert werden
      if (!el.closest('header') && !el.closest('footer')) {
        el.classList.add('reveal');
      }
    });
  });
}

function initScrollReveal() {
  injectRevealStyles();
  applyRevealClasses();

  const elements = document.querySelectorAll('.reveal');
  if (!elements.length) return;

  if (revealObserver) {
    revealObserver.disconnect();
  }

  elements.forEach(function(el) {
    el.classList.remove('is-visible');
  });

  revealObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { 
    threshold: 0.05,
    rootMargin: "0px 0px -30px 0px"
  });

  elements.forEach(function(el) {
    revealObserver.observe(el);
  });
}

function updateSlider(rangeEl, wrapId, handleId) {
  var v = rangeEl.value;
  var wrap = document.getElementById(wrapId);
  var handle = document.getElementById(handleId);
  if (wrap) wrap.style.clipPath = 'inset(0 0 0 ' + v + '%)';
  if (handle) handle.style.left = v + '%';
}

// ---------- Preisrechner-Status im Kontaktformular ----------
function updatePreisStatus(){
  const btn = document.getElementById('pk-status-btn');
  const title = document.getElementById('pk-status-title');
  const sub = document.getElementById('pk-status-sub');
  const icon = document.getElementById('pk-status-icon');
  const hidden = document.getElementById('preis-ergebnis');
  if (!btn || !hidden) return;
  if (hidden.value && hidden.value.trim() !== ''){
    btn.classList.remove('pending');
    btn.classList.add('done');
    if (title) title.textContent = 'Preis berechnet: ' + hidden.value;
    if (sub) sub.textContent = 'Klicken, um den Preisrechner erneut zu öffnen und Angaben zu ändern';
    if (icon) icon.textContent = '✓';
  } else {
    btn.classList.remove('done');
    btn.classList.add('pending');
    if (title) title.textContent = 'Preis noch nicht berechnet';
    if (sub) sub.textContent = 'Klicken, um den Preisrechner zu öffnen';
    if (icon) icon.textContent = '!';
  }
}

// Von der Kontaktseite aus zum Preisrechner wechseln
function openPreisrechnerFromForm(){
  sessionStorage.setItem('pkReturnToKontakt', '1');
  window.location.href = 'preisrechner.html';
}

// ---------- Speichern & Wiederherstellen der Formular-Eingaben ----------
const PK_INPUT_IDS = [
  'pkp-klein-anzahl', 'pkp-klein-dach', 'pkp-klein-sprossen', 'pkp-klein-falz',
  'pkp-mittel-anzahl', 'pkp-mittel-dach', 'pkp-mittel-sprossen', 'pkp-mittel-falz',
  'pkp-gross-anzahl', 'pkp-gross-dach', 'pkp-gross-sprossen', 'pkp-gross-falz',
  'pkp-wg-m2-input', 'pkp-wg-sprossen-slider'
];

function pkSaveInputs() {
  const inputs = {};
  PK_INPUT_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) inputs[id] = el.value;
  });
  sessionStorage.setItem('pkSavedInputs', JSON.stringify(inputs));
}

function pkRestoreInputs() {
  const saved = sessionStorage.getItem('pkSavedInputs');
  if (!saved) return false;
  try {
    const inputs = JSON.parse(saved);
    let hasValue = false;
    PK_INPUT_IDS.forEach(id => {
      const el = document.getElementById(id);
      if (el && inputs[id] !== undefined) {
        el.value = inputs[id];
        if (parseFloat(inputs[id]) > 0) hasValue = true;
      }
    });

    ["klein", "mittel", "gross"].forEach(cat => {
      const inputAnzahl = document.getElementById(`pkp-${cat}-anzahl`);
      if (inputAnzahl) {
        const val = Math.max(0, parseInt(inputAnzahl.value || 0));
        Object.keys(PK_SURCHARGE_LABELS).forEach(key => {
          const extraInput = document.getElementById(`pkp-${cat}-${key}`);
          if (extraInput) extraInput.max = val;
        });
      }
    });
    const pkWgM2Input = document.getElementById("pkp-wg-m2-input");
    const pkWgSprossenInput = document.getElementById("pkp-wg-sprossen-slider");
    if (pkWgM2Input && pkWgSprossenInput) {
      const totalM2 = Math.max(0, parseInt(pkWgM2Input.value || 0));
      pkWgSprossenInput.max = totalM2;
    }

    return hasValue;
  } catch(e) {
    return false;
  }
}

// ---------- Seiten-Setup beim Laden ----------
document.addEventListener('DOMContentLoaded', function(){
  pkSyncDisplayFromConfig();

  // Prüft direkt, ob das Karten-Element auf der Seite existiert
  if (document.getElementById('radius-map')) {
    initRadiusMap();
  }

  // Initialisiert die Wisch-Animation zuverlässig auf ALLEN 4 Seiten
  initScrollReveal();

  // Vom Preisrechner übernommenes Ergebnis in das Kontaktformular einsetzen
  const pending = sessionStorage.getItem('pkPendingResult');
  if (pending) {
    try {
      const data = JSON.parse(pending);
      const hiddenTotal = document.getElementById('preis-ergebnis');
      const hiddenDetails = document.getElementById('preis-details');
      if (hiddenTotal) hiddenTotal.value = data.total;
      if (hiddenDetails) hiddenDetails.value = data.details;
    } catch (e) {}
  }

  updatePreisStatus();
});


// ---------- Standalone Preisrechner (eigene Seite) ----------
(function(){
  const embed = document.getElementById('pkp-embed');
  if (!embed) return;

  function pkFormatEuro(v){
    return v.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
  }

  const pkCategories = ["klein", "mittel", "gross"];
  pkCategories.forEach(cat => {
    const inputAnzahl = document.getElementById(`pkp-${cat}-anzahl`);
    if (!inputAnzahl) return;
    inputAnzahl.addEventListener("input", () => {
      const val = Math.max(0, parseInt(inputAnzahl.value || 0));
      Object.keys(PK_SURCHARGE_LABELS).forEach(key => {
        const extraInput = document.getElementById(`pkp-${cat}-${key}`);
        if (extraInput) {
          extraInput.max = val;
          if (parseInt(extraInput.value) > val) extraInput.value = val;
        }
      });
      pkSaveInputs();
    });
    Object.keys(PK_SURCHARGE_LABELS).forEach(key => {
      const extraInput = document.getElementById(`pkp-${cat}-${key}`);
      if (extraInput) {
        extraInput.addEventListener("input", () => {
          const currentMax = parseInt(extraInput.max || 0);
          let currentVal = parseInt(extraInput.value || 0);
          if (currentVal > currentMax) extraInput.value = currentMax;
          pkSaveInputs();
        });
      }
    });
  });

  const pkWgM2Input = document.getElementById("pkp-wg-m2-input");
  const pkWgSprossenInput = document.getElementById("pkp-wg-sprossen-slider");
  if (pkWgM2Input && pkWgSprossenInput) {
    pkWgM2Input.addEventListener("input", () => {
      const totalM2 = Math.max(0, parseInt(pkWgM2Input.value || 0));
      pkWgSprossenInput.max = totalM2;
      if (parseInt(pkWgSprossenInput.value) > totalM2) pkWgSprossenInput.value = totalM2;
      pkSaveInputs();
    });
    pkWgSprossenInput.addEventListener("input", () => {
      const maxVal = parseInt(pkWgSprossenInput.max || 0);
      if (parseInt(pkWgSprossenInput.value) > maxVal) pkWgSprossenInput.value = maxVal;
      pkSaveInputs();
    });
  }

  let pkpLastResult = null;

  function pkpHideToForm(){
    const toBtn = document.getElementById('pkp-to-form-btn');
    if (toBtn) toBtn.classList.remove('visible');
    pkpLastResult = null;
  }

  embed.addEventListener('input', function(e){
    if (e.target.id === 'pkp-calc-btn' || e.target.id === 'pkp-to-form-btn') return;
    pkpHideToForm();
    pkSaveInputs();
  });

  function pkCalculatePrice(){
    pkSaveInputs();
    let total = 0;
    let hasWindows = false;
    const breakdown = [];
    const detailsLines = [];

    pkCategories.forEach(cat => {
      const input = document.getElementById(`pkp-${cat}-anzahl`);
      if (!input) return;
      const anzahl = Math.max(0, parseInt(input.value || 0));
      if (anzahl <= 0) return;
      hasWindows = true;
      const basePrice = PK_PRICES[cat].ein;
      const sumBase = anzahl * basePrice;
      total += sumBase;
      breakdown.push(`<div class="result-row"><span>${PK_PRICES[cat].label} · ${anzahl}× Grundpreis (beidseitig)</span><span>${pkFormatEuro(sumBase)}</span></div>`);
      detailsLines.push(`${PK_PRICES[cat].label}: ${anzahl}x (${pkFormatEuro(sumBase)})`);
      Object.keys(PK_SURCHARGE_LABELS).forEach(key => {
        const extraEl = document.getElementById(`pkp-${cat}-${key}`);
        let extra = extraEl ? parseInt(extraEl.value || 0) : 0;
        if (extra > anzahl) extra = anzahl;
        if (extra > 0){
          const add = extra * PK_SURCHARGE_AMOUNTS[cat][key];
          total += add;
          breakdown.push(`<div class="result-row"><span>${PK_PRICES[cat].label} · ${PK_SURCHARGE_LABELS[key]} (${extra}×)</span><span>+${pkFormatEuro(add)}</span></div>`);
          detailsLines.push(`${PK_PRICES[cat].label} ${PK_SURCHARGE_LABELS[key]}: ${extra}x (+${pkFormatEuro(add)})`);
        }
      });
    });

    const wgM2 = pkWgM2Input ? parseFloat(pkWgM2Input.value || 0) : 0;
    let wgSprossenM2 = pkWgSprossenInput ? parseFloat(pkWgSprossenInput.value || 0) : 0;
    if (wgM2 > 0){
      if (wgSprossenM2 > wgM2) wgSprossenM2 = wgM2;
      const glassBase = wgM2 * PK_GLASS.ein;
      total += glassBase;
      breakdown.push(`<div class="result-row"><span>Glasflächen · ${wgM2} m² Grundpreis (beidseitig)</span><span>${pkFormatEuro(glassBase)}</span></div>`);
      detailsLines.push(`Glasflächen: ${wgM2} m² (${pkFormatEuro(glassBase)})`);
      if (wgSprossenM2 > 0){
        const sprossenAufpreis = wgSprossenM2 * PK_GLASS.ein * PK_GLASS.sprossenPercent;
        total += sprossenAufpreis;
        breakdown.push(`<div class="result-row"><span>Glasflächen · Sprossen-Zuschlag (${wgSprossenM2} m²)</span><span>+${pkFormatEuro(sprossenAufpreis)}</span></div>`);
        detailsLines.push(`Glasflächen Sprossen-Zuschlag: ${wgSprossenM2} m² (+${pkFormatEuro(sprossenAufpreis)})`);
      }
    }

    if (total < PK_MIN_PRICE && (hasWindows || wgM2 > 0)) total = PK_MIN_PRICE;

    const card = document.getElementById("pkp-result-card");
    const outTotal = document.getElementById("pkp-result-total");
    const outBreak = document.getElementById("pkp-result-breakdown");
    const empty = document.getElementById("pkp-result-empty");
    const toBtn = document.getElementById("pkp-to-form-btn");

    if (card) card.classList.add("visible");

    if (!hasWindows && wgM2 <= 0){
      if (outTotal) outTotal.textContent = pkFormatEuro(0);
      if (outBreak) outBreak.innerHTML = "";
      if (empty) empty.style.display = "block";
      if (toBtn) toBtn.classList.remove('visible');
      pkpLastResult = null;
      return;
    }

    if (outTotal) outTotal.textContent = pkFormatEuro(total);
    if (outBreak) outBreak.innerHTML = breakdown.join("");
    if (empty) empty.style.display = "none";

    pkpLastResult = { total: pkFormatEuro(total), details: detailsLines.join(" | ") };
    if (toBtn) toBtn.classList.add('visible');

    if (card) card.scrollIntoView({behavior:"smooth", block:"center"});
  }

  const calcBtn = document.getElementById("pkp-calc-btn");
  if (calcBtn) calcBtn.addEventListener("click", pkCalculatePrice);

  const toFormBtn = document.getElementById("pkp-to-form-btn");
  if (toFormBtn){
    toFormBtn.addEventListener("click", function(){
      if (!pkpLastResult) return;
      pkSaveInputs();
      sessionStorage.setItem('pkPendingResult', JSON.stringify(pkpLastResult));
      sessionStorage.removeItem('pkReturnToKontakt');
      window.location.href = 'kontakt.html';
    });
  }

  if (pkRestoreInputs()) {
    pkCalculatePrice();
  }
})();