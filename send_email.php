<?php
// Всегда устанавливаем CORS заголовки в начале
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Обработка preflight OPTIONS запроса для CORS (обязательно!)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Max-Age: 86400');
    http_response_code(200);
    exit;
}

header('Content-Type: application/json; charset=utf-8');

/**
 * Очистка строки для plain-text письма:
 * убираем управляющие символы, но сохраняем переносы строк и спецсимволы как есть.
 */
function cleanForPlainText($value) {
    if (!is_string($value)) return 'Не указано';
    $value = trim($value);
    if ($value === '') return 'Не указано';
    // Удаляем управляющие символы кроме \n \r \t
    return preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $value);
}

// Проверка метода запроса
$request_method = $_SERVER['REQUEST_METHOD'] ?? 'UNKNOWN';
if ($request_method !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false, 
        'message' => 'Метод не разрешен. Ожидается POST, получен: ' . $request_method
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Получение данных из запроса
$input = file_get_contents('php://input');
if ($input === false) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Ошибка чтения данных запроса']);
    exit;
}

$data = json_decode($input, true);
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Ошибка декодирования JSON: ' . json_last_error_msg()]);
    exit;
}

// Проверка reCAPTCHA
$recaptcha_secret = '6LeqwWIsAAAAAE_PqliG-EKZykFMLC3s1wvivKnW'; // Секретный ключ reCAPTCHA
$recaptcha_response = isset($data['recaptcha_token']) ? $data['recaptcha_token'] : '';

if (empty($recaptcha_response)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'reCAPTCHA не пройдена']);
    exit;
}

// Верификация reCAPTCHA
$recaptcha_url = 'https://www.google.com/recaptcha/api/siteverify';
$recaptcha_data = [
    'secret' => $recaptcha_secret,
    'response' => $recaptcha_response
];

$recaptcha_options = [
    'http' => [
        'method' => 'POST',
        'header' => 'Content-Type: application/x-www-form-urlencoded',
        'content' => http_build_query($recaptcha_data)
    ]
];

$recaptcha_context = stream_context_create($recaptcha_options);
$recaptcha_result = @file_get_contents($recaptcha_url, false, $recaptcha_context);

if ($recaptcha_result === false) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Не удалось связаться с сервером reCAPTCHA. Попробуйте позже.']);
    exit;
}

$recaptcha_json = json_decode($recaptcha_result, true);

if (json_last_error() !== JSON_ERROR_NONE || !$recaptcha_json || !isset($recaptcha_json['success']) || !$recaptcha_json['success']) {
    $error_message = 'Ошибка проверки reCAPTCHA';
    if (isset($recaptcha_json['error-codes']) && is_array($recaptcha_json['error-codes'])) {
        $error_codes = implode(', ', $recaptcha_json['error-codes']);
        // Более понятные сообщения для пользователя
        if (strpos($error_codes, 'invalid-input-secret') !== false || strpos($error_codes, 'missing-input-secret') !== false) {
            $error_message = 'Ошибка конфигурации. Обратитесь к администратору.';
        } elseif (strpos($error_codes, 'timeout-or-duplicate') !== false) {
            $error_message = 'Срок действия проверки истёк. Пожалуйста, подтвердите действие ещё раз.';
        }
    }
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $error_message]);
    exit;
}

// Получение данных формы
$form_type = isset($data['form_type']) ? $data['form_type'] : 'unknown';
$to_email = 'salelockoutsystem@gmail.com';

// Формирование темы письма
$subject = '';
$message_body = '';

switch ($form_type) {
    case 'main':
        $subject = 'Новая заявка — Lockout Tagout';
        $message_body = "Новая заявка с главной формы\n\n";
        $message_body .= "Название компании: " . cleanForPlainText($data['company-name'] ?? '') . "\n";
        $message_body .= "Контактное лицо: " . cleanForPlainText($data['contact-person'] ?? '') . "\n";
        $message_body .= "Телефон: " . cleanForPlainText($data['phone'] ?? '') . "\n";
        $message_body .= "Email: " . cleanForPlainText($data['email'] ?? '') . "\n";
        $message_body .= "Должность: " . cleanForPlainText($data['position'] ?? '') . "\n";
        break;
        
    case 'quick':
        $quick_subject = cleanForPlainText($data['quick-subject'] ?? '');
        $subject = $quick_subject !== 'Не указано' ? $quick_subject : 'Заявка с сайта';
        $message_body = '';
        $message_body .= "Тема заявки: " . $quick_subject . "\n";
        $message_body .= "Телефон: " . cleanForPlainText($data['quick-phone'] ?? '') . "\n";
        $message_body .= "Имя: " . cleanForPlainText($data['quick-name'] ?? '') . "\n";
        $message_body .= "Компания: " . cleanForPlainText($data['quick-company'] ?? '') . "\n";
        $message_body .= "Email: " . cleanForPlainText($data['quick-email'] ?? '') . "\n";
        $message_body .= "Должность: " . cleanForPlainText($data['quick-position'] ?? '') . "\n";
        break;
        
    case 'docs':
        $subject = 'Запрос на скачивание документов';
        $message_body = "Запрос на скачивание документов\n\n";
        $message_body .= "Телефон: " . cleanForPlainText($data['docs-phone'] ?? '') . "\n";
        $message_body .= "Email: " . cleanForPlainText($data['docs-email'] ?? '') . "\n";
        $message_body .= "ФИО: " . cleanForPlainText($data['docs-name'] ?? '') . "\n";
        $message_body .= "Компания: " . cleanForPlainText($data['docs-company'] ?? '') . "\n";
        $message_body .= "Должность: " . cleanForPlainText($data['docs-position'] ?? '') . "\n";
        break;
        
    default:
        $subject = 'Новая заявка с сайта';
        $message_body = "Новая заявка\n\n";
        $message_body .= print_r($data, true);
}

$message_body .= "\n\n---\n";
$message_body .= "Дата отправки: " . date('d.m.Y H:i:s') . "\n";
$message_body .= "IP адрес: " . ($_SERVER['REMOTE_ADDR'] ?? 'Неизвестно') . "\n";

// Настройки для отправки письма
$fromEmail = 'no-reply@oilspill-solutions.ru';
$fromName  = 'Lockout Tagout';

$headers  = "From: ".$fromName." <".$fromEmail.">\r\n";
$headers .= "Reply-To: ".$fromEmail."\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

// Отправка письма
$mail_sent = mail($to_email, $subject, $message_body, $headers);

if ($mail_sent) {
    echo json_encode([
        'success' => true,
        'message' => 'Заявка успешно отправлена!'
    ], JSON_UNESCAPED_UNICODE);
} else {
    // Логирование ошибки (в реальном проекте лучше использовать error_log)
    $error = error_get_last();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Ошибка при отправке письма. Попробуйте позже.'
    ], JSON_UNESCAPED_UNICODE);
}
?>