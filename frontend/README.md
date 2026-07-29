# AetherBilling - Subscription Management Frontend

A premium, responsive SaaS frontend interface built for a **Subscription Management & Automated Billing Platform**. The interface is designed in the aesthetic styles of modern platforms like Vercel, Linear, Stripe, and Clerk, featuring custom glassmorphism, responsive CSS grid layouts, real-time Chart.js integrations, and seamless dark-mode customization.

## 🚀 Quick Start (Running Locally)

Since this frontend uses modern ES Module imports and assets dependencies, we recommend running a simple HTTP server in the `frontend` folder for the best experience.

### Option 1: Python (Easiest)
If you have Python installed, open your shell inside the `frontend` folder and execute:
```bash
python -m http.server 8000
```
Then, point your browser to `http://localhost:8000`.

### Option 2: Live Server (VS Code)
If using VS Code, click the **Go Live** button at the bottom status bar to host the page instantly.

### Option 3: Node.js static server
```bash
npx http-server -p 8000
```

---

## 🔑 Demo Sandbox Credentials
To experience the full flow including the spinner animations, mock API requests, redirect actions, and alert toasts:
- **Username / Email:** `admin@example.com`
- **Password:** `password123`

*Any other combination will trigger a validation error toast with helpful feedback.*

---

## 📂 Project Structure

```
frontend/
├── index.html             # Entry redirect pointing straight to pages/login.html
├── README.md              # Technical documentation and launch setup
│
├── assets/                # Visual items and graphic assets
│   ├── images/
│   ├── icons/
│   ├── logos/
│   ├── fonts/
│   └── backgrounds/
│
├── components/            # Reusable HTML components
│   ├── navbar.html        # Top navigation bar
│   ├── sidebar.html       # Side navigation panel
│   ├── footer.html        # Site footer
│   ├── loader.html        # Page loader & skeleton screens
│   ├── toast.html         # Toast notification container
│   └── modal.html         # Reusable modal dialog
│
├── css/
│   ├── variables.css      # CSS custom properties & design tokens
│   ├── global.css         # Reset, base styles & utility classes
│   ├── themes.css         # Dark mode theme overrides
│   ├── components.css     # Reusable component styles
│   ├── animations.css     # Keyframe animations & transitions
│   ├── login.css          # Auth layouts (login, recovery, passwords reset)
│   ├── dashboard.css      # SaaS panels, sidebars, charts containers, invoice tables
│   ├── responsive.css     # Adaptations for Desktop, Laptop, Tablet, and Mobile
│   └── style.css          # Master stylesheet (imports all modules)
│
├── js/
│   ├── app.js             # Application entry point & module bootstrapper
│   ├── theme.js           # Dark/light theme management module
│   ├── auth.js            # Simulated client API, route guards, local storage syncs
│   ├── utils.js           # Toast alerts engine, validation helpers, theme triggers
│   ├── login.js           # Auth credentials validator and page actions
│   ├── dashboard.js       # Dynamic statistics timers, Chart.js, search filters
│   ├── animations.js      # Click-ripple anchors, 3D card parallax shifting
│   └── services/
│       └── api.js         # Centralized API service layer (placeholder fetch methods)
│
└── pages/
    ├── login.html         # Sign-in portal with splitscreen metrics illustration
    ├── signup.html        # Account creation with password strength meter
    ├── forgot-password.html # Recover workspace credential parameters
    ├── otp.html           # 6-digit OTP verification with countdown timer
    ├── reset-password.html # Setup a new secure workspace account key
    ├── dashboard.html     # SaaS metrics panels, transactions tables, search
    ├── profile.html       # Manage avatars, name updates, local syncs
    ├── settings.html      # Configure billing rules, currencies, API key generator
    └── 404.html           # Page not found error page
```

---

## 🎨 Technology Stack & Features

- **Core Structure:** HTML5 & CSS3 with CSS custom properties (variables) for theme configurations.
- **Iconography:** Raw, lightweight, fast-loading inline SVGs mapping Lucide Icons specifications.
- **Charts:** [Chart.js](https://www.chartjs.org/) via CDN, configured to rebuild dynamically upon light/dark theme switches.
- **Responsive Adaptations:** Structured layouts collapse into sliding drawers (hamburgers) on screen sizes below `992px`.
- **Keyboard Access:** Inputs and control triggers are linked with tabindexes and keystroke listeners (`Enter` / `Space`) for screen accessibility.
