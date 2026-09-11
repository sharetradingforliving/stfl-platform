# Share Trading For Living

Share Trading For Living (STFL) is an Indian-market investment research platform built to combine live market data, fundamental research, technical analysis, news intelligence, corporate actions and institutional activity in one research experience.

## Technology Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend

- FastAPI
- Python
- SQLAlchemy
- PostgreSQL
- Neon cloud database

### Market Data and Sources

- Upstox instrument master and market data
- NSE corporate actions
- Google News RSS
- NewsAPI fallback
- Official institutional-flow sources

## Current Modules

### Market Intelligence

The Market Intelligence section provides:

- Indian index overview
- Market breadth
- Stocks on the move
- India VIX sentiment
- Global market cues
- Institutional activity
- Sector and market-level assessment

### News and Sentiment

The News and Sentiment engine provides:

- Current Indian-market news
- Multiple news-source aggregation
- Duplicate-story clustering
- Contextual sentiment analysis
- Investor-impact classification
- Market, index, sector and company scope
- Immediate, short-term, medium-term and structural horizons
- Brokerage calls
- Rating upgrades and downgrades
- Index inclusions, exclusions and rebalances
- Ranked “What Matters Now” intelligence
- Freshness controls to prevent stale sentiment

### Corporate Actions

Corporate Actions is available as a dedicated page under the Markets navigation menu:

```text
/corporate-actions

It provides:

Upcoming corporate actions
Historical corporate actions
Dividend announcements
REIT and InvIT distributions
Bonus issues
Stock splits
Rights issues
Buybacks
Mergers and demergers
Capital reductions
Interest payments
Company and symbol search
Action-type filtering
Date-range filtering
Pagination
Ex-date and record-date tracking

Corporate-action data is retrieved from NSE and normalized before being stored in PostgreSQL.

Historical records are preserved permanently and are not deleted after their ex-date passes.

Duplicate records are prevented through a deterministic SHA-256 corporate-action identity.

Corporate Actions Architecture

The Corporate Actions data flow is:

NSE Corporate Actions
        ↓
Next.js NSE provider
        ↓
Normalization and classification
        ↓
FastAPI synchronization endpoint
        ↓
PostgreSQL historical archive
        ↓
Database-backed read API
        ↓
Corporate Actions table page
Frontend Corporate Action Routes
/api/corporate-actions
/api/corporate-actions/sync
/api/corporate-actions/archive
/api/fundamental/corporate-actions/[symbol]
Backend Corporate Action Routes
POST /api/corporate-actions/sync
GET  /api/corporate-actions
Supported Database Filters

The database-backed API supports:

view=upcoming
view=historical
view=all
action_type=DIVIDEND
search=RELIANCE
from_date=YYYY-MM-DD
to_date=YYYY-MM-DD
page=1
page_size=25
Corporate Action Synchronization

The synchronization process:

Establishes an NSE session.
Retrieves market-wide corporate actions for a selected date range.
Normalizes company, symbol, action, purpose and date fields.
Classifies each corporate action.
Consolidates duplicate NSE rows.
Creates a stable action key.
Inserts new records.
Updates materially changed records.
Leaves unchanged records untouched.
Preserves all historical records.

A successful repeat synchronization should normally show:

inserted  : 0
updated   : 0
unchanged : existing record count
Environment Configuration

Create a local frontend environment file:

frontend/.env.local

Configure the FastAPI backend URL:

STFL_BACKEND_URL=http://127.0.0.1:8001

Do not commit .env, .env.local, API keys, access tokens or database credentials to Git.

The production environment must use the deployed backend URL instead of the local address.

Running the Backend

Open a terminal in the backend directory.

Start FastAPI:

& ".\.venv\Scripts\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8001

Keep this terminal running.

FastAPI will be available at:

http://127.0.0.1:8001

API documentation is available at:

http://127.0.0.1:8001/docs
Running the Frontend

Open another terminal in the frontend directory.

Install dependencies when required:

npm install

Start the Next.js development server:

npm run dev

The website will be available at:

http://localhost:3000
Database

The backend uses PostgreSQL through SQLAlchemy.

The database currently stores:

Institutional-flow history
Market-index daily history
Corporate-action history

Database tables are registered from app.models and created during FastAPI startup through SQLAlchemy metadata.

Important Project Files
Corporate Actions
frontend/app/corporate-actions/page.tsx
frontend/app/api/corporate-actions/route.ts
frontend/app/api/corporate-actions/sync/route.ts
frontend/app/api/corporate-actions/archive/route.ts
frontend/app/api/fundamental/corporate-actions/[symbol]/route.ts
frontend/lib/fundamental/providers/nseCorporateActions.ts
backend/app/models.py
backend/app/schemas.py
backend/app/corporate_action_routes.py
backend/app/services/corporate_action_service.py
backend/app/main.py
News Intelligence
frontend/components/news/NewsDashboard.tsx
frontend/lib/news/types.ts
frontend/lib/news/newsEngine.ts
frontend/lib/news/investorIntelligence.ts
frontend/lib/news/providers/newsApi.ts
frontend/lib/news/filters/companyMapper.ts
frontend/lib/news/filters/indianMarketFilter.ts
Navigation
frontend/components/navigation/MainNavigation.tsx
Development Status

Completed:

Next.js frontend foundation
FastAPI backend foundation
PostgreSQL and Neon integration
Live market ticker
Indian index data
Market breadth
Stocks on the move
India VIX sentiment
Global market cues
Institutional-flow history
News aggregation
Investor-focused news intelligence
Brokerage and index-event detection
NSE corporate-action retrieval
Corporate-action classification
Historical corporate-action database
Duplicate-safe synchronization
Upcoming and historical Corporate Actions page
Corporate Actions navigation integration
Next Development Priorities
Extract structured dividend amounts.
Extract bonus and rights ratios.
Improve stock-split face-value parsing.
Add scheduled daily Corporate Actions synchronization.
Backfill older corporate-action history in controlled date ranges.
Add company-specific corporate actions to the company dashboard.
Continue the STFL fundamental and conviction engines.
Disclaimer

STFL is an investment research and market-information platform.

Market data, news, corporate actions, calculations and assessments may be delayed, incomplete or revised by their original sources. Users should verify important information against official exchange and company filings before making investment decisions.

Nothing displayed by STFL should be considered personalized investment advice.


Save the file. Next, we’ll run validation for both repositories before staging and committing them.