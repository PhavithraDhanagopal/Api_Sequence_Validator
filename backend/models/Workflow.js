const mongoose = require("mongoose");

const stepSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  url: { type: String, required: true, trim: true },
  method: { type: String, enum: ["GET", "POST", "PUT", "PATCH", "DELETE"], required: true },
  headers: { type: mongoose.Schema.Types.Mixed, default: {} },
  body: { type: mongoose.Schema.Types.Mixed, default: {} },
  expectedStatusCode: { type: Number, default: 200 },
  requiredResponseFields: { type: [String], default: [] },
  expectedResponseValues: { type: mongoose.Schema.Types.Mixed, default: {} },
  order: { type: Number, required: true }
});

const workflowSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  steps: { type: [stepSchema], default: [] }
}, { timestamps: true });

module.exports = mongoose.model("Workflow", workflowSchema);
