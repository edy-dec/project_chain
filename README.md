# Chain HR Management

> Platformă completă de management HR pentru companii românești. Gestionați angajați, ture, pontaj, concedii, salarii, activități de teren și rapoarte — totul dintr-o singură aplicație web modernă.

**Versiune:** 0.2.0-beta · **Status:** Active Development · **Licență:** MIT

---

## Cuprins

1. [Ce este Chain?](#1-ce-este-chain)
2. [Pentru cine este?](#2-pentru-cine-este)
3. [Ce face?](#3-ce-face--funcționalități)
4. [Cum funcționează?](#4-cum-functioneaza--arhitectura)
5. [Stack Tehnologic](#5-stack-tehnologic)
6. [Baza de Date](#6-baza-de-date--schema)
7. [Autentificare și Roluri](#7-autentificare--roluri)
8. [API Reference](#8-api-reference)
9. [Chatbot AI HR](#9-chatbot-ai-hr)
10. [Calcul Salarii România](#10-calcul-salarii-românia-2024)
11. [Configurare și Instalare](#11-configurare--instalare)
12. [Variabile de Mediu](#12-variabile-de-mediu)
13. [Deploy pe Render](#13-deploy-pe-render)
14. [Structura Proiectului](#14-structura-proiectului)

---

## 1. Ce este Chain?

**Chain** este o aplicație web full-stack de tip SaaS destinată departamentelor HR din companiile românești. Oferă un sistem centralizat pentru administrarea întregului ciclu de viață al unui angajat: de la onboarding și pontaj zilnic, la calcul salarial, gestiunea concediilor, activități de teren, ore suplimentare și raportare.

Platforma este construită ca un **monorepozitoriu** cu backend Node.js/Express și frontend React, conectate printr-un REST API, autentificate prin Auth0 și alimentate de un chatbot AI bazat pe Google Gemini.

---

## 2. Pentru cine este?

Aplicația are trei tipuri de utilizatori, fiecare cu experiență și permisiuni diferite:

| Rol | Cine este | Ce face în aplicație |
|---|---|---|
| **Admin** | Owner platformă | Acces complet: angajați, salarii, ture, concedii, ore suplimentare, activități de teren, rapoarte, setări **și cereri demo** (funcție exclusivă SaaS, invizibilă pentru manageri) |
| **Manager** | Team Lead, Manager de departament | Supervizează echipa: aprobă concedii și activități de teren, compensează ore suplimentare, înregistrare manuală pontaj, vizualizează rapoarte — **fără acces la cereri demo** |
| **Employee** | Angajat obișnuit | Pontaj zilnic, cereri de concediu și activități de teren, vizualizare salariu și ore suplimentare, asistent AI |

---

## 3. Ce face? — Funcționalități

### Managementul Angajaților
- Creare, editare și dezactivare profile angajați
- Câmpuri: nume, email, telefon, funcție, departament, dată angajare, salariu de bază, rată orară, avatar
- Atribuire departament și tură de lucru
- Urmărirea statusului contului: `active`, `inactive`, `suspended`
- Sold inițial concedii: 21 zile anuale + 10 zile medicale (configurabil)

### Pontaj & Urmărire Timp
- Check-in și check-out zilnic cu un singur click
- Calculul automat al orelor lucrate și al orelor suplimentare (>8h/zi = overtime)
- Înregistrare manuală a pontajului de către manager/admin
- Sumar lunar al prezenței per angajat
- Integrare cu modulul de concedii (zilele de concediu apar automat ca `on_leave`)
- Statusuri pontaj: `present`, `absent`, `late`, `half_day`, `on_leave`

### Managementul Concediilor
- **Tipuri de concediu suportate:**
  - Anual (`annual`) — din soldul de 21 zile
  - Medical (`sick`) — din soldul de 10 zile
  - Personal (`personal`) — fără deducere din sold
  - Maternitate (`maternity`) / Paternitate (`paternity`)
  - Fără plată (`unpaid`)
- Flux de aprobare: `pending` → `approved` / `rejected`
- Auto-aprobare pentru concedii de 1 zi (dacă e activată în setări)
- Detecție overlap — nu se pot depune cereri suprapuse
- Actualizare automată a soldului la aprobare (tranzacție atomică)
- **Audit complet** — fiecare modificare a soldului este înregistrată în `LeaveBalanceHistory`
- Manager/Admin poate anula sau respinge cu motiv

### Managementul Orelor Suplimentare
- Urmărire sold ore suplimentare pe ferestre de **90 de zile** (Codul Muncii art. 122)
- Compensare prioritară cu timp liber plătit; orele necompensate la expirare sunt plătite cu spor minim 75% (art. 123)
- Angajatul vede propriul sold (`GET /overtime/balance/my`)
- Admin/Manager poate vizualiza soldul oricărui angajat și poate aproba compensări
- Integrare automată cu modulul de salarii la generarea statului de plată

### Activități de Teren & Deplasări
- Înregistrarea situațiilor speciale de muncă în afara locației obișnuite:
  | Tip | Bază legală | Detalii |
  |---|---|---|
  | `delegation` | Codul Muncii art. 42 | Delegație — același angajator, altă locație, max 60 zile |
  | `detachment` | CM art. 45 | Detașare — alt angajator |
  | `field_work` | — | Activitate pe teren (vizite clienți, inspecții, șantier) |
  | `remote` | Legea 81/2018 | Telemuncă / muncă la domiciliu |
  | `transport` | — | Timp de conducere/deplasare ca timp de muncă |
  | `training` | — | Training extern, conferință, eveniment profesional |
- Calcul automat diurnă și indemnizație de deplasare
- Urmărire cheltuieli: transport, cazare, altele
- Marcare automată taxabilitate dacă diurna depășește plafonul neimpozabil (Codul Fiscal art. 76)
- Flux aprobare: `draft` / `pending` → `approved` / `rejected`
- Legătură opțională cu înregistrarea de pontaj din ziua respectivă

### Salarii & Payroll
- Generare lunară a statului de plată per angajat sau în masă
- Calcul automat conform legislației românești (vezi [secțiunea 10](#10-calcul-salarii-românia-2024))
- **Reguli fiscale versionizate** în baza de date (`TaxRule`) — modificările legislative nu necesită redeploy
- Includerea bonusurilor active în calculul brut
- Statusuri: `draft` → `generated` → `paid`
- Marcare individuală sau în masă ca plătit
- Angajatul poate vedea propriul istoric salarial

### Bonusuri & Sporuri
- Creare bonusuri de tip:
  - **Fix** — sumă fixă în RON
  - **Procentual** — procent din salariul de bază
  - **Multiplicator ore suplimentare** — factor aplicat ratei orare
- Aplicare: per angajat sau pe tot departamentul / compania
- Recurente (lunar) sau punctuale (interval de date)
- Administrate din panoul Admin

### Ture de Lucru
- Definirea șabloanelor de ture (ex: "Tura I" 06:00–14:00, "Zi" 09:00–17:00)
- Configurare zile săptămână și pauze
- Atribuire tură per angajat sau per departament
- Cod culoare pentru vizualizare în UI

### Sărbători Legale
- Baza de date cu sărbătorile legale românești (`LegalHoliday`), pre-populate la pornirea serverului
- Suport pentru sărbători recurente anual și cu valabilitate limitată
- Integrare cu calculul pontajului și al concediilor

### Rapoarte & Analize
- Sumar dashboard: număr angajați activi, prezenți azi, cereri concediu în așteptare
- Rapoarte pontaj filtrate pe perioadă și departament
- Rapoarte salarii pe lună și status
- Analize pe departamente

### Interfață & Experiență Utilizator
- **Mod întunecat / luminos** — toggle dark/light mode persistent
- **Multilingv** — interfață disponibilă în **Română** și **Engleză** (sistem i18n integrat)
- Dashboard cu carduri KPI, grafice de analiză lunară și urmărire timp în timp real

### Setări Aplicație
- Politici concediu (solduri implicite, auto-aprobare)
- Reguli payroll (deduceri, taxe)
- Override bonusuri per companie
- Stocat ca JSONB în tabelul `AppSettings`

### Landing Page & Demo Requests
- Pagină publică de prezentare a platformei
- Formular de cerere demo/trial
- **Exclusiv Admin (owner):** gestionare cereri demo (`new` → `contacted` → `closed`) — funcție SaaS, nu face parte din ecosistemul de management HR; invizibilă și inaccesibilă pentru manageri
- Abonare newsletter

---

## 4. Cum functioneaza? — Arhitectura

```
┌─────────────────────────────────────────────────────────┐
│                     BROWSER (User)                      │
│              React 18 SPA + TailwindCSS                 │
│         Auth0 SDK → obține JWT la autentificare         │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTPS + Bearer JWT
                        ▼
┌─────────────────────────────────────────────────────────┐
│                  BACKEND (Node.js/Express)               │
│                                                         │
│  ┌──────────┐   ┌────────────┐   ┌──────────────────┐   │
│  │  Routes  │ → │Controllers │ → │    Services      │   │
│  └──────────┘   └────────────┘   └────────┬─────────┘   │
│                                           │             │
│  Middleware stack:                        ▼             │
│  - checkJwt (Auth0 JWKS validation) ┌──────────┐        │
│  - attachUser (DB lookup)           │ Sequelize│        │
│  - requireRole (RBAC)               │  Models  │        │
│  - express-validator                └────┬─────┘        │
│  - helmet, cors, rate-limit              │              │
└─────────────────────────────────────────┼──────────────┘
                                          │
                        ┌─────────────────▼──────────────┐
                        │         PostgreSQL DB           │
                        │  Users, Attendance, Leave,      │
                        │  Salary, Bonus, Shift, Dept,    │
                        │  OvertimeBalance, FieldActivity, │
                        │  TaxRule, LegalHoliday, ...     │
                        └────────────────────────────────┘

Servicii externe:
  Auth0  ──→  Autentificare OAuth 2.0 (RS256 JWT)
  Gemini ──→  AI Chatbot HR (Google Generative AI)
  Gmail  ──→  Notificări email (Nodemailer SMTP)
```

### Fluxul unei cereri autentificate:

1. Utilizatorul se autentifică prin **Auth0** (email/parolă sau social login)
2. Auth0 returnează un **JWT semnat RS256**
3. Frontend-ul atașează JWT la fiecare request: `Authorization: Bearer <token>`
4. Middleware-ul `checkJwt` validează semnătura cu **JWKS** de la Auth0
5. Middleware-ul `attachUser` caută utilizatorul în baza de date după `auth0Id`
6. La prima autentificare: `POST /api/auth/sync` creează automat utilizatorul cu rol `employee`
7. Middleware-ul `requireRole` verifică dacă rolul corespunde rutei accesate
8. Controllerul apelează service-ul, care interacționează cu modelele Sequelize
9. Răspunsul este formatat și returnat ca JSON

---

## 5. Stack Tehnologic

### Frontend
| Tehnologie | Versiune | Rol |
|---|---|---|
| React | 18.2.0 | Framework UI principal |
| React Router | v6.21.0 | Rutare client-side |
| TailwindCSS | 3.4.19 | Styling utility-first |
| Axios | 1.6.0 | Client HTTP pentru API |
| Recharts | — | Grafice și vizualizări |
| date-fns | 3.0.6 | Manipulare date |
| jsPDF | 2.5.2 | Export PDF rapoarte |
| Lucide React | — | Icoane SVG |
| @auth0/auth0-react | — | SDK Auth0 SPA |

### Backend
| Tehnologie | Versiune | Rol |
|---|---|---|
| Node.js | ≥18 | Runtime JavaScript |
| Express.js | 4.18.2 | Framework HTTP |
| Sequelize | 6.35.1 | ORM PostgreSQL |
| pg | 8.11.3 | Driver PostgreSQL |
| express-jwt | 8.4.1 | Validare JWT |
| jwks-rsa | 3.1.0 | Fetch chei publice Auth0 |
| @google/generative-ai | 0.24.1 | Client Gemini AI |
| @google/genai | 1.45.0 | Client Gemini AI (v2) |
| Helmet | 7.1.0 | Security headers |
| express-rate-limit | 7.1.5 | Rate limiting |
| express-validator | 7.0.1 | Validare input |
| Nodemailer | 8.0.6 | Trimitere email |
| Morgan | 1.10.0 | HTTP request logging |
| cors | 2.8.5 | CORS middleware |
| dotenv | 16.3.1 | Variabile de mediu |
| Nodemon | 3.0.2 | Auto-reload dezvoltare |

### Servicii Externe
| Serviciu | Utilizare |
|---|---|
| **Auth0** | Autentificare OAuth 2.0, JWT RS256, managementul utilizatorilor |
| **Google Gemini API** | Chatbot AI HR (model: `gemini-3-flash-preview`) |
| **Gmail SMTP** | Notificări email prin Nodemailer |
| **Render** | Hosting backend (Web Service) + frontend (Static Site) |
| **PostgreSQL** | Baza de date relațională (hosted pe Render sau local) |

---

## 6. Baza de Date — Schema

Toate tabelele sunt gestionate prin **Sequelize ORM** cu auto-sync (`alter: true` în development). Sărbătorile legale și regulile fiscale sunt populate automat la pornirea serverului prin seed-uri.

### User
Profilul unui angajat/admin.

| Câmp | Tip | Detalii |
|---|---|---|
| `id` | UUID | Cheie primară |
| `auth0Id` | STRING | ID-ul din Auth0, unic |
| `firstName`, `lastName` | STRING | Numele complet |
| `email` | STRING | Email unic |
| `role` | ENUM | `admin`, `manager`, `employee` |
| `position` | STRING | Funcția în companie |
| `phone` | STRING | Telefon |
| `baseSalary` | DECIMAL | Salariul brut de bază (RON) |
| `hourlyRate` | DECIMAL | Rata orară (RON) |
| `hireDate` | DATEONLY | Data angajării |
| `status` | ENUM | `active`, `inactive`, `suspended` |
| `avatar` | STRING | URL avatar |
| `annualLeaveBalance` | INTEGER | Sold concediu anual (implicit: 21) |
| `sickLeaveBalance` | INTEGER | Sold concediu medical (implicit: 10) |
| `departmentId` | FK → Department | — |
| `shiftId` | FK → Shift | — |

### Department
Departamentele companiei.

| Câmp | Tip | Detalii |
|---|---|---|
| `id` | UUID | Cheie primară |
| `name` | STRING | Denumire departament |
| `description` | TEXT | Descriere |
| `color` | STRING | Cod culoare hex (UI) |

### Shift
Șabloane de ture de lucru.

| Câmp | Tip | Detalii |
|---|---|---|
| `id` | UUID | Cheie primară |
| `name` | STRING | Ex: "Tura I", "Zi" |
| `startTime`, `endTime` | TIME | Interval orar |
| `daysOfWeek` | ARRAY(INTEGER) | Zilele active [1–7] |
| `breakMinutes` | INTEGER | Pauza în minute |
| `color` | STRING | Cod culoare hex |
| `isActive` | BOOLEAN | Stare activ/inactiv |
| `departmentId` | FK → Department | — |

### Attendance
Înregistrările de pontaj zilnic.

| Câmp | Tip | Detalii |
|---|---|---|
| `id` | UUID | Cheie primară |
| `date` | DATEONLY | Data pontajului |
| `checkIn`, `checkOut` | DATE | Timestamp sosire/plecare |
| `totalHours` | DECIMAL | Total ore lucrate |
| `overtimeHours` | DECIMAL | Ore suplimentare (>8h) |
| `status` | ENUM | `present`, `absent`, `late`, `half_day`, `on_leave` |
| `notes` | TEXT | Observații |
| `isManualEntry` | BOOLEAN | Dacă a fost înregistrat manual |
| `approvedBy` | UUID | Userul care a aprobat intrarea manuală |
| `userId` | FK → User | Angajatul |
| `shiftId` | FK → Shift | Tura asociată |

### Leave
Cererile de concediu.

| Câmp | Tip | Detalii |
|---|---|---|
| `id` | UUID | Cheie primară |
| `type` | ENUM | `annual`, `sick`, `personal`, `maternity`, `paternity`, `unpaid` |
| `startDate`, `endDate` | DATEONLY | Interval concediu |
| `days` | INTEGER | Număr zile |
| `reason` | TEXT | Motivul cererii |
| `status` | ENUM | `pending`, `approved`, `rejected`, `cancelled` |
| `approvedAt` | DATE | Data aprobării |
| `rejectionReason` | TEXT | Motivul respingerii |
| `attachmentUrl` | STRING | Document atașat (URL) |
| `userId` | FK → User | Angajatul care cere |
| `approverId` | FK → User | Managerul/Adminul care aprobă |

### LeaveBalanceHistory
Jurnal imutabil al tuturor modificărilor de sold concediu.

| Câmp | Tip | Detalii |
|---|---|---|
| `id` | UUID | Cheie primară |
| `leaveType` | STRING | Tipul de concediu afectat |
| `changeAmount` | INTEGER | Pozitiv = credit, negativ = debit |
| `balanceAfter` | INTEGER | Soldul după modificare |
| `reason` | STRING | Motivul modificării |
| `userId` | FK → User | Angajatul |
| `performedBy` | FK → User | Cine a efectuat modificarea |

### OvertimeBalance
Soldul orelor suplimentare pe ferestre de 90 zile (CM art. 122).

| Câmp | Tip | Detalii |
|---|---|---|
| `id` | UUID | Cheie primară |
| `periodStart` | DATEONLY | Începutul ferestrei de 90 zile |
| `expirationDate` | DATEONLY | `periodStart + 90 zile` — termen limită compensare |
| `accumulatedHours` | DECIMAL | Ore suplimentare acumulate |
| `compensatedHours` | DECIMAL | Ore compensate cu timp liber |
| `paidHours` | DECIMAL | Ore expirate incluse în statul de plată |
| `userId` | FK → User | Angajatul |

### FieldActivity
Activități speciale de muncă în afara locației obișnuite.

| Câmp | Tip | Detalii |
|---|---|---|
| `id` | UUID | Cheie primară |
| `activityType` | ENUM | `delegation`, `detachment`, `field_work`, `remote`, `transport`, `training` |
| `destination` | STRING | Locația activității |
| `startDate`, `endDate` | DATEONLY | Interval activitate |
| `startTime`, `endTime` | TIME | Ore (pentru activități într-o singură zi) |
| `totalDays`, `totalHours` | DECIMAL | Durată calculată |
| `dailyAllowance` | DECIMAL | Diurnă RON/zi |
| `totalAllowance` | DECIMAL | Total indemnizație deplasare |
| `transportCost` | DECIMAL | Cheltuieli transport |
| `accommodationCost` | DECIMAL | Cheltuieli cazare |
| `otherCosts` | DECIMAL | Alte cheltuieli |
| `isTaxable` | BOOLEAN | Diurna depășește plafonul neimpozabil (CF art. 76) |
| `status` | ENUM | `draft`, `pending`, `approved`, `rejected` |
| `approvedAt` | DATE | Data aprobării |
| `rejectionReason` | TEXT | Motivul respingerii |
| `notes` | TEXT | Observații |
| `attachmentUrl` | STRING | Document justificativ (URL) |
| `userId` | FK → User | Angajatul |
| `approvedBy` | FK → User | Aprobatorul |
| `attendanceId` | FK → Attendance | Pontajul asociat (opțional) |

### TaxRule
Reguli fiscale și de muncă versionizate, specifice per țară.

| Câmp | Tip | Detalii |
|---|---|---|
| `id` | UUID | Cheie primară |
| `country` | CHAR(2) | Codul țării (implicit `RO`) |
| `ruleType` | STRING | `cas`, `cass`, `income_tax`, `cam`, `overtime_min_bonus`, etc. |
| `rate` | DECIMAL | Rată fracționară (ex: `0.25` = 25%) |
| `amount` | DECIMAL | Valoare absolută (zile, ore, RON) |
| `validFrom`, `validUntil` | DATEONLY | Intervalul de valabilitate |
| `notes` | TEXT | Note explicative |

### LegalHoliday
Sărbătorile legale românești.

| Câmp | Tip | Detalii |
|---|---|---|
| `id` | UUID | Cheie primară |
| `holidayDate` | DATEONLY | Data sărbătorii |
| `name` | STRING | Denumire |
| `country` | CHAR(2) | Cod țară (implicit `RO`) |
| `isRecurring` | BOOLEAN | Se repetă anual |
| `validFrom`, `validUntil` | DATEONLY | Intervalul de valabilitate |

### Salary
Statele de plată lunare.

| Câmp | Tip | Detalii |
|---|---|---|
| `id` | UUID | Cheie primară |
| `month` | INTEGER | Luna (1–12) |
| `year` | INTEGER | Anul |
| `baseSalary` | DECIMAL | Salar de bază brut |
| `workedDays` | INTEGER | Zile lucrate |
| `workedHours` | DECIMAL | Ore lucrate total |
| `overtimeHours` | DECIMAL | Ore suplimentare |
| `overtimePay` | DECIMAL | Valoare ore suplimentare |
| `bonusesTotal` | DECIMAL | Total bonusuri aplicate |
| `deductions` | DECIMAL | Alte deduceri |
| `grossSalary` | DECIMAL | Salariu brut final |
| `taxAmount` | DECIMAL | Impozit pe venit (10%) |
| `socialContributions` | DECIMAL | CAS + CASS |
| `netSalary` | DECIMAL | Salariu net de plată |
| `status` | ENUM | `draft`, `generated`, `paid` |
| `paidAt` | DATE | Data plății |
| `notes` | TEXT | Note |
| `userId` | FK → User | Angajatul |

### Bonus
Bonusuri și sporuri configurabile.

| Câmp | Tip | Detalii |
|---|---|---|
| `id` | UUID | Cheie primară |
| `name` | STRING | Denumire bonus |
| `type` | ENUM | `fixed`, `percentage`, `overtime_multiplier` |
| `amount` | DECIMAL | Valoarea bonusului |
| `appliesTo` | STRING | `all`, `department:<id>`, `user:<id>` |
| `description` | TEXT | Descriere |
| `isRecurring` | BOOLEAN | Lunar recurent |
| `applicableFrom`, `applicableTo` | DATEONLY | Interval de aplicare |
| `isActive` | BOOLEAN | Activ/inactiv |

### AppSetting
Configurații aplicație (JSONB).

| Cheie | Conținut |
|---|---|
| `leavePolicy` | Solduri implicite, auto-aprobare |
| `payrollSettings` | Reguli calcul, deduceri |
| `bonusOverrides` | Override-uri bonusuri |
| `generalSettings` | Setări generale companie |

### DemoRequest
Cereri de trial din landing page.

| Câmp | Tip | Detalii |
|---|---|---|
| `id` | UUID | Cheie primară |
| `fullName`, `company`, `email`, `phone` | STRING | Date contact |
| `role`, `teamSize`, `focus` | STRING | Context |
| `status` | ENUM | `new`, `contacted`, `closed` |

### Relații (Associations)
```
User ──N:1──► Department
User ──N:1──► Shift
User ──1:N──► Attendance
User ──1:N──► Leave (ca angajat)
User ──1:N──► Leave (ca aprobare)
User ──1:N──► Salary
User ──1:N──► OvertimeBalance
User ──1:N──► FieldActivity (ca angajat)
User ──1:N──► FieldActivity (ca aprobare)
User ──1:N──► LeaveBalanceHistory (ca angajat)
User ──1:N──► LeaveBalanceHistory (ca actor)
Department ──1:N──► Shift
Shift ──1:N──► Attendance
Attendance ──1:N──► FieldActivity
```

---

## 7. Autentificare & Roluri

### Mecanismul Auth0 + RS256 JWT

```
1. User → Auth0 Login (email/parolă sau social)
         ↓
2. Auth0 → emite JWT semnat cu cheie privată RS256
         ↓
3. Frontend → stochează JWT și îl trimite în header:
   Authorization: Bearer <jwt_token>
         ↓
4. Backend → checkJwt middleware:
   - Fetch JWKS de la: https://{AUTH0_DOMAIN}/.well-known/jwks.json
   - Verifică semnătura JWT cu cheia publică Auth0
   - Verifică audience: https://chain-api
   - Verifică expirarea tokenului
         ↓
5. attachUser middleware:
   - Extrage auth0Id din JWT payload (sub)
   - Caută User în PostgreSQL după auth0Id
         ↓
6. Prima autentificare → POST /api/auth/sync:
   - Creează automat User cu rol 'employee'
   - Dacă emailul există deja → linkuieste auth0Id
         ↓
7. requireRole middleware → verifică rolul pentru rută
```

**Config Auth0:**
- Domain: `chainapp.eu.auth0.com`
- Audience: `https://chain-api`
- Algoritm: RS256

### Ierarhia Rolurilor

```
admin  (owner platformă)
  ├── Toate drepturile managerului
  ├── CRUD angajați (creare, editare, dezactivare)
  ├── Generare și plată salarii (individual + în masă)
  ├── Creare/editare bonusuri
  ├── Modificare setări aplicație
  ├── Vizualizare / compensare ore suplimentare (toți angajații)
  └── [EXCLUSIV] Gestionare cereri demo (SaaS) — invizibil pentru manageri

manager
  ├── Toate drepturile angajatului
  ├── Vizualizare toți angajații din departament
  ├── Aprobare/respingere concedii
  ├── Aprobare/respingere activități de teren
  ├── Compensare ore suplimentare
  ├── Înregistrare manuală pontaj
  ├── Creare/editare ture
  └── Acces rapoarte

employee
  ├── Check-in/check-out zilnic
  ├── Vizualizare pontaj propriu
  ├── Depunere cereri concediu
  ├── Vizualizare sold concediu și istoric modificări
  ├── Înregistrare activități de teren (delegații, telemuncă etc.)
  ├── Vizualizare sold ore suplimentare
  ├── Vizualizare propriul salariu
  └── Chat cu asistentul AI HR
```

---

## 8. API Reference

**Base URL:** `/api`  
**Autentificare:** `Authorization: Bearer <JWT>` (toate rutele, excepție `/health` și demo requests)  
**Rate Limit:** 200 req / 15 min

### Auth
| Metodă | Endpoint | Descriere | Acces |
|---|---|---|---|
| POST | `/auth/sync` | Sincronizare Auth0 → DB (prima autentificare) | JWT valid |
| GET | `/auth/me` | Profil utilizator curent | Autentificat |
| PUT | `/auth/me` | Actualizare profil propriu | Autentificat |

### Angajați
| Metodă | Endpoint | Descriere | Acces |
|---|---|---|---|
| GET | `/employees` | Listă angajați (paginat) | Admin / Manager |
| GET | `/employees/:id` | Detalii angajat | Autentificat |
| POST | `/employees` | Creare angajat | Admin |
| PUT | `/employees/:id` | Editare angajat | Admin |
| DELETE | `/employees/:id` | Dezactivare angajat | Admin |

### Pontaj (Attendance)
| Metodă | Endpoint | Descriere | Acces |
|---|---|---|---|
| POST | `/attendance/check-in` | Înregistrare sosire | Autentificat |
| POST | `/attendance/check-out` | Înregistrare plecare | Autentificat |
| GET | `/attendance/today` | Pontajul de azi | Autentificat |
| GET | `/attendance/my-history` | Istoric personal | Autentificat |
| GET | `/attendance/my-monthly` | Sumar lunar personal | Autentificat |
| GET | `/attendance` | Toate pontajele | Admin / Manager |
| GET | `/attendance/employee/:userId` | Istoricul unui angajat | Admin / Manager |
| GET | `/attendance/employee/:userId/monthly` | Sumar lunar angajat | Admin / Manager |
| POST | `/attendance/manual` | Înregistrare manuală | Admin / Manager |

### Concedii (Leaves)
| Metodă | Endpoint | Descriere | Acces |
|---|---|---|---|
| POST | `/leaves` | Cerere concediu nouă | Autentificat |
| GET | `/leaves/my` | Concediile mele | Autentificat |
| GET | `/leaves/balance` | Sold concediu | Autentificat |
| PATCH | `/leaves/:id/cancel` | Anulare cerere proprie | Autentificat |
| GET | `/leaves` | Toate cererile | Admin / Manager |
| GET | `/leaves/employee/:userId` | Concediile unui angajat | Admin / Manager |
| PATCH | `/leaves/:id/approve` | Aprobare concediu | Admin / Manager |
| PATCH | `/leaves/:id/reject` | Respingere concediu | Admin / Manager |

### Ore Suplimentare (Overtime)
| Metodă | Endpoint | Descriere | Acces |
|---|---|---|---|
| GET | `/overtime/balance/my` | Soldul propriu de ore suplimentare | Autentificat |
| GET | `/overtime/balance/:userId` | Soldul unui angajat | Admin / Manager |
| POST | `/overtime/compensate` | Compensare ore suplimentare cu timp liber | Admin / Manager |

### Activități de Teren (Field Activities)
| Metodă | Endpoint | Descriere | Acces |
|---|---|---|---|
| POST | `/field-activities` | Înregistrare activitate nouă | Autentificat |
| GET | `/field-activities/my` | Activitățile proprii | Autentificat |
| GET | `/field-activities/my/summary` | Sumar lunar propriu (`?year=&month=`) | Autentificat |
| GET | `/field-activities/:id` | Detalii activitate | Autentificat |
| PUT | `/field-activities/:id` | Editare activitate (doar `draft`/`pending`) | Autentificat |
| PATCH | `/field-activities/:id/cancel` | Anulare activitate | Autentificat |
| GET | `/field-activities` | Toate activitățile | Admin / Manager |
| GET | `/field-activities/employee/:userId/summary` | Sumar lunar pe angajat | Admin / Manager |
| PATCH | `/field-activities/:id/approve` | Aprobare activitate | Admin / Manager |
| PATCH | `/field-activities/:id/reject` | Respingere activitate | Admin / Manager |

### Salarii (Salary)
| Metodă | Endpoint | Descriere | Acces |
|---|---|---|---|
| GET | `/salary/my` | Salariile mele | Autentificat |
| GET | `/salary` | Toate salariile | Admin |
| GET | `/salary/employee/:userId` | Salariile unui angajat | Admin |
| POST | `/salary/generate/:userId` | Generare salariu pentru user | Admin |
| POST | `/salary/generate-all` | Generare în masă (toți angajații) | Admin |
| POST | `/salary/pay-all` | Marcare în masă ca plătit | Admin |
| PATCH | `/salary/:id/paid` | Marcare individual ca plătit | Admin |

### Ture (Shifts)
| Metodă | Endpoint | Descriere | Acces |
|---|---|---|---|
| GET | `/shifts` | Listă ture | Autentificat |
| GET | `/shifts/:id` | Detalii tură | Autentificat |
| POST | `/shifts` | Creare tură | Admin / Manager |
| PUT | `/shifts/:id` | Editare tură | Admin / Manager |
| DELETE | `/shifts/:id` | Ștergere tură | Admin |
| POST | `/shifts/assign` | Atribuire tură la angajat | Admin / Manager |

### Bonusuri (Bonuses)
| Metodă | Endpoint | Descriere | Acces |
|---|---|---|---|
| GET | `/bonuses` | Listă bonusuri | Admin / Manager |
| POST | `/bonuses` | Creare bonus | Admin |
| PUT | `/bonuses/:id` | Editare bonus | Admin |
| DELETE | `/bonuses/:id` | Ștergere bonus | Admin |

### Rapoarte (Reports)
| Metodă | Endpoint | Descriere | Acces |
|---|---|---|---|
| GET | `/reports/summary` | Sumar dashboard | Admin / Manager |
| GET | `/reports/attendance` | Raport pontaj | Admin / Manager |
| GET | `/reports/salary` | Raport salarii | Admin / Manager |
| GET | `/reports/departments` | Analize departamente | Admin / Manager |

### Chatbot AI
| Metodă | Endpoint | Descriere | Acces |
|---|---|---|---|
| POST | `/chatbot/chat` | Conversație cu asistentul AI HR | Autentificat |

### Alte Rute
| Metodă | Endpoint | Descriere | Acces |
|---|---|---|---|
| POST | `/demo-requests` | Trimitere cerere demo | Public |
| GET | `/demo-requests` | Listă cereri demo | Admin |
| PATCH | `/demo-requests/:id` | Actualizare status cerere | Admin |
| POST | `/newsletter` | Abonare newsletter | Public |
| GET/PUT | `/settings` | Setări aplicație | Admin |
| GET | `/health` | Health check server | Public |

---

## 9. Chatbot AI HR

Asistentul AI HR este alimentat de **Google Gemini** (`gemini-3-flash-preview`) și are acces exclusiv la datele **proprii** ale utilizatorului autentificat.

### Ce poate face asistentul

| Intenție | Exemplu întrebare |
|---|---|
| Sold concediu | "Câte zile de concediu mai am?" |
| Concediu luat în an | "Câte zile am luat în 2025?" |
| Următorul concediu | "Când urmează concediul meu aprobat?" |
| Salariu luna curentă | "Care e salariul meu luna asta?" |
| Salarii recente | "Arată-mi ultimele salarii" |
| Data de salarizare | "Când primesc banii?" |
| Program de lucru | "Ce tură am?" |
| Ore lunare | "Câte ore am lucrat luna asta?" |
| Ore suplimentare | "Am ore suplimentare în mai?" |

### Funcționare

1. Mesajul utilizatorului este trimis la `POST /api/chatbot/chat`
2. Service-ul detectează **limba** (română/engleză)
3. Se recunoaște **intenția** prin analiza cuvintelor cheie
4. Se extrag din baza de date datele relevante (pontaj, concedii, salarii)
5. Se construiește un **prompt contextual** cu datele angajatului
6. Gemini generează răspunsul natural
7. **Fallback:** dacă Gemini nu e disponibil, service-ul răspunde direct pe baza intențiilor detectate

### Limitări de securitate
- Asistentul **nu are acces** la datele altor angajați
- Nu poate efectua acțiuni (aproba, modifica date)
- Răspunde doar pe baza propriilor date ale utilizatorului autentificat

---

## 10. Calcul Salarii România 2024

Sistemul aplică automat regulile de impozitare pentru salariați conform legislației românești în vigoare. **Regulile fiscale sunt stocate în baza de date** (`TaxRule`) și încărcate la runtime — modificările legislative nu necesită redeploy.

```
Salariu Brut = Salariu de Bază + Ore Suplimentare + Bonusuri - Deduceri

Contribuții angajat:
  CAS (pensie)    = 25% × Brut
  CASS (sănătate) = 10% × Brut

Deducere personală:
  500 RON dacă Venitul Net ≤ 3.000 RON
  0 RON dacă Venitul Net > 3.000 RON

Baza impozabilă = Brut - CAS - CASS - Deducere personală

Impozit pe venit = 10% × Baza impozabilă

Salariu Net = Brut - CAS - CASS - Impozit pe venit
```

### Calcul Ore Suplimentare
```
Ore suplimentare = MAX(0, Total Ore Lucrate - 8) pe zi
Plată ore suplimentare = Ore Suplimentare × Rată Orară × 1.5

Compensare preferată: timp liber plătit (în termen de 90 zile — CM art. 122)
Plată forțată: spor minim 75% pentru orele expirate necompensate (CM art. 123)
```

### Aplicarea Bonusurilor
Bonusurile active pentru luna generată sunt aplicate în funcție de `appliesTo`:
- `all` → aplicat tuturor angajaților
- `department:<id>` → aplicat angajaților din departamentul respectiv
- `user:<id>` → aplicat unui singur angajat

---

## 11. Configurare & Instalare

### Cerințe Prealabile
- Node.js ≥ 18
- PostgreSQL ≥ 14
- Cont Auth0 (plan gratuit suficient)
- Cheie API Google Gemini (opțional, pentru chatbot)

### Pas 1 — Clonare și Instalare Dependențe

```bash
git clone <repo-url>
cd project_CHAIN

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### Pas 2 — Creare Baza de Date PostgreSQL

```bash
psql -U postgres
CREATE DATABASE chaindb;
\q
```

Tabelele sunt create automat la prima pornire a serverului prin Sequelize `sync({ alter: true })`. Sărbătorile legale și regulile fiscale sunt populate automat prin seed-uri.

### Pas 3 — Configurare Auth0

1. Mergeți pe [auth0.com](https://auth0.com) și creați un cont (gratuit)
2. Creați o **Single Page Application** → copiați `Domain` și `Client ID`
3. Creați un **API** cu Identifier `https://chain-api` → copiați `Audience`
4. În setările aplicației SPA, adăugați:
   - **Allowed Callback URLs:** `http://localhost:3000`
   - **Allowed Logout URLs:** `http://localhost:3000`
   - **Allowed Web Origins:** `http://localhost:3000`
5. Activați Grant Types: Authorization Code, Implicit, Refresh Token

### Pas 4 — Configurare Variabile de Mediu

Creați fișierele `.env` conform secțiunii [12](#12-variabile-de-mediu).

### Pas 5 — Pornire în Dezvoltare

```bash
# Terminal 1 — Backend (http://localhost:5000)
cd backend
npm run dev

# Terminal 2 — Frontend (http://localhost:3000)
cd frontend
npm start
```

### Pas 6 — Primul Admin

La prima autentificare, orice utilizator primește rolul `employee`. Pentru a deveni admin:
1. Autentificați-vă o dată ca să se creeze contul în baza de date
2. Conectați-vă direct la PostgreSQL și actualizați rolul:
```sql
UPDATE "Users" SET role = 'admin' WHERE email = 'admin@example.com';
```

### Scripturi Disponibile

**Backend:**
```bash
npm start          # Pornire producție (node server.js)
npm run dev        # Pornire cu nodemon (auto-reload)
npm run migrate    # Rulare migrații Sequelize
npm run seed       # Populare baza de date cu date de test
```

**Frontend:**
```bash
npm start          # Server de dezvoltare CRA (port 3000)
npm run build      # Build producție în /build
npm test           # Rulare teste
```

---

## 12. Variabile de Mediu

### Backend — `backend/.env`

```env
# Mediu
NODE_ENV=development
PORT=5000

# Baza de date PostgreSQL
DATABASE_URL=postgresql://postgres:parola@localhost:5432/chaindb

# Auth0
AUTH0_DOMAIN=your-tenant.eu.auth0.com
AUTH0_AUDIENCE=https://chain-api

# Google Gemini AI (opțional)
GEMINI_API_KEY=AIzaSy...
GEMINI_MODEL=gemini-3-flash-preview

# URL Frontend (pentru CORS)
CLIENT_URL=http://localhost:3000

# Email SMTP (opțional, pentru notificări)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=yourapp@gmail.com
SMTP_PASS=your-app-specific-password
SMTP_FROM_NAME=Chain HR
SMTP_FROM_EMAIL=yourapp@gmail.com
```

### Frontend — `frontend/.env`

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_AUTH0_DOMAIN=your-tenant.eu.auth0.com
REACT_APP_AUTH0_CLIENT_ID=your-auth0-client-id
REACT_APP_AUTH0_AUDIENCE=https://chain-api
```

> Pentru Gmail SMTP, generați o **App Password** din Google Account → Security → 2-Step Verification → App Passwords.

---

## 13. Deploy pe Render

### Backend (Web Service)

1. Creați un **Web Service** pe [render.com](https://render.com)
2. Conectați repository-ul GitHub
3. Setați **Root Directory:** `backend`
4. **Build Command:** `npm install`
5. **Start Command:** `node server.js`
6. Creați un **PostgreSQL** service pe Render și copiați `Internal Database URL` în `DATABASE_URL`
7. Adăugați toate variabilele de mediu din `backend/.env`
8. Actualizați `CLIENT_URL` cu URL-ul real al frontend-ului de pe Render

### Frontend (Static Site)

1. Creați un **Static Site** pe Render
2. Conectați același repository
3. Setați **Root Directory:** `frontend`
4. **Build Command:** `npm run build`
5. **Publish Directory:** `build`
6. Adăugați variabilele `REACT_APP_*` cu valorile de producție
7. Actualizați `REACT_APP_API_URL` cu URL-ul backend-ului de pe Render

### Configurare Auth0 pentru Producție

În setările aplicației Auth0, adăugați URL-urile de producție:
- **Allowed Callback URLs:** `https://your-frontend.onrender.com`
- **Allowed Logout URLs:** `https://your-frontend.onrender.com`
- **Allowed Web Origins:** `https://your-frontend.onrender.com`

---

## 14. Structura Proiectului

```
project_CHAIN/
│
├── backend/
│   ├── server.js                    # Entry point — pornire server + auto-seed
│   ├── app.js                       # Configurare Express, middleware global
│   ├── package.json
│   ├── migrations/                  # Migrații Sequelize CLI
│   └── src/
│       ├── config/
│       │   ├── auth.js              # Configurare Auth0 JWT (checkJwt middleware)
│       │   └── database.js          # Conexiune Sequelize + PostgreSQL
│       │
│       ├── models/                  # Modele Sequelize (schema tabel + relații)
│       │   ├── index.js             # Agregator + definire associations
│       │   ├── User.js
│       │   ├── Department.js
│       │   ├── Shift.js
│       │   ├── Attendance.js
│       │   ├── Leave.js
│       │   ├── LeaveBalanceHistory.js  # Audit imutabil modificări sold concediu
│       │   ├── Salary.js
│       │   ├── Bonus.js
│       │   ├── OvertimeBalance.js   # Sold ore suplimentare / 90 zile (CM art.122)
│       │   ├── FieldActivity.js     # Delegații, telemuncă, activități pe teren
│       │   ├── LegalHoliday.js      # Sărbători legale RO (pre-populate la start)
│       │   ├── TaxRule.js           # Reguli fiscale versionizate (fără redeploy)
│       │   ├── AppSetting.js
│       │   └── DemoRequest.js
│       │
│       ├── controllers/             # Request handlers (parsare input, apel service, răspuns)
│       │   ├── authController.js
│       │   ├── userController.js
│       │   ├── attendanceController.js
│       │   ├── leaveController.js
│       │   ├── salaryController.js
│       │   ├── shiftController.js
│       │   ├── reportController.js
│       │   ├── chatbotController.js
│       │   ├── bonusController.js
│       │   ├── settingsController.js
│       │   ├── overtimeController.js    # Sold și compensare ore suplimentare
│       │   ├── fieldActivityController.js  # CRUD activități de teren
│       │   ├── demoRequestController.js
│       │   └── newsletterController.js
│       │
│       ├── services/                # Business logic (calcule, validări, DB operations)
│       │   ├── userService.js
│       │   ├── attendanceService.js
│       │   ├── leaveService.js
│       │   ├── payrollService.js    # Calcul salarii + taxe România (citește TaxRule)
│       │   ├── chatbotService.js    # Integrare Gemini AI + intent detection
│       │   ├── shiftService.js
│       │   ├── bonusService.js
│       │   ├── reportService.js
│       │   ├── settingsService.js
│       │   ├── fieldActivityService.js  # Logică activități de teren + diurnă
│       │   ├── demoRequestService.js
│       │   └── newsletterService.js
│       │
│       ├── routes/                  # Express routers + validări
│       │   ├── index.js             # Agregator rute
│       │   ├── authRoutes.js
│       │   ├── userRoutes.js
│       │   ├── attendanceRoutes.js
│       │   ├── leaveRoutes.js
│       │   ├── salaryRoutes.js
│       │   ├── shiftRoutes.js
│       │   ├── reportRoutes.js
│       │   ├── chatbotRoutes.js
│       │   ├── bonusRoutes.js
│       │   ├── settingsRoutes.js
│       │   ├── overtimeRoutes.js        # /overtime/balance/my, /compensate
│       │   ├── fieldActivityRoutes.js   # /field-activities CRUD + aprobare
│       │   ├── demoRequestRoutes.js
│       │   └── newsletterRoutes.js
│       │
│       ├── middleware/
│       │   ├── authMiddleware.js    # attachUser — caută userul în DB după auth0Id
│       │   ├── roleMiddleware.js    # requireRole — verifică rolul utilizatorului
│       │   └── errorMiddleware.js   # Gestionare globală erori + formatare răspuns
│       │
│       ├── seeds/
│       │   ├── index.js             # Orchestrator seed-uri (rulat la pornire server)
│       │   ├── legalHolidays.js     # Sărbători legale RO pre-populate
│       │   └── taxRules.js          # Reguli fiscale RO pre-populate
│       │
│       └── utils/
│           ├── calculationHelper.js # Calcule taxe, bonusuri, ore suplimentare
│           ├── dateHelper.js        # Funcții utilitare pentru date
│           ├── departmentHelper.js  # Logică departamente
│           └── responseHelper.js    # Formatare răspunsuri API
│
└── frontend/
    ├── package.json
    ├── public/
    │   └── index.html
    └── src/
        ├── App.jsx                  # Component root, rutare principală
        ├── index.js                 # Entry point React
        │
        ├── i18n/
        │   └── translations.js      # Dicționar EN/RO pentru toată aplicația
        │
        ├── constants/
        │   └── index.js             # Constante aplicație (tipuri concediu, statusuri etc.)
        │
        ├── context/
        │   └── AuthContext.jsx      # Context autentificare (user, token, logout)
        │
        ├── services/                # Module pentru apeluri API (Axios)
        │   ├── api.js               # Instanță Axios configurată cu base URL și JWT
        │   ├── attendanceService.js
        │   ├── chatbotService.js
        │   ├── employeeService.js
        │   ├── leaveService.js
        │   └── shiftService.js
        │
        ├── utils/
        │   └── formatters.js        # Formatare date, valute, durate
        │
        ├── components/
        │   ├── common/              # Componente reutilizabile (Modal, Spinner)
        │   └── ui/                  # Componente UI (Button, Badge, Input, Select, Table)
        │
        └── pages/
            ├── Landing/             # Pagini publice
            │   ├── LandingPage.jsx
            │   ├── DemoRequestPage.jsx
            │   └── PlatformOverviewPage.jsx
            └── Dashboard/
                ├── admin/           # Panou admin
                │   ├── AdminLayout.jsx      # Layout cu dark/light mode + i18n
                │   ├── AdminOverview.jsx
                │   ├── AdminEmployees.jsx
                │   ├── AdminLeave.jsx
                │   ├── AdminShifts.jsx
                │   ├── AdminBonuses.jsx
                │   ├── AdminReports.jsx
                │   ├── AdminSettings.jsx
                │   └── AdminDemoRequests.jsx
                └── employee/        # Panou angajat
                    ├── DashboardLayout.jsx  # Layout cu dark/light mode + i18n
                    ├── Sidebar.jsx
                    ├── TopNav.jsx
                    ├── ThemeContext.jsx     # Context dark/light mode
                    ├── ChatBot.jsx
                    ├── cards/
                    │   ├── KPIRow.jsx
                    │   ├── SalaryCard.jsx
                    │   ├── LeaveAttendanceCard.jsx
                    │   ├── MonthlyAnalytics.jsx
                    │   └── TimeTrackingCard.jsx
                    └── pages/
                        ├── OverviewPage.jsx         # Dashboard principal
                        ├── TimeTrackingPage.jsx     # Pontaj
                        ├── LeavePage.jsx            # Concedii
                        ├── SalaryPage.jsx           # Salarii
                        ├── HistoryPage.jsx          # Istoricul complet
                        ├── SchedulePage.jsx         # Program și ture
                        ├── ProfilePage.jsx          # Profil personal
                        └── AIAssistantPage.jsx      # Chatbot AI HR
```

---

## Securitate

- **JWT RS256** — token-urile sunt semnate asimetric; backend-ul nu gestionează parole
- **Helmet.js** — HTTP security headers (XSS, HSTS, CSP, etc.)
- **CORS** — origins permise configurate explicit
- **Rate Limiting** — 200 req / 15 min pe toate rutele `/api/*`
- **Input Validation** — `express-validator` pe toate endpoint-urile cu input
- **Sequelize Parameterization** — protecție automată SQL injection
- **Role-Based Access Control** — verificare rol la nivel de middleware
- **Account Status Check** — conturile `inactive` sau `suspended` sunt respinse
- **Data Isolation** — chatbot-ul AI și endpoint-urile personale nu expun date ale altor angajați

---

MIT © Chain HR Management
