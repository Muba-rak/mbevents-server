const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const eventSchema = new Schema(
  {
    image: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
      validate: {
        validator: function (value) {
          // Allow "online" or any non-empty string
          return value === "online" || value.trim().length > 0;
        },
        message: "Location must be 'online' or a valid non-empty address",
      },
    },
    category: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    tags: {
      type: [String],
      required: true,
    },
    price: {
      free: {
        type: Boolean, // Indicates if the event is free
        default: false, // Defaults to false (paid event)
      },
      regular: {
        type: Number, // Ticket price for regular tickets
        required: function () {
          return !this.price.free; // Required if the event is not free
        },
        min: 0, // Ensure non-negative ticket prices
      },
      vip: {
        type: Number, // Ticket price for VIP tickets
        required: function () {
          return !this.price.free; // Required if the event is not free
        },
        min: 0, // Ensure non-negative ticket prices
      },
    },
    hostedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("event", eventSchema);
