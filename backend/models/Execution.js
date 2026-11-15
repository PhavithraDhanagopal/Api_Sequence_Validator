const mongoose = require("mongoose");

const executionSchema = new mongoose.Schema({
  workflow: { type: mongoose.Schema.Types.ObjectId, ref: "Workflow", required: true },
  workflowName: { type: String, required: true },
  status: { type: String, enum: ["passed", "failed"], required: true },
  startedAt: { type: Date, required: true },
  finishedAt: { type: Date, required: true },
  durationMs: { type: Number, required: true },
  results: [{
    stepName: String, order: Number, method: String, url: String,
    statusCode: Number, durationMs: Number, passed: Boolean,
    checks: [String], errors: [String], response: mongoose.Schema.Types.Mixed
  }]
}, { timestamps: true });

module.exports = mongoose.model("Execution", executionSchema);
