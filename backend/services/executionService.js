const axios = require("axios");
const { validateExternalUrl } = require("../utils/urlSafety");

function getPath(object, path) {
  return path.split(".").reduce((value, key) => value == null ? undefined : value[key], object);
}
function hasRequiredField(data, field) {
  if (Array.isArray(data)) {
    return data.length > 0 && data.every(item => getPath(item, field) !== undefined);
  }

  return getPath(data, field) !== undefined;
}
function replaceTemplates(value, previous) {
  if (typeof value === "string") {
    const exact = value.match(/^\{\{steps\.([\w -]+)\.response\.([\w.$-]+)\}\}$/);
    if (exact) return getPath(previous[exact[1]]?.response, exact[2]);
    return value.replace(/\{\{steps\.([\w -]+)\.response\.([\w.$-]+)\}\}/g, (_, step, path) => {
      const result = getPath(previous[step]?.response, path);
      return result == null ? "" : String(result);
    });
  }
  if (Array.isArray(value)) return value.map(item => replaceTemplates(item, previous));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k,v]) => [k, replaceTemplates(v, previous)]));
  return value;
}

async function executeWorkflow(workflow) {
  const startedAt = new Date();
  const start = Date.now();
  const previous = {};
  const results = [];
  const steps = [...workflow.steps].sort((a,b) => a.order - b.order);

  for (const step of steps) {
    const stepStart = Date.now();
    const result = { stepName: step.name, order: step.order, method: step.method, url: step.url, checks: [], errors: [], passed: false };
    try {
      const url = await validateExternalUrl(step.url);
      const headers = replaceTemplates(step.headers || {}, previous);
      const body = replaceTemplates(step.body || {}, previous);
      const response = await axios({
        url, method: step.method, headers, data: ["GET", "DELETE"].includes(step.method) ? undefined : body,
        timeout: 10000, maxRedirects: 0, maxContentLength: 1024 * 1024,
        maxBodyLength: 1024 * 1024, validateStatus: () => true
      });
      console.log("Requested URL:", url);
console.log("Actual response status:", response.status);
console.log("Response data:", response.data);
      result.statusCode = response.status;
      result.response = response.data;
      if (response.status === step.expectedStatusCode) result.checks.push(`Status code matched (${response.status})`);
      else result.errors.push(`Expected status ${step.expectedStatusCode}, received ${response.status}`);
      for (const field of step.requiredResponseFields || []) {
  if (hasRequiredField(response.data, field)) {
    result.checks.push(`Required field present: ${field}`);
  } else {
    result.errors.push(`Missing required response field: ${field}`);
  }
}
      for (const [field, expected] of Object.entries(step.expectedResponseValues || {})) {
        const actual = getPath(response.data, field);
        if (JSON.stringify(actual) === JSON.stringify(expected)) result.checks.push(`Expected value matched: ${field}`);
        else result.errors.push(`Value mismatch for ${field}`);
      }
      previous[step.name] = { response: response.data, statusCode: response.status };
    } catch (error) {
      result.errors.push(error.response ? `HTTP request failed: ${error.message}` : error.message || "Request failed");
    }
    result.durationMs = Date.now() - stepStart;
    result.passed = result.errors.length === 0;
    results.push(result);
    if (!result.passed) break;
  }
  const finishedAt = new Date();
  return {
    workflow: workflow._id, workflowName: workflow.name,
    status: results.length === steps.length && results.every(r => r.passed) ? "passed" : "failed",
    startedAt, finishedAt, durationMs: Date.now() - start, results
  };
}

function validateTrace(workflow, actualSteps) {
  const expected = [...workflow.steps].sort((a,b) => a.order - b.order).map(s => s.name);
  const actual = Array.isArray(actualSteps) ? actualSteps.map(s => typeof s === "string" ? s : s.name).filter(Boolean) : [];
  const counts = actual.reduce((m, name) => (m[name] = (m[name] || 0) + 1, m), {});
  const missing = expected.filter(name => !counts[name]);
  const duplicates = Object.keys(counts).filter(name => counts[name] > 1);
  const unexpected = actual.filter(name => !expected.includes(name));
  const orderCorrect = actual.length === expected.length && actual.every((name, i) => name === expected[i]);
  return { valid: orderCorrect && !missing.length && !duplicates.length && !unexpected.length, expectedOrder: expected, actualOrder: actual, missing, duplicates, unexpected, orderCorrect };
}
module.exports = { executeWorkflow, validateTrace };
