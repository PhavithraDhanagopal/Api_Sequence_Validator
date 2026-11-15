const express = require("express");
const router = express.Router();
const { runWorkflow, getHistory, getExecution, validateWorkflowTrace } = require("../controllers/executionController");
router.get("/", getHistory);
router.get("/:id", getExecution);
router.post("/workflow/:id/run", runWorkflow);
router.post("/workflow/:id/validate-trace", validateWorkflowTrace);
module.exports = router;
