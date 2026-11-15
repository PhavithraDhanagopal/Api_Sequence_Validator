const mongoose = require("mongoose");
const Workflow = require("../models/Workflow");

exports.createWorkflow = async (req, res) => {
  try {
    const workflow = await Workflow.create(req.body);
    res.status(201).json(workflow);
  } catch (error) { res.status(400).json({ message: error.message }); }
};
exports.getWorkflows = async (req, res) => {
  try { res.json(await Workflow.find().sort({ updatedAt: -1 })); }
  catch (error) { res.status(500).json({ message: error.message }); }
};
exports.getWorkflow = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid workflow ID" });
    const workflow = await Workflow.findById(req.params.id);
    if (!workflow) return res.status(404).json({ message: "Workflow not found" });
    res.json(workflow);
  } catch (error) { res.status(500).json({ message: error.message }); }
};
exports.updateWorkflow = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid workflow ID" });
    const workflow = await Workflow.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!workflow) return res.status(404).json({ message: "Workflow not found" });
    res.json(workflow);
  } catch (error) { res.status(400).json({ message: error.message }); }
};
exports.deleteWorkflow = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid workflow ID" });
    const workflow = await Workflow.findByIdAndDelete(req.params.id);
    if (!workflow) return res.status(404).json({ message: "Workflow not found" });
    res.json({ message: "Workflow deleted successfully" });
  } catch (error) { res.status(500).json({ message: error.message }); }
};
