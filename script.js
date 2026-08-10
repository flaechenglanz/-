// ══════════════════════════════════════════════════════════════════
// ⭐ PREIS-KONFIGURATION
// ══════════════════════════════════════════════════════════════════
const PK_MIN_PRICE = 30;
const PK_ERWEITERT_PERCENT = 0.5;

const PK_PRICES = {
  klein:  { ein: 2, label: "Kleine Fenster" },
  mittel: { ein: 3, label: "Mittelgroße Fenster" },
  gross:  { ein: 4, label: "Große Fenster" }
};

const PK_SURCHARGE_AMOUNTS = {
  klein:  { sprossen: 0.5 },
  mittel: { sprossen: 1 },
  gross:  { sprossen: 1.5 }
};

const PK_SURCHARGE_LABELS = {
  sprossen: "Sprossen-Zuschlag"
};

const PK_INPUT_IDS = [
  'pkp-klein-anzahl', 'pkp-klein-sprossen',
  'pkp-mittel-anzahl', 'pkp-mittel-sprossen',
  'pkp-gross-anzahl', 'pkp-gross-sprossen'
];

const PK_CATEGORIES = ["klein", "mittel", "gross"];

// ══════════════════════════════════════════════════════════════════
// ⭐ HILFSFUNKTIONEN & DISPLAY-SYNC (KORRIGIERT)
// ══════════════════════════════════════════════════════════════════
function pkFormatEuroPlain(v) {
  return v.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

function pkSyncDisplayFromConfig() {
  // 1. Mindestpreis im Hinweis aktualisieren
  const mindest = document.getElementById('pkp-note-mindestpreis');
  if (mindest) mindest.textContent = pkFormatEuroPlain(PK_MIN_PRICE);

  // 2. Grundpreise und Aufpreise der Fenstertypen auf der Seite aktualisieren
  PK_CATEGORIES.forEach(cat => {
    // Aktualisiert z. B. #pkp-klein-price-label -> "Preis: 2,00 € (beidseitig)"
    const priceLabel = document.getElementById(`pkp-${cat}-price-label`);
    if (priceLabel) {
      priceLabel.textContent = `Preis: ${pkFormatEuroPlain(PK_PRICES[cat].ein)} (beidseitig)`;
    }

    // Aktualisiert die Zuschlags-Anzeigen (+1,00 €, etc.)
    Object.keys(PK_SURCHARGE_LABELS).forEach(key => {
      const amountEl = document.getElementById(`pkp-${cat}-${key}-amount`);
      if (amountEl && PK_SURCHARGE_AMOUNTS[cat][key] !== undefined) {
        amountEl.textContent = "+" + pkFormatEuroPlain(PK_SURCHARGE_AMOUNTS[cat][key]);
      }
    });
  });
}

// ══════════════════════════════════════════════════════════════════
// ⭐ KARTE (LEAFLET)
// ══════════════════════════════════════════════════════════════════
let mapInitialized = false;

function initRadiusMap() {
  if (mapInitialized || typeof L === 'undefined') return;

  const geocoderCss = document.createElement('link');
  geocoderCss.rel = 'stylesheet';
  geocoderCss.href = 'https://unpkg.com/leaflet-control-geocoder/dist/Control.Geocoder.css';
  document.head.appendChild(geocoderCss);

  const geocoderJs = document.createElement('script');
  geocoderJs.src = 'https://unpkg.com/leaflet-control-geocoder/dist/Control.Geocoder.js';
  geocoderJs.onload = buildMap;
  document.head.appendChild(geocoderJs);
}

function refreshRadiusMap() {
  if (mapInitialized && window.radiusMapInstance) {
    window.radiusMapInstance.invalidateSize();
  }
}

function buildMap() {
  const tonwerkstrasseCoords = [52.2045, 8.7011];
  const map = L.map('radius-map').setView(tonwerkstrasseCoords, 12);
  window.radiusMapInstance = map;

  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBL, and the GIS User Community'
  }).addTo(map);

  L.circle(tonwerkstrasseCoords, {
    color: '#1E72AF',
    fillColor: '#88C2EC',
    fillOpacity: 0.35,
    radius: 5000
  }).addTo(map);

  L.Control.geocoder({
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
// ⭐ SCROLL-REVEAL ANIMATIONEN
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
  const selectors = [
    '.clean-card', '.clean-card-leistungen', '.glass-card', '.pricecalc-card',
    '.social-card', '.contact-card', '.ba-card', '.faq-item', '.ba-slider',
    '.hours-box', '.map-frame', '.cta-band', '.hero-grid > *', '.why-grid > *',
    '.about-grid > *', '.clean-grid > *', '.ba-slider-grid > *', '.social-proof-grid > *',
    '.check-list li', 'section:not(.hero-banner)', 'form'
  ];

  selectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
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

  if (revealObserver) revealObserver.disconnect();

  elements.forEach(el => el.classList.remove('is-visible'));

  revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05, rootMargin: "0px 0px -30px 0px" });

  elements.forEach(el => revealObserver.observe(el));
}

