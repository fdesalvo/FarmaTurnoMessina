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
  var doc = fetchRemoteDOM(targetUrl);

    doc.querySelectorAll('a[href*="riferimento_mappa"]').forEach(a => {
      const url = new URL(a.href);
      const id = url.searchParams.get('riferimento_mappa');
      if (id) {
        riferimenti[id] = a.textContent.trim();
      }
    });
    
    console.log(riferimenti);

}


estraiRiferimenti ("http://www.ordinefarmacistimessina.it/newsite1/departments-all.html");
