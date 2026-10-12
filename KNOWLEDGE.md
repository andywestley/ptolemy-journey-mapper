# Project Knowledge Base: Ptolemy - the OpenJourney editor

This document serves as the definitive source of truth for architectural rules, technical constraints, and data schemas for the Ptolemy project.

## 1. Architectural Rules & Tech Stack
Adhere strictly to these technical constraints for all development:

- **Frontend & Styling:** **Bootstrap 5 (Vanilla JS/CSS)** via CDN. 
    - No Tailwind, Material UI, or heavy JS frameworks (React, Vue, etc.).
    - Rely on Bootstrap utility classes and native components.
- **Backend & Database:** **PocketBase**.
    - Handles User Authentication (Email/Password), REST API routing, and SQLite database management.
- **API SDK:** Use the official `pocketbase` JavaScript SDK for auth and CRUD operations.
- **Frontend Environment:** Entirely vanilla code served directly by PocketBase from `pb_public/`.
    - No `npm`, `package.json`, or build steps (Webpack/Vite).

## 2. OpenJourney Format (.ojf)
The journey map state must conform to the OpenJourney schema.

- **Storage:** Managed as a JSON object in the `ojf_data` field of the `journeys` collection.
- **Visual Implementation:** 
    - **DOM-based Visual Map:** Use **CSS Grid** for the visual representation.
    - **No Canvas:** Do not use HTML5 Canvas for the map.
    - **Accessibility:** Must be keyboard navigable and screen-reader friendly.
- **Export/Import:**
    - Support exporting journeys as `.ojf` (JSON) files.
    - Support importing `.ojf` files to create new database records.

## 3. Database Schema (PocketBase Collections)

### Collection: `users` (System Default)
- `id`, `email`, `password`, `name`, `avatar`

### Collection: `journeys`
- `title` (Text)
- `description` (Text)
- `owner` (Relation -> `users`)
- `collaborators` (Relation -> `users`)
- `ojf_data` (JSON): The complete OpenJourney JSON object containing stages, swimlanes, and nodes.

## 4. Operational Directives
- Read this file (`KNOWLEDGE.md`) at the start of every new task.
- Ensure all UI changes are visually premium (Bootstrap 5 + custom CSS for "wow" factor).
- Persist state frequently with auto-save/sync to PocketBase.

## 5. Environment & Production Details
- **Production URL:** `https://ptolemy.andrewwestley.co.uk/`
- **Web Server Document Root:** `public/`
- **Target Infrastructure:** Plesk-managed VPS deployed via GitHub Actions (`.github/workflows/deploy.yml`).

## 6. Asset Minification Pipeline
- **Raw Assets:** `public/css/*.css` and `public/js/*.js`
- **Minified Assets:** `public/css/*.min.css` and `public/js/*.min.js`
- **Build Commands:**
  - `npm run minify` (or `node scripts/minify.js`): Minifies all raw CSS and JS assets using `clean-css` and `terser`.
  - `npm run watch`: Automatically rebuilds minified assets whenever changes are saved to raw CSS or JS files.
- **CI/CD Integration:** GitHub Actions automatically builds minified assets during deploy (`.github/workflows/deploy.yml`).
- **Templates:** Loaded dynamically in `public/includes/header.php` and `public/includes/footer.php` with automatic fallback and `filemtime` cache-busting.
