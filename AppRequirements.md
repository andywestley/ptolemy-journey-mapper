# Product Specification: Ptolemy - the OpenJourney editor

## 1. Project Overview
A multi-user, full-stack web application for creating, managing, and sharing data-driven user journey maps. The application uses **PocketBase** for the backend (handling SQLite storage and user authentication) and a vanilla **Bootstrap 5** frontend. It serves as the official collaborative editor for the new **OpenJourney Format (`.ojf`)**.

## 2. Tech Stack & Architectural Directives
*(Note for Antigravity Agents: Adhere strictly to these technical constraints).*

* **Frontend & Styling:** **Bootstrap 5 (Vanilla JS/CSS)** via CDN. Do not use Tailwind, Material UI, or heavy JS frameworks unless absolutely necessary. Rely on Bootstrap's utility classes and native components for a fast, accessible UI.
* **Backend & Database:** **PocketBase**. Used for User Authentication (Email/Password), REST API routing, and SQLite database management. 
* **API SDK:** Use the official `pocketbase` JavaScript SDK on the frontend to handle auth state and CRUD operations.
* **State Management:** The current journey map state is a JSON object matching the OpenJourney schema. It is fetched from PocketBase on load, manipulated in the browser, and saved back to the PocketBase API.

## 3. Database Schema (PocketBase Collections)

The backend requires the following collections to be configured:

* **Collection: `users` (System Default)**
    * Handles authentication.
    * Fields: `id`, `email`, `password`, `name`, `avatar`.
* **Collection: `journeys`**
    * Stores the actual map data.
    * Fields:
        * `title` (Text)
        * `description` (Text)
        * `owner` (Relation -> `users`): The creator of the map.
        * `collaborators` (Relation -> `users`): Array of users with edit access.
        * `ojf_data` (JSON): The complete OpenJourney JSON object containing stages, swimlanes, and nodes.

## 4. Core Features & UI Requirements

### 4.1. Authentication & Dashboard
* **Auth Flow:** Simple Bootstrap login and registration forms.
* **Dashboard:** A secure view where a logged-in user can see "My Journeys" and "Shared with Me." Includes a button to create a new journey.

### 4.2. The Editor: Table View & Visual Map View
* **Table View:** An accessible data-entry interface built with Bootstrap tables and form controls to edit the `ojf_data` JSON.
* **Visual Map View:** Displays the journey as a rich CSS Grid. Must be keyboard navigable and screen-reader friendly. Should support visual indicators for **"Moments of Truth"** and eventually **emotional curves** or graphs based on node scores.
    * Supports drag-and-drop node reordering between grid cells.
    * Direct "Add Stage" and "Add Swimlane" buttons for quick editing.
    * Interactive nodes that open the detail modal.
    * **Emotional Curves:** Dynamic SVG path overlaying the map based on the `score` (0-10) of nodes in the path to visualize the "emotional arc."
* **Auto-Save / Sync:** Changes made in either view should trigger a patch request via the PocketBase SDK to update the `ojf_data` field in the database.

### 4.3. Import / Export (The Open Standard)
* **OJF (OpenJourney Format):** The primary import/export format using `.ojf` (JSON).
* **Visual Exports:** High-resolution PNG and PDF captures of the CSS Grid visual map.
* **Textual Reports:**
    * **Markdown Export (.md):** A structured, readable textual representation of the journey (Stages > Swimlanes > Nodes).
    * **Progressive PDF Report:** A textual PDF report (different from the visual capture) optimized for accessibility and documentation.

### 4.4. Persona & Alignment (Refinement)
* **Persona Definition:** The editor must allow users to define a **Persona** and **Point of View** for each journey to ensure a grounded narrative.
* **Visual Empathy:** Support for icons or small images in Nodes to increase map efficienty and empathy.


### 4.5. Sample Library & Format Mastery (Education)
* **Downloadable Samples:** A list of downloadable `.ojf` files (e.g., "Customer Support Flow", "E-commerce Purchase") provided in the UI.
* **Demonstrating Openness:** These files demonstrate the portability of the format and the "Import" functionality.
* **Journey Manual:** A specific sample `.ojf` that serves as a self-describing manual for using Ptolemy.
* **Alignment Workshop Mode:** (Roadmap) A dedicated mode for team-based evaluation where users can "dot-vote" on pain points or priority opportunities directly on the map.


### 4.6. Collaboration & Feedback (Beta)
* **User Invitations (SMTP-free):** A system to generate unique invite codes/links that can be shared manually. This allows onboarding colleagues even if the server cannot send outbound emails.
* **Pinned Feedback Notes:** Office-style "sticky notes" or comments that users can drop anywhere on the journey map to provide feedback or suggest changes.
* **Review Mode:** A toggle to highlight/active the feedback layer while dimming the journey content for focused review sessions.

## 5. Database Schema (Extensions)

* **Collection: `invites`**
    * `token` (Text, Unique): Secure random code.
    * `invitedBy` (Relation -> `users`)
    * `isUsed` (Boolean)
* **Collection: `comments`**
    * `journey` (Relation -> `journeys`)
    * `user` (Relation -> `users`)
    * `content` (Text)
    * `x` / `y` (Number): Positioning on the map grid.
    * `parent` (Relation -> `comments`): For threaded replies.

## 6. Project Structure & Version Control

*(Note for Antigravity Agents: This is a strict architectural constraint. Do not initialize npm, package.json, or Webpack/Vite. The frontend is entirely vanilla and served directly by PocketBase).*

### 5.1. File & Folder Architecture
The project must adhere to the standard PocketBase directory structure:

```text
/project-root
  ├── pb_public/          # All frontend code goes here (HTML, CSS, JS)
  │   ├── index.html      # Login / Setup page
  │   ├── dashboard.html  # The Journey Editor / Map views
  │   ├── css/
  │   └── js/
  ├── pb_migrations/      # Auto-generated database schema files (Commit to Git)
  ├── pb_data/            # The actual SQLite database (DO NOT COMMIT)
  ├── pocketbase          # The PocketBase executable (DO NOT COMMIT)
  └── .gitignore