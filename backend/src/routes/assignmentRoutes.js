const express = require("express");
const { authRequired, requireRole } = require("../middleware/auth");
const { validateBody } = require("../middleware/validate");
const { createAssignmentSchema, updateAssignmentStatusSchema } = require("../validation/assignmentSchemas");
const {
  createAssignment,
  listAssignments,
  myAssignments,
  updateMyAssignmentStatus
} = require("../controllers/assignmentController");

const router = express.Router();

router.post("/", authRequired, requireRole("ngo"), validateBody(createAssignmentSchema), createAssignment);
router.get("/", authRequired, requireRole("ngo"), listAssignments);

router.get("/my", authRequired, requireRole("volunteer"), myAssignments);
router.patch("/:id/status", authRequired, requireRole("volunteer"), validateBody(updateAssignmentStatusSchema), updateMyAssignmentStatus);

module.exports = router;