function updateSlider(rangeEl, wrapId, handleId) {
  const v = rangeEl.value;
  const wrap = document.getElementById(wrapId);
  const handle = document.getElementById(handleId);
  if (wrap) wrap.style.clipPath = 'inset(0 0 0 ' + v + '%)';
  if (handle) handle.style.left = v + '%';
}

// ══════════════════════════════════════════════════════════════════
// ⭐ REFERENZEN-SLIDESHOW (immer 2 Vorher/Nachher-Bilder sichtbar)
// ══════════════════════════════════════════════════════════════════
let baCurrentPage = 0;

function baSlideshowNav(direction) {
  const grid = document.getElementById('ba-slider-grid');
  if (!grid) return;

  const slides = Array.from(grid.querySelectorAll('.ba-slider'));
  const pages = [...new Set(slides.map(el => parseInt(el.dataset.baPage, 10)))].sort((a, b) => a - b);
  if (!pages.length) return;

  const currentIndex = pages.indexOf(baCurrentPage);
  const nextIndex = currentIndex + direction;
  if (nextIndex < 0 || nextIndex >= pages.length) return;

  baCurrentPage = pages[nextIndex];

  slides.forEach(el => {
    el.hidden = parseInt(el.dataset.baPage, 10) !== baCurrentPage;
  });

  const prevBtn = document.getElementById('ba-prev-btn');
  const nextBtn = document.getElementById('ba-next-btn');
  if (prevBtn) prevBtn.disabled = baCurrentPage === pages[0];
  if (nextBtn) nextBtn.disabled = baCurrentPage === pages[pages.length - 1];
}

function initBaSlideshow() {
  const grid = document.getElementById('ba-slider-grid');
  if (!grid) return;

  baCurrentPage = 0;
  const prevBtn = document.getElementById('ba-prev-btn');
  const nextBtn = document.getElementById('ba-next-btn');
  if (prevBtn) prevBtn.disabled = true;
  if (nextBtn) {
    const slides = grid.querySelectorAll('.ba-slider');
    const pages = new Set(Array.from(slides).map(el => parseInt(el.dataset.baPage, 10)));
    nextBtn.disabled = pages.size <= 1;
  }
}

// ══════════════════════════════════════════════════════════════════
// ⭐ STATUS, SPEICHERN & WIEDERHERSTELLEN
// ══════════════════════════════════════════════════════════════════
function updatePreisStatus() {
  const btn = document.getElementById('pk-status-btn');
  const title = document.getElementById('pk-status-title');
  const sub = document.getElementById('pk-status-sub');
  const icon = document.getElementById('pk-status-icon');
  const hidden = document.getElementById('preis-ergebnis');

  if (!btn || !hidden) return;

  if (hidden.value && hidden.value.trim() !== '') {
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

// Von der Kontaktseite aus zum Preisrechner wechseln (+ Formulardaten speichern)
function openPreisrechnerFromForm() {
  saveKontaktForm(); // 👈 Speichert aktuelle Kontaktdaten ab
  sessionStorage.setItem('pkReturnToKontakt', '1');
  window.location.hash = '#preisrechner';
}

// ---------- Preisrechner Eingaben speichern ----------
function pkSaveInputs() {
  const inputs = {};
  PK_INPUT_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) inputs[id] = el.value;
  });
  const artSel = document.querySelector('input[name="pkp-art"]:checked');
  inputs['pkp-art'] = artSel ? artSel.value : 'grund';
  sessionStorage.setItem('pkSavedInputs', JSON.stringify(inputs));
}

function pkSyncInputLimits() {
  PK_CATEGORIES.forEach(cat => {
    const inputAnzahl = document.getElementById(`pkp-${cat}-anzahl`);
    if (inputAnzahl) {
      const val = Math.max(0, parseInt(inputAnzahl.value || 0));
      Object.keys(PK_SURCHARGE_LABELS).forEach(key => {
        const extraInput = document.getElementById(`pkp-${cat}-${key}`);
        if (extraInput) {
          extraInput.max = val;
          if (parseInt(extraInput.value || 0) > val) extraInput.value = val;
        }
      });
    }
  });
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

    if (inputs['pkp-art']) {
      const artEl = document.querySelector(`input[name="pkp-art"][value="${inputs['pkp-art']}"]`);
      if (artEl) artEl.checked = true;
    }

    pkSyncInputLimits();
    return hasValue;
  } catch(e) {
    return false;
  }
}

