import { useEffect, useMemo, useState } from "react";
import api from "./api";

const emptyStep = () => ({ name: "", url: "https://jsonplaceholder.typicode.com/users", method: "GET", headers: "{}", body: "{}", expectedStatusCode: 200, requiredResponseFields: "", expectedResponseValues: "{}" });
const blankForm = () => ({ name: "", description: "", steps: [emptyStep()] });
const parseObject = (value, label) => { try { const parsed = JSON.parse(value || "{}"); if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error(); return parsed; } catch { throw new Error(`${label} must be a valid JSON object`); } };

export default function App() {
  const [workflows, setWorkflows] = useState([]);
  const [history, setHistory] = useState([]);
  const [form, setForm] = useState(blankForm());
  const [editingId, setEditingId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [report, setReport] = useState(null);
  const [trace, setTrace] = useState("");
  const [traceResult, setTraceResult] = useState(null);
  const [tab, setTab] = useState("workflows");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const passed = useMemo(() => history.filter(x => x.status === "passed").length, [history]);

  async function load() {
    try { const [w, h] = await Promise.all([api.get("/workflows"), api.get("/executions")]); setWorkflows(w.data); setHistory(h.data); setError(""); }
    catch (e) { setError(e.response?.data?.message || "Cannot connect to backend. Start the backend and check its .env file."); }
  }
  useEffect(() => { load(); }, []);
  function changeStep(index, key, value) { setForm(f => ({ ...f, steps: f.steps.map((s,i) => i === index ? { ...s, [key]: value } : s) })); }
  function editWorkflow(w) {
    setEditingId(w._id); setForm({ name: w.name, description: w.description || "", steps: w.steps.map(s => ({ name: s.name, url: s.url, method: s.method, headers: JSON.stringify(s.headers || {}, null, 2), body: JSON.stringify(s.body || {}, null, 2), expectedStatusCode: s.expectedStatusCode || 200, requiredResponseFields: (s.requiredResponseFields || []).join(", "), expectedResponseValues: JSON.stringify(s.expectedResponseValues || {}, null, 2) })) });
    setTab("workflows"); window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function saveWorkflow(e) {
    e.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      const payload = { name: form.name.trim(), description: form.description, steps: form.steps.map((s,i) => ({ name: s.name.trim(), url: s.url.trim(), method: s.method, headers: parseObject(s.headers,"Headers"), body: parseObject(s.body,"Body"), expectedStatusCode: Number(s.expectedStatusCode), requiredResponseFields: s.requiredResponseFields.split(",").map(x=>x.trim()).filter(Boolean), expectedResponseValues: parseObject(s.expectedResponseValues,"Expected values"), order: i+1 })) };
      if (!payload.name || payload.steps.some(s => !s.name || !s.url)) throw new Error("Workflow name, step names and URLs are required");
      if (editingId) await api.put(`/workflows/${editingId}`, payload); else await api.post("/workflows", payload);
      setMessage(editingId ? "Workflow updated." : "Workflow created."); setForm(blankForm()); setEditingId(null); await load();
    } catch (e) { setError(e.response?.data?.message || e.message); } finally { setBusy(false); }
  }
  async function removeWorkflow(id) { if (!confirm("Delete this workflow? Its execution history will remain.")) return; try { await api.delete(`/workflows/${id}`); if (editingId === id) { setEditingId(null); setForm(blankForm()); } setMessage("Workflow deleted."); await load(); } catch(e) { setError(e.response?.data?.message || e.message); } }
  async function runWorkflow(w) { setBusy(true); setError(""); setReport(null); try { const r = await api.post(`/executions/workflow/${w._id}/run`); setReport(r.data); setTab("workflows"); await load(); } catch(e) { setError(e.response?.data?.message || e.message); } finally { setBusy(false); } }
  async function checkTrace(w) { try { const actualSteps = JSON.parse(trace); const r = await api.post(`/executions/workflow/${w._id}/validate-trace`, { actualSteps }); setTraceResult(r.data); } catch(e) { setError(e.response?.data?.message || "Trace must be a JSON array, for example [\"Get Users\"]"); } }

  return <div className="app-shell"><header className="topbar"><div className="brand"><div className="brand-mark">↗</div><div><strong>FlowCheck</strong><small>API Workflow Validator</small></div></div><div className="connection"><span className="pulse"/> Local workspace</div></header>
    <main className="container"><section className="hero"><div><p className="eyebrow">WORKFLOW QUALITY CONTROL</p><h1>Validate every API step.<br/><span>Trust the whole sequence.</span></h1><p className="hero-copy">Create API workflows, execute requests in order, and inspect validation results from one workspace.</p></div><div className="hero-art"><div className="art-node">API</div><div className="art-line"/><div className="art-node art-node-two">✓</div><div className="art-line"/><div className="art-node art-node-three">✓</div></div></section>
    {error && <div className="notice error">{error}</div>}{message && <div className="notice success">{message}</div>}
    <section className="stats"><div className="stat"><span>Total workflows</span><strong>{workflows.length}</strong></div><div className="stat"><span>Executions recorded</span><strong>{history.length}</strong></div><div className="stat"><span>Successful executions</span><strong>{passed}</strong></div><div className="stat"><span>Failed executions</span><strong>{history.length-passed}</strong></div></section>
    <nav className="tabs"><button className={tab==="workflows"?"active":""} onClick={()=>setTab("workflows")}>Workflows</button><button className={tab==="history"?"active":""} onClick={()=>setTab("history")}>Execution history</button></nav>
    {tab==="workflows" ? <div className="layout"><section className="panel form-panel"><div className="panel-heading"><div><p className="eyebrow">WORKFLOW BUILDER</p><h2>{editingId?"Edit workflow":"Create a workflow"}</h2></div>{editingId&&<button className="text-button" onClick={()=>{setEditingId(null);setForm(blankForm())}}>Cancel edit</button>}</div>
      <form onSubmit={saveWorkflow}><label>Workflow name<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. User management workflow" required/></label><label>Description<textarea rows="2" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="What does this workflow verify?"/></label>
      <div className="steps-heading"><h3>API steps</h3><span>{form.steps.length} step(s)</span></div>
      {form.steps.map((s,i)=><div className="step-editor" key={i}><div className="step-title"><strong>Step {i+1}</strong>{form.steps.length>1&&<button type="button" className="remove" onClick={()=>setForm(f=>({...f,steps:f.steps.filter((_,j)=>j!==i)}))}>Remove</button>}</div>
        <label>Step name<input value={s.name} onChange={e=>changeStep(i,"name",e.target.value)} placeholder="e.g. Get Users" required/></label><label>Request URL<input value={s.url} onChange={e=>changeStep(i,"url",e.target.value)} placeholder="https://api.example.com/users" required/></label>
        <div className="field-row"><label>Method<select value={s.method} onChange={e=>changeStep(i,"method",e.target.value)}>{["GET","POST","PUT","PATCH","DELETE"].map(m=><option key={m}>{m}</option>)}</select></label><label>Expected status<input type="number" min="100" max="599" value={s.expectedStatusCode} onChange={e=>changeStep(i,"expectedStatusCode",e.target.value)}/></label></div>
        <label>Headers (JSON)<textarea rows="2" value={s.headers} onChange={e=>changeStep(i,"headers",e.target.value)} spellCheck="false"/></label><label>Request body (JSON)<textarea rows="2" value={s.body} onChange={e=>changeStep(i,"body",e.target.value)} spellCheck="false"/></label>
        <label>Required response fields <small>Comma-separated; nested fields use dot notation</small><input value={s.requiredResponseFields} onChange={e=>changeStep(i,"requiredResponseFields",e.target.value)} placeholder="id, name, address.city"/></label><label>Expected response values (JSON)<textarea rows="2" value={s.expectedResponseValues} onChange={e=>changeStep(i,"expectedResponseValues",e.target.value)} spellCheck="false"/></label>
      </div>)}
      <button type="button" className="add-step" onClick={()=>setForm(f=>({...f,steps:[...f.steps,emptyStep()]}))}>＋ Add another API step</button><button className="primary full" disabled={busy}>{busy?"Saving…":editingId?"Save changes":"Create workflow"}</button></form></section>
      <section className="workflow-column"><div className="section-heading"><div><p className="eyebrow">SAVED CONFIGURATIONS</p><h2>Your workflows</h2></div><button className="icon-button" onClick={load} title="Refresh">↻</button></div>
      {!workflows.length?<div className="empty"><div className="empty-icon">⌁</div><h3>No workflows yet</h3><p>Create your first workflow using the builder.</p></div>:workflows.map(w=><article className="workflow-card" key={w._id}><div className="workflow-card-top"><div><h3>{w.name}</h3><p>{w.description||"No description"}</p></div><span className="step-count">{w.steps.length} steps</span></div><div className="mini-steps">{[...w.steps].sort((a,b)=>a.order-b.order).map((s,i)=><span key={s._id||i}>{i+1}. {s.name}</span>)}</div><div className="card-actions"><button className="primary small" onClick={()=>runWorkflow(w)} disabled={busy||!w.steps.length}>▶ Run workflow</button><button className="secondary small" onClick={()=>editWorkflow(w)}>Edit</button><button className="danger small" onClick={()=>removeWorkflow(w._id)}>Delete</button><button className="secondary small" onClick={()=>{setSelected(selected?._id===w._id?null:w);setTrace("");setTraceResult(null)}}>Validate trace</button></div>
      {selected?._id===w._id&&<div className="trace-box"><label>Paste actual step names as a JSON array<textarea rows="3" value={trace} onChange={e=>setTrace(e.target.value)} placeholder={'["Get Users", "Create User"]'}/></label><button className="secondary small" onClick={()=>checkTrace(w)}>Check sequence</button>{traceResult&&<pre className={traceResult.valid?"trace-good":"trace-bad"}>{JSON.stringify(traceResult,null,2)}</pre>}</div>}</article>)}
      {report&&<div className="report"><div className="report-title"><div><p className="eyebrow">LATEST EXECUTION</p><h3>{report.workflowName}</h3></div><span className={`status ${report.status}`}>{report.status}</span></div><p className="muted">Completed in {report.durationMs} ms · {report.results.length} step(s) executed</p>{report.results.map((r,i)=><div className="result-row" key={i}><div><strong>{r.order}. {r.stepName}</strong><small>{r.method} · HTTP {r.statusCode??"—"} · {r.durationMs} ms</small>{r.errors.map((x,j)=><small className="failure-text" key={j}>{x}</small>)}</div><span className={`status ${r.passed?"passed":"failed"}`}>{r.passed?"Passed":"Failed"}</span></div>)}</div>}</section></div> : <section className="panel history-panel"><div className="panel-heading"><div><p className="eyebrow">RUN LOGS</p><h2>Execution history</h2></div><button className="secondary small" onClick={load}>Refresh</button></div>{!history.length?<div className="empty"><h3>No executions recorded</h3><p>Run a workflow to see its results here.</p></div>:<div className="history-list">{history.map(h=><article className="history-item" key={h._id}><div><strong>{h.workflowName}</strong><small>{new Date(h.createdAt).toLocaleString()} · {h.durationMs} ms · {h.results.length} step(s)</small></div><span className={`status ${h.status}`}>{h.status}</span><details><summary>View results</summary>{h.results.map((r,i)=><div className="history-result" key={i}><b>{r.order}. {r.stepName}</b> — {r.passed?"Passed":"Failed"}{r.errors?.map((x,j)=><small className="failure-text" key={j}>{x}</small>)}</div>)}</details></article>)}</div>}</section>}
    <footer>FlowCheck · API Workflow Sequence Validator <span>Local development build</span></footer></main></div>;
}
