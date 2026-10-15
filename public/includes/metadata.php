<?php
/**
 * Global Metadata, SEO, Social (Open Graph & Twitter), Favicon, and Schema.org Include for Ptolemy
 *
 * Expected / Supported optional page variables:
 * - $pageTitle (string): Custom title for the current view
 * - $pageDescription (string): Meta description for search and social previews
 * - $pageOgImage (string): Full URL to custom 1200x630 preview image
 * - $pageOgType (string): 'website', 'article', etc. (defaults to 'website')
 * - $canonicalUrl (string): Explicit canonical URL override if needed
 * - $schemaExtra (array): Additional Schema.org graph items to merge into JSON-LD
 */

$siteName = "Ptolemy - the OpenJourney editor";
$defaultDescription = "Ptolemy is an open-source, collaborative user journey mapping editor powered by the OpenJourney Format (.ojf) without proprietary lock-in.";
$defaultOgImage = "https://ptolemy.andrewwestley.co.uk/images/og-image.png";

// Compute title
if (!empty($pageTitle)) {
    $metaTitle = (strpos($pageTitle, 'Ptolemy') !== false) ? $pageTitle : $pageTitle . " | Ptolemy";
} else {
    $metaTitle = $siteName;
}

// Compute description
$metaDescription = !empty($pageDescription) ? $pageDescription : $defaultDescription;

// Compute Canonical URL
if (empty($canonicalUrl)) {
    $requestUri = $_SERVER['REQUEST_URI'] ?? '/';
    $canonicalPath = strtok($requestUri, '?');
    $canonicalUrl = "https://ptolemy.andrewwestley.co.uk" . $canonicalPath;
}

// Compute Open Graph details
$ogImage = !empty($pageOgImage) ? $pageOgImage : $defaultOgImage;
$ogType = !empty($pageOgType) ? $pageOgType : "website";

// Prepare JSON-LD Schema.org graph
$schemaGraph = [
    [
        "@type" => "WebSite",
        "@id" => "https://ptolemy.andrewwestley.co.uk/#website",
        "url" => "https://ptolemy.andrewwestley.co.uk/",
        "name" => "Ptolemy - the OpenJourney editor",
        "description" => $defaultDescription,
        "inLanguage" => "en",
        "publisher" => [
            "@type" => "Person",
            "name" => "Andrew Westley",
            "url" => "https://andrewwestley.co.uk/"
        ]
    ],
    [
        "@type" => "WebApplication",
        "@id" => "https://ptolemy.andrewwestley.co.uk/#webapp",
        "url" => "https://ptolemy.andrewwestley.co.uk/",
        "name" => "Ptolemy",
        "applicationCategory" => "DesignApplication",
        "operatingSystem" => "All",
        "browserRequirements" => "Requires JavaScript. Requires HTML5.",
        "offers" => [
            "@type" => "Offer",
            "price" => "0",
            "priceCurrency" => "GBP"
        ],
        "description" => "Collaborative, open-standard user journey mapping tool built for UX professionals."
    ]
];

if (!empty($schemaExtra) && is_array($schemaExtra)) {
    $schemaGraph = array_merge($schemaGraph, $schemaExtra);
}

$jsonLdPayload = [
    "@context" => "https://schema.org",
    "@graph" => $schemaGraph
];
?>
    <!-- Primary Meta Tags -->
    <title><?php echo htmlspecialchars($metaTitle, ENT_QUOTES, 'UTF-8'); ?></title>
    <meta name="title" content="<?php echo htmlspecialchars($metaTitle, ENT_QUOTES, 'UTF-8'); ?>">
    <meta name="description" content="<?php echo htmlspecialchars($metaDescription, ENT_QUOTES, 'UTF-8'); ?>">
    <meta name="application-name" content="Ptolemy">
    <link rel="canonical" href="<?php echo htmlspecialchars($canonicalUrl, ENT_QUOTES, 'UTF-8'); ?>">

    <!-- Mobile Branding & Theme Color -->
    <meta name="theme-color" content="#4f46e5">
    <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0f172a">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="Ptolemy">

    <!-- Favicons & Web App Manifest -->
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
    <link rel="shortcut icon" href="/favicon.ico">
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
    <link rel="manifest" href="/manifest.json">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="<?php echo htmlspecialchars($ogType, ENT_QUOTES, 'UTF-8'); ?>">
    <meta property="og:site_name" content="Ptolemy - the OpenJourney editor">
    <meta property="og:url" content="<?php echo htmlspecialchars($canonicalUrl, ENT_QUOTES, 'UTF-8'); ?>">
    <meta property="og:title" content="<?php echo htmlspecialchars($metaTitle, ENT_QUOTES, 'UTF-8'); ?>">
    <meta property="og:description" content="<?php echo htmlspecialchars($metaDescription, ENT_QUOTES, 'UTF-8'); ?>">
    <meta property="og:image" content="<?php echo htmlspecialchars($ogImage, ENT_QUOTES, 'UTF-8'); ?>">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:type" content="image/png">
    <meta property="og:image:alt" content="Ptolemy - the OpenJourney editor">

    <!-- Twitter Cards -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="<?php echo htmlspecialchars($canonicalUrl, ENT_QUOTES, 'UTF-8'); ?>">
    <meta name="twitter:title" content="<?php echo htmlspecialchars($metaTitle, ENT_QUOTES, 'UTF-8'); ?>">
    <meta name="twitter:description" content="<?php echo htmlspecialchars($metaDescription, ENT_QUOTES, 'UTF-8'); ?>">
    <meta name="twitter:image" content="<?php echo htmlspecialchars($ogImage, ENT_QUOTES, 'UTF-8'); ?>">
    <meta name="twitter:image:alt" content="Ptolemy - the OpenJourney editor">

    <!-- Structured Data (JSON-LD / Schema.org) -->
    <script type="application/ld+json">
    <?php echo json_encode($jsonLdPayload, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE); ?>
    </script>
