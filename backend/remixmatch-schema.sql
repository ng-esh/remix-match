-- remixmatch-schema.sql

-- Drop tables in reverse order of dependencies
DROP TABLE IF EXISTS live_session_users;
DROP TABLE IF EXISTS live_sessions;
DROP TABLE IF EXISTS votes;
DROP TABLE IF EXISTS shared_playlists;
DROP TABLE IF EXISTS playlist_songs;
DROP TABLE IF EXISTS playlists;
DROP TABLE IF EXISTS users;

-- Users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Playlists
CREATE TABLE playlists (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Playlist Songs
CREATE TABLE playlist_songs (
  id SERIAL PRIMARY KEY,
  playlist_id INTEGER REFERENCES playlists(id) ON DELETE CASCADE,
  track_id TEXT NOT NULL,
  added_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  position INTEGER,
  UNIQUE (playlist_id, track_id)
);

-- Shared Playlists
CREATE TABLE shared_playlists (
  id SERIAL PRIMARY KEY,
  playlist_id INTEGER REFERENCES playlists(id) ON DELETE CASCADE,
  from_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  to_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (playlist_id, to_user_id)
);

-- Shares Table (for song shares)
CREATE TABLE shares (
  id SERIAL PRIMARY KEY,
  shared_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shared_with INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  playlist_id INTEGER REFERENCES playlists(id) ON DELETE CASCADE,
  track_id TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Votes
CREATE TABLE votes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users ON DELETE CASCADE,
  playlist_id INTEGER REFERENCES playlists ON DELETE CASCADE,
  vote_type INTEGER NOT NULL CHECK (vote_type IN (1, -1)),
  UNIQUE (user_id, playlist_id)
);

-- Live Listening Sessions
CREATE TABLE live_sessions (
  id SERIAL PRIMARY KEY,
  host_id INTEGER REFERENCES users ON DELETE CASCADE,
  session_name TEXT NOT NULL,
  playlist_id INTEGER REFERENCES playlists(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users in Live Sessions
CREATE TABLE live_session_users (
  session_id INTEGER REFERENCES live_sessions ON DELETE CASCADE,
  user_id INTEGER REFERENCES users ON DELETE CASCADE,
  PRIMARY KEY (session_id, user_id)
);