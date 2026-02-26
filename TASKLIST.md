# Ptolemy: the OpenJourney editor - Master Task List

This is the project's source of truth for milestones and progress.

## Phase 1: PocketBase & Environment Setup
- [x] Initialize `pb_public/` and `pb_migrations/`
- [x] Configure `.gitignore` (Exclude `pb_data` and binary)
- [x] Set up PocketBase `journeys` collection
    - `title` (Text)
    - `description` (Text)
    - `owner` (Relation)
    - `collaborators` (Relation)
    - `ojf_data` (JSON)

## Phase 2: Auth & Navigation
- [x] Implement `index.html` (Login/Register Forms)
- [x] Implement `dashboard.html` (Journey List)
- [x] Connect PocketBase JS SDK (CDN)
- [x] Basic "Create New Journey" functionality
- [x] "Shared with Me" filtering and tabs

## Phase 3: Table Editor & .ojf JSON State
- [x] Design `.ojf` (OpenJourney Format) base JSON object
- [x] Implement Table Editor UI (Bootstrap)
- [x] CRUD for Stages (Columns)
- [x] CRUD for Swimlanes (Rows)
- [x] Drag-and-drop or reordering logic (Vanilla JS)
- [x] "Add Stage" and "Add Swimlane" buttons in Visual Map view
- [x] Debounced Auto-save sync with PocketBase
- [x] Guidance: Help text and examples for stages/swimlanes

## Phase 4: CSS Grid Visual Map
- [x] Implement CSS Grid container in `dashboard.html`
- [x] Build JS renderer for mapping nodes to Grid cells
- [x] Keyboard navigation for map nodes
- [x] Node editing via visual & table interface modals

## Phase 5: Collaboration & Refinements
- [x] Share Modal for managing collaborators by email
- [x] Real-time lookup of users by email
- [ ] Audit trail for changes (Roadmap)
- [ ] Commenting system for reviews (Roadmap)

## Phase 6: Import / Export (Public Alpha)
- [x] Export journey as `.ojf` file
- [x] Import `.ojf` file into PocketBase
- [x] Visual Export (PNG/PDF optimization)
- [x] "About OpenJourney" landing content (Refined for public release)

## Phase 7: Sample Library & Template Onboarding
- [x] **Sample OJF Assets:**
    - [x] Create/Document sample `.ojf` files (Newsletter, Event Booking, E-commerce)
    - [x] Add "Sample Templates" section to the Dashboard UI (using `.ojf` imports)
    - [x] "Self-Describing Manual" OJF to guide new testers

## Phase 12: Emotional Curves & Journey Analytics
- [x] **Emotional Arc Rendering:**
    - [x] Calculate score-based coordinates for an SVG overlay.
    - [x] Render a smooth Bezier curve across the visual map nodes.
- [x] **Journey Scorecard:**
    - [x] Cumulative journey score calculation.
    - [x] "At a Glance" sentiment summary in the editor header.

## Phase 10: Collaboration & Feedback (Beta)
- [x] **SMTP-less Invite System:**
    - [x] Create `invites` collection in PocketBase
    - [x] Admin UI to generate and copy invite links
    - [x] Refactor `index.html` to support invite-code registration
- [x] **Pinned Feedback Notes:**
    - [x] Create `comments` collection in PocketBase
    - [x] Implement "Add Comment" tool in Map View
    - [x] Render feedback pins visually over the grid
    - [x] Comment sidebar/overlay for threaded discussions
- [x] **Review Mode Toggle:**
    - [x] UI to toggle visibility of feedback layer
- [x] **Semantic Feedback Integration:**
    - [x] Attach comments directly to specific nodes or the general journey.
    - [x] Include embedded feedback in Markdown and Textual PDF exports.

## Phase 11: Textual Reporting
- [x] **Markdown Report Generator:**
    - [x] Logic to convert OJF JSON to readable Markdown hierarchy.
    - [x] Export button for `.md`.
- [x] **Textual PDF Generator:**
    - [x] Dedicated layout for printed text reports.
    - [x] Export button for textual `.pdf`.

---

## Roadmap & Stretch Goals
- [ ] **Granular Collaboration Roles:**
    - **Update Mode:** Full edit access with audit trails.
    - **Review Mode:** Commenting and Q&A (Google Docs style).
    - **View Mode:** Static public sharing link.
- [ ] Real-time cursor presence (via PocketBase Realtime)
- [ ] Theming engine for visual maps
- [ ] Component library for reusable journey nodes
- [ ] Integration with Figma/Miro exports
- [ ] Shared global "Reference" library for all users
