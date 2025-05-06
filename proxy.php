<?php
header('Content-Type: application/json; charset=utf-8');

// Verifica se è stato passato il parametro `url`
if (!isset($_GET['url']) || empty($_GET['url'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Parametro "url" mancante']);
    exit;
}

$targetUrl = $_GET['url'];
$mode = $_GET['mode'];

// Valida l'URL
if (!filter_var($targetUrl, FILTER_VALIDATE_URL)) {
    http_response_code(400);
    echo json_encode(['error' => 'URL non valido']);
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
    echo json_encode(['error' => 'Errore cURL: ' . curl_error($ch)]);
    curl_close($ch);
    exit;
}

$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$headers = substr($response, 0, $headerSize);
$body = substr($response, $headerSize);

// Detect encoding
$encoding = mb_detect_encoding($body, ['UTF-8', 'ISO-8859-1', 'Windows-1252'], true);

// Convert to UTF-8 if not already
if ($encoding && strtoupper($encoding) !== 'UTF-8') {
    $body = mb_convert_encoding($body, 'UTF-8', $encoding);
}

$statusInfo = [
    'url' => curl_getinfo($ch, CURLINFO_EFFECTIVE_URL),
    'content_type' => curl_getinfo($ch, CURLINFO_CONTENT_TYPE),
    'http_code' => curl_getinfo($ch, CURLINFO_HTTP_CODE),
];

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
        
        $riferimenti = [];
        
        foreach ($links as $link) {
            $href = $link->getAttribute('href');
            parse_str(parse_url($href, PHP_URL_QUERY), $params);
        
            if (isset($params['riferimento_mappa'])) {
                $rawId = $params['riferimento_mappa'];
                $id = preg_replace('/\D/', '', $rawId); // Solo numeri
        
                // Recupera la descrizione associata (es. il testo della lista)
                $parentLi = $link->parentNode->parentNode;
                $descrizione = trim($parentLi->textContent);
        
                $riferimenti[$id] = trim($link->textContent) . ' - ' . $descrizione;
            }
        }
        
        echo json_encode($riferimenti, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    break;

    default:
        echo json_encode([
            'contents' => $body,
            'status' => $statusInfo,
        ]);
    break;
}
