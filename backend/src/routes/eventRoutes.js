const express = require("express");
const { authRequired, requireRole } = require("../middleware/auth");
const { validateBody } = require("../middleware/validate");
const { createEventSchema, updateEventSchema, suggestSchema, querySchema, autoFillSchema } = require("../validation/eventSchemas");
const {
  createEvent,
  updateEvent,
  deleteEvent,
  getEvent,
  listEvents,
  suggestForEvent,
  recommendEvents,
  expressInterest,
  raiseQuery,
  autoFill
} = require("../controllers/eventController");

const router = express.Router();

router.get("/recommended", authRequired, requireRole("volunteer"), recommendEvents);
router.get("/", authRequired, listEvents);

router.post("/", authRequired, requireRole("ngo"), validateBody(createEventSchema), createEvent);
router.post("/:id/auto-fill", authRequired, requireRole("ngo"), validateBody(autoFillSchema), autoFill);

router.get("/:id", authRequired, getEvent);
router.patch("/:id", authRequired, requireRole("ngo"), validateBody(updateEventSchema), updateEvent);
router.delete("/:id", authRequired, requireRole("ngo"), deleteEvent);

router.post("/:id/suggest", authRequired, requireRole("ngo"), validateBody(suggestSchema), suggestForEvent);
router.post("/:id/interest", authRequired, requireRole("volunteer"), expressInterest);
router.post("/:id/query", authRequired, requireRole("volunteer"), validateBody(querySchema), raiseQuery);

module.exports = router;