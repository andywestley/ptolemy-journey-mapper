<?php
$pageTitle = "About | Ptolemy - the OpenJourney editor";
$pageDescription = "Learn about Ptolemy, the open-source human-centered journey mapping editor and the OpenJourney Format (.ojf).";
include __DIR__ . '/includes/header.php';
?>

<style>
    :root {
        --primary-bg: #f8f9fa;
        --accent-color: #4f46e5;
    }

    body {
        font-family: 'Outfit', sans-serif;
        background-color: var(--primary-bg);
        color: #333;
        line-height: 1.6;
    }

    .hero {
        background-color: var(--accent-color);
        color: white;
        padding: 4rem 2rem;
        text-align: center;
    }

    .hero .btn-light {
        color: #4338ca !important;
        background-color: #ffffff;
        border-color: #ffffff;
    }

    .hero .btn-light:hover,
    .hero .btn-light:focus {
        color: #312e81 !important;
        background-color: #f1f5f9;
        border-color: #f1f5f9;
    }

    [data-bs-theme="dark"] body {
        background-color: #0f172a;
        color: #f8fafc;
    }

    [data-bs-theme="dark"] .hero {
        background-color: #1e293b;
    }

    [data-bs-theme="dark"] .hero .btn-light {
        background-color: #334155;
        border-color: #475569;
        color: #f8fafc !important;
    }

    [data-bs-theme="dark"] .hero .btn-light:hover,
    [data-bs-theme="dark"] .hero .btn-light:focus {
        background-color: #475569;
        border-color: #64748b;
        color: #ffffff !important;
    }

    [data-bs-theme="dark"] .content-section .bg-light {
        background-color: #1e293b !important;
        border-color: #475569 !important;
        color: #f8fafc;
    }

    [data-bs-theme="dark"] .list-group-item {
        color: #f8fafc;
    }

    .content-section {
        padding: 3rem 1rem;
        max-width: 800px;
        margin: 0 auto;
    }

    .content-section a {
        color: #4338ca;
    }

    .content-section a:hover,
    .content-section a:focus {
        color: #312e81;
    }

    [data-bs-theme="dark"] .content-section a {
        color: #818cf8;
    }

    [data-bs-theme="dark"] .content-section a:hover,
    [data-bs-theme="dark"] .content-section a:focus {
        color: #a5b4fc;
    }
</style>

<?php
$activePublicNav = 'about';
include __DIR__ . '/includes/public_navbar.php';
?>

<header class="hero">
    <h1 class="display-4 fw-bold mb-3">Hi, I'm Ptolemy</h1>
    <p class="lead mb-4">A simple, open-source editor for human-centered journey mapping.</p>
    <a href="https://github.com/andywestley/ptolemy-journey-mapper" target="_blank" rel="noopener noreferrer" class="btn btn-light btn-lg shadow-sm fw-semibold" title="Opens repository in a new tab">
        Visit the Repository <i class="bi bi-box-arrow-up-right ms-1" aria-hidden="true" style="font-size: 0.85rem;"></i><span class="visually-hidden">(opens in a new tab)</span>
    </a>
</header>

