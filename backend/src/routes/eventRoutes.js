const express = require("express");
const { authRequired, requireRole } = require("../middleware/auth");
const { validateBody } = require("../middleware/validate");
const { createEventSchema, updateEventSchema, suggestSchema } = require("../validation/eventSchemas");
const {
  createEvent,
  updateEvent,
  deleteEvent,
  getEvent,
  listEvents,
  suggestForEvent
} = require("../controllers/eventController");

const router = express.Router();

router.get("/", authRequired, listEvents);
router.get("/:id", authRequired, getEvent);

router.post("/", authRequired, requireRole("admin"), validateBody(createEventSchema), createEvent);
router.patch("/:id", authRequired, requireRole("admin"), validateBody(updateEventSchema), updateEvent);
router.delete("/:id", authRequired, requireRole("admin"), deleteEvent);

router.post("/:id/suggest", authRequired, requireRole("admin"), validateBody(suggestSchema), suggestForEvent);

module.exports = router;
