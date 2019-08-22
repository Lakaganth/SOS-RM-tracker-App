const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const LocationSchema = new Schema({
  location_name: {
    type: String,
    required: true
  },
  location_code: {
    type: String,
    required: true,
    unique: true
  },
  location_area: {
    type: String,
    required: true
  },
  rmanager: [
    {
      type: Schema.Types.ObjectId,
      ref: "rmschema"
    }
  ],
  sport: [
    {
      type: Schema.Types.ObjectId,
      ref: "sport"
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

module.exports = mongoose.model("location", LocationSchema);