<main id="main-content" class="content-section">
    <div class="mb-5">
        <a href="/" class="btn btn-outline-secondary fw-semibold d-inline-flex align-items-center px-3 py-2" style="min-height: 44px;">
            <i class="bi bi-arrow-left me-2" aria-hidden="true"></i>Back to the App
        </a>
    </div>

    <h2 class="mb-4">Why I Built This</h2>
    <p class="mb-4" style="font-size: 1.1rem;">
        If you've ever worked in UX, you know the drill: we spend days researching and building beautiful journey maps, only for them to get trapped inside a proprietary tool or a static image.
    </p>
    <p class="mb-4" style="font-size: 1.1rem;">
        I built Ptolemy because I believe our work shouldn't be held hostage by a subscription. We need a way to collaborate, version-control our insights, and share our data freely.
    </p>

    <h3 class="mb-3">The OpenJourney Format (.ojf)</h3>
    <p class="mb-4">
        At the heart of this project is a simple idea: an open, human-readable JSON format for user journeys. By using <strong>.ojf</strong>, your data stays in your hands. You can track changes with Git, build custom reports, or even move your data to a completely different tool without losing a single node.
    </p>

    <div class="bg-light p-4 rounded-3 border mb-5 shadow-sm">
        <h4 class="mb-3 h6 text-uppercase fw-bold text-muted">A look inside an .ojf file</h4>
        <pre class="mb-0" style="font-size: 0.9rem;"><code>{
  "metadata": {
    "title": "A Day in the Life",
    "version": "1.0"
  },
  "stages": [
    { "id": "s1", "name": "Discovery" }
  ],
  "nodes": [
    {
      "id": "n1",
      "stage": "s1",
      "title": "Found a better way",
      "description": "User realizes they don't need proprietary software."
    }
  ]
}</code></pre>
    </div>

    <h3 class="mb-3">A Hobby Project with Heart</h3>
    <p class="mb-4">
        Just to be clear: this isn't a venture-backed enterprise platform. It's a hobby project built by a UX professional who wanted a tool that didn't exist yet. It's built with <strong>PHP + MySQL</strong> and plain old JavaScript, which makes it fast, privacy-focused, and easy to host yourself.
    </p>

    <h3 class="mb-3">Human-Led, AI-Built</h3>
    <p class="mb-4">
        There’s one more thing you should know about how Ptolemy was made. While I provided the vision, the UX requirements, and the final design calls, I actually wrote very little of the source code by hand.
    </p>
    <p class="mb-4">
        Instead, Ptolemy was built using **Google Antigravity**, an agentic AI coding assistant. We worked together in a high-intensity pair-programming process where I acted as the navigator and the AI acted as the primary builder. It allowed me to focus on the problem I wanted to solve, while the AI handled the heavy lifting of implementation.
    </p>

    <h3 class="mb-3">Help Make it Better</h3>
    <p class="mb-4">
        Ptolemy is currently in <strong>public beta</strong>. Since this is open-source, it belongs to the community as much as it does to me. If you have an idea for a new feature, find a bug, or just want to chat about the future of open journey standards, I'd love to hear from you.
    </p>
    <p class="mb-4">
        <strong>Need an invite code?</strong> We are managing scale by issuing manual invite codes during the beta period. Please <a href="https://github.com/andywestley/ptolemy-journey-mapper/issues" target="_blank" rel="noopener noreferrer" title="Opens in a new tab">open a GitHub Issue <i class="bi bi-box-arrow-up-right ms-1" aria-hidden="true" style="font-size: 0.75rem;"></i><span class="visually-hidden">(opens in a new tab)</span></a> to request yours!
    </p>
    <p class="mb-5">
        Feel free to contribute code or report issues on GitHub. Let's make journey mapping better for everyone.
    </p>

    <footer id="colophon-ptolemy" class="text-muted mt-5 pt-3 border-top" style="font-size: 0.9rem;">
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
            <nav aria-label="Footer Navigation" class="d-flex flex-wrap gap-2 small">
                <a href="/" class="text-decoration-none py-2 px-2 d-inline-flex align-items-center" style="min-height: 44px;">Ptolemy App</a>
                <a href="/templates/" class="text-decoration-none py-2 px-2 d-inline-flex align-items-center" style="min-height: 44px;">Templates</a>
                <a href="https://github.com/andywestley/ptolemy-journey-mapper" target="_blank" rel="noopener noreferrer" class="text-decoration-none py-2 px-2 d-inline-flex align-items-center" style="min-height: 44px;" title="Opens in a new tab">GitHub Repo <i class="bi bi-box-arrow-up-right ms-1" aria-hidden="true" style="font-size: 0.7rem;"></i><span class="visually-hidden">(opens in a new tab)</span></a>
                <a href="https://github.com/andywestley/ptolemy-journey-mapper/issues" target="_blank" rel="noopener noreferrer help" class="text-decoration-none py-2 px-2 d-inline-flex align-items-center" style="min-height: 44px;" title="Get human support or report an issue on GitHub">Help &amp; Support <i class="bi bi-box-arrow-up-right ms-1" aria-hidden="true" style="font-size: 0.7rem;"></i><span class="visually-hidden">(opens in a new tab)</span></a>
            </nav>
            <span class="small text-muted">&copy; <?php echo date('Y'); ?> Ptolemy</span>
        </div>
        <p class="mb-0">
            <strong>Why the name?</strong> We named this after <a href="https://en.wikipedia.org/wiki/Ptolemy" target="_blank" rel="noopener noreferrer" class="text-decoration-underline" title="Opens in a new tab">Claudius Ptolemy <i class="bi bi-box-arrow-up-right ms-1" aria-hidden="true" style="font-size: 0.75rem;"></i><span class="visually-hidden">(opens in a new tab)</span></a>, who used grids to turn the messy, unknown world into maps that people could actually use. This tool is a small attempt to do the same for the complex landscape of human experiences.
        </p>
    </footer>
</main>

<?php
include __DIR__ . '/includes/footer.php';
?>
