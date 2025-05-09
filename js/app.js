const proxyUrl = "proxy.php?mode=";
const ua = navigator.userAgent;
const isAndroid = /Android/i.test(ua);
const isIOS = /iPhone|iPad|iPod/i.test(ua);
const isMobile = isAndroid || isIOS;

async function fetchRemoteDOM(mode) {
  try {
    const response = await fetch(`${proxyUrl}${mode}`);
    if (!response.ok) {
      throw new Error(`Errore nel fetch: ${response.status} ${response.statusText}`);
    }
    
    return await response.text();
  } catch (err) {
    console.error("Errore durante il recupero del DOM:", err);
    throw err;
  }
}

async function estraiRiferimenti() {
  return JSON.parse(await fetchRemoteDOM('riferimenti'));
}

async function populateDati() {
  const riferimenti = await estraiRiferimenti(); // aspetta la risposta

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

function createButton(text, href) {
  return `<a href="${href}" target="_blank" class="btn btn-primary me-2">${text}</a>`;
}

function mettiPulsanti (farmacia) {
  const query = encodeURIComponent(farmacia[1][0] + " " + farmacia[1][2].replace ("Cap ", ""));

  var html = "";

  if (!isMobile) {
    // Desktop: solo Google Maps web
    html += createButton("Apri con Google Maps", `https://www.google.com/maps/search/?api=1&query=${query}`);
  } else if (isAndroid) {
    // Android: Google Maps + Waze
    html += createButton("Apri con Google Maps", `geo:0,0?q=${query}`);
    html += createButton("Apri con Waze", `https://waze.com/ul?q=${query}`);
  } else if (isIOS) {
    // iOS: Apple Maps + Google Maps + Waze
    html += createButton("Apri con Apple Maps", `maps://?q=${query}`);
    html += createButton("Apri con Google Maps", `comgooglemaps://?q=${query}`);
    html += createButton("Apri con Waze", `waze://?q=${query}`);
  }

  return html;
}

function formattaRisultato (risultato) {
  let html = "";
  if (Array.isArray(risultato)) {
    risultato.forEach(farmacia => {
      html += `
        <div class="row mb-3">
          <div class="col-12">
            <div class="card">
              <div class="card-header">
                <b>${farmacia[0]}</b>
              </div>
              <div class="card-body">
                <div class="row mb-3">
                  <div class="col-8 text-start">
                    Indirizzo: ${farmacia[1][0]}<br>${farmacia[1][2]}<br>${farmacia[1][1]}
                  </div>
                  <div class="col-4">                
                    ${mettiPulsanti(farmacia)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    });
  }
  return html;
}

async function eseguiRicerca(event) {
  event.preventDefault(); // Evita il submit del form

  const loader = document.getElementById("loader");
  const cardBody = document.querySelector(".card-body");
  const zona = document.getElementById("zona").value;
  const data = document.getElementById("date").value;
  const fasciaOraria = document.querySelector('input[name="fasciaOraria"]:checked').value;
  //divido la data in modo da creare correttamente la query
  const [year, month, day] = data.split("-");

  // Mostra il loader
  loader.classList.remove("hiddenElement");

  try {
    // Costruisci il target URL (modifica secondo la tua struttura)
    const mode = `risultati&fasciaOraria=${fasciaOraria}&day=${parseInt(day)}&month=${parseInt(month)}&year=${year}&orario=&riferimento_mappa=${zona}`;

    var risultato = JSON.parse (await fetchRemoteDOM (mode));

    // Mostra il risultato nella card
    cardBody.innerHTML = formattaRisultato (risultato) || "<span class='text-danger'>Nessun risultato trovato.</span>";
  } catch (err) {
    console.error("Errore durante la ricerca:", err);
    cardBody.innerHTML = `<span class="text-danger">Errore durante la ricerca. Riprova.</span>`;
  } finally {
    loader.classList.add ("hiddenElement");
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
