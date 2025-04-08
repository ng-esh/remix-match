// test/dbTeardown.js
let ended = false;
const teardown = async (db) => {
  if (!ended) {
    ended = true;
    await db.end();
  }
};

module.exports = teardown;
