const express = require("express");

const { authRequired, requireRole } = require("../middleware/auth");
const { validateBody } = require("../middleware/validate");
const { issueTokenSchema, checkInSchema, checkOutSchema } = require("../validation/attendanceSchemas");
const { issueShiftToken, checkIn, checkOut } = require("../controllers/attendanceController");

const router = express.Router();

// NGO shows a short-lived code/QR for a shift
router.post(
  "/events/:eventId/shifts/:shiftId/token",
  authRequired,
  requireRole("ngo"),
  validateBody(issueTokenSchema),
  issueShiftToken
);

// Volunteer attendance
router.post("/check-in", authRequired, requireRole("volunteer"), validateBody(checkInSchema), checkIn);
router.post("/check-out", authRequired, requireRole("volunteer"), validateBody(checkOutSchema), checkOut);

module.exports = router;
