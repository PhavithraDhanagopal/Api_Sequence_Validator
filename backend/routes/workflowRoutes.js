const express = require("express");
const router = express.Router();
const { createWorkflow, getWorkflows, getWorkflow, updateWorkflow, deleteWorkflow } = require("../controllers/workflowController");
router.post("/", createWorkflow);
router.get("/", getWorkflows);
router.get("/:id", getWorkflow);
router.put("/:id", updateWorkflow);
router.delete("/:id", deleteWorkflow);
module.exports = router;
