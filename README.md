# PORTAIL-JPO : University Open Days Portal

## ✨ Project Overview

**PORTAIL-JPO** is a web application designed as part of a SAE (Situation d'Apprentissage et d'Évaluation) to provide a comprehensive portal listing university Open Days (Journées Portes Ouvertes - JPO) across France. The platform allows users to search for and consult detailed information on universities, their formations, and upcoming JPOs.

This project simulates a real-world professional environment where students demonstrate their technical and organizational skills by building a useful and interactive platform for higher education exploration.

---

## 🔧 Tech Stack

* **Frontend Framework**: Next.js 14 with TypeScript
* **Package Manager**: pnpm
* **UI Components**: shadcn/ui & TailwindCSS
* **Database**: Supabase (PostgreSQL)
* **APIs & Data Scraping**: ONISEP and custom scrapers

---

## 🚀 Getting Started

### Prerequisites

* Node.js >= 18
* pnpm ([https://pnpm.io/installation](https://pnpm.io/installation))

### Installation

```bash
pnpm install
```

### Launch Development Server

```bash
pnpm dev
```

The site will be available at `http://localhost:3000`.

---

## 📅 Project Goals

For this SAE, the objective was to:

* Build a **relational database** to centralize information on universities, formations, and JPO events.
* Provide a **simple and intuitive interface** for users to search JPOs.
* Develop a **search engine** capable of filtering JPOs by criteria like location, discipline, university, etc.

### Data Managed

* **Universities / Schools**: name, address, website, phone number, etc.
* **Formations**: title, level (Licence, BUT, Master...), duration, prerequisites, professional opportunities, internship duration, alternance availability, modality (online/presential)
* **Disciplines**: titles and categories
* **JPOs**: date, location, linked formation or university

---

## 🔢 Example Queries

* List all formations of a university
* List career paths for a formation
* List JPO dates within a geographic perimeter

## ✏️ Example Actions

* Update JPO information
* Add or remove a formation
* Consult details via an integrated search interface

---

## 🤖 Features Implemented

| Commit Type | Description                                                         |
| ----------- | ------------------------------------------------------------------- |
| `feat`      | Added calendar component, API integration, AI-powered search engine |
| `fix`       | Bug fixes in homepage, card components, and spelling corrections    |
| `test`      | Implemented tests for map and homepage functionalities              |
| `chore`     | Initialized project, updated dependencies                           |
| `refactor`  | Improved OpenStreetMap component and file structure                 |

---

## 🎓 About the SAE

**SAE (Situations d'Apprentissage et d'Évaluation)**: Professional scenarios in which students demonstrate acquisition of key competencies through real-life projects.

This project allowed the demonstration of:

* Database modeling and querying
* Frontend development with modern JS frameworks
* Data integration and web scraping
* UI/UX design and user-focused features

---

##📃 License
This project is provided for educational purposes. Any use or modification is allowed for learning or academic activities.

This section will be automatically updated with recent GitHub activity.
