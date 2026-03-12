# ⛓ Chain HR Management

> Platformă completă de management HR pentru companii românești. Gestionați angajați, ture, pontaj, concedii, salarii și rapoarte — totul dintr-o singură aplicație.

---

## 🚀 Stack Tehnologic

| Layer | Tehnologie |
|---|---|
| Frontend | React 18, React Router v6, Recharts, date-fns, Axios |
| Backend | Node.js, Express.js (MVC + Layered Architecture) |
| Autentificare | Auth0 (RS256 JWT), express-jwt, jwks-rsa |
| Bază de date | PostgreSQL + Sequelize v6 ORM |
| AI Chatbot | OpenAI API (GPT-3.5-turbo) |
| Hosting | Render (backend + frontend) |

---

## 📁 Structura Proiectului

```
project_CHAIN/
├── backend/
│   ├── src/
│   │   ├── config/          # database.js, auth.js
│   │   ├── models/          # Sequelize models (User, Department, Shift, Attendance, Leave, Salary, Bonus)
│   │   ├── services/        # Business logic
│   │   ├── controllers/     # Request handlers
│   │   ├── routes/          # Express routers
│   │   ├── middleware/      # Auth, role, error handlers
│   │   └── utils/           # Helpers (response, date, calculation)
│   ├── app.js
│   ├── server.js
│   └── package.json
│
└── frontend/
    ├── public/
    └── src/
        ├── components/
        │   ├── common/      # Button, Badge, Card, Modal, Input, Alert, Spinner, StatCard
        │   ├── Layout/      # Layout, Sidebar, Header
        │   └── Chatbot/     # ChatbotWidget
        ├── pages/           # Login, Dashboard, Attendance, Leave, Salary, Employees, Shifts, Reports, Profile
        ├── hooks/           # useAttendance, useLeave, useEmployees, useDashboard
        ├── services/        # API service modules
        ├── context/         # AuthContext
        ├── utils/           # formatters
        └── constants/       # App-wide constants
```

---

## ⚙️ Configurare & Instalare

### Cerințe Prealabile

- Node.js ≥ 18
- PostgreSQL ≥ 14
- Cont Auth0 (gratuit)
- Cheie API OpenAI (opțional, pentru chatbot)

---

### 1. Clonare și Instalare

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

---

### 2. Configurare Backend (`.env`)

```bash
cp backend/.env.example backend/.env
```

Editați `backend/.env`:

```env
NODE_ENV=development
PORT=5000

# PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/chain_hr

# Auth0
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=https://your-api-audience

# OpenAI (opțional)
OPENAI_API_KEY=sk-...

# Frontend URL (pentru CORS)
CLIENT_URL=http://localhost:3000
```

---

### 3. Configurare Frontend (`.env`)

```bash
cp frontend/.env.example frontend/.env
```

Editați `frontend/.env`:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_AUTH0_DOMAIN=your-tenant.auth0.com
REACT_APP_AUTH0_CLIENT_ID=your-client-id
REACT_APP_AUTH0_AUDIENCE=https://your-api-audience
```

---

### 4. Creare Bază de Date PostgreSQL

```bash
psql -U postgres
CREATE DATABASE chain_hr;
\q
```

Tabelele sunt create automat la pornirea serverului (Sequelize `sync({ alter: true })`).

---

### 5. Configurare Auth0

1. Creați o aplicație **Single Page Application** în Auth0
2. Creați un **API** în Auth0 cu audience-ul dorit
3. Activați **Grant Types**: Authorization Code, Implicit, Refresh Token
4. Adăugați în **Allowed Callback URLs**: `http://localhost:3000`
5. Adăugați în **Allowed Logout URLs**: `http://localhost:3000`
6. Adăugați în **Allowed Web Origins**: `http://localhost:3000`

---

