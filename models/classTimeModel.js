const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const classTimeSchema = new Schema({
  coach_class: {
    type: Date,
    required: true,
    unique: false
  },
  coach_class_end: {
    type: Date,
    required: true,
    unique: false
  },
  day_pattern: {
    type: String,
    required: true
  },
  coach: {
    type: Schema.Types.ObjectId,
    ref: "coach"
  },
  sport: {
    type: Schema.Types.ObjectId,
    ref: "sport"
  },
  location: {
    type: Schema.Types.ObjectId,
    ref: "location"
  },
  rmanager: [
    {
      type: Schema.Types.ObjectId,
      ref: "rmanager"
    }
  ],
  report: [
    {
      type: Schema.Types.ObjectId,
      ref: "report"
    }
  ]
});

module.exports = mongoose.model("classtime", classTimeSchema);
