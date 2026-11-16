const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const workflowRoutes = require("./routes/workflowRoutes");
const executionRoutes = require("./routes/executionRoutes");

const app = express();
const corsOrigin = process.env.CLIENT_URL
  ? (process.env.CLIENT_URL.trim() === "*" ? "*" : process.env.CLIENT_URL.trim().replace(/\/+$/, ""))
  : "*";
app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => res.json({ message: "API Workflow Validator Backend is Running!" }));
app.use("/api/workflows", workflowRoutes);
app.use("/api/executions", executionRoutes);

const PORT = process.env.PORT || 5000;
async function startServer() {
  await connectDB();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
startServer().catch((error) => {
  console.error("Server startup failed:", error.message);
  process.exit(1);
});
