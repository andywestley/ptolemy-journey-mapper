<!DOCTYPE html>
<html lang="en">
<head>

    <!-- Silktide/GTM Consent pre-config -->
    <script>
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    gtag('consent', 'default', {
    'analytics_storage': localStorage.getItem('stcm.consent.analytics') === 'true' ? 'granted' : 'denied',
    'ad_storage': localStorage.getItem('stcm.consent.marketing') === 'true' ? 'granted' : 'denied',
    'ad_user_data': localStorage.getItem('stcm.consent.marketing') === 'true' ? 'granted' : 'denied',
    'ad_personalization': localStorage.getItem('stcm.consent.marketing') === 'true' ? 'granted' : 'denied',
    'wait_for_update': 500
    });
    </script>

    <!-- Google Tag Manager -->
    <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','GTM-TNL8J42G');</script>
    <!-- End Google Tag Manager -->

    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    

    <title><?php echo isset($pageTitle) ? $pageTitle . " | Ptolemy" : "Ptolemy - the OpenJourney editor"; ?></title>
    <meta name="description" content="<?php echo isset($pageDescription) ? $pageDescription : "Ptolemy - collaborative open journey mapping tool"; ?>">

    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Bootstrap Icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css">
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&display=swap" rel="stylesheet">
    
    <link rel="stylesheet" href="css/style.css">
    <?php if (isset($extraCss)): ?>
        <?php foreach ($extraCss as $cssFile): ?>
            <link rel="stylesheet" href="css/<?php echo $cssFile; ?>">
        <?php endforeach; ?>
    <?php endif; ?>
</head>
<body>
    <!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-TNL8J42G"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
