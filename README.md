# AROT - Advanced Research on Options & Traders 📊

![Project Banner](public/screenshots/banner.png)

> **The Ultimate Real-Time Dashboard for Professional Traders**  
> Aggregating Gamma Exposure (GEX), COT Positioning, AAII Sentiment, and "Squawk" News Feeds into one actionable interface.

[![Vercel](https://therealsujitk-vercel-badge.vercel.app/?app=arot-tech)](https://arot.tech)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🌟 Features Breakdown

### 1. ⚡ Real-Time "Squawk" News Aggregator
A terminal-grade news feed that aggregates headlines instantly from top-tier sources.
- **Sources**: **FinancialJuice**, **FXStreet**, **Reuters**, **Yahoo Finance**, **CNBC**.
- **Latency**: Near real-time (Client-side Proxy).
- **Features**: Priority sorting (Major sources first), Auto-refresh, "Breaking" tags.

### 2. 📉 Gamma Exposure (GEX)
Visualize Market Maker positioning to predict volatility and price pins.
- **Charts**: Zero GEX levels, Net Gamma profiles.
- **Data**: Powered by Supabase (Real Options Data).

### 3. 🏦 Institutional Positioning (COT)
Decode the "Commitments of Traders" reports efficiently.
- **Metrics**: Net Commercial vs. Non-Commercial positions.
- **Visuals**: Trend lines, Open Interest analysis.

### 4. 🧠 Market Sentiment
- **AAII Sentiment**: Bull-Bear spread visualization.
- **FedWatch Tool**: Real-time probabilities for upcoming FOMC Rate Decisions.

---

## 📸 Screenshots

| Dashboard Overview | Gamma Analysis |
|:---:|:---:|
| ![Dashboard](public/screenshots/dashboard.png) | ![Gamma](public/screenshots/gamma.png) |
| *Live Market Overview & Feeds* | *Deep Option Analytics* |

| Live News Feed | COT Reports |
|:---:|:---:|
| ![News](public/screenshots/news.png) | ![COT](public/screenshots/cot.png) |
| *FinancialJuice & FXStreet Aggregation* | *Institutional Tracking* |

---

## 🏗️ Architecture & Tech Stack

This project uses a hybrid data approach for maximum speed and reliability.

- **Frontend**: React 18 (Vite) + TypeScript + TailwindCSS.
- **Database**: Supabase (for heavy options data).
- **Data Engine**:
  - **Live**: Client-side RSS integration (rss2json) for News.
  - **Weekly**: Node.js scripts (`npm run update-data`) fetch COT/AAII data.
- **Deployment**: Vercel (Edge Network).
- **Automation**: GitHub Actions trigger weekly data updates automatically.

## 📦 Installation & Setup

1.  **Clone the Repo**
    ```bash
    git clone https://github.com/Crusherbolt/AROT.git
    cd AROT
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env` file with your Supabase credentials:
    ```env
    VITE_SUPABASE_URL=your_url
    VITE_SUPABASE_PUBLISHABLE_KEY=your_key
    ```

4.  **Run Locally**
    ```bash
    npm run dev
    ```
    Access at `http://localhost:8080`.

## 🔄 Data Updates

- **Automatic**: News updates live. The Vercel deployment updates weekly via GitHub Actions.
- **Manual**: Run the fetch script locally:
  ```bash
  npm run update-data
  ```

## 📄 License

© 2026 AROT.tech. All rights reserved.