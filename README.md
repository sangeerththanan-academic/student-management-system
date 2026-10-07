# Student Management System

A web-based Student Management System developed for **ABC Institute**.

---

## 1. Technology Stack

### Frontend

- React
- Vite
- JavaScript
- CSS

### Backend

- Node.js
- Express
- REST API

### Database

- MySQL

### Development Tools

- Git
- GitHub
- Postman

---

## 2. Project Structure

```text
student-management-system/
│
├── backend/
│   ├── src/
│   ├── package.json
│   └── ...
│
├── frontend/
│   ├── src/
│   ├── package.json
│   └── ...
│
├── database/
│   ├── README.md
│   ├── schema.sql
│   └── seed.sql
│
├── docs/
│   └── ...
│
├── .gitignore
├── CHANGELOG.md
├── LICENSE
└── README.md
```

---

## 3. Prerequisites

Install the following software before running the application:

- Node.js
- npm
- MySQL Server
- Git

---

## 4. Database Setup

The application uses MySQL.

### Create the Database

Run the database schema:

```text
database/schema.sql
```

Using the MySQL command line:

```bash
mysql -u root -p < database/schema.sql
```

### Load Sample Data

Run the seed script:

```bash
mysql -u root -p student_management < database/seed.sql
```

Alternatively, both SQL files can be opened and executed using MySQL
Workbench or another MySQL client.

---

## 5. Backend Setup

Open a terminal in the project root and navigate to the backend:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file using the environment variables required by the backend.

Example:

```env
PORT=5000

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=student_management
DB_PORT=3306

JWT_SECRET=your_secret_key
```

Do not commit the `.env` file to Git.

Start the backend:

```bash
npm run dev
```

If the project does not provide a development script, use the start command
defined in `backend/package.json`.

---

## 6. Frontend Setup

Open another terminal and navigate to the frontend:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create the required `.env` file if the frontend uses environment variables.

Start the frontend:

```bash
npm run dev
```

Vite will display the local development URL in the terminal.

---

## 7. Running the Complete Application

Start the services in the following order:

```text
MySQL Server
     ↓
Backend API
     ↓
React Frontend
```

The application consists of:

```text
React Frontend
       │
       │ HTTP / REST API
       ▼
Node.js + Express Backend
       │
       │ SQL
       ▼
MySQL Database
```

---

## 8. Database

The main database is:

```text
student_management
```

The current database contains:

```text
users
students
```

Database scripts are located in:

```text
database/
├── README.md
├── schema.sql
└── seed.sql
```

Refer to `database/README.md` for database-specific information.

---

## 9. Testing

API endpoints can be tested using **Postman**.

Frontend functionality can be tested through the browser after starting
the frontend and backend services.

---

## 10. Environment Variables

Environment files may contain sensitive information such as:

- Database passwords
- JWT secrets
- API configuration

Do not commit `.env` files or real credentials to the repository.

The project `.gitignore` should include:

```text
.env
.env.*
!.env.example
```

---

## 11. Git

Clone the repository:

```bash
git clone <repository-url>
```

Navigate into the project:

```bash
cd student-management-system
```

Install the frontend and backend dependencies separately:

```bash
cd backend
npm install
```

```bash
cd ../frontend
npm install
```

Git is used to manage the project source code and its version history.

---

## 12. Documentation

Project documentation is maintained separately under:

```text
docs/
```

Database-specific documentation is available under:

```text
database/README.md
```

Change history is maintained in:

```text
CHANGELOG.md
```
---

## 13. License

See the [LICENSE](LICENSE) file for the applicable project license.
