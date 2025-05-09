<?php
header('Content-Type: application/json; charset=utf-8');

$mode = $_GET['mode'];
$fasciaOraria = $_GET['fasciaOraria'];
$day = $_GET['day'];
$month = $_GET['month'];
$year = $_GET['year'];
$riferimento_mappa = $_GET['riferimento_mappa'];

switch ($mode) {
    case 'riferimenti':
        $targetUrl = 'http://www.ordinefarmacistimessina.it/newsite1/departments-all.html';
    break;
    case 'risultati':
        $targetUrl = 'http://www.ordinefarmacistimessina.it/turni-farmacie/stampa.asp'
                   . '?day='.$day
                   . '&month='.$month
                   . '&year='.$year
                   . '&orario='
                   . '&riferimento_mappa='.$riferimento_mappa;
    break;
 
    default:
        http_response_code(400);
        echo json_encode(array ('error' => 'Accesso negato'));
        exit;
    break;
}

// Valida l'URL
if (!filter_var($targetUrl, FILTER_VALIDATE_URL)) {
    http_response_code(400);
    echo json_encode(array ('error' => 'URL non valido'));
    exit;
}

// Inizializza cURL
$ch = curl_init($targetUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
//curl_setopt($ch, CURLOPT_USERAGENT, 'AllOrigins PHP Clone');
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_HEADER, true);

$response = curl_exec($ch);

if (curl_errno($ch)) {
    http_response_code(500);
    echo json_encode(array ('error' => 'Errore cURL: ' . curl_error($ch)));
    curl_close($ch);
    exit;
}

$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$headers = substr($response, 0, $headerSize);
$body = substr($response, $headerSize);

// Detect encoding
$encoding = mb_detect_encoding($body, array ('UTF-8', 'ISO-8859-1', 'Windows-1252'), true);

// Convert to UTF-8 if not already
if ($encoding && strtoupper($encoding) !== 'UTF-8') {
    $body = mb_convert_encoding($body, 'UTF-8', $encoding);
}

$statusInfo = array (
    'url' => curl_getinfo($ch, CURLINFO_EFFECTIVE_URL),
    'content_type' => curl_getinfo($ch, CURLINFO_CONTENT_TYPE),
    'http_code' => curl_getinfo($ch, CURLINFO_HTTP_CODE),
);

curl_close($ch);

// Costruzione della risposta JSON come AllOrigins
switch ($mode) {
    case 'riferimenti':
        $dom = new DOMDocument();
        libxml_use_internal_errors(true); // Evita warning per HTML malformato
        $dom->loadHTML($body);
        libxml_clear_errors();
        
        $xpath = new DOMXPath($dom);
        $links = $xpath->query('//h5/a[contains(@href, "riferimento_mappa")]');

        $riferimenti = array ();
        
        foreach ($links as $link) {

            $href = $link->getAttribute('href');
            parse_str(parse_url($href, PHP_URL_QUERY), $params);

            if (isset($params['riferimento_mappa'])) {
                $rawId = $params['riferimento_mappa'];
                $id = preg_replace('/\D/', '', $rawId); // Solo numeri

                // Recupera la descrizione associata (es. il testo della lista)
                $parentLi = $link->parentNode->parentNode;
                foreach ($parentLi->childNodes as $child) {
                    if ($child->nodeName == 'p') {
                        $descrizione = trim($child->textContent);
                        break;
                    }
                }
                $riferimenti[$id] = trim($link->textContent) . ' - ' . $descrizione;
            }
        }
        
        echo json_encode($riferimenti, JSON_UNESCAPED_UNICODE);
    break;

    case 'risultati':
        $risultati = array ();

        $dom = new DOMDocument();
        libxml_use_internal_errors(true); // Evita warning per HTML malformato
        $dom->loadHTML($body);
        libxml_clear_errors();

        $xpath = new DOMXPath($dom);
        $query = '//h2[contains(translate(normalize-space(.), "abcdefghijklmnopqrstuvwxyz", "ABCDEFGHIJKLMNOPQRSTUVWXYZ"), "NOTTURNO")]';
        $nodes = $xpath->query($query);
        if ($nodes->length === 0) {
            array_push($risultati, "Nessuna farmacia trovata");
        } else {
            foreach ($nodes as $i => $node) {
                // Per ottenere l'elemento padre <td> (se ti serve):
                $td = preg_split('/<img\b[^>]*>/i', $dom->saveHTML($node->parentNode));
                $x = array_shift ($td);
                foreach ($td as $x => $y) {
                    $td[$x] = explode ("<br>", $y);
                }
                foreach ($td as $x => $y) {
                    $text = $y[1];
                    $matches = array ();
                    $telefonoPos = stripos($text, 'Telefono');
                    $capPos = stripos($text, 'Cap');

                    if ($telefonoPos !== false && $capPos !== false) {
                        $part1 = trim(substr($text, 0, $telefonoPos));
                        $part2 = trim(substr($text, $telefonoPos, $capPos - $telefonoPos));
                        $part3 = trim(substr($text, $capPos));

                        $matches = array ($part1, $part2, $part3);
                    }
                    array_push ($risultati, array (strip_tags ($y[0]), $matches));
                }
            }
        }

        echo json_encode($risultati, JSON_UNESCAPED_UNICODE);
    break;

    default:
        echo json_encode(array (
            'contents' => $body,
            'status' => $statusInfo,
        ));
    break;
}
?>