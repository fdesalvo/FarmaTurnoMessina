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

  // Imposto i valori delle zone
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

  // Imposto funzione sul pulsante ricerca
  document.getElementById("btnRicerca").addEventListener("click", eseguiRicerca);
}

function parseFarmacieNotturne(rawText) {
  const risultato = {};
  
  // Rimuove "NOTTURNO" e spazi iniziali/finali
  rawText = rawText.replace(/^NOTTURNO\s*/i, '').trim();

  // Divide le sezioni delle farmacie: 2 o più \n
  const blocchi = rawText.split(/\n{2,}/);

  blocchi.forEach(blocco => {
    const righe = blocco.split('\n');
    if (righe.length >= 2) {
      const nome = righe[0].trim();
      const indirizzo = righe.slice(1).join(' ').trim(); // se l'indirizzo va su più righe
      if (nome && indirizzo) {
        risultato[nome] = indirizzo;
      }
    }
  });

  return risultato;
}

async function eseguiRicerca(event) {
  event.preventDefault(); // Evita il submit del form

  const loader = document.getElementById("loader");
  const cardBody = document.querySelector(".card-body");
  const zona = document.getElementById("zona").value;
  const data = document.getElementById("date").value;

  // Mostra il loader
  loader.classList.remove("hiddenElement");

  try {
    // Costruisci il target URL (modifica secondo la tua struttura)
    const targetUrl = `http://www.ordinefarmacistimessina.it/newsite1/turni.html?riferimento_mappa=${zona}&data=${data}`;

    const doc = await fetchRemoteDOM(targetUrl);

    // Estrai il contenuto utile dal DOM (modifica secondo la struttura reale)
    var risultato = doc.querySelector("body > div > table > tbody > tr > td > table > tbody > tr > td > center > table > tbody > tr > td > table > tbody > tr > td:last-child").innerText;
    risultato = parseFarmacieNotturne (risultato);
      
    // Mostra il risultato nella card
    cardBody.innerHTML = risultato || "Nessun risultato trovato.";
  } catch (err) {
    console.error("Errore durante la ricerca:", err);
    cardBody.innerHTML = `<span class="text-danger">Errore durante la ricerca. Riprova.</span>`;
  } finally {
    loader.classList.add("hiddenElement");
  }
}

async function initPage() {
  try {
    await populateDati();
  } catch (err) {
    console.error("Errore durante l'inizializzazione:", err);
  } finally {
    const loader = document.getElementById("loader");
    if (loader) {
      loader.classList.add("hiddenElement");
    }
  }
}

document.addEventListener("DOMContentLoaded", initPage);
