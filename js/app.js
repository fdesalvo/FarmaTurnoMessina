async function estraiTesto(urlP) {
    const proxyUrl = 'https://api.allorigins.win/get?url=' + encodeURIComponent(urlP);
    fetch(proxyUrl)
        .then(response => {
	        if (response.ok) return response.json()
	        throw new Error('Network response was not ok.')
        })
        .then(data => {
    const response = await fetch(proxyUrl);
    const data = await response.json();
    const parser = new DOMParser();
    const doc = parser.parseFromString(data.contents, data.content_type);
    
    data.querySelectorAll('a[href*="riferimento_mappa"]').forEach(a => {
      const url = new URL(a.href);
      const id = url.searchParams.get('riferimento_mappa');
      if (id) {
        riferimenti[id] = a.textContent.trim();
      }
    });
    
    console.log(riferimenti);
            });
    return true;
}

const riferimenti = {};

const htmlFarma = estraiTesto ("http://www.ordinefarmacistimessina.it/newsite1/departments-all.html");
