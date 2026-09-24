<?php
/**
 * Live Bands Music — Receptor de Notas de Voz para el Cuestionario de Alineación
 * Marketing Amable v2.0
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Método no permitido. Utilizar POST.']);
    exit;
}

if (!isset($_FILES['audio']) || $_FILES['audio']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'No se recibió ningún archivo de audio válido.']);
    exit;
}

$file = $_FILES['audio'];
$maxSize = 25 * 1024 * 1024; // 25 MB máximo por nota de voz

if ($file['size'] > $maxSize) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'El archivo supera el límite permitido de 25 MB.']);
    exit;
}

// Directorio de almacenamiento seguro
$uploadDir = __DIR__ . '/audios/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Prefijo según la pregunta (ej. p3, b2)
$prefix = isset($_POST['preguntaId']) ? preg_replace('/[^a-zA-Z0-9_-]/', '', $_POST['preguntaId']) : 'nota';
$ext = 'webm';
if (isset($file['type'])) {
    if (strpos($file['type'], 'mp4') !== false || strpos($file['type'], 'm4a') !== false) {
        $ext = 'm4a';
    } elseif (strpos($file['type'], 'ogg') !== false) {
        $ext = 'ogg';
    } elseif (strpos($file['type'], 'wav') !== false) {
        $ext = 'wav';
    }
}

$filename = sprintf('audio_%s_%s_%s.%s', $prefix, date('Ymd_His'), substr(md5(uniqid()), 0, 6), $ext);
$targetPath = $uploadDir . $filename;

if (move_uploaded_file($file['tmp_name'], $targetPath)) {
    // Determinar la URL absoluta
    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
    $host = $_SERVER['HTTP_HOST'];
    $dir = dirname($_SERVER['REQUEST_URI']);
    $url = rtrim($protocol . $host . $dir, '/') . '/audios/' . $filename;

    echo json_encode([
        'success' => true,
        'filename' => $filename,
        'url' => $url,
        'size' => $file['size']
    ]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Error al guardar el archivo en el servidor.']);
}
