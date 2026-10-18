<?php
/**
 * Sitemap Generator Service for Ptolemy
 *
 * Encapsulates XML sitemap generation for public SEO crawlers and authorised audit tools.
 */
require_once __DIR__ . '/Journey.php';
require_once __DIR__ . '/Template.php';

class SitemapGenerator {
    /**
     * Build and return the XML string for the sitemap.
     *
     * @param string $baseUrl Base URL (e.g. https://ptolemy.andrewwestley.co.uk)
     * @param bool $includeAuth Whether to include protected app routes, all private journeys, and templates
     * @return string Valid sitemaps.org XML
     */
    public static function generate(string $baseUrl, bool $includeAuth = false): string {
        $baseUrl = rtrim($baseUrl, '/');
        $pages = [];

        // 1. Base public pages
        $pages[] = [
            'path' => '/',
            'file' => dirname(__DIR__) . '/public/index.php',
            'changefreq' => 'weekly',
            'priority' => '1.0'
        ];
        $pages[] = [
            'path' => '/about/',
            'file' => dirname(__DIR__) . '/public/about.php',
            'changefreq' => 'monthly',
            'priority' => '0.8'
        ];
        $pages[] = [
            'path' => '/login/',
            'file' => dirname(__DIR__) . '/public/login.php',
            'changefreq' => 'monthly',
            'priority' => '0.8'
        ];

        if (!$includeAuth) {
            // Standard Public Sitemap: only publicly shared journeys
            $publicJourneys = Journey::findPublic();
            foreach ($publicJourneys as $pj) {
                if (empty($pj['id'])) {
                    continue;
                }
                $dateSource = !empty($pj['updated_at']) ? $pj['updated_at'] : ($pj['created_at'] ?? null);
                $timestamp = !empty($dateSource) ? strtotime($dateSource) : false;
                $lastmod = ($timestamp !== false && $timestamp > 0) ? date('Y-m-d', $timestamp) : date('Y-m-d');

                $pages[] = [
                    'path' => '/share/' . rawurlencode($pj['id']) . '/',
                    'lastmod' => $lastmod,
                    'changefreq' => 'weekly',
                    'priority' => '0.8'
                ];
            }
        } else {
            // Authorised Audit Sitemap: includes app sections, all journeys (private & public), and all templates
            $pages[] = [
                'path' => '/dashboard/',
                'file' => dirname(__DIR__) . '/public/dashboard.php',
                'changefreq' => 'weekly',
                'priority' => '0.9'
            ];
            $pages[] = [
                'path' => '/dashboard/shared/',
                'changefreq' => 'weekly',
                'priority' => '0.8'
            ];
            $pages[] = [
                'path' => '/dashboard/trash/',
                'changefreq' => 'monthly',
                'priority' => '0.5'
            ];
            $pages[] = [
                'path' => '/templates/',
                'file' => dirname(__DIR__) . '/public/templates.php',
                'changefreq' => 'monthly',
                'priority' => '0.7'
            ];
            $pages[] = [
                'path' => '/invites/',
                'file' => dirname(__DIR__) . '/public/invites.php',
                'changefreq' => 'monthly',
                'priority' => '0.6'
            ];

            // Include all starter blueprint templates
            $templates = Template::getAll();
            foreach ($templates as $tpl) {
                $pages[] = [
                    'path' => $tpl['path'],
                    'lastmod' => $tpl['lastmod'],
                    'changefreq' => 'monthly',
                    'priority' => '0.7'
                ];
            }

            // Include all active journeys (private and public) for comprehensive tool auditing
            $allJourneys = Journey::findAllForAudit();
            foreach ($allJourneys as $j) {
                if (empty($j['id'])) {
                    continue;
                }
                $dateSource = !empty($j['updated_at']) ? $j['updated_at'] : ($j['created_at'] ?? null);
                $timestamp = !empty($dateSource) ? strtotime($dateSource) : false;
                $lastmod = ($timestamp !== false && $timestamp > 0) ? date('Y-m-d', $timestamp) : date('Y-m-d');
                $id = rawurlencode($j['id']);

                // Journey editor routes (table & visual modes)
                $pages[] = [
                    'path' => '/journey/' . $id . '/',
                    'lastmod' => $lastmod,
                    'changefreq' => 'weekly',
                    'priority' => '0.9'
                ];
                $pages[] = [
                    'path' => '/journey/' . $id . '/visual/',
                    'lastmod' => $lastmod,
                    'changefreq' => 'weekly',
                    'priority' => '0.8'
                ];
                $pages[] = [
                    'path' => '/journey/' . $id . '/table/',
                    'lastmod' => $lastmod,
                    'changefreq' => 'weekly',
                    'priority' => '0.8'
                ];

                // Share view route
                $pages[] = [
                    'path' => '/share/' . $id . '/',
                    'lastmod' => $lastmod,
                    'changefreq' => 'weekly',
                    'priority' => '0.8'
                ];
            }
        }

        // Build XML DOM document
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
            if (isset($page['lastmod'])) {
                $lastmodDate = $page['lastmod'];
            } elseif (isset($page['file']) && file_exists($page['file'])) {
                $lastmodDate = date('Y-m-d', filemtime($page['file']));
            } else {
                $lastmodDate = date('Y-m-d');
            }
            $urlElement->appendChild($xml->createElement('lastmod', $lastmodDate));

            // Change frequency
            $urlElement->appendChild($xml->createElement('changefreq', $page['changefreq']));

            // Priority
            $urlElement->appendChild($xml->createElement('priority', $page['priority']));

            $urlset->appendChild($urlElement);
        }

        $xml->appendChild($urlset);
        return $xml->saveXML();
    }
}
