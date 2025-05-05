const proxyUrl = "https://api.allorigins.win/get?url=";

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

async function estraiRiferimenti(targetUrl) {
  const riferimenti = {};
  const doc = await fetchRemoteDOM(targetUrl);

  doc.querySelectorAll('a[href*="riferimento_mappa"]').forEach(a => {
    const url = new URL(a.href);
    const id = url.searchParams.get('riferimento_mappa');
    if (id) {
      riferimenti[id] = a.textContent.trim();
    }
  });

  return riferimenti;
}

async function populateDati() {
  const targetUrl = "http://www.ordinefarmacistimessina.it/newsite1/departments-all.html";
  const riferimenti = await estraiRiferimenti(targetUrl); // aspetta la risposta

  const select = document.getElementById("zona");
  Object.entries(riferimenti).forEach(([value, label]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    select.appendChild(option);
  });

  // Imposta la data odierna
  const dateInput = document.getElementById("date");
  const today = new Date().toISOString().split("T")[0];
  dateInput.value = today;
}

async function initPage() {
  try {
    await populateDati();
  } catch (err) {
    console.error("Errore durante l'inizializzazione:", err);
  } finally {
    const loader = document.getElementById("loader");
    if (loader) {
      loader.classList.add("hidden");
    }
  }
}

document.addEventListener("DOMContentLoaded", initPage);
