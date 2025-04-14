// This route includes:
// - Creating a live session (playlist, track, or album)
// - Generating and using private invite tokens (host-only)
// - Browsing public live sessions
// - Joining a public or private session
// - Viewing all sessions the user is part of
// - Viewing all sessions hosted by the user
// - Ending a live session (host-only)

// routes/liveListening.js
"use strict";

const jsonschema = require("jsonschema");
const express = require("express");
const LiveListening = require("../models/liveListening");
const router = new express.Router();
const jwt = require("jsonwebtoken");

const { ensureLoggedIn } = require("../middleware/auth");
const { SECRET_KEY } = require("../config");
const { BadRequestError, ForbiddenError } = require("../expressError");
const liveListeningCreateSchema = require("../schema/liveListeningCreate.json");

/** POST /live/create
 * Host creates a new session.
 * Requires: { sessionName, sourceType, sourceId, isPublic }
 * Returns: session object
 */
router.post("/create", ensureLoggedIn, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, liveListeningCreateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs.join(", "));
    }

    const payload = {
      hostId: res.locals.user.id,
      sessionName: req.body.sessionName,
      sourceType: req.body.sourceType,
      sourceId: req.body.sourceId,
      isPublic: req.body.isPublic ?? false
    };

    console.log("🎯 createSession payload", payload);

    const session = await LiveListening.createSession(payload);
    return res.status(201).json({ session });
  } catch (err) {
    return next(err);
  }
});

/** POST /live/:sessionId/invite-token
 * Host generates a private invite token for a session.
 * Returns: { token }
 */
router.post("/:sessionId/invite-token", ensureLoggedIn, async function (req, res, next) {
  try {
    const sessionId = +req.params.sessionId;
    const session = await LiveListening.getSessionById(sessionId);

    if (!session) {
      console.error("🚫 No session found for invite-token");
    }
    
    if (session.host_id !== res.locals.user.id) {
      throw new ForbiddenError("Only the host can generate invite tokens.");
    }

    const token = jwt.sign({ sessionId }, SECRET_KEY, { expiresIn: "30m" });
    return res.json({ token });
  } catch (err) {
    return next(err);
  }
});

/** POST /live/join/:token
 * Join a session using a private invite token.
 * Returns: { sessionId, userId }
 */
router.post("/join/:token", ensureLoggedIn, async function (req, res, next) {
  try {
    const payload = jwt.verify(req.params.token, SECRET_KEY);
    const sessionId = payload.sessionId;
    const joinRes = await LiveListening.joinSession(sessionId, res.locals.user.id);
    return res.json(joinRes);
  } catch (err) {
    return next(err);
  }
});

/** POST /live/:sessionId/join
 * Join a live public session by ID.
 * Returns: { message: "{username} joined session" }
 */
router.post("/:sessionId/join", ensureLoggedIn, async function (req, res, next) {
  try {
    const session = await LiveListening.getSessionById(req.params.sessionId);

    if (!session.is_active) {
      throw new ForbiddenError("Cannot join an inactive session.");
    }

    if (!session.is_public && session.host_id !== res.locals.user.id) {
      throw new ForbiddenError("You must be invited to join this session.");
    }

    await LiveListening.joinSession(Number(req.params.sessionId), res.locals.user.id);
    return res.json({ message: `${res.locals.user.username} joined session` });
  } catch (err) {
    return next(err);
  }
});

/** GET /live/public
 * Get all public and active sessions.
 * Returns: [session, ...]
 */
router.get("/public", ensureLoggedIn, async function (req, res, next) {
  try {
    const sessions = await LiveListening.getPublicSessions();
    return res.json({ sessions });
  } catch (err) {
    return next(err);
  }
});

/** GET /live/me
 * Get all active sessions the user is part of.
 */
router.get("/me", ensureLoggedIn, async function (req, res, next) {
  try {
    const sessions = await LiveListening.getUserActiveSessions(res.locals.user.id);
    return res.json({ sessions });
  } catch (err) {
    return next(err);
  }
});

/** GET /live/host
 * Get all sessions hosted by the current user.
 */
router.get("/host", ensureLoggedIn, async function (req, res, next) {
  try {
    const sessions = await LiveListening.getHostSessions(res.locals.user.id);
    return res.json({ sessions });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /live/:sessionId/end
 * End a session (host only).
 * Returns: { message: "Session ended successfully." }
 */
router.patch("/:sessionId/end", ensureLoggedIn, async function (req, res, next) {
  try {
    const sessionId = +req.params.sessionId;
    const result = await LiveListening.endSession(sessionId, res.locals.user.id);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
