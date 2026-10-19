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

    <!-- Silktide Consent Manager (STCM) Accessibility Normalizer: Demotes third-party CMP h1 to h2, ensures landmarks exist, and handles modal accessibility -->
    <script>
    (function() {
        function normalizeModal(modal) {
            if (!modal) return;
            var hasContent = modal.children && modal.children.length > 0 && modal.innerHTML.trim() !== '';
            if (!hasContent) {
                modal.removeAttribute('role');
                modal.removeAttribute('aria-modal');
                modal.setAttribute('aria-hidden', 'true');
                modal.setAttribute('hidden', '');
            } else {
                modal.removeAttribute('hidden');
                modal.removeAttribute('aria-hidden');
                if (!modal.getAttribute('role')) {
                    modal.setAttribute('role', 'dialog');
                }
                if (!modal.getAttribute('aria-modal')) {
                    modal.setAttribute('aria-modal', 'true');
                }
                if (!modal.getAttribute('aria-label')) {
                    modal.setAttribute('aria-label', 'Cookie preferences');
                }
                // Ensure explicit, accessible close button for UX & WCAG best practices
                var closeBtns = modal.querySelectorAll('.stcm-modal-close, button.stcm-modal-close, [class*="modal-close"]');
                closeBtns.forEach(function(btn) {
                    btn.setAttribute('aria-label', 'Close modal');
                    btn.setAttribute('title', 'Close modal');
                });
            }
        }

        function normalizeStcm(root) {
            var target = root || document;
            if (!target.querySelectorAll) return;

            // 1. Demote any h1 to h2 to maintain single primary h1 per page
            var h1s = target.querySelectorAll('#stcm-modal h1, #stcm-banner h1, .stcm-modal h1, .stcm-banner h1');
            h1s.forEach(function(h1) {
                var h2 = document.createElement('h2');
                for (var i = 0; i < h1.attributes.length; i++) {
                    h2.setAttribute(h1.attributes[i].name, h1.attributes[i].value);
                }
                h2.innerHTML = h1.innerHTML;
                if (h1.parentNode) {
                    h1.parentNode.replaceChild(h2, h1);
                }
            });

            // 2. Ensure CMP banners, modals, and badges act as proper landmarks for Axe/WCAG region rules
            var banners = target.querySelectorAll('#stcm-banner, .stcm-banner');
            banners.forEach(function(banner) {
                if (!banner.getAttribute('role')) {
                    banner.setAttribute('role', 'region');
                }
                if (!banner.getAttribute('aria-label')) {
                    banner.setAttribute('aria-label', 'Cookie consent');
                }
            });
            if (target.id === 'stcm-banner' || (target.classList && target.classList.contains('stcm-banner'))) {
                if (!target.getAttribute('role')) {
                    target.setAttribute('role', 'region');
                }
                if (!target.getAttribute('aria-label')) {
                    target.setAttribute('aria-label', 'Cookie consent');
                }
            }

            var modals = target.querySelectorAll('#stcm-modal, .stcm-modal');
            modals.forEach(normalizeModal);
            if (target.id === 'stcm-modal' || (target.classList && target.classList.contains('stcm-modal'))) {
                normalizeModal(target);
            }

            var badges = target.querySelectorAll('#stcm-badge, .stcm-badge');
            badges.forEach(function(badge) {
                if (!badge.getAttribute('role')) {
                    badge.setAttribute('role', 'region');
                }
                if (!badge.getAttribute('aria-label')) {
                    badge.setAttribute('aria-label', 'Cookie settings');
                }
            });
            if (target.id === 'stcm-badge' || (target.classList && target.classList.contains('stcm-badge'))) {
                if (!target.getAttribute('role')) {
                    target.setAttribute('role', 'region');
                }
                if (!target.getAttribute('aria-label')) {
                    target.setAttribute('aria-label', 'Cookie settings');
                }
            }
        }

        if (typeof MutationObserver !== 'undefined') {
            var observer = new MutationObserver(function(mutations) {
                var checkNeeded = false;
                for (var i = 0; i < mutations.length; i++) {
                    var added = mutations[i].addedNodes;
                    for (var j = 0; j < added.length; j++) {
                        var node = added[j];
                        if (node.nodeType === 1) {
                            if (node.id === 'stcm-modal' || node.id === 'stcm-banner' || node.id === 'stcm-badge' || 
                               (node.querySelector && node.querySelector('#stcm-modal, #stcm-banner, #stcm-badge, .stcm-modal, .stcm-banner, .stcm-badge')) ||
                               (node.closest && node.closest('#stcm-modal, .stcm-modal'))) {
                                checkNeeded = true;
                                break;
                            }
                        }
                    }
                    if (mutations[i].removedNodes && mutations[i].removedNodes.length > 0) {
                        checkNeeded = true;
                    }
                    if (checkNeeded) break;
                }
                if (checkNeeded) {
                    normalizeStcm();
                }
            });
            observer.observe(document.documentElement, { childList: true, subtree: true });
        }

        // Ensure pressing Escape key dismisses CMP modal if open
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27) {
                var modal = document.getElementById('stcm-modal');
                if (modal && modal.children && modal.children.length > 0) {
                    var closeBtn = modal.querySelector('.stcm-modal-close, button.stcm-modal-close, [class*="modal-close"]');
                    if (closeBtn) {
                        closeBtn.click();
                    } else {
                        modal.innerHTML = '';
                        normalizeModal(modal);
                    }
                }
            }
        });

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() { normalizeStcm(); });
        } else {
            normalizeStcm();
        }

        // Periodic check for delayed CMP initialization from GTM
        var checkCount = 0;
        var timer = setInterval(function() {
            normalizeStcm();
            checkCount++;
            if (checkCount > 20) clearInterval(timer);
        }, 250);
    })();
    </script>

    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <base href="/">

<?php include __DIR__ . '/metadata.php'; ?>

<?php if (!empty($currentUser)): ?>
    <script>
        window.currentUser = <?php echo json_encode($currentUser, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP); ?>;
    </script>
<?php endif; ?>

    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Bootstrap Icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css">
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&display=swap" rel="stylesheet">
    
<?php
// Asset loader helper for CSS with automatic minification detection & cache busting
if (!function_exists('loadCssAsset')) {
    function loadCssAsset($file) {
        $baseName = preg_replace('/\.min\.css$|\.css$/', '', $file);
        $minFile = $baseName . '.min.css';
        $rawFile = $baseName . '.css';

        $cssDir = __DIR__ . '/../css/';
        if (file_exists($cssDir . $minFile)) {
            $v = filemtime($cssDir . $minFile);
            return '/css/' . $minFile . '?v=' . $v;
        } elseif (file_exists($cssDir . $rawFile)) {
            $v = filemtime($cssDir . $rawFile);
            return '/css/' . $rawFile . '?v=' . $v;
        }
        return '/css/' . $file;
    }
}
?>
    <link rel="stylesheet" href="<?php echo loadCssAsset('style.css'); ?>">
    <?php if (isset($extraCss)): ?>
        <?php foreach ($extraCss as $cssFile): ?>
            <link rel="stylesheet" href="<?php echo loadCssAsset($cssFile); ?>">
        <?php endforeach; ?>
    <?php endif; ?>
</head>
<body>
    <!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-TNL8J42G"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->

    <!-- Skip Link for Accessibility (WCAG 2.5.8 compliant target size) -->
    <nav aria-label="Skip links">
        <a class="skip-to-content-link btn btn-primary" href="#main-content">Skip to main content</a>
    </nav>

