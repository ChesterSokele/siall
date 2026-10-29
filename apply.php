<?php
/**
 * Careers application handler (SI All Logistics and Trading CC).
 *
 * Receives the multipart form from careers.html, validates it and emails the application
 * (details + CV + supporting documents as attachments) to HR. Nothing is stored on the server.
 *
 * Works on any PHP host (Hostinger shared hosting included). Edit the settings below.
 */
declare(strict_types=1);

// ---------- settings ----------
const HR_EMAIL    = 'info@sialllogistics.com';        // where applications are delivered
const FROM_EMAIL  = 'no-reply@sialllogistics.com';    // use an address on your own domain so mail is not marked as spam
const SITE_NAME   = 'SI All Logistics and Trading CC';
const MAX_FILE    = 5 * 1024 * 1024;                   // per file
const MAX_TOTAL   = 18 * 1024 * 1024;                  // all attachments together
const MAX_DOCS    = 5;                                 // supporting documents besides the CV
const RATE_LIMIT  = 5;                                 // applications per IP per hour
const ALLOWED     = [                                  // extension => accepted MIME types
    'pdf'  => ['application/pdf'],
    'doc'  => ['application/msword', 'application/vnd.ms-office', 'application/octet-stream'],
    'docx' => ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip', 'application/octet-stream'],
    'jpg'  => ['image/jpeg'],
    'jpeg' => ['image/jpeg'],
    'png'  => ['image/png'],
];
const ROLES = [
    'General application', 'Logistics Coordinator', 'Customs & Documentation Clerk', 'Truck Driver',
    'Garment Machinist / Production Assistant', 'Sales & Account Executive', 'Warehouse & Stock Assistant', 'Other',
];

