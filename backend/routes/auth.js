"use strict";

const jsonschema = require("jsonschema");
const express = require("express");
const User = require("../models/user");
const { createToken } = require("../helpers/tokens");
const { BadRequestError } = require("../expressError");
const userRegisterSchema = require("../schema/userRegister.json");
const userLoginSchema = require("../schema/userLogin.json");

const router = new express.Router();

/**
 * POST /auth/register
 * 
 * Registers a new user and returns a signed JWT.
 */
router.post("/register", async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userRegisterSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs.join(", "));
    }

    const newUser = await User.register(req.body);
    const token = createToken(newUser);
    return res.status(201).json({ token });
  } catch (err) {
    return next(err);
  }
});

/**
 * POST /auth/token
 * 
 * Authenticates a user and returns a signed JWT.
 */
router.post("/login", async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userLoginSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs.join(", "));
    }

    const user = await User.authenticate(req.body.username, req.body.password);
    const token = createToken(user);
    return res.json({ token });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
