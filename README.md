# coinbank

a customizable Bitcoin bank

## What?

- Frontend interface for a self-hosted Bitcoin bank
- Backed by a Cashu mint and inherits its properties, e.g. peer-to-peer settlement over the Lightning Network

## Why?

- Infinitely scalable Bitcoin transactions
- Allow independent banks to choose their own standards and policies
- Facilitate a free market of banks

## Development

Copy the env example and configure with appropriate values

```bash
cp .env.example .env
```

```bash
python3 -m venv venv
. venv/bin/activate
python -m pip install -U pip setuptools poetry
poetry install
python manage.py migrate
python manage.py createrootbankuser  # creates superuser with same name as DJANGO_BANK_NAME
python manage.py runserver
```

Run the frontend

```bash
cd frontend
npm run dev
```
