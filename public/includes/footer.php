    <!-- Bootstrap 5 Bundle JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

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
            <script src="<?php echo loadJsAsset($jsFile); ?>"></script>
        <?php endforeach; ?>
    <?php endif; ?>
</body>
</html>
