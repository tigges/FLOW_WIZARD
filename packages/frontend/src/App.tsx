import { useState, useEffect, useCallback } from "react";
import "./App.css";
import { api } from "./api";
import type { Session, ProviderCapabilities, AiEstimate, PatchResult, Job } from "./api";

const STEPS = [
  { num: 1, label: "Upload" },
  { num: 2, label: "Page Map" },
  { num: 3, label: "Settings" },
  { num: 4, label: "Review" },
  { num: 5, label: "Preview + QA" },
  { num: 6, label: "Complete" },
];

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [step, setStep] = useState(1);
  const [providers, setProviders] = useState<ProviderCapabilities | null>(null);
  const [cpm, setCpm] = useState<Record<string, unknown> | null>(null);
  const [cpmRevision, setCpmRevision] = useState(0);
  const [estimate, setEstimate] = useState<AiEstimate | null>(null);
  const [patchResult, setPatchResult] = useState<PatchResult | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [log, setLog] = useState<Array<{ text: string; type: string }>>([]);
  const [sessionName, setSessionName] = useState("");
  const [apiOk, setApiOk] = useState<boolean | null>(null);

  const addLog = useCallback((text: string, type = "info") => {
    setLog((prev) => [...prev, { text: `[${new Date().toISOString().slice(11, 19)}] ${text}`, type }]);
  }, []);

  useEffect(() => {
    api.health().then(() => setApiOk(true)).catch(() => setApiOk(false));
  }, []);

  const handleCreateSession = async () => {
    try {
      const s = await api.createSession(sessionName || "New Session");
      setSession(s);
      setStep(1);
      addLog(`Session created: ${s.sessionId}`, "success");

      const p = await api.getProviders();
      setProviders(p);
      addLog(`Loaded ${p.providers.length} providers from backend`, "success");

      const c = await api.getCpm(s.sessionId);
      setCpm(c);
      addLog("CPM loaded", "success");
    } catch (e: unknown) {
      addLog(`Error: ${e instanceof Error ? e.message : String(e)}`, "error");
    }
  };

  const handlePatchCpm = async () => {
    if (!session) return;
    try {
      const result = await api.patchCpm(session.sessionId, cpmRevision, [
        { op: "add", path: "/clusters/0", value: { clusterId: "clu_demo", name: "Demo Cluster" } },
        { op: "add", path: "/metadata/title", value: "Demo Project" },
      ]);
      setPatchResult(result);
      setCpm(result.cpm);
      setCpmRevision(result.revision);
      addLog(`CPM patched → revision ${result.revision}, ${result.operationResults.length} ops applied`, "success");
    } catch (e: unknown) {
      addLog(`Patch error: ${e instanceof Error ? e.message : String(e)}`, "error");
    }
  };

  const handleEstimate = async () => {
    if (!session) return;
    try {
      const est = await api.estimateAi(session.sessionId, "preview", { provider: "gemini" });
      setEstimate(est);
      addLog(`Estimate: ${est.estimatedTotalTokens} tokens, $${est.estimatedCostUsd.toFixed(4)} USD`, "success");
    } catch (e: unknown) {
      addLog(`Estimate error: ${e instanceof Error ? e.message : String(e)}`, "error");
    }
  };

  const handleConfirm = async () => {
    if (!session || !estimate) return;
    try {
      const result = await api.confirmAi(session.sessionId, estimate.estimateId, estimate.action);
      addLog(`AI confirmed: execution ${result.executionId}`, "success");
      setEstimate(null);
    } catch (e: unknown) {
      addLog(`Confirm error: ${e instanceof Error ? e.message : String(e)}`, "error");
    }
  };

  const handlePreviewJob = async () => {
    if (!session) return;
    try {
      const j = await api.createPreviewJob(session.sessionId, cpmRevision, 0, {
        mode: "dev-human-loop",
        clusterAdjustments: [{ clusterId: "clu_demo", priority: 1, selected: true }],
        actor: { actorType: "user" },
      });
      setJob(j);
      addLog(`Preview job queued: ${j.jobId}`, "success");
      pollJob(session.sessionId, j.jobId);
    } catch (e: unknown) {
      addLog(`Job error: ${e instanceof Error ? e.message : String(e)}`, "error");
    }
  };

  const handleCompileJob = async () => {
    if (!session) return;
    try {
      const j = await api.createCompileJob(session.sessionId, cpmRevision, 0, "pre-view", {
        processAllocation: [{ clusterId: "clu_demo", selected: true, priority: 1 }],
        actor: { actorType: "user" },
      });
      setJob(j);
      addLog(`Compile job queued: ${j.jobId}`, "success");
      pollJob(session.sessionId, j.jobId);
    } catch (e: unknown) {
      addLog(`Job error: ${e instanceof Error ? e.message : String(e)}`, "error");
    }
  };

  const pollJob = (sessionId: string, jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const j = await api.getJob(sessionId, jobId);
        setJob(j);
        if (j.state === "succeeded" || j.state === "failed" || j.state === "canceled") {
          clearInterval(interval);
          addLog(`Job ${jobId} → ${j.state}`, j.state === "succeeded" ? "success" : "error");
        }
      } catch {
        clearInterval(interval);
      }
    }, 500);
  };

  if (!session) {
    return (
      <div id="root">
        <header className="app-header">
          <h1>FLOW_WIZARD</h1>
          <span className="status">
            API: {apiOk === null ? "checking..." : apiOk ? "connected" : "unavailable"}
          </span>
        </header>
        <div className="wizard-container">
          <div className="landing">
            <h2>Import Wizard</h2>
            <p>
              Contract-first import wizard. Create a session to start the six-step flow.
            </p>
            <input
              type="text"
              placeholder="Session name (optional)"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
            />
            <button className="btn btn-primary" onClick={handleCreateSession} disabled={!apiOk}>
              Create Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="root">
      <header className="app-header">
        <h1>FLOW_WIZARD</h1>
        <div className="session-info">
          <span>Session: {session.sessionId}</span>
          <span>Step: {step}/6</span>
          <span>Status: {session.status}</span>
        </div>
      </header>

      <div className="wizard-container">
        <nav className="step-nav">
          {STEPS.map((s) => (
            <button
              key={s.num}
              className={s.num === step ? "active" : s.num < step ? "done" : ""}
              onClick={() => setStep(s.num)}
            >
              {s.num}. {s.label}
            </button>
          ))}
        </nav>

        <div className="step-content">
          {step === 1 && (
            <>
              <h2>Step 1: Upload</h2>
              <p>Upload source and reference files. Files are identified by backend-assigned fileId.</p>
              <div className="panel">
                <h3>Session Files</h3>
                <pre>{session.files.length === 0 ? "No files uploaded yet." : JSON.stringify(session.files, null, 2)}</pre>
              </div>
              <div className="btn-group">
                <button className="btn btn-primary" onClick={() => setStep(2)}>Continue to Page Map</button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2>Step 2: Page Map</h2>
              <p>Configure per-page metadata and role tagging.</p>
              <div className="panel">
                <h3>Page Map</h3>
                <pre>Page map configuration will be populated after file upload.</pre>
              </div>
              <div className="btn-group">
                <button className="btn btn-secondary" onClick={() => setStep(1)}>Back</button>
                <button className="btn btn-primary" onClick={() => setStep(3)}>Continue to Settings</button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2>Step 3: Settings</h2>
              <p>Configure import parameters. Provider options are loaded from backend — frontend never guesses models.</p>

              {providers && (
                <div className="provider-grid">
                  {providers.providers.map((p) => (
                    <div key={p.provider} className="provider-card">
                      <div className="name">{p.provider}</div>
                      <div className="families">{p.modelFamilies.join(", ")}</div>
                      <span className={`badge ${p.enabled ? "enabled" : ""}`}>
                        {p.enabled ? "Enabled" : "Disabled"}
                      </span>
                      {p.notes && <div className="families">{p.notes}</div>}
                    </div>
                  ))}
                </div>
              )}

              <div className="btn-group">
                <button className="btn btn-secondary" onClick={() => setStep(2)}>Back</button>
                <button className="btn btn-primary" onClick={() => setStep(4)}>Continue to Review</button>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h2>Step 4: Review (CPM Patch)</h2>
              <p>Edit the Canonical Project Model using structured patch operations.</p>

              <div className="panel">
                <h3>Current CPM (revision {cpmRevision})</h3>
                <pre>{JSON.stringify(cpm, null, 2)}</pre>
              </div>

              <div className="btn-group">
                <button className="btn btn-primary" onClick={handlePatchCpm}>Apply Demo Patch</button>
              </div>

              {patchResult && (
                <div className="panel">
                  <h3>Patch Result</h3>
                  <pre>{JSON.stringify(patchResult.operationResults, null, 2)}</pre>
                </div>
              )}

              <div className="btn-group">
                <button className="btn btn-secondary" onClick={() => setStep(3)}>Back</button>
                <button className="btn btn-primary" onClick={() => setStep(5)}>Continue to Preview</button>
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <h2>Step 5: Preview + Visual QA + Moderation</h2>
              <p>
                Preview-only step. No primary extraction. Human moderation enabled in development mode.
              </p>

              <div className="btn-group">
                <button className="btn btn-warning" onClick={handleEstimate}>
                  Get AI Cost Estimate
                </button>
                <button className="btn btn-primary" onClick={handlePreviewJob}>
                  Create Preview Job
                </button>
              </div>

              {estimate && (
                <div className="estimate-box">
                  <h3>AI Usage Estimate (consent required)</h3>
                  <div className="cost">${estimate.estimatedCostUsd.toFixed(4)} USD</div>
                  <div className="detail">
                    Provider: {estimate.provider} | Model: {estimate.modelFamily} |
                    Tokens: {estimate.estimatedTotalTokens}
                  </div>
                  <div className="btn-group">
                    <button className="btn btn-success" onClick={handleConfirm}>
                      Confirm & Execute
                    </button>
                    <button className="btn btn-secondary" onClick={() => setEstimate(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {job && job.type === "preview" && (
                <div className="panel">
                  <h3>Preview Job</h3>
                  <pre>ID: {job.jobId} | State: {job.state}</pre>
                </div>
              )}

              <div className="btn-group">
                <button className="btn btn-secondary" onClick={() => setStep(4)}>Back</button>
                <button className="btn btn-primary" onClick={() => setStep(6)}>Continue to Complete</button>
              </div>
            </>
          )}

          {step === 6 && (
            <>
              <h2>Step 6: Pre-Export Gate</h2>
              <p>
                Development mode: human sign-off before export. Production mode: compile/export after explicit approval.
              </p>

              <div className="btn-group">
                <button className="btn btn-warning" onClick={handleCompileJob}>
                  Create Compile Job (Pre-View Mode)
                </button>
              </div>

              {job && job.type === "compile" && (
                <div className="panel">
                  <h3>Compile Job</h3>
                  <pre>ID: {job.jobId} | State: {job.state}</pre>
                </div>
              )}

              <div className="btn-group">
                <button className="btn btn-secondary" onClick={() => setStep(5)}>Back</button>
              </div>
            </>
          )}
        </div>

        {log.length > 0 && (
          <div className="panel" style={{ marginTop: 16 }}>
            <h3>Activity Log</h3>
            {log.slice(-10).map((entry, i) => (
              <div key={i} className={`log-entry ${entry.type}`}>{entry.text}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
