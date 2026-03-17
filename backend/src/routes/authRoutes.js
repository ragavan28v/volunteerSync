const express = require("express");
const { validateBody } = require("../middleware/validate");
const { authRequired } = require("../middleware/auth");
const { signupSchema, loginSchema } = require("../validation/authSchemas");
const { signup, login, refresh, logout, me } = require("../controllers/authController");

const router = express.Router();

router.post("/signup", validateBody(signupSchema), signup);
router.post("/login", validateBody(loginSchema), login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", authRequired, me);

module.exports = router;
