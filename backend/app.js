// app.js
const express = require('express');
const cors = require("cors");

const morgan = require('morgan');
const app = express();


const { authenticateJWT } = require("./middleware/auth");
app.use(express.json());

const userRoutes = require("./routes/users");
const playlistRoutes = require ("./routes/playlists");
const playlistSongRoutes = require ("./routes/playlistSongs");
const playlistShareRoutes = require ("./routes/playlistShares");
const songShareRoutes = require ("./routes/songShares");
const voteRoutes = require ("./routes/votes");
const liveListeningRoutes = require ("./routes/liveListenings");
const spotifyRoutes = require("./routes/spotify");
const authRoutes = require("./routes/auth");
const songsRoutes = require("./routes/songs");


app.use(morgan('dev'));
app.use(cors());
app.use(authenticateJWT);


// Add routes here later
app.use("/", userRoutes);
app.use("/playlists", playlistRoutes);
app.use("/playlist-songs", playlistSongRoutes);
app.use("/playlist-shares", playlistShareRoutes);
app.use("/song-shares", songShareRoutes);
app.use("/votes", voteRoutes);
app.use("/lives", liveListeningRoutes);
app.use("/spotify", spotifyRoutes);
app.use("/auth", authRoutes);
app.use("/songs", songsRoutes);




app.get('/', (req, res) => {
  return res.json({ message: 'Welcome to ReMixMatch API 🎵' });
});

// 404 handler
app.use((req, res, next) => {
  return res.status(404).json({ error: 'Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message;
  return res.status(status).json({ error: message });
});

module.exports = app;
