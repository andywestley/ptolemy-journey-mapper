# Ptolemy: The OpenJourney Editor

**Ptolemy** is a multi-user, collaborative web application for creating and managing human-centered user journey maps. It is built as a lightweight, open-source alternative to proprietary mapping software, serving as the official editor for the **OpenJourney Format (`.ojf`)**.

## 🚀 Why Ptolemy?

Commercial journey mapping tools often lock your data into a proprietary ecosystem. Ptolemy breaks this lock-in by using an open, human-readable JSON standard. 

- **Own Your Data:** Everything you create is stored in the open `.ojf` format.
- **Collaborative by Nature:** Share journeys with teammates and collect pinned feedback directly on the map.
- **Visual & Data-Driven:** Switch between a rich Visual Map (with emotional curves!) and a structured Table Editor.
- **Service Blueprint Integration:** Seamlessly expand user journeys into full service blueprints with frontstage/backstage layers and physical evidence.
- **Portable:** Export your maps as JSON (.ojf), Markdown (.md), PDF, or PNG images.

## 🛠️ The Tech Stack

Ptolemy is designed to run on simple, ubiquitous hosting environments.

- **Backend:** Vanilla PHP 8.x (No heavy frameworks, simple page-based routing and REST API).
- **Database:** MySQL / MariaDB (Supports JSON columns and relational integrity constraints).
- **Frontend:** Vanilla JavaScript & Bootstrap 5 (Centralized headers/footers with GA4/GTM tracking capabilities).
- **Format:** OpenJourney Format (.ojf) JSON specification.

## 🤖 Built with Antigravity

This project is a unique collaboration between human intent and machine execution. While the vision, design decisions, and UX requirements were driven by a human, nearly all of the source code was authored by **Google Antigravity**, an agentic AI coding assistant.

The result isn't "AI slop"—it's a high-quality, functional application built through a rigorous pair-programming process where the AI acted as the primary engineer and the human acted as the product owner.

## 📥 Getting Started

### Prerequisites
- A web server running PHP 8.0+ (Apache, Nginx, or PHP CLI Server)
- MySQL / MariaDB server

### Database Schema Setup
1. Create a MySQL database (e.g., `ptolemy`).
2. Import the database tables using the schema file:
   ```bash
   mysql -u your_user -p ptolemy < schema.sql
   ```

### Configuration
Create/update `config/database.php` in your root directory to match your environment credentials:
```php
define('DB_HOST', '127.0.0.1');
define('DB_NAME', 'ptolemy');
define('DB_USER', 'your_user');
define('DB_PASS', 'your_password');
```

### Local Development
To spin up a local PHP development server:
```bash
php -S localhost:8000 -t public/
```
Then visit `http://localhost:8000` in your web browser.

## ✨ The OpenJourney Format (.ojf)
Ptolemy isn't just an editor; it's a way to standardize how we document human experiences. The `.ojf` format allows you to version-control your maps with Git and integrate them into your team's existing development workflows.

```json
{
  "metadata": { "title": "Example Journey" },
  "stages": [ { "id": "s1", "name": "Awareness" } ],
  "nodes": [ { 
    "id": "n1", 
    "stage": "s1", 
    "title": "Customer finds us",
    "blueprint": {
      "backstage": [ { "action": "Update SEO", "actor": "Marketing" } ]
    }
  } ]
}
```

## 🤝 Contributing
The project is a hobbyist effort by UX professionals for the UX community. We welcome contributions of all kinds:
- Bug reports and feature suggestions
- Documentation improvements
- Pull requests for new rendering styles or export formats

## 📜 License
Ptolemy is released under the MIT License. See the `LICENSE` file for details.
