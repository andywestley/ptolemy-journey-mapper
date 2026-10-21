<?php if (empty($hideBackToTop)): ?>
    <!-- Back to Top Escape Button (WCAG 2.2.2 & 2.2.1 Compliant) -->
    <button type="button" id="btn-back-to-top" class="btn btn-primary rounded-circle shadow back-to-top" aria-label="Back to top" title="Back to top" aria-hidden="true" tabindex="-1">
        <i class="bi bi-arrow-up" aria-hidden="true"></i>
    </button>
    <script>
    (function() {
        var backToTopBtn = document.getElementById('btn-back-to-top');
        if (!backToTopBtn) return;
        var isTicking = false;
        function updateBackToTop() {
            // Hysteresis threshold to prevent rapid flickering or vanishing content on transient scrolls
            if (window.scrollY > 400) {
                backToTopBtn.classList.add('show');
                backToTopBtn.removeAttribute('aria-hidden');
                backToTopBtn.removeAttribute('tabindex');
            } else if (window.scrollY < 200) {
                backToTopBtn.classList.remove('show');
                backToTopBtn.setAttribute('aria-hidden', 'true');
                backToTopBtn.setAttribute('tabindex', '-1');
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
<?php endif; ?>

    <!-- Modal Backdrop Accessibility Guard (WCAG 4.1.2 & Ghost Modal Prevention) -->
    <script>
    (function() {
        function secureBackdrop(el) {
            if (!el || el.nodeType !== 1) return;
            if (!el.hasAttribute('aria-hidden')) {
                el.setAttribute('aria-hidden', 'true');
            }
            if (!el.hasAttribute('role')) {
                el.setAttribute('role', 'presentation');
            }
        }

        function secureAllBackdrops() {
            var backdrops = document.querySelectorAll('.modal-backdrop');
            for (var i = 0; i < backdrops.length; i++) {
                secureBackdrop(backdrops[i]);
            }
        }

        if (typeof MutationObserver !== 'undefined') {
            var observer = new MutationObserver(function(mutations) {
                for (var i = 0; i < mutations.length; i++) {
                    var added = mutations[i].addedNodes;
                    for (var j = 0; j < added.length; j++) {
                        var node = added[j];
                        if (node.nodeType === 1) {
                            if (node.classList && node.classList.contains('modal-backdrop')) {
                                secureBackdrop(node);
                            } else if (node.getElementsByClassName) {
                                var nested = node.getElementsByClassName('modal-backdrop');
                                for (var k = 0; k < nested.length; k++) {
                                    secureBackdrop(nested[k]);
                                }
                            }
                        }
                    }
                }
            });

            if (document.body) {
                observer.observe(document.body, { childList: true });
            } else {
                document.addEventListener('DOMContentLoaded', function() {
                    observer.observe(document.body, { childList: true });
                });
            }
        }

        document.addEventListener('show.bs.modal', function() {
            setTimeout(secureAllBackdrops, 0);
        });
        document.addEventListener('shown.bs.modal', secureAllBackdrops);
    })();
    </script>

    <!-- Global Status Announcer & Dropdown Accessibility Guard (WCAG 4.1.2 & Heuristic silent-update Guard) -->
    <div id="global-status-announcer" class="visually-hidden" role="status" aria-live="polite" aria-atomic="true"></div>
    <script>
    (function() {
        document.addEventListener('show.bs.dropdown', function(e) {
            var toggle = e.target.querySelector('[data-bs-toggle="dropdown"]') || e.target;
            if (toggle && toggle.setAttribute) {
                toggle.setAttribute('aria-expanded', 'true');
            }
            var announcer = document.getElementById('global-status-announcer');
            if (announcer && toggle) {
                var label = toggle.getAttribute('aria-label') || toggle.innerText.trim() || 'Menu';
                announcer.textContent = label + ' opened';
            }
        });
        document.addEventListener('hide.bs.dropdown', function(e) {
            var toggle = e.target.querySelector('[data-bs-toggle="dropdown"]') || e.target;
            if (toggle && toggle.setAttribute) {
                toggle.setAttribute('aria-expanded', 'false');
            }
            var announcer = document.getElementById('global-status-announcer');
            if (announcer) {
                announcer.textContent = '';
            }
        });

        // W3C APG Menu Button keyboard pattern: Close dropdown cleanly on Tab or Escape to avoid focus trapping
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Tab') {
                var openMenus = document.querySelectorAll('.dropdown-menu.show');
                openMenus.forEach(function(menu) {
                    var parentDropdown = menu.closest('.dropdown, .dropup, .dropend, .dropstart');
                    var toggle = parentDropdown ? parentDropdown.querySelector('[data-bs-toggle="dropdown"]') : null;
                    if (toggle && window.bootstrap && window.bootstrap.Dropdown) {
                        var instance = bootstrap.Dropdown.getInstance(toggle);
                        if (instance) {
                            instance.hide();
                        }
                    }
                });
            } else if (e.key === 'Escape') {
                var activeMenu = document.querySelector('.dropdown-menu.show');
                if (activeMenu) {
                    var parent = activeMenu.closest('.dropdown, .dropup, .dropend, .dropstart');
                    var btn = parent ? parent.querySelector('[data-bs-toggle="dropdown"]') : null;
                    if (btn && window.bootstrap && window.bootstrap.Dropdown) {
                        var inst = bootstrap.Dropdown.getInstance(btn);
                        if (inst) {
                            e.preventDefault();
                            inst.hide();
                            btn.focus();
                        }
                    }
                }
            }
        });
    })();
    </script>

    <!-- Bootstrap 5 Bundle JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js" defer crossorigin="anonymous"></script>

    <?php
    // Asset loader helper for JS with automatic minification detection & cache busting
    if (!function_exists('loadJsAsset')) {
        /**
         * Resolves the versioned path for a JavaScript asset.
         *
         * @param string $file Asset file name (e.g., 'dashboard.js')
         * @return string Versioned asset path
         */
        function loadJsAsset(string $file): string {
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
