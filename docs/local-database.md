# Local PostgreSQL setup — each teammate
Both developers run PostgreSQL 17 on their own Windows laptop. Docker is not required.
Use the same repository migrations, not a shared live database.

## 1. Install PostgreSQL 17
Use the official Windows installer linked from https://www.postgresql.org/download/windows/.
Select PostgreSQL Server and Command Line Tools. pgAdmin is optional; Stack Builder is unnecessary.
Keep port 5432 unless it is already in use. Set your own postgres administrator password privately.
Do not send passwords to teammates, put them in chat, or commit them.
The installer starts PostgreSQL as a Windows service.

## 2. Create the application database
Open SQL Shell (psql) from the Start menu.
Accept localhost, database postgres, port 5432 and user postgres. Enter your administrator password.
Run the following ONE TIME on your own laptop:

    CREATE ROLE repairflow LOGIN;
    \password repairflow
    CREATE DATABASE repairflow OWNER repairflow;

The password command prompts privately for an app-user password; choose your own.
If the role/database already exists, inspect and reuse it rather than deleting it.
Exit with \q. Do not change listen_addresses or firewall settings; this setup is local-only.

## 3. Connect the project
In the project directory, copy .env.example to .env if .env does not already exist.
Edit DATABASE_URL in .env with your app-user password and actual port.
URL-encode special characters in the password (for example @ becomes %40).
An existing .env from the earlier Docker draft may still use port 5433; change it to 5432.
Then run:

    npm ci
    npm run db:generate
    npm run db:validate
    npm run db:deploy
    npm run db:check
    npm run db:seed
    npm run dev

db:seed is optional: it creates one persisted development ticket and technician, and preserves them on repeat runs.
Its fixed ticket UUID lets Arhan build allocations while Abbas implements repair CRUD.
The database check rolls back its verification records. Ticket-number gaps are expected.
Restarting the app or Windows does not erase data. Do not drop the database to restart development.

## Troubleshooting
Connection refused: check the PostgreSQL Windows service is running and the URL port matches.
Authentication failed: check the app-user password; it differs from the postgres administrator password.
Missing tables: run db:deploy.
Never use prisma db push or reset to bypass migration errors. Share the error without credentials.
