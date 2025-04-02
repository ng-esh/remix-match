
-- Insert users
INSERT INTO users (username, password, email)
VALUES
  ('alice', 'password1', 'alice@example.com'),
  ('bob', 'password2', 'bob@example.com');

-- Insert playlists
INSERT INTO playlists (user_id, name, is_public)
VALUES
  (1, 'Alice''s Favorites', TRUE),
  (2, 'Bob''s Bangers', FALSE);

-- Insert playlist songs
INSERT INTO playlist_songs (playlist_id, track_id, added_by, position)
VALUES
  (1, 'track_001', 1, 1),
  (1, 'track_002', 1, 2),
  (2, 'track_003', 2, 1);

-- Insert shared playlists
INSERT INTO shared_playlists (playlist_id, from_user_id, to_user_id)
VALUES
  (1, 1, 2);

-- Insert shares
INSERT INTO shares (shared_by, shared_with, playlist_id, track_id, message)
VALUES
  (1, 2, 1, 'track_001', 'Check this out!');

-- Insert votes
INSERT INTO votes (user_id, playlist_id, vote_type)
VALUES
  (1, 2, 1),
  (2, 1, -1);

-- Insert live sessions
INSERT INTO live_sessions (host_id, session_name, playlist_id)
VALUES
  (1, 'Morning Jam', 1);

-- Insert users in live sessions
INSERT INTO live_session_users (session_id, user_id)
VALUES
  (1, 1),
  (1, 2);
