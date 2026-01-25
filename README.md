# AROT - Advanced Research on Options & Traders 📊

<img width="1099" height="905" alt="Project Banner" src="https://github.com/user-attachments/assets/47c795f3-9cd5-4e08-9716-50fae6bf536d" />

> **The Ultimate Real-Time Dashboard for Professional Traders**  
> Aggregating Gamma Exposure (GEX), COT Positioning, AAII Sentiment, and "Squawk" News Feeds into one actionable interface.

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
| <img width="825" height="912" alt="Dashboard" src="https://github.com/user-attachments/assets/6d9635de-86d3-4cf7-b569-aae7abb51456" /> | <img width="821" height="855" alt="Gamma" src="https://github.com/user-attachments/assets/7b6607fb-39f8-4042-a7ab-e86c872bd032" /> |
| *Live Market Overview & Feeds* | *Deep Option Analytics* |

| Live News Feed | COT Reports |
|:---:|:---:|
| <img width="843" height="626" alt="News" src="https://github.com/user-attachments/assets/dfcafcb8-72dc-4683-9f74-b1dc8a7df62a" /> | <img width="819" height="913" alt="COT" src="https://github.com/user-attachments/assets/863b4f92-12da-436e-83cb-347b3b78a355" /> |
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
