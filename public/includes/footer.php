    <!-- Bootstrap 5 Bundle JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

    <?php if (isset($extraJs)): ?>
        <?php foreach ($extraJs as $jsFile): ?>
            <script src="js/<?php echo $jsFile; ?>"></script>
        <?php endforeach; ?>
    <?php endif; ?>
</body>
</html>
