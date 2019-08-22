const RManager = require("../models/rManagerModel");
const Location = require("../models/locationModel");
const Coach = require("../models/coachModel");
const Sport = require("../models/sportModel");
const ClassTime = require("../models/classTimeModel");
const Report = require("../models/reportModel");

const moment = require("moment");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const {
  GraphQLDate,
  GraphQLDateTime,
  GraphQLTime
} = require("graphql-iso-date");

const { EmailAddressResolver } = require("graphql-scalars");

const createToken = (rmanager, secret, expiresIn) => {
  console.log("TOken generater");
  const { rmanager_name, rmanager_email } = rmanager;
  return jwt.sign({ rmanager_name, rmanager_email }, secret, { expiresIn });
};

module.exports = {
  Date: GraphQLDate,
  Time: GraphQLTime,
  DateTime: GraphQLDateTime,

  Query: {
    rManagers: async () => {
      try {
        const allRManagers = await RManager.find().populate("location");

        return allRManagers;
      } catch (err) {
        console.log(err);
        throw err;
      }
    },
    getAllClassesForCoach: async (root, { id }, ctxt) => {
      const coach = await Coach.findById(id).populate("classtime");
      return coach;
    },
    getcurrentRM: async (root, args, { currentRM }) => {
      console.log("Context in resolver", currentRM.rmanager_email);
      if (!currentRM) {
        return null;
      }

      const rManager = await RManager.findOne({
        rmanager_email: currentRM.rmanager_email
      });
      // const rManager = await RManager.findById("5d57f285a1f81340e8b34b67");
      // console.log("This is laka", rManager);
      return rManager;
    },
    getCurrentRMDashboard: async (root, { RMemail }, ctxt) => {
      const rManager = await RManager.findOne({
        rmanager_email: RMemail
      })
        .populate("coach")
        .populate("sport")
        .populate("location")
        .populate("classtime");

      const locID = rManager.location.map(lcID => lcID._id);
      console.log(locID);
      // console.log(rManager);

      const rManLocation = locID.map(
        async lcID => await Location.findById(lcID).populate("sport")
      );
      // console.log(rManLocation);

      rManagerWithLocation = {
        rmanager: rManager,
        rmanager_location: rManLocation
      };

      return rManagerWithLocation;
    },

    getClasstimeforLocationSport: async (root, { sportID, locID }, ctxt) => {
      const allClass = await ClassTime.find({ sport: sportID })
        .populate("location")
        .populate("sport")
        .populate("coach");

      console.log("All class for sport", allClass);

      const classForLocation = allClass.filter(cl => {
        // console.log("class Location", cl.location);
        // console.log("args", locID);

        return cl.location._id == locID;
      });

      // console.log(classForLocation);

      return classForLocation;
    },

    getAllClassesForCurrentRM: async (root, { RMemail }, ctxt) => {
      const rManager = await RManager.findOne({
        rmanager_email: RMemail
      });

      const allCT = rManager.classtime.map(async ct => {
        return await ClassTime.findById(ct)
          .sort({ coach_class: "asc" })
          .populate("rmanager")
          .populate("coach")
          .populate("sport")
          .populate("location");
      });

      return allCT;
    }
  },

  Mutation: {
    createNewRManager: async (root, { newRManagerInput }, ctxt) => {
      const {
        rmanager_name,
        rmanager_email,
        location_name,
        location_area
      } = newRManagerInput;

      try {
        const newRManager = new RManager({
          rmanager_name,
          rmanager_email
        });

        const newLocation = new Location({
          location_name,
          location_area
        });

        const rManager = await newRManager.save();

        const location = await newLocation.save();

        rManager.location.push(location._id);

        location.rmanager.push(rManager._id);

        await rManager.save();

        await location.save();

        return rManager;
      } catch (err) {
        console.log(err);
        if (err.code === 11000) return console.log("RM already exists");
        throw err;
      }
    },

    createNewLocation: async (root, { newLocationInput }, ctxt) => {
      const {
        location_name,
        location_code,
        location_area,
        location_rmanager_email,
        location_rmanager_name
      } = newLocationInput;

      console.log(newLocationInput.location_name);

      try {
        const newLocation = new Location({
          location_name,
          location_code,
          location_area
        });
        console.log(newLocation);

        await newLocation.save();

        const existingRManager = await RManager.findOne({
          rmanager_email: location_rmanager_email
        });

        if (existingRManager) {
          newLocation.rmanager.push(existingRManager._id);
          existingRManager.location.push(newLocation._id);
          await existingRManager.save();
          await newLocation.save();
          return newLocation;
        } else {
          const newRManager = new RManager({
            rmanager_name: location_rmanager_name,
            rmanager_email: location_rmanager_email
          });
          newLocation.rmanager.push(newRManager._id);
          newRManager.location.push(newLocation._id);
          await newLocation.save();
          await newRManager.save();
          return newLocation;
        }
      } catch (err) {
        console.log(err);
        throw err;
      }
    },
    createCoach: async (root, { newCoachInput }, ctxt) => {
      const {
        coach_name,
        coach_email,
        backup_coach,
        coach_sport
      } = newCoachInput;
      try {
        const coaches_sport = coach_sport.toLowerCase();

        const newCoach = new Coach({
          coach_name,
          coach_email,
          backup_coach
        });

        await newCoach.save();

        // Check if sport already exists or add new Sport
        const existingSport = await Sport.findOne({
          sport_name: coaches_sport
        });

        if (existingSport) {
          existingSport.coach.push(newCoach._id);
          const sport = existingSport.save();
          newCoach.sport = sport._id;
        } else {
          const newSport = new Sport({
            sport_name: coaches_sport
          });
          newSport.coach.push(newCoach._id);
          const sport = await newSport.save();
          newCoach.sport = sport._id;
        }

        const coach = await newCoach.save();

        return coach;
      } catch (err) {
        console.log(err);
        throw err;
      }
    },

    // 3. Add coach to a Location

    addCoachToLocation: async (root, { coachToLocationInput }, ctxt) => {
      const {
        coach_name,
        coach_email,
        backup_coach,
        coach_sport,
        sport_code,
        coach_code,
        location_id
      } = coachToLocationInput;

      try {
        const existingCoach = await Coach.findOne({
          coach_email: coach_email
        });

        const location = await Location.findById(location_id);
        const rmanagerID = location.rmanager.map(rm => rm);
        console.log(rmanagerID);
        // 3.1. Check exisitng coach
        if (existingCoach) {
          // 3.1.2 Check if location is exisitng in coach
          const existloc = existingCoach.location.filter(l => l == location_id);
          if (existloc.length > 0) {
            console.log("Location already exisitng for this coach", existloc);
            return location;
          } else {
            existingCoach.location.push(location._id);
            existingCoach.rmanager.push(location.rmanager.map(rm => rm));
            await existingCoach.save();
            const sport_id = existingCoach.sport._id;
            location.coach.push(existingCoach._id);
            location.sport.push(sport_id);
            await location.save();

            // 3.1.3 Add existing coach and sport to RM
            location.rmanager.map(async rmID => {
              const rmManager = await RManager.findById(rmID);
              rmManager.coach.push(existingCoach._id);
              rmManager.sport.push(sport_id);
              await rmManager.save();
            });
            return location;
          }
        } else {
          // 3.2. Create new Coach
          const newCoach = new Coach({
            coach_name,
            coach_email,
            backup_coach,
            coach_code
          });
          newCoach.rmanager.push(location.rmanager.map(rm => rm));
          //await newCoach.save();

          // 3.2.1Check if sport already exists or add new Sport
          const existingSport = await Sport.findOne({
            sport_name: coach_sport
          });

          if (existingSport) {
            existingSport.coach.push(newCoach._id);

            const exisitngLocationForExisitngSport = existingSport.location.filter(
              sp => sp === location._id
            );

            if (exisitngLocationForExisitngSport.length > 0) {
              existingSport.location.push(location._id);
              location.sport.push(sport._id);
            }

            // existingSport.rmanager.push(rmanagerID);

            const sport = await existingSport.save();
            newCoach.sport = sport._id;
          } else {
            const newSport = new Sport({
              sport_name: coach_sport,
              sport_code: sport_code
            });
            newSport.coach.push(newCoach._id);
            newSport.location.push(location._id);
            newSport.rmanager.push(location.rmanager.map(rm => rm));

            const sport = await newSport.save();
            newCoach.sport = sport._id;
            location.sport.push(sport._id);
          }

          const coach = await newCoach.save();

          coach.location.push(location._id);
          await coach.save();
          const sport_id = coach.sport._id;
          location.coach.push(coach._id);

          await location.save();
          location.rmanager.map(async rmID => {
            const rmManager = await RManager.findById(rmID);
            rmManager.coach.push(coach._id);
            //Check if sport already exisit in RM
            const exisitngSportInRM = rmManager.sport.filter(
              sp => sp.toString() === sport_id.toString()
            );
            console.log("exisitngSportInRM", exisitngSportInRM);
            console.log("sport_id", sport_id);
            // rmManager.sport.push(sport_id);
            if (exisitngSportInRM.length == 0) {
              rmManager.sport.push(sport_id);
            }
            // console.log("RMSPORT", rmManager);
            await rmManager.save();
          });
          return location;
        }
      } catch (err) {
        console.log(err);
        throw err;
      }
    },
    addClassToCoach: async (root, { addClassInput }, ctxt) => {
      const {
        coachID,
        coach_class,
        location_code,
        coach_class_end,
        day_pattern
      } = addClassInput;
      try {
        // 4.1 Get the coach from CoachID
        const coach = await Coach.findById(coachID);
        const sport = await Sport.findById(coach.sport._id);
        const location = await Location.findOne({ location_code });

        const newClassTime = new ClassTime({
          coach_class,
          coach_class_end,
          day_pattern,
          coach: coach._id,
          sport: sport._id,
          rmanager: location.rmanager.map(id => id),
          location: location._id
        });

        // const exisitngClassTime = await ClassTime.findOne({
        //   coach_class: coach_class
        // });
        const exisitngClassTime = await ClassTime.find({
          coach_class: coach_class
        });

        const existingCoachId = exisitngClassTime.filter(
          ect => ect.coach.toString() === coach._id.toString()
        );

        console.log("1", existingCoachId);
        // console.log("2", coach._id);
        // console.log("3", exisitngClassTime.coach);

        // console.log(
        //   "Exisiting Class coach",
        //   typeof exisitngClassTime.coach._id.toString()
        // );
        // console.log("Exisiting coach", typeof coach._id.toString());

        // if (
        //   exisitngClassTime &&
        //   exisitngClassTime.coach._id.toString() === coach._id.toString()
        // )
        if (existingCoachId.length > 0) {
          console.log("Exisiting Class", exisitngClassTime);
          throw new Error("Class to coach already exisits");
        } else {
          // 4.2 save classTime to DB
          // const classTime = newClassTime;
          const classTime = await newClassTime.save();

          // 4.3 save class to coach
          coach.classtime.push(classTime._id);
          await coach.save();

          // 4.4 save class to sport

          sport.classtime.push(classTime._id);
          await sport.save();

          // 4.5 save class to RManager
          location.rmanager.map(async id => {
            const rm = await RManager.findById(id);

            rm.classtime.push(classTime._id);
            await rm.save();
          });

          // 4.6 save class to location

          location.classtime.push(classTime._id);
          await location.save();

          return classTime;
        }
      } catch (err) {
        console.log(err);
        throw err;
      }
    },
    signupRM: async (root, { signupRMInput }, ctxt) => {
      const {
        rmanager_name,
        rmanager_email,
        rmanager_password
      } = signupRMInput;
      const rmanager = await RManager.findOne({
        rmanager_email: rmanager_email
      });
      if (rmanager) {
        throw new Error("RM already exists");
      }
      const newRmanager = await new RManager({
        rmanager_name,
        rmanager_email,
        rmanager_password
      }).save();

      return { token: createToken(newRmanager, process.env.SECRET, "1hr") };
    },
    signinRM: async (root, { signinRMInput }, ctxt) => {
      const { rmanager_email, rmanager_password } = signinRMInput;
      const rmanager = await RManager.findOne({
        rmanager_email: rmanager_email
      });
      if (!rmanager) {
        throw new Error("RM Does not exists");
      }
      const isvalidPassword = await bcrypt.compare(
        rmanager_password,
        rmanager.rmanager_password
      );

      if (!isvalidPassword) {
        throw new Error("Invalid password");
      }

      return { token: createToken(rmanager, process.env.SECRET, "1hr") };
    },
    addReport: async (root, { reportInput }, ctxt) => {
      const {
        class_start_time,
        class_end_time,
        coach_arrival_time,
        feedback,
        classTimeID
      } = reportInput;

      // 7.1 find the classtime to report

      const classTime = await ClassTime.findById(classTimeID);

      // 7.2 calculate the duration

      const a = moment(class_start_time);
      const b = moment(class_end_time);

      const class_duration = b.diff(a, "minutes");
      console.log(class_duration);

      // 7.3 Create new Report
      const newReport = new Report({
        class_start_time,
        class_end_time,
        coach_arrival_time,
        feedback,
        class_duration,
        coach: classTime.coach,
        sport: classTime.sport,
        location: classTime.location,
        rmanager: classTime.rmanager
      });

      //console.log(classTime);

      // 7.4 Add report to Location
      const location = await Location.findById(classTime.location);
      location.report.push(newReport._id);
      await location.save();

      // 7.5 Add report to sport
      const sport = await Sport.findById(classTime.sport);
      sport.report.push(newReport._id);
      await sport.save();

      // 7.6 Add report to Coach

      const coach = await Coach.findById(classTime.coach);
      coach.report.push(newReport._id);
      await coach.save();

      // 7.7 Add report to RManager

      classTime.rmanager.map(async rm => {
        const rmanager = await RManager.findById(rm);
        rmanager.report.push(newReport._id);
        await rmanager.save();
      });

      console.log(newReport);
      await newReport.save();
      return newReport;
    },
    deleteAll: async () => {
      const coach = await Coach.find();
      const location = await Location.find();
      const sport = await Sport.find();
      const rmanager = await RManager.find();
      const classTime = await ClassTime.find();

      coach.map(async c => {
        await Coach.findByIdAndRemove(c);
      });
      location.map(async c => {
        await Location.findByIdAndRemove(c);
      });
      sport.map(async c => {
        await Sport.findByIdAndRemove(c);
      });
      rmanager.map(async c => {
        await RManager.findByIdAndRemove(c);
      });
      classTime.map(async c => {
        await ClassTime.findByIdAndRemove(c);
      });

      return true;
    }
  }
};

// Coach Query and Mutations
