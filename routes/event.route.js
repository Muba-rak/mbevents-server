const express = require("express");
const router = express.Router();
const {
  getAllEvents,
  getSingleEvent,
  getUpcomingEvents,
  getFreeEvents,
  createEvent,
  getHostedEvents,
  getpreviousEvents,
  getEventsToAttend,
  payForAnEvent,
} = require("../controllers/event.controller");
const auth = require("../middleware/auth");

router.route("/").get(getAllEvents).post(auth, createEvent);
router.get("/upcoming", getUpcomingEvents);
router.get("/free", getFreeEvents);
router.get("/hosted", auth, getHostedEvents);
router.post("/pay/:eventId", auth, payForAnEvent);
router.get("/previous", auth, getpreviousEvents);
router.get("/attending", auth, getEventsToAttend);

router.get("/:eventId", getSingleEvent);

//user event

module.exports = router;
