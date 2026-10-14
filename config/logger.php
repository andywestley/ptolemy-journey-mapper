<?php
/**
 * Application Logging System for Ptolemy
 */

if (!function_exists('getLogFilePath')) {
    function getLogFilePath() {
        $logDir = dirname(__DIR__) . '/logs';
        if (!is_dir($logDir)) {
            @mkdir($logDir, 0755, true);
        }
        return $logDir . '/app.log';
    }
}

if (!function_exists('app_log')) {
    function app_log($level, $message, array $context = []) {
        $filePath = getLogFilePath();
        $timestamp = date('Y-m-d H:i:s');
        $contextStr = !empty($context) ? ' ' . json_encode($context, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) : '';
        $logLine = sprintf("[%s] [%s] %s%s\n", $timestamp, strtoupper($level), $message, $contextStr);

        // Rotate if log exceeds 5MB
        if (file_exists($filePath) && filesize($filePath) > 5 * 1024 * 1024) {
            @rename($filePath, $filePath . '.' . date('Ymd_His') . '.bak');
        }

        @file_put_contents($filePath, $logLine, FILE_APPEND | LOCK_EX);

        // Forward warning/errors to standard PHP error log
        if (in_array(strtoupper($level), ['WARNING', 'ERROR', 'CRITICAL'], true)) {
            error_log("[Ptolemy] $level: $message$contextStr");
        }
    }
}

if (!function_exists('get_recent_logs')) {
    function get_recent_logs($maxLines = 100) {
        $filePath = getLogFilePath();
        if (!file_exists($filePath)) {
            return [];
        }
        $lines = @file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if (!$lines) return [];
        return array_slice($lines, -$maxLines);
    }
}

// Global exception and error logging
set_exception_handler(function ($exception) {
    app_log('ERROR', 'Uncaught Exception: ' . $exception->getMessage(), [
        'file' => $exception->getFile(),
        'line' => $exception->getLine(),
        'trace' => substr($exception->getTraceAsString(), 0, 1000)
    ]);
});

set_error_handler(function ($severity, $message, $file, $line) {
    if (!(error_reporting() & $severity)) {
        return false;
    }
    $level = in_array($severity, [E_ERROR, E_CORE_ERROR, E_COMPILE_ERROR, E_USER_ERROR], true) ? 'ERROR' : 'WARNING';
    app_log($level, "PHP Error ($severity): $message", [
        'file' => $file,
        'line' => $line
    ]);
    return false; // let normal PHP handling continue as well
});