### 6. Pornire în Dezvoltare

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm start
```

Aplicația va fi disponibilă la: **http://localhost:3000**

---

## 🔑 Roluri și Permisiuni

| Rol | Permisiuni |
|---|---|
| `admin` | Acces complet: CRUD angajați, generare salarii, rapoarte, aprobare concedii |
| `manager` | Vizualizare angajați, rapoarte, aprobare concedii departament |
| `employee` | Pontaj propriu, cereri concediu, vizualizare salariu, chatbot HR |

La prima autentificare prin Auth0, utilizatorul este creat automat în baza de date cu rolul `employee`. Un admin poate ulterior schimba rolul.

---

## 📡 Endpoints API Principali

### Autentificare
| Metodă | Endpoint | Descriere |
|---|---|---|
| `POST` | `/api/auth/sync` | Sincronizare utilizator Auth0 → DB |
| `GET` | `/api/auth/me` | Date utilizator curent |

### Angajați
| Metodă | Endpoint | Acces |
|---|---|---|
| `GET` | `/api/employees` | Admin/Manager |
| `GET` | `/api/employees/:id` | Autentificat |
| `POST` | `/api/employees` | Admin |
| `PUT` | `/api/employees/:id` | Admin |
| `DELETE` | `/api/employees/:id` | Admin |

### Pontaj
| Metodă | Endpoint | Descriere |
|---|---|---|
| `POST` | `/api/attendance/check-in` | Înregistrare sosire |
| `POST` | `/api/attendance/check-out` | Înregistrare plecare |
| `GET` | `/api/attendance/today` | Pontajul de azi |
| `GET` | `/api/attendance/my-history` | Istoric propriu |

### Concedii
| Metodă | Endpoint | Descriere |
|---|---|---|
| `POST` | `/api/leaves` | Cerere concediu |
| `GET` | `/api/leaves/my` | Concediile mele |
| `GET` | `/api/leaves/balance` | Sold concediu |
| `PATCH` | `/api/leaves/:id/approve` | Aprobare (admin) |
| `PATCH` | `/api/leaves/:id/reject` | Respingere (admin) |

### Salarii
| Metodă | Endpoint | Descriere |
|---|---|---|
| `GET` | `/api/salary/my` | Salariile mele |
| `POST` | `/api/salary/generate/:userId` | Generare salariu (admin) |
| `POST` | `/api/salary/generate-all` | Generare în masă (admin) |

### Chatbot AI
| Metodă | Endpoint | Descriere |
|---|---|---|
| `POST` | `/api/chatbot/chat` | Conversație cu asistentul HR |

---

## 🧮 Calcul Salarii (România 2024)

Sistemul aplică automat:
- **CAS** (pensie): 25% din salariul brut
- **CASS** (sănătate): 10% din salariul brut
- **Impozit pe venit**: 10% din (brut - CAS - CASS - deducere personală)
- **Deducere personală**: 510 RON pentru salarii ≤ 3.000 RON, 0 pentru salarii > 3.000 RON
- **Ore suplimentare**: 1.5× rata orară

---

## 🤖 Chatbot AI HR

Asistentul AI are acces la datele **proprii** ale angajatului autentificat:
- Pontajul din ziua curentă
- Orele lucrate în luna curentă
- Soldul de concediu
- Ultimul salariu net

Asistentul **nu are acces** la datele altor angajați.

---

## 🚢 Deploy pe Render

### Backend
1. Creați un **Web Service** pe Render
2. Setați **Build Command**: `npm install`
3. Setați **Start Command**: `node server.js`
4. Adăugați variabilele de mediu din `.env.example`
5. Adăugați un **PostgreSQL** service pe Render și copiați `DATABASE_URL`

### Frontend
1. Creați un **Static Site** pe Render
2. Setați **Build Command**: `npm run build`
3. Setați **Publish Directory**: `build`
4. Adăugați variabilele `REACT_APP_*`

---

## 📄 Licență

MIT © Chain HR Management
