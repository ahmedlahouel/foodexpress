# FoodExpress

Online food ordering and delivery platform (MEAN Stack).
Team: Ahmed, Bassem, Ameni, Hanan.

## Structure
- `backend/`  Node.js + Express API
- `frontend/` Angular app
- `docs/`     API contract (routes and JSON shapes)

## Run the backend
```bash
cd backend
npm install
cp .env.example .env   # then edit values
npm run dev
```
API: http://localhost:5000/api/health

## Run the frontend
```bash
cd frontend
npm install
ng serve
```

## Git rules
- Branches: `main` (stable) and one feature branch per task, e.g. `feature/auth-ahmed`
- Never push directly to `main`. Open a pull request, one teammate reviews.
- Never commit `.env`. Commit `.env.example` only.
- Do not change a field name or route in `docs/api-contract.md` without telling the group.
