# ShowMatchGoOn

## Overview
ShowMatchGoOn est une plateforme de divertissement intelligente développée dans le cadre d’un projet académique.  
Elle centralise le streaming et la réservation de cinéma, propose des recommandations personnalisées via intelligence artificielle, et offre une expérience fluide entre frontend Angular et backend Spring Boot + MongoDB.

---

## Features
- Découverte de films et séries
- Recommandation intelligente basée sur AI / Deep Learning
- Réservation de billets de cinéma
- Authentification sécurisée (JWT)
- Gestion complète (CRUD) : Cinema, Salle, Seance, Reservation
- Communication temps réel Frontend ↔ Backend via REST APIs
- participation a des session watchparty
- gagner des points de fidelité
- ...

---

## Tech Stack

### Frontend
- Angular 18.2.21
- TypeScript
- Angular CLI

### Backend
- Spring Boot
- MongoDB
- REST API
- JWT Authentication

### DevOps & AI
- Docker
- Jenkins (CI/CD)
- Machine Learning / Deep Learning

---

## Architecture
- Frontend Angular (port 4200)
- Backend Spring Boot (port 8091)
- Communication via REST API
- Proxy configuré pour `/api/*` et `/auth/*` vers le backend
- Base de données MongoDB
- Services AI pour recommandations personnalisées

---

## Contributors
- Omrani Sarra
- Rezgui Wafa
- Mejri Elee
- Thlibi Ranim
- Ouertateni Mohamed Aziz

---

## Academic Context
Projet réalisé dans le cadre du module **PIDEV – 2ème année ingénierie**  
*Esprit School of Engineering – Tunisie*  
Année universitaire : 2025–2026

---

## Getting Started

### 1. Backend (Spring Boot)
1. Ouvrir le projet Spring Boot dans IntelliJ
2. Lancer l’application sur le port 8091
3. Vérifier les endpoints disponibles :
   - `POST /auth/login`
   - `POST /auth/register`
   - `GET /api/cinemas`
   - `GET /api/salles`
   - `GET /api/seances`
   - `GET /api/reservations`
   - `GET /api/abonnements`
   - `GET /api/feedback`

### 2. Frontend (Angular)
```bash
cd frontend
npm install
npm start

### Accès
Frontend : http://localhost:4200
Backend : http://localhost:8091
