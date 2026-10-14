<?php
/**
 * Dynamic Sitemap Controller for Ptolemy
 *
 * Web Usage:
 *   GET /sitemap.xml                     (Standard public sitemap)
 *   GET /audit-sitemap.xml               (Rewritten to authorized audit sitemap)
 *   GET /sitemap.xml?include_auth=1      (Direct authorized audit sitemap)
 *
 * CLI Usage:
 *   php public/sitemap.php
 *   php public/sitemap.php --include-auth
 */

require_once __DIR__ . '/../models/SitemapGenerator.php';

$isCli = (php_sapi_name() === 'cli');

if ($isCli) {
    $baseUrl = 'https://ptolemy.andrewwestley.co.uk';
    $includeAuth = in_array('--include-auth', $argv, true);

    foreach ($argv as $arg) {
        if (str_starts_with($arg, '--base-url=')) {
            $baseUrl = rtrim(substr($arg, 11), '/');
        }
    }
} else {
    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https')
        || (isset($_SERVER['HTTP_X_FORWARDED_SSL']) && $_SERVER['HTTP_X_FORWARDED_SSL'] === 'on')
        || (isset($_SERVER['SERVER_PORT']) && (int)$_SERVER['SERVER_PORT'] === 443);

    $protocol = $isHttps ? 'https://' : 'http://';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $baseUrl = $protocol . $host;

    $includeAuth = (isset($_GET['include_auth']) && ($_GET['include_auth'] === '1' || strtolower($_GET['include_auth']) === 'true'));
}

$xmlOutput = SitemapGenerator::generate($baseUrl, $includeAuth);

if ($isCli) {
    echo $xmlOutput;
} else {
    header('Content-Type: application/xml; charset=utf-8');
    echo $xmlOutput;
}
