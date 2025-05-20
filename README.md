# Capstone Project Two
🎧 ReMixMatch
Collaborative Music Dashboard & Sharing Platform

📝 Project Description
ReMixMatch is a full-stack web application that lets users search for songs, build playlists, share music, and host real-time listening sessions — all without requiring a Spotify account. Inspired by the social and collaborative features of Spotify but with more personalized community-driven tools, ReMixMatch focuses on playlist sharing, song recommendations, and interactive listening parties.

The platform functions as a user’s music dashboard, with a rich frontend interface and robust backend architecture supporting every action from song searches to live session hosting.

## 🛠️ API Details
Spotify Api: https://developer.spotify.com/documentation/web-api?ref=apilist.fun

🟢 Spotify Integration
Uses Client Credentials Flow to access Spotify’s API.
Backend exposes a /spotify/search route to return structured metadata.
Only public data is fetched — no user token required.

🟢 Custom Express API (You Built)
My own RESTful API powers the app:
Authentication Routes: /auth/login, /auth/register
User Routes: Get, update, delete users
Playlist Routes: Create, read, update, delete playlists; change visibility
Playlist Song Routes: Add, remove, reorder songs
Share Routes: Share playlists or songs with users
Vote Routes: Upvote/downvote playlists
Live Listening Routes: Host, join, update, delete sessions
Song Routes: Get songs a user has interacted with

API Notes
- Centralized Axios-based helper class (RemixMatchApi.js) on the frontend handles all requests.
- All API errors are caught and logged, and returned in a consistent shape ({ error: 'message' }).
- Protected routes require a valid JWT token passed in the Authorization header.

## 🔁 Standard User Flow
Sign Up / Log In
A user creates an account or logs in using a username and password.
JWT token is stored for session authentication.

Music Search
User searches for songs via the Spotify API.
Returned results include track info, album art, preview snippets (where available), and Spotify links.

Playlist Creation & Management
Users create playlists (public or private).
They can add songs directly from the search results.
Playlists can be renamed, deleted, reordered, or shared with others.
Sharing Music
Share a playlist with another user.
Share a song with an optional custom message.
Remove previously shared songs.

Voting
Public playlists can be upvoted or downvoted.
Vote totals influence visibility in the user’s dashboard.

Live Listening
Host or join a live listening session.
Hosts control playback and session visibility.
Public sessions are browsable; private sessions are invite-only.

Dashboard (Feed Page)
View playlists you've upvoted.
See songs you’ve shared with others ("Songs I’d Recommend").
Optionally display your favorite song.
Fully styled with a Spotify-like layout and dark/light theme support.

## ⚙️ Technology Stack
Frontend
React (with Create React App)
Tailwind CSS v4
React Router
Axios for HTTP requests
Context API for global auth state
Vite (for local development and fast builds)

Backend
Node.js with Express.js
PostgreSQL (hosted on Render)
JWT for authentication
Axios (for Spotify API)
Express-validator for request validation
bcrypt for password hashing

## RemixMatch Backend Test Coverage Summary
✅ Test Coverage Overview
The backend has complete and comprehensive test coverage across all route files, including validation, authentication, authorization, edge cases, and business logic. Below is a route-by-route breakdown.

🧪 How to Run Tests:
1. Install dependencies:
    - npm install
2. Run all tests:
    - npm test


👤 Users (routes/users.js)
Register, login, update, delete
Get user by ID
Search users by username
Schema validation for register, login, update, and search
Auth checks on all protected routes
Full coverage ✅

🎵 Playlists (routes/playlists.js)
Create, update, delete, get, search
Change visibility
Schema validation for create, update, visibility, and search
Ownership enforcement via auth middleware
Full coverage ✅

🤝 Playlist Shares (routes/playlistShares.js)
Share playlist with a user
Get users a playlist is shared with
Get all playlists shared with a user
Delete shared playlist
Schema validation for sharing
Covers: duplicate shares, unauthorized deletion, and 404 edge case
Full coverage ✅

🎧 Song Shares (routes/songShares.js)
Share a song with optional message
Get songs shared with/by a user
Delete a song shar
Schema validation for sharing
Full coverage ✅

📀 Playlist Songs (routes/playlistSongs.js)
Add, remove, and reorder songs in a playlist
Schema validation for add and reorder
Auth and ownership tested
Full coverage ✅

🧑🏾‍🤝‍🧑🏽 Live Listening (routes/liveListenings.js)
Create, join (public/private), leave, end
Invite token generation
Get public sessions, sessions by host, and sessions joined by user
Schema validation for create route
Covers: join restrictions, token-based access, and end-session logic
Full coverage ✅

📈 Votes (routes/votes.js)
Cast vote (up/down), change vote
Remove vote
Get vote count and user vote status
Schema validation for voteType (1, -1)
Handles: multiple vote changes, invalid values, and expired tokens
Full coverage ✅

🎶 Spotify Search (routes/spotify.js)
Search Spotify for tracks using query string
Schema validation for q param
Handles:
- Missing query param (400)
- Unauthorized token request (401)
- Spotify rate limiting (429)
- Unexpected failures (500)
- Mocked token and track responses in tests
- Edge cases and response structure fully covered
Full coverage ✅

🧪 Summary
Total Routes: 100+ endpoints
Total Test Suites: 17
Authentication / Permission Logic Tested: ✅
Expired/Invalid Token Handling: ✅
CRUD + Edge Case Coverage: ✅

## 🧪 Scripts

| Command        | What it does           |
|----------------|------------------------|
| `npm run dev`  | Run local dev server   |
| `npm run build`| Build for production   |
| `npm start`    | Serve production build |

## 💾 Deployment Notes

- Run `npm run build` before deploying
- Don’t commit the `dist/` folder
- Heroku uses a `Procfile` with `web: serve -s dist`

