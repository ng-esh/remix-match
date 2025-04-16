"use strict";

/** ReMixMatch shared configuration */

require("dotenv").config();
require("colors");

/** SECRET_KEY: Used for JWTs or session signing */
const SECRET_KEY = process.env.SECRET_KEY || "remixmatch-secret";

/** SPOTIFY CLIENT & CLIENT SECRET: allows my backend to tequest an access token from Spotify */
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

/** PORT: App server port */
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

/** getDatabaseUri(): returns DB connection string depending on NODE_ENV */
function getDatabaseUri() {
  return process.env.NODE_ENV === "test"
    ? "postgresql:///remixmatch-test"
    : process.env.DATABASE_URL || "postgresql:///remixmatch";
}

/** BCRYPT_WORK_FACTOR: lower during tests to speed them up */
const BCRYPT_WORK_FACTOR = process.env.NODE_ENV === "test" ? 1 : 12;

/** Console info on startup */
console.log("ReMixMatch Config:".green);
console.log("SECRET_KEY:".yellow, SECRET_KEY);
console.log("PORT:".yellow, PORT.toString());
console.log("BCRYPT_WORK_FACTOR:".yellow, BCRYPT_WORK_FACTOR);
console.log("Database URI:".yellow, getDatabaseUri());
console.log("---");

module.exports = {
  SECRET_KEY,
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  PORT,
  BCRYPT_WORK_FACTOR,
  getDatabaseUri,
  DATABASE_URL: getDatabaseUri() // for convenience
};