// ---------- NEW: Kontaktformular Eingaben speichern & wiederherstellen ----------
function saveKontaktForm() {
  const form = document.querySelector('form');
  if (!form) return;

  const formData = {};
  // Speichert automatisch alle Input-, Textarea- und Select-Felder im Formular
  form.querySelectorAll('input, textarea, select').forEach(el => {
    if (el.name && el.type !== 'hidden' && el.type !== 'submit') {
      if (el.type === 'checkbox' || el.type === 'radio') {
        formData[el.name] = el.checked;
      } else {
        formData[el.name] = el.value;
      }
    }
  });
  sessionStorage.setItem('kontaktSavedInputs', JSON.stringify(formData));
}

function restoreKontaktForm() {
  const saved = sessionStorage.getItem('kontaktSavedInputs');
  if (!saved) return;
  try {
    const formData = JSON.parse(saved);
    const form = document.querySelector('form');
    if (!form) return;

    Object.keys(formData).forEach(name => {
      const el = form.querySelector(`[name="${name}"]`);
      if (el) {
        if (el.type === 'checkbox' || el.type === 'radio') {
          el.checked = formData[name];
        } else {
          el.value = formData[name];
        }
      }
    });
  } catch(e) {}
}

// ══════════════════════════════════════════════════════════════════
// ⭐ SEITEN-INIT (DOM LOADED)
// ══════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function() {
  pkSyncDisplayFromConfig();

  if (document.getElementById('radius-map')) {
    initRadiusMap();
  }

  initScrollReveal();
  initBaSlideshow();

  // Vom Preisrechner übernommenes Ergebnis im Kontaktformular einsetzen
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

  // Bereits getätigte Kontaktdaten auf kontakt.html wiederherstellen & Ereignisse sichern
  const kontaktForm = document.querySelector('form');
  if (kontaktForm) {
    restoreKontaktForm(); // Lädt Daten beim Seitenaufruf zurück

    // Bei jeder Texteingabe im Kontaktformular automatisch zwischenspeichern
    kontaktForm.addEventListener('input', saveKontaktForm);
    kontaktForm.addEventListener('change', saveKontaktForm);

    // Nach erfolgreichem Absenden den Speicher leeren
    kontaktForm.addEventListener('submit', () => {
      sessionStorage.removeItem('kontaktSavedInputs');
    });
  }

  updatePreisStatus();
});

