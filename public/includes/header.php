<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-VBK5N6M620"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag() { dataLayer.push(arguments); }
        gtag('js', new Date());

        gtag('config', 'G-VBK5N6M620');
    </script>
    
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
