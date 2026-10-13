<?php
/**
 * Dynamic Sitemap Generator for Ptolemy
 *
 * Generates an XML sitemap complying with the sitemaps.org standard.
 *
 * By default, only public indexable pages are included to preserve SEO integrity.
 * If ?include_auth=1 (or --include-auth via CLI) is provided, authenticated app
 * pages (such as /dashboard.php) are included for site-audit tools.
 *
 * Web Usage:
 *   GET /sitemap.xml                     (Standard public sitemap)
 *   GET /sitemap.xml?include_auth=1      (Audit sitemap with protected routes)
 *   GET /sitemap.php?include_auth=1      (Direct PHP endpoint)
 *
 * CLI Usage:
 *   php public/sitemap.php
 *   php public/sitemap.php --include-auth
 *   php public/sitemap.php --save
 *   php public/sitemap.php --include-auth --dest=audit-sitemap.xml --save
 */

$isCli = (php_sapi_name() === 'cli');

// Determine base URL
if ($isCli) {
    $baseUrl = 'https://ptolemy.andrewwestley.co.uk';
    $includeAuth = in_array('--include-auth', $argv, true);
    $destFileName = 'sitemap.xml';

    foreach ($argv as $arg) {
        if (str_starts_with($arg, '--base-url=')) {
            $baseUrl = rtrim(substr($arg, 11), '/');
        } elseif (str_starts_with($arg, '--dest=')) {
            $destFileName = basename(substr($arg, 7));
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
    $destFileName = isset($_GET['dest']) ? basename($_GET['dest']) : 'sitemap.xml';
}

// Public crawlable pages
$pages = [
    [
        'path' => '/',
        'file' => __DIR__ . '/index.php',
        'changefreq' => 'weekly',
        'priority' => '1.0'
    ],
    [
        'path' => '/about/',
        'file' => __DIR__ . '/about.php',
        'changefreq' => 'monthly',
        'priority' => '0.8'
    ]
];

// Include authenticated app routes if requested for audit tools
if ($includeAuth) {
    $pages[] = [
        'path' => '/dashboard/',
        'file' => __DIR__ . '/dashboard.php',
        'changefreq' => 'weekly',
        'priority' => '0.9'
    ];
    $pages[] = [
        'path' => '/templates/',
        'file' => __DIR__ . '/templates.php',
        'changefreq' => 'monthly',
        'priority' => '0.7'
    ];
    $pages[] = [
        'path' => '/invites/',
        'file' => __DIR__ . '/invites.php',
        'changefreq' => 'monthly',
        'priority' => '0.6'
    ];
}

// Build XML structure
$xml = new DOMDocument('1.0', 'UTF-8');
$xml->formatOutput = true;

$urlset = $xml->createElement('urlset');
$urlset->setAttribute('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9');

foreach ($pages as $page) {
    $urlElement = $xml->createElement('url');

    // Location
    $loc = $baseUrl . $page['path'];
    $urlElement->appendChild($xml->createElement('loc', htmlspecialchars($loc, ENT_XML1, 'UTF-8')));

    // Last modified
    $lastmodDate = file_exists($page['file']) ? date('Y-m-d', filemtime($page['file'])) : date('Y-m-d');
    $urlElement->appendChild($xml->createElement('lastmod', $lastmodDate));

    // Change frequency
    $urlElement->appendChild($xml->createElement('changefreq', $page['changefreq']));

    // Priority
    $urlElement->appendChild($xml->createElement('priority', $page['priority']));

    $urlset->appendChild($urlElement);
}

$xml->appendChild($urlset);
$xmlOutput = $xml->saveXML();

// Check if static save is requested
$saveToFile = false;
if ($isCli && in_array('--save', $argv, true)) {
    $saveToFile = true;
} elseif (!$isCli && isset($_GET['save']) && $_GET['save'] === '1') {
    $saveToFile = true;
}

if ($saveToFile) {
    $dest = __DIR__ . '/' . $destFileName;
    file_put_contents($dest, $xmlOutput);
    if ($isCli) {
        echo "Successfully generated and saved sitemap to: {$dest}\n";
        exit(0);
    }
}

if ($isCli) {
    echo $xmlOutput;
} else {
    header('Content-Type: application/xml; charset=utf-8');
    echo $xmlOutput;
}
