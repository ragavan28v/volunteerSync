const express = require("express");
const { authRequired, requireRole } = require("../middleware/auth");
const { validateBody } = require("../middleware/validate");
const { updateVolunteerMeSchema } = require("../validation/volunteerSchemas");
const { getMe, updateMe, listVolunteers, getVolunteerById } = require("../controllers/volunteerController");

const router = express.Router();

router.get("/me", authRequired, requireRole("volunteer"), getMe);
router.patch("/me", authRequired, requireRole("volunteer"), validateBody(updateVolunteerMeSchema), updateMe);

router.get("/", authRequired, requireRole("ngo"), listVolunteers);
router.get("/:id", authRequired, requireRole("ngo"), getVolunteerById);

module.exports = router;