// ══════════════════════════════════════════════════════════════════
// ⭐ PREISRECHNER-LOGIK
// ══════════════════════════════════════════════════════════════════
(function() {
  const embed = document.getElementById('pkp-embed');
  if (!embed) return;

  let pkpLastResult = null;

  PK_INPUT_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => {
        pkSyncInputLimits();
        pkSaveInputs();
        pkpHideToForm();
      });
    }
  });

  document.querySelectorAll('input[name="pkp-art"]').forEach(el => {
    el.addEventListener('change', () => {
      pkSaveInputs();
      pkpHideToForm();
    });
  });

  function pkpHideToForm() {
    const toBtn = document.getElementById('pkp-to-form-btn');
    if (toBtn) toBtn.classList.remove('visible');
    pkpLastResult = null;
  }

  function pkCalculatePrice() {
    pkSaveInputs();
    let hasWindows = false;
    const breakdown = [];
    const detailsLines = [];
    const catAnzahl = {};
    let baseTotal = 0;

    PK_CATEGORIES.forEach(cat => {
      const input = document.getElementById(`pkp-${cat}-anzahl`);
      const anzahl = input ? Math.max(0, parseInt(input.value || 0)) : 0;
      catAnzahl[cat] = anzahl;
      if (anzahl > 0) {
        hasWindows = true;
        baseTotal += anzahl * PK_PRICES[cat].ein;
      }
    });

    const artSel = document.querySelector('input[name="pkp-art"]:checked');
    const art = artSel ? artSel.value : 'grund';
    const erweitertAufpreis = (art === 'erweitert' && baseTotal > 0) ? baseTotal * PK_ERWEITERT_PERCENT : 0;

    let total = baseTotal + erweitertAufpreis;

    // 1. Grundpreis mit Einzelpositionen & Gesamt
    breakdown.push(`<div class="result-heading" style="font-size:1.1rem; font-weight:800; margin-bottom:8px;">Grundpreis:</div>`);

    PK_CATEGORIES.forEach(cat => {
      const anzahl = catAnzahl[cat];
      const sumBase = anzahl * PK_PRICES[cat].ein;
      breakdown.push(`<div class="result-row"><span>${PK_PRICES[cat].label} · ${anzahl}× eingetragen</span><span>${pkFormatEuroPlain(sumBase)}</span></div>`);
      if (anzahl > 0) {
        detailsLines.push(`${PK_PRICES[cat].label}: ${anzahl}x (${pkFormatEuroPlain(sumBase)})`);
      }
    });

    breakdown.push(`<div class="result-row" style="font-weight:800; border-top:1px solid rgba(0,0,0,0.15); margin-top:6px; padding-top:6px;"><span>Grundpreis gesamt:</span><span>${pkFormatEuroPlain(baseTotal)}</span></div>`);

    // 2. Erweiterte Reinigung (+50%) – Nur wenn ausgewählt
    if (art === 'erweitert' && baseTotal > 0) {
      breakdown.push(`<div class="result-row" style="font-weight:700; color:var(--ink); margin-top:12px;"><span>Erweiterte Reinigung (+50%)</span><span>+${pkFormatEuroPlain(erweitertAufpreis)}</span></div>`);
      detailsLines.push(`Reinigungsart: Erweiterte Reinigung (+${pkFormatEuroPlain(erweitertAufpreis)})`);
    } else if (hasWindows) {
      detailsLines.push(`Reinigungsart: Grundreinigung`);
    }

    // 3. Sprossen-Zuschlag Einzelpositionen & Gesamt
    let sprossenTotal = 0;
    breakdown.push(`<div class="result-heading" style="font-size:1.1rem; font-weight:800; margin-top:16px; margin-bottom:8px;">Sprossen-Zuschlag:</div>`);

    PK_CATEGORIES.forEach(cat => {
      const anzahl = catAnzahl[cat];
      const extraEl = document.getElementById(`pkp-${cat}-sprossen`);
      let extra = extraEl ? parseInt(extraEl.value || 0) : 0;
      if (extra > anzahl) extra = anzahl;

      const add = extra * PK_SURCHARGE_AMOUNTS[cat].sprossen;
      sprossenTotal += add;

      breakdown.push(`<div class="result-row"><span>${PK_PRICES[cat].label} · ${extra}× Sprossen</span><span>+${pkFormatEuroPlain(add)}</span></div>`);
      if (extra > 0) {
        detailsLines.push(`${PK_PRICES[cat].label} Sprossen-Zuschlag: ${extra}x (+${pkFormatEuroPlain(add)})`);
      }
    });

    breakdown.push(`<div class="result-row" style="font-weight:800; border-top:1px solid rgba(0,0,0,0.15); margin-top:6px; padding-top:6px;"><span>Sprossenaufschlag gesamt</span><span>+${pkFormatEuroPlain(sprossenTotal)}</span></div>`);

    total += sprossenTotal;

    if (total < PK_MIN_PRICE && hasWindows) {
      total = PK_MIN_PRICE;
    }

    // 4. Gesamtpreis am Ende
    breakdown.push(`<div class="result-row" style="font-weight:900; font-size:1.3rem; border-top:2px solid var(--ink); margin-top:16px; padding-top:10px;"><span>Gesamtpreis:</span><span>${pkFormatEuroPlain(total)}</span></div>`);

    const card = document.getElementById("pkp-result-card");
    const outTotal = document.getElementById("pkp-result-total");
    const outBreak = document.getElementById("pkp-result-breakdown");
    const empty = document.getElementById("pkp-result-empty");
    const toBtn = document.getElementById("pkp-to-form-btn");

    if (card) card.classList.add("visible");

    if (!hasWindows) {
      if (outTotal) outTotal.textContent = pkFormatEuroPlain(0);
      if (outBreak) outBreak.innerHTML = "";
      if (empty) empty.style.display = "block";
      if (toBtn) toBtn.classList.remove('visible');
      pkpLastResult = null;
      return;
    }

    if (outTotal) outTotal.textContent = pkFormatEuroPlain(total);
    if (outBreak) outBreak.innerHTML = breakdown.join("");
    if (empty) empty.style.display = "none";

    pkpLastResult = { total: pkFormatEuroPlain(total), details: detailsLines.join(" | ") };
    if (toBtn) toBtn.classList.add('visible');

    if (card) card.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  const calcBtn = document.getElementById("pkp-calc-btn");
  if (calcBtn) calcBtn.addEventListener("click", pkCalculatePrice);

  const toFormBtn = document.getElementById("pkp-to-form-btn");
  if (toFormBtn) {
    toFormBtn.addEventListener("click", function() {
      if (!pkpLastResult) return;
      pkSaveInputs();
      sessionStorage.setItem('pkPendingResult', JSON.stringify(pkpLastResult));
      sessionStorage.removeItem('pkReturnToKontakt');
      window.location.hash = '#kontakt';
    });
  }

  if (pkRestoreInputs()) {
    pkCalculatePrice();
  }
})();
