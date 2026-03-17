const express = require("express");
const { authRequired, requireRole } = require("../middleware/auth");
const { validateBody } = require("../middleware/validate");
const { logHoursSchema, verifyHoursSchema } = require("../validation/hoursSchemas");
const { logHours, myHours, listHours, verifyHours } = require("../controllers/hoursController");

const router = express.Router();

router.post("/", authRequired, requireRole("volunteer"), validateBody(logHoursSchema), logHours);
router.get("/my", authRequired, requireRole("volunteer"), myHours);

router.get("/", authRequired, requireRole("admin"), listHours);
router.patch("/:id/verify", authRequired, requireRole("admin"), validateBody(verifyHoursSchema), verifyHours);

module.exports = router;
