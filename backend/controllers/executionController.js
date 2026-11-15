const mongoose = require("mongoose");
const Workflow = require("../models/Workflow");
const Execution = require("../models/Execution");
const { executeWorkflow, validateTrace } = require("../services/executionService");

exports.runWorkflow = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid workflow ID" });
    const workflow = await Workflow.findById(req.params.id);
    if (!workflow) return res.status(404).json({ message: "Workflow not found" });
    if (!workflow.steps.length) return res.status(400).json({ message: "Add at least one step before execution" });
    const report = await executeWorkflow(workflow);
    const saved = await Execution.create(report);
    res.status(201).json(saved);
  } catch (error) { res.status(500).json({ message: error.message }); }
};
exports.getHistory = async (req, res) => {
  try { res.json(await Execution.find().sort({ createdAt: -1 }).limit(50)); }
  catch (error) { res.status(500).json({ message: error.message }); }
};
exports.getExecution = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid execution ID" });
    const item = await Execution.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Execution not found" });
    res.json(item);
  } catch (error) { res.status(500).json({ message: error.message }); }
};
exports.validateWorkflowTrace = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid workflow ID" });
    const workflow = await Workflow.findById(req.params.id);
    if (!workflow) return res.status(404).json({ message: "Workflow not found" });
    res.json(validateTrace(workflow, req.body.actualSteps));
  } catch (error) { res.status(400).json({ message: error.message }); }
};
