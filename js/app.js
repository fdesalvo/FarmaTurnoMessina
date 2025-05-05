async function estraiTesto(url) {
    const proxyUrl = 'https://api.allorigins.win/get?url=' + encodeURIComponent(url);
    const response = await fetch(proxyUrl);
    const data = await response.json();
    const parser = new DOMParser();
    const doc = parser.parseFromString(data.contents, 'text/html');

    return doc;
}

const htmlFarma = estraiTesto ("http://www.ordinefarmacistimessina.it/newsite1/departments-all.html");
const riferimenti = {};
htmlFarma.querySelectorAll('a[href*="riferimento_mappa"]').forEach(a => {
  const url = new URL(a.href);
  const id = url.searchParams.get('riferimento_mappa');
  if (id) {
    riferimenti[id] = a.textContent.trim();
  }
});

console.log(riferimenti);