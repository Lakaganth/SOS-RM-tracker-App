const mongoose = require("mongoose");

const bcrypt = require("bcryptjs");

const Schema = mongoose.Schema;

const RManagerSchema = new Schema({
  rmanager_name: {
    type: String,
    required: true,
    unique: true
  },
  rmanager_email: {
    type: String,
    required: true,
    unique: true
  },
  rmanager_password: {
    type: String,
    required: true
  },

  location: [
    {
      type: Schema.Types.ObjectId,
      ref: "location"
    }
  ],
  coach: [{ type: Schema.Types.ObjectId, ref: "coach" }],
  sport: [{ type: Schema.Types.ObjectId, ref: "sport" }],
  classtime: [{ type: Schema.Types.ObjectId, ref: "classtime" }],
  report: [
    {
      type: Schema.Types.ObjectId,
      ref: "report"
    }
  ]
});

RManagerSchema.pre("save", function(next) {
  if (!this.isModified("rmanager_password")) {
    return next();
  }
  bcrypt.genSalt(10, (err, salt) => {
    if (err) return next(err);

    console.log("world", this.rmanager_password);

    bcrypt.hash(this.rmanager_password, salt, (err, hash) => {
      if (err) return next(err);

      this.rmanager_password = hash;

      next();
    });
  });
});

module.exports = mongoose.model("rmanager", RManagerSchema);
