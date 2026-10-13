<?php
header('Content-Type: application/json');
echo json_encode([
    'sapi' => php_sapi_name(),
    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? null,
    'has_apache' => function_exists('apache_get_modules'),
    'apache_modules' => function_exists('apache_get_modules') ? apache_get_modules() : null,
    'request_uri' => $_SERVER['REQUEST_URI'] ?? null,
    'script_name' => $_SERVER['SCRIPT_NAME'] ?? null,
    'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? null
], JSON_PRETTY_PRINT);
