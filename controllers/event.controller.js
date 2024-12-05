const Event = require("../models/events");
const User = require("../models/user");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

//get all events with pagination
const getAllEvents = async (req, res) => {
  const { location, category, tag, price, searchTerm } = req.query;
  const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
  const limit = 10;
  const queryObject = {};
  queryObject.date = { $gte: new Date().setHours(0, 0, 0, 0) }; // Events starting from today at midnight
  let result = Event.find(queryObject);
  if (searchTerm) {
    const regex = { $regex: searchTerm, $options: "i" };
    queryObject.$or = [
      { title: regex },
      { location: regex },
      { category: regex },
    ];
  }
  if (location) {
    queryObject.location = { $regex: location, $options: "i" };
  }
  if (category) {
    queryObject.category = { $regex: category, $options: "i" };
  }
  if (tag) {
    queryObject.tags = { $in: tag.split(",") };
  }
  if (price) {
    if (price === "free") {
      queryObject["price.free"] = true;
    } else {
      queryObject["price.free"] = !true;
    }
  }

  const skip = (page - 1) * limit;

  result = result.find(queryObject).sort("-createdAt").skip(skip).limit(limit);
  try {
    const totalEvents = await Event.countDocuments(queryObject);
    const totalPages = Math.ceil(totalEvents / limit);
    const events = await result;
    res.status(200).json({
      success: true,
      currentPage: page,
      totalPages,
      totalEvents,
      numOfEvents: events.length,
      events,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: "Something went wrong", msg: error.message });
  }
};

const getSingleEvent = async (req, res) => {
  const { eventId } = req.params;
  const currentDate = new Date();
  try {
    const event = await Event.findById({ _id: eventId });
    const similarEvents = await Event.find({
      _id: { $ne: eventId }, // Exclude the current event
      category: event.category,
      date: { $gte: currentDate },
    })
      .sort("-createdAt")
      .limit(3);

    res.status(200).json({ success: true, event, similarEvents });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "Something went wrong", msg: error.message });
  }
};

const getUpcomingEvents = async (req, res) => {
  try {
    const currentDate = new Date(); // Get the current date

    // Find events where the date is in the future or today, sorted by date in ascending order
    const upcomingEvents = await Event.find({ date: { $gte: currentDate } })
      .sort("date") // Sort by `date` in ascending order
      .limit(6); // Limit to 6 events

    res.status(200).json({ success: true, events: upcomingEvents });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "Something went wrong", msg: error.message });
  }
};

const getFreeEvents = async (req, res) => {
  try {
    const currentDate = new Date(); // Get the current date

    // Find free events with a date in the future or today
    const freeEvents = await Event.find({
      "price.free": true, // Ensure the `free` field is true
      date: { $gte: currentDate }, // Ensure the event date is today or in the future
    })
      .sort("date") // Sort by date in ascending order
      .limit(6); // Limit to 6 events

    res.status(200).json({ success: true, events: freeEvents });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong", msg: error.message });
  }
};

const createEvent = async (req, res) => {
  const { userId } = req.user;
  console.log(req.body);

  try {
    // Extract form data and image file from the request
    const {
      date,
      startTime,
      endTime,
      location,
      description,
      tags,
      free,
      online,
      category,
      title,
    } = req.body;

    const imageFile = req.files?.image?.tempFilePath;

    // Validate required fields
    if (
      !date ||
      !startTime ||
      !endTime ||
      (!location && !online) ||
      !description ||
      !tags ||
      !free ||
      !title ||
      !imageFile
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Upload the image to Cloudinary
    const uploadedImage = await cloudinary.uploader.upload(imageFile, {
      use_filename: true,
      folder: "mbevents",
    });
    fs.unlinkSync(req.files.image.tempFilePath);

    // Prepare the new event data
    const newEvent = new Event({
      image: uploadedImage.secure_url, // URL of the uploaded image
      title,
      date,
      startTime,
      endTime,
      location: online === "true" ? "online" : location,
      description,
      category,
      tags: Array.isArray(tags) ? tags : tags.split(","), // Handle tags as array
      price: {
        free: free === "true", // Convert string "true"/"false" to boolean
        regular: free === "true" ? 0 : req.body?.regularPrice,
        vip: free === "true" ? 0 : req.body?.vipPrice,
      },
      hostedBy: userId,
    });

    // Save the event to the database
    const savedEvent = await newEvent.save();

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      event: savedEvent,
    });
  } catch (error) {
    console.log(error);

    res.status(400).json({ message: error.message });
  }
};

const getHostedEvents = async (req, res) => {
  const { userId } = req.user;
  try {
    const hostedEvents = await Event.find({ hostedBy: userId });
    res.status(200).json({ success: true, events: hostedEvents });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Something went wrong", msg: error.message });
  }
};

module.exports = {
  getAllEvents,
  getSingleEvent,
  getUpcomingEvents,
  getFreeEvents,
  createEvent,
  getHostedEvents,
};
