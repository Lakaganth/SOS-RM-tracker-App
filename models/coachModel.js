const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const CoachSchema = new Schema({
  coach_name: {
    type: String,
    required: true
  },
  coach_email: {
    type: String,
    required: true,
    unique: true
  },
  coach_code: {
    type: String,
    required: true
  },
  sport: {
    type: Schema.Types.ObjectId,
    ref: "sport"
  },
  location: [
    {
      type: Schema.Types.ObjectId,
      ref: "location"
    }
  ],
  rmanager: [
    {
      type: Schema.Types.ObjectId,
      ref: "rmanager"
    }
  ],
  backup_coach: {
    type: String,
    required: false
  },
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

module.exports = mongoose.model("coach", CoachSchema);
