const express = require("express");
const router = express.Router();
const {
  getAllEvents,
  getSingleEvent,
  getUpcomingEvents,
  getFreeEvents,
  createEvent,
} = require("../controllers/event.controller");
const auth = require("../middleware/auth");

router.route("/").get(getAllEvents).post(auth, createEvent);
router.get("/upcoming", getUpcomingEvents);
router.get("/free", getFreeEvents);
router.get("/:eventId", getSingleEvent);

//user event

module.exports = router;
