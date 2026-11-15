const mongoose = require("mongoose");

const connectDB = async () => {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is missing. Add it to backend/.env");
  await mongoose.connect(process.env.MONGO_URI, { dbName: "api_workflow_validator" });
  console.log("MongoDB Atlas Connected Successfully! (api_workflow_validator)");
};

module.exports = connectDB;
