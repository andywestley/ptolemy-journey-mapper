    <!-- Back to Top Escape Button -->
    <button type="button" id="btn-back-to-top" class="btn btn-primary rounded-circle shadow back-to-top" aria-label="Back to top" title="Back to top">
        <i class="bi bi-arrow-up" aria-hidden="true"></i>
    </button>
    <script>
    (function() {
        var backToTopBtn = document.getElementById('btn-back-to-top');
        if (!backToTopBtn) return;
        var isTicking = false;
        function updateBackToTop() {
            if (window.scrollY > 300) {
                backToTopBtn.classList.add('show');
            } else {
                backToTopBtn.classList.remove('show');
            }
            isTicking = false;
        }
        window.addEventListener('scroll', function() {
            if (!isTicking) {
                window.requestAnimationFrame(updateBackToTop);
                isTicking = true;
            }
        }, { passive: true });
        backToTopBtn.addEventListener('click', function() {
            var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            window.scrollTo({
                top: 0,
                behavior: prefersReduced ? 'auto' : 'smooth'
            });
            backToTopBtn.blur();
        });
    })();
    </script>

    <!-- Bootstrap 5 Bundle JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js" defer crossorigin="anonymous"></script>

    <?php
    // Asset loader helper for JS with automatic minification detection & cache busting
    if (!function_exists('loadJsAsset')) {
        function loadJsAsset($file) {
            $baseName = preg_replace('/\.min\.js$|\.js$/', '', $file);
            $minFile = $baseName . '.min.js';
            $rawFile = $baseName . '.js';

            $jsDir = __DIR__ . '/../js/';
            if (file_exists($jsDir . $minFile)) {
                $v = filemtime($jsDir . $minFile);
                return '/js/' . $minFile . '?v=' . $v;
            } elseif (file_exists($jsDir . $rawFile)) {
                $v = filemtime($jsDir . $rawFile);
                return '/js/' . $rawFile . '?v=' . $v;
            }
            return '/js/' . $file;
        }
    }
    ?>
    <?php if (isset($extraJs)): ?>
        <?php foreach ($extraJs as $jsFile): ?>
            <script src="<?php echo loadJsAsset($jsFile); ?>" defer></script>
        <?php endforeach; ?>
    <?php endif; ?>
</body>
</html>
