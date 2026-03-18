const express = require("express");
const { authRequired } = require("../middleware/auth");
const { listNotifications, markRead, markAllRead, stream } = require("../controllers/notificationController");

const router = express.Router();

router.get("/", authRequired, listNotifications);
router.patch("/:id/read", authRequired, markRead);
router.post("/mark-all-read", authRequired, markAllRead);

// SSE stream: supports authRequired OR ?accessToken= for EventSource
router.get("/stream", stream);

module.exports = router;