const express = require("express");
const { authRequired, requireRole } = require("../middleware/auth");
const { overview } = require("../controllers/analyticsController");

const router = express.Router();

router.get("/overview", authRequired, requireRole("admin"), overview);

module.exports = router;
