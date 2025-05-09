const proxyUrl = "proxy.php?mode=";

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

function formattaRisultato (risultato) {
  let html = "";
  if (Array.isArray(risultato)) {
    risultato.forEach(farmacia => {
      html += `
        <div class="row mb-3">
          <div class="col-12">
            <div class="card">
              <div class="card-header">
                ${farmacia.nome}
              </div>
              <div class="card-body">
                <p class="card-text">Indirizzo: ${farmacia.indirizzo}</p>
                <p class="card-text">Comune: ${farmacia.comune}</p>
                <p class="card-text">Telefono: ${farmacia.telefono}</p>
                <a href="${farmacia.link_maps}" target="_blank" class="btn btn-primary">Apri su Maps</a>
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
