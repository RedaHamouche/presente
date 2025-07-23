# 📱 HeadsUp – MVP

> “Mom was right — it *is* the damn phone.”  
> Put your phone away… unless someone nearby is doing the same.

**HeadsUp** is a minimalist social app designed for serendipity in real life.  
When two users within 500 meters go "available", they’re matched anonymously — no chat, no photos, just a matching background and an arrow pointing toward the other.

---

## 🔥 MVP Features

### ✅ Available Mode
- User activates "Available Mode".
- Becomes visible (but not locatable) within a 500m radius.

### 🎨 Visual Match
- When two users are nearby and available:
  - They're instantly matched.
  - Both screens show the **same dynamic background**.
  - A **compass arrow** points toward the other.

### 🧭 Encounter Screen
- Shared animated background.
- Real-time direction arrow using GPS + Compass.
- “Go Invisible” button for safety — exits matching instantly.

### 🛡️ Safety First
- No map.
- No profile.
- No history.
- Exit anytime. No data is stored long-term.

---

## 🛠️ Tech Stack (MVP)

| Layer        | Tech                                      |
|--------------|-------------------------------------------|
| Frontend     | React Native (Expo)                       |
| Realtime DB  | Supabase or Node.js + WebSocket           |
| Database     | PostgreSQL                                |
| Auth         | Anonymous UUID (client-generated)         |
| Location     | Expo Location + Compass                   |
| Deployment   | Supabase / Railway / Vercel (TBD)         |

---

## 📁 Project Structure

- /app
- /screens → Écrans principaux (Accueil, Rencontre)
- /components → UI réutilisables
- /lib → Fonctions utilitaires (GPS, matching, etc.)
- /backend
- /api → WebSocket ou endpoints Supabase
- /database
-  schema.sql → Structure PostgreSQL minimale

---

## ✅ Prochaine étape

- [ ] Prototype fonctionnel avec fond partagé + boussole
- [ ] Gestion de la disponibilité temps réel (WebSocket)
- [ ] Sécurité + tests de proximité IRL

---

## 📣 Pitch rapide

> Une app pour provoquer une vraie rencontre dans le monde réel.  
> Sors ton téléphone, mets-toi dispo, croise quelqu’un qui fait pareil. Rien de plus. Rien de moins.

---

## ❤️ Contribuer

HeadsUp est un projet open early.  
Si tu veux contribuer au design, à l'UX, au dev ou aux tests terrain, contacte-moi !

