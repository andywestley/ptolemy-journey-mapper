# Ptolemy - Agent Instructions & Workspace Context

## Production Environment
- **Production URL:** https://ptolemy.andrewwestley.co.uk/
- **Web Document Root:** `public/`
- **Sitemap Locations:**
  - Standard Public: `https://ptolemy.andrewwestley.co.uk/sitemap.xml`
  - Audit (Protected App Routes): `https://ptolemy.andrewwestley.co.uk/sitemap.xml?include_auth=1`
- **Deployment Mechanism:** Deployments are handled via GitHub Actions to a Plesk VPS. Never execute local deployment commands.

## Asset Minification & Pipeline
- **Raw Assets:** `public/css/*.css` and `public/js/*.js`
- **Minified Assets:** `public/css/*.min.css` and `public/js/*.min.js`
- **Rule:** Whenever raw CSS or JS files are modified, regenerate minified assets using `npm run minify` (or keep `npm run watch` running during development).
- **Automated Build Step:** GitHub Actions automatically executes `npm ci` and `npm run minify` on push to `main` before rsyncing to the production VPS.
- **Templates:** [header.php](file:///c:/Users/Andrew/Documents/github/ptolemy-journey-mapper/public/includes/header.php) and [footer.php](file:///c:/Users/Andrew/Documents/github/ptolemy-journey-mapper/public/includes/footer.php) dynamically load `.min` assets with timestamped cache-busting (`?v=filemtime`) whenever minified files exist.
