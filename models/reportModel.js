const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const ReportSchema = new Schema({
  class_start_time: {
    type: Date,
    required: true
  },
  class_end_time: {
    type: Date,
    required: true
  },
  coach_arrival_time: {
    type: Date,
    required: true
  },
  class_duration: {
    type: String,
    required: true
  },
  feedback: {
    type: String,
    required: false
  },
  create_at: {
    type: Date,
    default: Date.now()
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
  ]
});

module.exports = mongoose.model("report", ReportSchema);
