const express = require("express");
const { authRequired, requireRole } = require("../middleware/auth");
const { volunteersCsv } = require("../controllers/reportController");

const router = express.Router();

router.get("/volunteers.csv", authRequired, requireRole("admin"), volunteersCsv);

module.exports = router;
