# Binance Futures 12-Matrix Institutional Scanner

An institutional-grade high-accuracy cryptocurrency futures scanner powered by Binance Futures live API data.

## Features

- **12-Matrix Quantitative Engine**: Order Flow Net Delta, MFI, Volume Surge, L2 Depth Liquidity, 200m HVN & POC, VWAP, ADX + DMI, Triple EMA (20/50/200), Bollinger %B, MACD, RSI, and StochRSI.
- **30-Quant Matrix Calculation**: Real-time multi-coin scoring and ranking across USDT and COIN-M pairs.
- **Live Direct & Proxy Connectivity**: Connects directly to Binance Public Futures APIs (`fapi.binance.com`) with zero configuration.
- **Responsive Dark Theme UI**: Built with Tailwind CSS and Lucide icons for mobile and desktop screens.

## 🚀 Live Deployment on GitHub Pages

1. In your GitHub repository, navigate to **Settings** > **Pages**.
2. Under **Build and deployment** > **Source**, select **GitHub Actions** (or select **Deploy from a branch** -> `main` / `root`).
3. GitHub will immediately build and provide your permanent public live URL:
   `https://<your-username>.github.io/<your-repo>/`
4. This URL can be shared with anyone worldwide. It opens instantly in any browser without login.

## Local Development

```bash
# Run with Node.js
node server.ts
```

Open `http://localhost:3000` in your web browser.