// ---------- helpers ----------
$wantsJson = (($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') === 'XMLHttpRequest')
    || str_contains($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json');

function respond(bool $ok, string $message, int $status = 200, array $extra = []): never
{
    global $wantsJson;
    if ($wantsJson) {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        echo json_encode(['ok' => $ok, 'message' => $message] + $extra, JSON_UNESCAPED_UNICODE);
    } else {
        // plain form post (no JavaScript): go back to the careers page
        header('Location: careers.html?' . ($ok ? 'sent=1' : 'error=' . rawurlencode($message)) . '#apply', true, 303);
    }
    exit;
}

function clean(string $s, int $max = 200): string
{
    $s = trim(preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $s) ?? '');
    return mb_substr($s, 0, $max);
}
function oneLine(string $s, int $max = 200): string
{
    return trim(preg_replace('/\s+/', ' ', clean($s, $max)) ?? '');
}
function mimeHeader(string $s): string
{
    return '=?UTF-8?B?' . base64_encode($s) . '?=';
}

// ---------- request checks ----------
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    echo 'Method not allowed';
    exit;
}

// honeypot (bots fill hidden fields) and a minimum fill-in time
if (oneLine((string)($_POST['website'] ?? '')) !== '') {
    respond(true, 'Thank you. Your application has been received.');   // pretend success, discard
}
$ts = (int)($_POST['ts'] ?? 0);
if ($ts > 0 && (microtime(true) * 1000 - $ts) < 2500) {
    respond(false, 'That was too quick. Please check your details and send again.', 429);
}

// simple per-IP rate limit
$ip   = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rate = sys_get_temp_dir() . '/siall_apply_' . hash('sha256', $ip . 'siall') . '.json';
$now  = time();
$hits = [];
if (is_file($rate)) {
    $hits = array_values(array_filter(json_decode((string)file_get_contents($rate), true) ?: [], fn($t) => is_int($t) && $t > $now - 3600));
}
if (count($hits) >= RATE_LIMIT) {
    respond(false, 'Too many applications from this connection. Please try again later.', 429);
}

// ---------- fields ----------
$name   = oneLine((string)($_POST['name'] ?? ''), 120);
$email  = oneLine((string)($_POST['email'] ?? ''), 160);
$phone  = oneLine((string)($_POST['phone'] ?? ''), 40);
$role   = oneLine((string)($_POST['position'] ?? ''), 100);
$town   = oneLine((string)($_POST['town'] ?? ''), 100);
$exp    = oneLine((string)($_POST['experience'] ?? ''), 60);
$avail  = oneLine((string)($_POST['available'] ?? ''), 60);
$note   = clean((string)($_POST['message'] ?? ''), 4000);
$agreed = ($_POST['consent'] ?? '') !== '';

if ($name === '' || mb_strlen($name) < 2)             respond(false, 'Please enter your full name.', 422);
if (!filter_var($email, FILTER_VALIDATE_EMAIL))        respond(false, 'Please enter a valid email address.', 422);
if (strlen(preg_replace('/\D/', '', $phone) ?? '') < 7) respond(false, 'Please enter a phone number we can reach you on.', 422);
if (!in_array($role, ROLES, true))                     respond(false, 'Please choose the position you are applying for.', 422);
if (!$agreed)                                          respond(false, 'Please confirm that we may keep your details for recruitment.', 422);

// ---------- files ----------
/** Normalise $_FILES entries (single or multiple) into a flat list. */
function collectFiles(string $key): array
{
    if (!isset($_FILES[$key])) return [];
    $f = $_FILES[$key];
    if (!is_array($f['name'])) return [$f];
    $out = [];
    foreach ($f['name'] as $i => $n) {
        $out[] = ['name' => $n, 'type' => $f['type'][$i], 'tmp_name' => $f['tmp_name'][$i], 'error' => $f['error'][$i], 'size' => $f['size'][$i]];
    }
    return $out;
}

$cv   = array_values(array_filter(collectFiles('cv'), fn($f) => $f['error'] !== UPLOAD_ERR_NO_FILE));
$docs = array_values(array_filter(collectFiles('docs'), fn($f) => $f['error'] !== UPLOAD_ERR_NO_FILE));

if (count($cv) !== 1)     respond(false, 'Please attach your CV (one file).', 422);
if (count($docs) > MAX_DOCS) respond(false, 'You can attach up to ' . MAX_DOCS . ' supporting documents.', 422);

$attachments = [];
$total = 0;
$finfo = new finfo(FILEINFO_MIME_TYPE);
foreach ([['CV', $cv], ['Document', $docs]] as [$label, $list]) {
    foreach ($list as $f) {
        if ($f['error'] !== UPLOAD_ERR_OK) {
            respond(false, ($f['error'] === UPLOAD_ERR_INI_SIZE || $f['error'] === UPLOAD_ERR_FORM_SIZE)
                ? 'A file is larger than the 5 MB limit.' : 'A file could not be uploaded. Please try again.', 422);
        }
        if (!is_uploaded_file($f['tmp_name'])) respond(false, 'Invalid upload.', 400);
        if ($f['size'] > MAX_FILE)             respond(false, '"' . oneLine($f['name'], 60) . '" is larger than 5 MB.', 422);
        $ext = strtolower(pathinfo((string)$f['name'], PATHINFO_EXTENSION));
        if (!isset(ALLOWED[$ext]))             respond(false, '"' . oneLine($f['name'], 60) . '" is not an accepted file type (PDF, DOC, DOCX, JPG or PNG).', 422);
        $mime = (string)$finfo->file($f['tmp_name']);
        if (!in_array($mime, ALLOWED[$ext], true)) respond(false, '"' . oneLine($f['name'], 60) . '" does not look like a valid ' . strtoupper($ext) . ' file.', 422);
        $total += (int)$f['size'];
        $safe = preg_replace('/[^A-Za-z0-9._-]+/', '_', pathinfo((string)$f['name'], PATHINFO_FILENAME)) ?: 'file';
        $attachments[] = ['label' => $label, 'name' => mb_substr($safe, 0, 60) . '.' . $ext, 'mime' => $mime, 'path' => $f['tmp_name']];
    }
}
if ($total > MAX_TOTAL) respond(false, 'The files are too large together. Please keep the total under 18 MB.', 422);

// ---------- build the email ----------
$ref      = strtoupper(substr(bin2hex(random_bytes(4)), 0, 8));
$boundary = '=_siall_' . bin2hex(random_bytes(8));
$subject  = "Job application [$ref]: $role - $name";

$lines = [
    "New job application ($ref)",
    '',
    "Position:     $role",
    "Name:         $name",
    "Email:        $email",
    "Phone:        $phone",
    'Town/region:  ' . ($town !== '' ? $town : '-'),
    'Experience:   ' . ($exp !== '' ? $exp : '-'),
    'Available:    ' . ($avail !== '' ? $avail : '-'),
    '',
    'Cover note:',
    $note !== '' ? $note : '-',
    '',
    'Attachments: ' . implode(', ', array_map(fn($a) => $a['label'] . ' - ' . $a['name'], $attachments)),
    '',
    'Sent from the careers form on ' . ($_SERVER['HTTP_HOST'] ?? SITE_NAME) . ' at ' . gmdate('Y-m-d H:i') . ' UTC.',
];
$text = implode("\r\n", $lines);

$body  = "--$boundary\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n";
$body .= chunk_split(base64_encode($text)) . "\r\n";
foreach ($attachments as $a) {
    $data  = (string)file_get_contents($a['path']);
    $body .= "--$boundary\r\nContent-Type: {$a['mime']}; name=\"{$a['name']}\"\r\n"
           . "Content-Transfer-Encoding: base64\r\nContent-Disposition: attachment; filename=\"{$a['name']}\"\r\n\r\n"
           . chunk_split(base64_encode($data)) . "\r\n";
}
$body .= "--$boundary--";

$headers = implode("\r\n", [
    'From: ' . mimeHeader(SITE_NAME . ' Careers') . ' <' . FROM_EMAIL . '>',
    'Reply-To: ' . mimeHeader($name) . ' <' . $email . '>',
    'MIME-Version: 1.0',
    "Content-Type: multipart/mixed; boundary=\"$boundary\"",
    'X-Mailer: siall-careers',
]);

// For local testing set APPLY_MAIL_LOG=/path/to/file to write the email there instead of sending it.
$logFile = getenv('APPLY_MAIL_LOG');
if ($logFile) {
    $sent = (bool)file_put_contents($logFile, "To: " . HR_EMAIL . "\r\nSubject: " . mimeHeader($subject) . "\r\n$headers\r\n\r\n$body\r\n", FILE_APPEND);
} else {
    $sent = mail(HR_EMAIL, mimeHeader($subject), $body, $headers, '-f' . FROM_EMAIL);
}

if (!$sent) {
    respond(false, 'We could not send your application right now. Please email it to ' . HR_EMAIL . ' instead.', 500);
}

$hits[] = $now;
@file_put_contents($rate, json_encode($hits), LOCK_EX);
respond(true, 'Thank you, ' . $name . '. Your application has been received.', 200, ['ref' => $ref]);
