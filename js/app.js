const proxyUrl = "https://api.allorigins.win/raw?url=";
var riferimenti = {};

async function fetchRemoteDOM(targetUrl) {
  try {
    const response = await fetch(`${proxyUrl}${encodeURIComponent(targetUrl)}`);
    if (!response.ok) {
      throw new Error(`Errore nel fetch: ${response.status} ${response.statusText}`);
    }
    
    const htmlText = await response.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');

    return doc;
  } catch (err) {
    console.error("Errore durante il recupero del DOM:", err);
    throw err;
  }
}

function estraiRiferimenti (targetUrl) {
  fetchRemoteDOM(targetUrl)
    .then (doc => {
      doc.querySelectorAll('a[href*="riferimento_mappa"]').forEach(a => {
        const url = new URL(a.href);
        const id = url.searchParams.get('riferimento_mappa');
        if (id) {
          riferimenti[id] = a.textContent.trim();
        }
      });
    });
}

document.addEventListener("DOMContentLoaded", initPage);

function initPage() {
  // Simula caricamento (puoi rimuovere il timeout se vuoi che sparisca subito)
  setTimeout(() => {
    const loader = document.getElementById("loader");
    if (loader) {
      loader.style.display = "none";
    }
    // Puoi inizializzare qui anche altri elementi, ad esempio popolare il select
    populateZoneSelect();
  }, 500); // Tempo simulato per il caricamento
}

function populateZoneSelect() {
  estraiRiferimenti ("http://www.ordinefarmacistimessina.it/newsite1/departments-all.html");

  const select = document.getElementById("zona");
  Object.entries(riferimenti).forEach(([value, label]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    select.appendChild(option);
  });
}
