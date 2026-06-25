# Shunji's Anime Watch List & Rankings

A cinematic anime watchlist and ranking web app built with React and Firebase. Features a Makoto Shinkai-inspired UI with multiple visual themes, real-time multi-user support, and smooth Framer Motion animations.

## Features

- **Multi-User Rankings** -- Each user logs in with a personal passcode and rates anime on a 1-10 scale (half-point increments). Ratings sync in real-time across all users via Firebase Firestore.
- **Plan to Watch Lists** -- Every user maintains a personal "Plan to Watch" queue.
- **OST Tracking** -- Log and browse original soundtracks tied to each anime entry.
- **Favorites** -- Admin-curated favorites collection displayed in a dedicated gallery.
- **Scenes Mode** -- A fullscreen, scroll-driven cinematic viewing experience for featured anime.
- **Three Visual Themes**
  - Sakura Breeze (day) -- soft pinks and pastels
  - Golden Hour (sunset) -- warm amber gradients
  - Hoshizora (night) -- deep blues with falling stars and comets
  - Auto-switches based on time of day, with manual override
- **Animated UI** -- Falling cherry blossom petals, glassmorphism cards, animated gradients, and smooth page transitions powered by Framer Motion.
- **Secure Authentication** -- User passcodes are hashed with PBKDF2-SHA256 (150k iterations). Admin role is protected with a separate passkey.
- **Responsive Design** -- Optimized for both desktop and mobile viewports.

## Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | React 19, Vite 8                  |
| Database  | Firebase Firestore (real-time)    |
| Hosting   | Firebase Hosting                  |
| Animation | Framer Motion                     |
| Styling   | CSS-in-JS with themed variables   |
| Auth      | Custom PBKDF2 passcode hashing    |

## Project Structure

```
src/
  main.jsx              # React entry point
  anime-watchlist.jsx    # Main application component
  firebase.js           # Firebase initialization (uses env vars)
  index.css             # Global styles and fonts
public/
  favicon.svg           # Site favicon
```

## Getting Started

### Prerequisites

- Node.js 18+
- A Firebase project with Firestore enabled

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/SHLEW06/Shunji-Anime-Watch-List-Rankings.git
   cd Shunji-Anime-Watch-List-Rankings
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Copy the example env file and fill in your Firebase credentials:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your values:
   ```
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   VITE_ADMIN_PASSKEY=your_admin_passkey
   ```

4. **Start the dev server**
   ```bash
   npm run dev
   ```

5. **Open in browser** at `http://localhost:5173`

### Build & Deploy

```bash
npm run build          # Production build to dist/
npm run preview        # Preview the production build locally
npm run deploy         # Build and deploy to Firebase Hosting
```

## Environment Variables

All environment variables are prefixed with `VITE_` so Vite exposes them to the client bundle.

| Variable | Description |
|----------|-------------|
| `VITE_FIREBASE_API_KEY` | Firebase Web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Cloud Messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Google Analytics measurement ID |
| `VITE_ADMIN_PASSKEY` | Admin access passkey |

## License

MIT
