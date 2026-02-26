# Ptolemy: The OpenJourney Editor

**Ptolemy** is a multi-user, collaborative web application for creating and managing human-centered user journey maps. It is built as a lightweight, open-source alternative to proprietary mapping software, serving as the official editor for the **OpenJourney Format (`.ojf`)**.

## 🚀 Why Ptolemy?

Commercial journey mapping tools often lock your data into a proprietary ecosystem. Ptolemy breaks this lock-in by using an open, human-readable JSON standard. 

- **Own Your Data:** Everything you create is stored in the open `.ojf` format.
- **Collaborative by Nature:** Share journeys with teammates and collect pinned feedback directly on the map.
- **Visual & Data-Driven:** Switch between a rich Visual Map (with emotional curves!) and a structured Table Editor.
- **Portable:** Export your maps as JSON (.ojf), Markdown (.md), PDF, or PNG images.

## 🛠️ The Tech Stack

Ptolemy is designed to be fast, privacy-focused, and easy to host.

- **Backend:** [PocketBase](https://pocketbase.io/) (Go-based backend with SQLite and Auth).
- **Frontend:** Vanilla JavaScript & Bootstrap 5 (No heavy frameworks required).
- **Format:** OpenJourney Format (.ojf) JSON specification.

## 🤖 Built with Antigravity

This project is a unique collaboration between human intent and machine execution. While the vision, design decisions, and UX requirements were driven by a human, nearly all of the source code was authored by **Google Antigravity**, an agentic AI coding assistant.

The result isn't "AI slop"—it's a high-quality, functional application built through a rigorous pair-programming process where the AI acted as the primary engineer and the human acted as the product owner.

## 📥 Getting Started

### Hosting Your Own Instance
Since Ptolemy is built on PocketBase, you can host it almost anywhere (even on a $5 VPS).

1.  Download the repository.
2.  Install [PocketBase](https://pocketbase.io/docs/) for your OS.
3.  Place the `pb_public` content into your PocketBase's `pb_public` directory.
4.  Run `./pocketbase serve`.
5.  Access the dashboard at `http://localhost:8090`.

### Deploying to Production
For a production deployment, we recommend using a reverse proxy like Nginx or Caddy with SSL provided by Let's Encrypt.

## ✨ The OpenJourney Format (.ojf)
Ptolemy isn't just an editor; it's a way to standardize how we document human experiences. The `.ojf` format allows you to version-control your maps with Git and integrate them into your team's existing development workflows.

```json
{
  "metadata": { "title": "Example Journey" },
  "stages": [ { "id": "s1", "name": "Awareness" } ],
  "nodes": [ { "id": "n1", "stage": "s1", "title": "Customer finds us" } ]
}
```

## 🤝 Contributing
The project is a hobbyist effort by UX professionals for the UX community. We welcome contributions of all kinds:
- Bug reports and feature suggestions
- Documentation improvements
- Pull requests for new rendering styles or export formats

## 📜 License
Ptolemy is released under the MIT License. See the `LICENSE` file for details.
