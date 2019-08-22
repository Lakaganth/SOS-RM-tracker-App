const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const SportSchema = new Schema({
  sport_name: {
    type: String,
    required: true
  },
  sport_code: {
    type: String,
    required: true
  },
  rmanager: [
    {
      type: Schema.Types.ObjectId,
      ref: "rmanager"
    }
  ],
  location: [
    {
      type: Schema.Types.ObjectId,
      ref: "location"
    }
  ],
  coach: [
    {
      type: Schema.Types.ObjectId,
      ref: "coach"
    }
  ],
  classtime: [
    {
      type: Schema.Types.ObjectId,
      ref: "classtime"
    }
  ],
  report: [
    {
      type: Schema.Types.ObjectId,
      ref: "report"
    }
  ]
});

module.exports = mongoose.model("sport", SportSchema);
