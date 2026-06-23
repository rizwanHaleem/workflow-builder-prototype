
import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Trash2,
  ArrowDown,
  ArrowUp,
  Copy,
  CheckCircle2,
  Play,
  GitBranch,
  CheckCheck,
  XCircle,
  RefreshCw,
} from "lucide-react";

const NODE_LIBRARY = [
  { type: "start", label: "Start", color: "#d1fae5", text: "#065f46" },
  { type: "task", label: "Task", color: "#dbeafe", text: "#1d4ed8" },
  { type: "approval", label: "Approval", color: "#fef3c7", text: "#92400e" },
  { type: "decision", label: "Decision", color: "#ede9fe", text: "#6d28d9" },
  { type: "upload", label: "Upload", color: "#fed7aa", text: "#c2410c" },
  { type: "invoice", label: "Invoice", color: "#fbcfe8", text: "#be185d" },
  { type: "payment", label: "Payment", color: "#ccfbf1", text: "#0f766e" },
  { type: "notification", label: "Notification", color: "#e0e7ff", text: "#4338ca" },
  { type: "end", label: "End", color: "#e5e7eb", text: "#334155" },
];

const roles = [
  "Requester",
  "Operations",
  "Manager",
  "SCM",
  "Vendor",
  "Finance",
  "Admin",
  "System",
];

function makeNode(type) {
  const lib = NODE_LIBRARY.find((n) => n.type === type) || NODE_LIBRARY[1];
  return {
    id: `${type}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    title: lib.label,
    role:
      type === "approval"
        ? "Manager"
        : type === "payment"
        ? "Finance"
        : type === "decision"
        ? "System"
        : "",
    description: "",
    required: false,
    condition: "",
    estimatedHours: 0,
    nextStepId: "",
    trueNextStepId: "",
    falseNextStepId: "",
    trueLabel: "Yes",
    falseLabel: "No",
  };
}

const baseDefaultFlow = [
  makeNode("start"),
  {
    ...makeNode("task"),
    title: "Issue Identification",
    role: "Requester",
    description: "Log issue, location, priority, and business context.",
  },
  {
    ...makeNode("task"),
    title: "Scope Definition",
    role: "Operations",
    description: "Define work scope, estimate cost, duration and dependencies.",
  },
  {
    ...makeNode("decision"),
    title: "Need Approval?",
    role: "System",
    description: "Route high-value or sensitive cases for approval.",
    condition: "Estimated cost > 100000",
  },
  {
    ...makeNode("approval"),
    title: "Scope Approval",
    role: "Manager",
    description: "Manager reviews and approves or rejects the scope.",
  },
  {
    ...makeNode("task"),
    title: "PO Issuance",
    role: "SCM",
    description: "Create and issue the purchase order to the selected vendor.",
  },
  {
    ...makeNode("upload"),
    title: "Work Completion + Photo Update",
    role: "Vendor",
    description: "Upload completion proof, photos and status update.",
    required: true,
  },
  {
    ...makeNode("approval"),
    title: "Validation",
    role: "Operations",
    description: "Validate completion quality and close technical checks.",
  },
  {
    ...makeNode("invoice"),
    title: "Invoice Submission",
    role: "Vendor",
    description: "Submit invoice and supporting documents.",
    required: true,
  },
  {
    ...makeNode("payment"),
    title: "Payment Release",
    role: "Finance",
    description: "Release payment after all controls are satisfied.",
  },
  makeNode("end"),
];

function buildSequentialLinks(nodes) {
  return nodes.map((node, index) => {
    const next = nodes[index + 1]?.id || "";
    if (node.type === "decision") {
      return {
        ...node,
        trueNextStepId: node.trueNextStepId || next,
        falseNextStepId: node.falseNextStepId || nodes[index + 2]?.id || next,
      };
    }
    if (node.type !== "end") {
      return {
        ...node,
        nextStepId: node.nextStepId || next,
      };
    }
    return node;
  });
}

const defaultFlow = buildSequentialLinks(baseDefaultFlow);

function getTypeMeta(type) {
  return NODE_LIBRARY.find((n) => n.type === type) || NODE_LIBRARY[1];
}

function makeHistoryEntry(stepTitle, action, actor, nextTitle) {
  return {
    id: `h-${Math.random().toString(36).slice(2, 8)}`,
    stepTitle,
    action,
    actor,
    nextTitle,
    time: new Date().toLocaleString(),
  };
}

function cardStyle() {
  return {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "16px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  };
}

function buttonStyle(primary = false, danger = false) {
  return {
    border: primary
      ? "1px solid #111827"
      : danger
      ? "1px solid #dc2626"
      : "1px solid #d1d5db",
    background: primary ? "#111827" : "#ffffff",
    color: primary ? "#ffffff" : danger ? "#dc2626" : "#111827",
    borderRadius: "12px",
    padding: "10px 14px",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: 500,
  };
}

function inputStyle() {
  return {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    background: "#fff",
    boxSizing: "border-box",
  };
}

function badgeStyle(bg = "#f3f4f6", color = "#111827") {
  return {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: "999px",
    background: bg,
    color,
    fontSize: "12px",
    fontWeight: 600,
  };
}

export default function App() {
  const [workflowName, setWorkflowName] = useState("Custom Workflow Builder");
  const [version, setVersion] = useState(1);
  const [status, setStatus] = useState("Draft");
  const [nodes, setNodes] = useState(defaultFlow);
  const [selectedId, setSelectedId] = useState(defaultFlow[1].id);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState("designer");
  const [instances, setInstances] = useState([]);
  const [selectedInstanceId, setSelectedInstanceId] = useState("");
  const [message, setMessage] = useState(
    "Prototype ready. Design workflows and simulate runtime execution."
  );

  const selectedNode =
    nodes.find((n) => n.id === selectedId) || nodes[0] || null;

  const selectedInstance =
    instances.find((i) => i.id === selectedInstanceId) || instances[0] || null;

  const allStepOptions = useMemo(() => {
    return nodes
      .filter((n) => n.id !== selectedId)
      .map((n, index) => ({
        id: n.id,
        label: `Step ${index + 1} - ${n.title}`,
      }));
  }, [nodes, selectedId]);

  const workflowDefinition = useMemo(
    () => ({
      workflowName,
      version,
      status,
      lastUpdated: new Date().toISOString(),
      steps: nodes,
    }),
    [workflowName, version, status, nodes]
  );

  const flowJson = useMemo(
    () => JSON.stringify(workflowDefinition, null, 2),
    [workflowDefinition]
  );

  const branchingSummary = useMemo(() => {
    return nodes
      .filter((n) => n.type === "decision")
      .map((n) => {
        const yesTarget = nodes.find((x) => x.id === n.trueNextStepId)?.title || "Not set";
        const noTarget = nodes.find((x) => x.id === n.falseNextStepId)?.title || "Not set";
        return { id: n.id, title: n.title, yesTarget, noTarget, rule: n.condition || "No rule defined" };
      });
  }, [nodes]);

  const activeTasks = useMemo(() => {
    return instances
      .filter((instance) => instance.status === "Active")
      .map((instance) => {
        const currentStep = nodes.find((n) => n.id === instance.currentStepId);
        if (!currentStep || currentStep.type === "start" || currentStep.type === "end")
          return null;
        return {
          instanceId: instance.id,
          instanceName: instance.name,
          stepId: currentStep.id,
          stepTitle: currentStep.title,
          stepType: currentStep.type,
          assignedRole: currentStep.role || "Unassigned",
          priority: instance.priority,
          currentStep,
        };
      })
      .filter(Boolean);
  }, [instances, nodes]);

  function showMessage(text) {
    setMessage(text);
    setTimeout(() => {
      setMessage("Prototype ready. Design workflows and simulate runtime execution.");
    }, 2200);
  }

  function updateNode(id, patch) {
    setNodes((prev) =>
      buildSequentialLinks(prev.map((n) => (n.id === id ? { ...n, ...patch } : n)))
    );
    setStatus("Draft");
  }

  function addNode(type) {
    const newNode = makeNode(type);
    setNodes((prev) => {
      const clone = [...prev];
      const insertAt = Math.max(clone.findIndex((n) => n.id === selectedId) + 1, clone.length - 1);
      clone.splice(insertAt, 0, newNode);
      return buildSequentialLinks(clone);
    });
    setSelectedId(newNode.id);
    setStatus("Draft");
  }

  function removeNode(id) {
    setNodes((prev) => {
      const filtered = buildSequentialLinks(prev.filter((n) => n.id !== id));
      if (selectedId === id && filtered.length) setSelectedId(filtered[0].id);
      return filtered;
    });
    setStatus("Draft");
  }

  function moveNode(id, dir) {
    setNodes((prev) => {
      const idx = prev.findIndex((n) => n.id === id);
      if (idx <= 0 || idx >= prev.length - 1) return prev;
      const target = dir === "up" ? idx - 1 : idx + 1;
      if (target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[target]] = [copy[target], copy[idx]];
      return buildSequentialLinks(copy);
    });
    setStatus("Draft");
  }

  async function copyJson() {
    try {
      await navigator.clipboard.writeText(flowJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
      showMessage("Workflow JSON copied to clipboard.");
    } catch {
      showMessage("Clipboard copy failed in this browser.");
    }
  }

  function publishWorkflow() {
    const nextVersion = status === "Published" ? version + 1 : version;
    setVersion(nextVersion);
    setStatus("Published");
    showMessage(`Published ${workflowName} version ${nextVersion}.`);
  }

  function newDraftVersion() {
    setVersion((v) => v + 1);
    setStatus("Draft");
    showMessage("Created a new draft version.");
  }

  function getNodeById(id) {
    return nodes.find((n) => n.id === id) || null;
  }

  function getNextStepId(node, action = "complete") {
    if (!node) return "";
    if (node.type === "decision") {
      return action === "false" ? node.falseNextStepId : node.trueNextStepId;
    }
    return node.nextStepId || "";
  }

  function createInstance() {
    const startNode = nodes.find((n) => n.type === "start") || nodes[0];
    const firstStepId = getNextStepId(startNode, "complete");
    const firstStep = getNodeById(firstStepId);

    const instance = {
      id: `inst-${Math.random().toString(36).slice(2, 8)}`,
      name: `${workflowName} run ${instances.length + 1}`,
      workflowName,
      workflowVersion: version,
      currentStepId: firstStepId,
      status: firstStep?.type === "end" ? "Completed" : "Active",
      startedAt: new Date().toLocaleString(),
      priority: ["High", "Medium", "Low"][instances.length % 3],
      history: [
        makeHistoryEntry("Start", "instance started", "System", firstStep?.title || "End"),
      ],
    };

    setInstances((prev) => [instance, ...prev]);
    setSelectedInstanceId(instance.id);
    setViewMode("runtime");
    showMessage(`Started runtime simulation for ${instance.name}.`);
  }

  function advanceInstance(instanceId, action) {
    setInstances((prev) =>
      prev.map((instance) => {
        if (instance.id !== instanceId) return instance;
        if (instance.status !== "Active") return instance;

        const currentNode = getNodeById(instance.currentStepId);
        if (!currentNode) return instance;

        if (currentNode.type === "approval" && action === "reject") {
          return {
            ...instance,
            status: "Rejected",
            history: [
              ...instance.history,
              makeHistoryEntry(
                currentNode.title,
                "rejected",
                currentNode.role || "Approver",
                "Workflow stopped"
              ),
            ],
          };
        }

        const nextStepId = getNextStepId(currentNode, action);
        const nextNode = getNodeById(nextStepId);
        const nextStatus = !nextNode || nextNode.type === "end" ? "Completed" : "Active";

        return {
          ...instance,
          currentStepId: nextStepId,
          status: nextStatus,
          completedAt: nextStatus === "Completed" ? new Date().toLocaleString() : instance.completedAt,
          history: [
            ...instance.history,
            makeHistoryEntry(
              currentNode.title,
              action === "true"
                ? currentNode.trueLabel || "true"
                : action === "false"
                ? currentNode.falseLabel || "false"
                : action,
              currentNode.role || "System",
              nextNode?.title || "End"
            ),
          ],
        };
      })
    );
  }

  function resetSimulation() {
    setInstances([]);
    setSelectedInstanceId("");
    showMessage("Runtime simulation reset.");
  }

  const metrics = {
    total: instances.length,
    active: instances.filter((i) => i.status === "Active").length,
    completed: instances.filter((i) => i.status === "Completed").length,
    rejected: instances.filter((i) => i.status === "Rejected").length,
    inbox: activeTasks.length,
  };

  const runtimeCurrentNode = selectedInstance
    ? getNodeById(selectedInstance.currentStepId)
    : null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
        color: "#111827",
      }}
    >
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "16px",
            flexWrap: "wrap",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: "30px" }}>SYSTEMS MADE SIMPLE</h1>
            <p style={{ marginTop: "6px", color: "#475569" }}>
              System for Issue Highlight and Resolution
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <span style={badgeStyle("#f1f5f9", "#334155")}>Status: {status}</span>
            <span style={badgeStyle("#f1f5f9", "#334155")}>Version: {version}</span>
            <button style={buttonStyle(viewMode === "designer")} onClick={() => setViewMode("designer")}>
              Designer
            </button>
            <button style={buttonStyle(viewMode === "runtime")} onClick={() => setViewMode("runtime")}>
              Runtime
            </button>
          </div>
        </div>

        <div style={{ ...cardStyle(), marginBottom: "16px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 1fr",
              gap: "12px",
              alignItems: "end",
            }}
          >
            <div>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "14px" }}>
                Workflow name
              </label>
              <input
                style={inputStyle()}
                value={workflowName}
                onChange={(e) => {
                  setWorkflowName(e.target.value);
                  setStatus("Draft");
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "14px" }}>
                Version action
              </label>
              <button style={{ ...buttonStyle(false), width: "100%" }} onClick={newDraftVersion}>
                <RefreshCw size={16} /> New Draft
              </button>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "14px" }}>
                Runtime action
              </label>
              <button style={{ ...buttonStyle(true), width: "100%" }} onClick={createInstance}>
                <Play size={16} /> Start Instance
              </button>
            </div>

            <div
              style={{
                border: "1px dashed #cbd5e1",
                borderRadius: "14px",
                padding: "12px",
                fontSize: "14px",
                color: "#475569",
                background: "#fff",
              }}
            >
              {message}
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px", marginTop: "14px", flexWrap: "wrap" }}>
            <button style={buttonStyle(false)} onClick={copyJson}>
              {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
              {copied ? "Copied" : "Copy JSON"}
            </button>
            <button style={buttonStyle(true)} onClick={publishWorkflow}>
              <CheckCheck size={16} /> Publish Version
            </button>
            <button style={buttonStyle(false)} onClick={resetSimulation}>
              <RefreshCw size={16} /> Reset Simulation
            </button>
          </div>
        </div>

        {viewMode === "designer" ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "280px 1fr 420px",
              gap: "16px",
            }}
          >
            {/* Left panel */}
            <div style={cardStyle()}>
              <h3 style={{ marginTop: 0 }}>Node Library</h3>
              <p style={{ color: "#64748b", fontSize: "14px" }}>
                Add steps after the selected node
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                }}
              >
                {NODE_LIBRARY.map((item) => (
                  <motion.button
                    key={item.type}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => addNode(item.type)}
                    style={{
                      border: "1px solid #d1d5db",
                      borderRadius: "14px",
                      padding: "12px",
                      textAlign: "left",
                      background: item.color,
                      color: item.text,
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    <div>{item.label}</div>
                    <div style={{ fontSize: "12px", opacity: 0.75, marginTop: "4px" }}>
                      Click to add
                    </div>
                  </motion.button>
                ))}
              </div>

              <div
                style={{
                  marginTop: "16px",
                  border: "1px dashed #cbd5e1",
                  borderRadius: "14px",
                  padding: "12px",
                  fontSize: "13px",
                  color: "#475569",
                }}
              >
                <strong>Tip:</strong> This prototype supports workflow design, branching, and runtime
                simulation. Next, you can connect it to a database and real user authentication.
              </div>
            </div>

            {/* Canvas */}
            <div style={cardStyle()}>
              <h3 style={{ marginTop: 0 }}>Workflow Canvas</h3>
              <p style={{ color: "#64748b", fontSize: "14px" }}>
                Select a step to edit its properties
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {nodes.map((node, index) => {
                  const meta = getTypeMeta(node.type);
                  const selected = selectedNode?.id === node.id;
                  const nextTitle = nodes.find((x) => x.id === node.nextStepId)?.title;
                  const trueTitle = nodes.find((x) => x.id === node.trueNextStepId)?.title;
                  const falseTitle = nodes.find((x) => x.id === node.falseNextStepId)?.title;

                  return (
                    <div key={node.id} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <motion.div
                        whileHover={{ y: -1 }}
                        onClick={() => setSelectedId(node.id)}
                        style={{
                          width: "100%",
                          border: selected ? "2px solid #0f172a" : "1px solid #e5e7eb",
                          borderRadius: "18px",
                          padding: "16px",
                          background: "#fff",
                          cursor: "pointer",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                              <span style={badgeStyle(meta.color, meta.text)}>{meta.label}</span>
                              <span style={{ fontSize: "12px", color: "#64748b" }}>
                                Step {index + 1}
                              </span>
                            </div>

                            <div style={{ marginTop: "10px", fontSize: "18px", fontWeight: 600 }}>
                              {node.title}
                            </div>
                            <div style={{ marginTop: "6px", color: "#475569", fontSize: "14px" }}>
                              {node.description || "No description added yet."}
                            </div>

                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "10px" }}>
                              {!!node.role && (
                                <span style={badgeStyle("#f1f5f9", "#334155")}>Role: {node.role}</span>
                              )}
                              {!!node.estimatedHours && (
                                <span style={badgeStyle("#f1f5f9", "#334155")}>
                                  ETA: {node.estimatedHours}h
                                </span>
                              )}
                              {node.required && (
                                <span style={badgeStyle("#fef2f2", "#b91c1c")}>
                                  Required documents
                                </span>
                              )}
                              {!!node.condition && (
                                <span style={badgeStyle("#f5f3ff", "#6d28d9")}>
                                  Rule: {node.condition}
                                </span>
                              )}
                            </div>

                            {node.type === "decision" ? (
                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "1fr 1fr",
                                  gap: "10px",
                                  marginTop: "14px",
                                }}
                              >
                                <div
                                  style={{
                                    border: "1px solid #86efac",
                                    background: "#ecfdf5",
                                    borderRadius: "14px",
                                    padding: "10px",
                                    fontSize: "13px",
                                  }}
                                >
                                  <strong>{node.trueLabel} branch</strong>
                                  <div style={{ marginTop: "4px" }}>Goes to: {trueTitle || "Not set"}</div>
                                </div>
                                <div
                                  style={{
                                    border: "1px solid #fca5a5",
                                    background: "#fef2f2",
                                    borderRadius: "14px",
                                    padding: "10px",
                                    fontSize: "13px",
                                  }}
                                >
                                  <strong>{node.falseLabel} branch</strong>
                                  <div style={{ marginTop: "4px" }}>Goes to: {falseTitle || "Not set"}</div>
                                </div>
                              </div>
                            ) : node.type !== "end" ? (
                              <div
                                style={{
                                  marginTop: "14px",
                                  border: "1px solid #e5e7eb",
                                  background: "#f8fafc",
                                  borderRadius: "14px",
                                  padding: "10px",
                                  fontSize: "13px",
                                }}
                              >
                                Next step: {nextTitle || "Not set"}
                              </div>
                            ) : null}
                          </div>

                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <button style={buttonStyle(false)} onClick={(e) => { e.stopPropagation(); moveNode(node.id, "up"); }}>
                              <ArrowUp size={16} />
                            </button>
                            <button style={buttonStyle(false)} onClick={(e) => { e.stopPropagation(); moveNode(node.id, "down"); }}>
                              <ArrowDown size={16} />
                            </button>
                            {node.type !== "start" && node.type !== "end" && (
                              <button style={buttonStyle(false, true)} onClick={(e) => { e.stopPropagation(); removeNode(node.id); }}>
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>

                      {index < nodes.length - 1 && (
                        <ArrowDown size={20} style={{ color: "#94a3b8", marginTop: "8px" }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Properties */}
            <div style={cardStyle()}>
              <h3 style={{ marginTop: 0 }}>Step Properties</h3>
              <p style={{ color: "#64748b", fontSize: "14px" }}>
                Edit the selected step
              </p>

              {selectedNode && (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "6px", fontSize: "14px" }}>
                      Step title
                    </label>
                    <input
                      style={inputStyle()}
                      value={selectedNode.title}
                      onChange={(e) => updateNode(selectedNode.id, { title: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "6px", fontSize: "14px" }}>
                      Step type
                    </label>
                    <select
                      style={inputStyle()}
                      value={selectedNode.type}
                      onChange={(e) => updateNode(selectedNode.id, { type: e.target.value })}
                    >
                      {NODE_LIBRARY.map((item) => (
                        <option key={item.type} value={item.type}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "6px", fontSize: "14px" }}>
                      Assigned role
                    </label>
                    <select
                      style={inputStyle()}
                      value={selectedNode.role}
                      onChange={(e) => updateNode(selectedNode.id, { role: e.target.value })}
                    >
                      <option value="">No role</option>
                      {roles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "6px", fontSize: "14px" }}>
                      Description
                    </label>
                    <textarea
                      rows={4}
                      style={inputStyle()}
                      value={selectedNode.description}
                      onChange={(e) => updateNode(selectedNode.id, { description: e.target.value })}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "6px", fontSize: "14px" }}>
                        Estimated hours
                      </label>
                      <input
                        type="number"
                        style={inputStyle()}
                        value={selectedNode.estimatedHours}
                        onChange={(e) =>
                          updateNode(selectedNode.id, {
                            estimatedHours: Number(e.target.value || 0),
                          })
                        }
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", marginBottom: "6px", fontSize: "14px" }}>
                        Requires documents?
                      </label>
                      <select
                        style={inputStyle()}
                        value={selectedNode.required ? "yes" : "no"}
                        onChange={(e) =>
                          updateNode(selectedNode.id, {
                            required: e.target.value === "yes",
                          })
                        }
                      >
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "6px", fontSize: "14px" }}>
                      Condition / rule
                    </label>
                    <input
                      style={inputStyle()}
                      value={selectedNode.condition}
                      onChange={(e) => updateNode(selectedNode.id, { condition: e.target.value })}
                    />
                  </div>

                  {selectedNode.type === "decision" ? (
                    <div
                      style={{
                        border: "1px solid #c4b5fd",
                        background: "#f5f3ff",
                        borderRadius: "16px",
                        padding: "12px",
                      }}
                    >
                      <div style={{ fontWeight: 600, marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <GitBranch size={16} />
                        Branching settings
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        <div>
                          <label style={{ display: "block", marginBottom: "6px", fontSize: "14px" }}>
                            True label
                          </label>
                          <input
                            style={inputStyle()}
                            value={selectedNode.trueLabel}
                            onChange={(e) => updateNode(selectedNode.id, { trueLabel: e.target.value })}
                          />
                        </div>

                        <div>
                          <label style={{ display: "block", marginBottom: "6px", fontSize: "14px" }}>
                            False label
                          </label>
                          <input
                            style={inputStyle()}
                            value={selectedNode.falseLabel}
                            onChange={(e) => updateNode(selectedNode.id, { falseLabel: e.target.value })}
                          />
                        </div>
                      </div>

                      <div style={{ marginTop: "10px" }}>
                        <label style={{ display: "block", marginBottom: "6px", fontSize: "14px" }}>
                          True branch target
                        </label>
                        <select
                          style={inputStyle()}
                          value={selectedNode.trueNextStepId}
                          onChange={(e) => updateNode(selectedNode.id, { trueNextStepId: e.target.value })}
                        >
                          <option value="">Not set</option>
                          {allStepOptions.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div style={{ marginTop: "10px" }}>
                        <label style={{ display: "block", marginBottom: "6px", fontSize: "14px" }}>
                          False branch target
                        </label>
                        <select
                          style={inputStyle()}
                          value={selectedNode.falseNextStepId}
                          onChange={(e) => updateNode(selectedNode.id, { falseNextStepId: e.target.value })}
                        >
                          <option value="">Not set</option>
                          {allStepOptions.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : selectedNode.type !== "end" ? (
                    <div>
                      <label style={{ display: "block", marginBottom: "6px", fontSize: "14px" }}>
                        Next step
                      </label>
                      <select
                        style={inputStyle()}
                        value={selectedNode.nextStepId}
                        onChange={(e) => updateNode(selectedNode.id, { nextStepId: e.target.value })}
                      >
                        <option value="">Not set</option>
                        {allStepOptions.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}

                  <div
                    style={{
                      borderTop: "1px solid #e5e7eb",
                      paddingTop: "12px",
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: "8px" }}>Branch summary</div>
                    <div
                      style={{
                        border: "1px solid #e5e7eb",
                        background: "#f8fafc",
                        borderRadius: "14px",
                        padding: "10px",
                        maxHeight: "130px",
                        overflow: "auto",
                      }}
                    >
                      {branchingSummary.length ? (
                        branchingSummary.map((item) => (
                          <div
                            key={item.id}
                            style={{
                              border: "1px solid #e5e7eb",
                              background: "#fff",
                              borderRadius: "12px",
                              padding: "10px",
                              marginBottom: "8px",
                              fontSize: "13px",
                            }}
                          >
                            <div style={{ fontWeight: 600 }}>{item.title}</div>
                            <div style={{ marginTop: "4px" }}>Rule: {item.rule}</div>
                            <div style={{ marginTop: "4px" }}>Yes → {item.yesTarget}</div>
                            <div>No → {item.noTarget}</div>
                          </div>
                        ))
                      ) : (
                        <div style={{ fontSize: "13px", color: "#64748b" }}>
                          No decision nodes added yet.
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontWeight: 600, marginBottom: "8px" }}>Generated definition</div>
                    <textarea
                      readOnly
                      value={flowJson}
                      rows={14}
                      style={{
                        ...inputStyle(),
                        fontFamily: "monospace",
                        fontSize: "12px",
                        background: "#f8fafc",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "320px 1fr 340px", gap: "16px" }}>
            {/* Task Inbox */}
            <div style={cardStyle()}>
              <h3 style={{ marginTop: 0 }}>Task Inbox</h3>
              <p style={{ color: "#64748b", fontSize: "14px" }}>
                Pending tasks from active workflow runs
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                  marginBottom: "12px",
                }}
              >
                <div style={{ ...cardStyle(), padding: "12px", textAlign: "center" }}>
                  <div style={{ fontSize: "24px", fontWeight: 700 }}>{metrics.inbox}</div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>Open tasks</div>
                </div>
                <div style={{ ...cardStyle(), padding: "12px", textAlign: "center" }}>
                  <div style={{ fontSize: "24px", fontWeight: 700 }}>{metrics.active}</div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>Active runs</div>
                </div>
                <div style={{ ...cardStyle(), padding: "12px", textAlign: "center" }}>
                  <div style={{ fontSize: "24px", fontWeight: 700 }}>{metrics.completed}</div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>Completed</div>
                </div>
                <div style={{ ...cardStyle(), padding: "12px", textAlign: "center" }}>
                  <div style={{ fontSize: "24px", fontWeight: 700 }}>{metrics.rejected}</div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>Rejected</div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {activeTasks.length ? (
                  activeTasks.map((task) => {
                    const meta = getTypeMeta(task.stepType);
                    const selected = selectedInstanceId === task.instanceId;
                    return (
                      <button
                        key={`${task.instanceId}-${task.stepId}`}
                        onClick={() => setSelectedInstanceId(task.instanceId)}
                        style={{
                          border: selected ? "2px solid #0f172a" : "1px solid #e5e7eb",
                          borderRadius: "14px",
                          padding: "12px",
                          textAlign: "left",
                          background: "#fff",
                          cursor: "pointer",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                          <span style={badgeStyle(meta.color, meta.text)}>{meta.label}</span>
                          <span style={{ fontSize: "12px", color: "#64748b" }}>{task.priority}</span>
                        </div>
                        <div style={{ marginTop: "8px", fontWeight: 600 }}>{task.stepTitle}</div>
                        <div style={{ marginTop: "4px", fontSize: "12px", color: "#64748b" }}>
                          {task.instanceName}
                        </div>
                        <div style={{ marginTop: "6px", fontSize: "12px", color: "#475569" }}>
                          Assigned role: {task.assignedRole}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div
                    style={{
                      border: "1px dashed #cbd5e1",
                      borderRadius: "14px",
                      padding: "14px",
                      color: "#64748b",
                      fontSize: "14px",
                    }}
                  >
                    No open tasks yet. Start an instance to populate the inbox.
                  </div>
                )}
              </div>
            </div>

            {/* Runtime */}
            <div style={cardStyle()}>
              <h3 style={{ marginTop: 0 }}>Runtime Simulator</h3>
              <p style={{ color: "#64748b", fontSize: "14px" }}>
                Run the workflow and action steps
              </p>

              {selectedInstance ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div style={{ ...cardStyle(), padding: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                      <div>
                        <div style={{ fontSize: "18px", fontWeight: 700 }}>{selectedInstance.name}</div>
                        <div style={{ marginTop: "4px", fontSize: "14px", color: "#64748b" }}>
                          {selectedInstance.workflowName} · Version {selectedInstance.workflowVersion}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <span style={badgeStyle("#f1f5f9", "#334155")}>{selectedInstance.status}</span>
                        <span style={badgeStyle("#f1f5f9", "#334155")}>
                          Started: {selectedInstance.startedAt}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ ...cardStyle(), padding: "14px" }}>
                    <div style={{ fontWeight: 600, marginBottom: "8px" }}>Current step</div>

                    {runtimeCurrentNode ? (
                      <>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                          <span
                            style={badgeStyle(
                              getTypeMeta(runtimeCurrentNode.type).color,
                              getTypeMeta(runtimeCurrentNode.type).text
                            )}
                          >
                            {getTypeMeta(runtimeCurrentNode.type).label}
                          </span>
                          <span style={{ fontSize: "18px", fontWeight: 700 }}>
                            {runtimeCurrentNode.title}
                          </span>
                        </div>

                        <div style={{ marginTop: "8px", color: "#475569", fontSize: "14px" }}>
                          {runtimeCurrentNode.description || "No description for this step."}
                        </div>

                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "10px" }}>
                          {!!runtimeCurrentNode.role && (
                            <span style={badgeStyle("#f1f5f9", "#334155")}>
                              Role: {runtimeCurrentNode.role}
                            </span>
                          )}
                          {runtimeCurrentNode.required && (
                            <span style={badgeStyle("#fef2f2", "#b91c1c")}>Requires documents</span>
                          )}
                          {!!runtimeCurrentNode.condition && (
                            <span style={badgeStyle("#f5f3ff", "#6d28d9")}>
                              Rule: {runtimeCurrentNode.condition}
                            </span>
                          )}
                        </div>

                        {selectedInstance.status === "Active" ? (
                          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "14px" }}>
                            {runtimeCurrentNode.type === "decision" ? (
                              <>
                                <button
                                  style={buttonStyle(true)}
                                  onClick={() => advanceInstance(selectedInstance.id, "true")}
                                >
                                  <GitBranch size={16} /> Route {runtimeCurrentNode.trueLabel || "True"}
                                </button>
                                <button
                                  style={buttonStyle(false)}
                                  onClick={() => advanceInstance(selectedInstance.id, "false")}
                                >
                                  <GitBranch size={16} /> Route {runtimeCurrentNode.falseLabel || "False"}
                                </button>
                              </>
                            ) : runtimeCurrentNode.type === "approval" ? (
                              <>
                                <button
                                  style={buttonStyle(true)}
                                  onClick={() => advanceInstance(selectedInstance.id, "approve")}
                                >
                                  <CheckCheck size={16} /> Approve
                                </button>
                                <button
                                  style={buttonStyle(false, true)}
                                  onClick={() => advanceInstance(selectedInstance.id, "reject")}
                                >
                                  <XCircle size={16} /> Reject
                                </button>
                              </>
                            ) : (
                              <button
                                style={buttonStyle(true)}
                                onClick={() => advanceInstance(selectedInstance.id, "complete")}
                              >
                                <CheckCircle2 size={16} /> Complete Step
                              </button>
                            )}
                          </div>
                        ) : (
                          <div
                            style={{
                              marginTop: "14px",
                              border: "1px dashed #cbd5e1",
                              borderRadius: "14px",
                              padding: "12px",
                              fontSize: "14px",
                              color: "#64748b",
                            }}
                          >
                            This instance is {selectedInstance.status.toLowerCase()}.
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ color: "#64748b", fontSize: "14px" }}>
                        No current step available.
                      </div>
                    )}
                  </div>

                  <div style={{ ...cardStyle(), padding: "14px" }}>
                    <div style={{ fontWeight: 600, marginBottom: "8px" }}>Execution timeline</div>
                    <div
                      style={{
                        maxHeight: "340px",
                        overflow: "auto",
                        border: "1px solid #e5e7eb",
                        borderRadius: "14px",
                        background: "#f8fafc",
                        padding: "10px",
                      }}
                    >
                      {selectedInstance.history.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            border: "1px solid #e5e7eb",
                            background: "#fff",
                            borderRadius: "12px",
                            padding: "10px",
                            marginBottom: "8px",
                            fontSize: "14px",
                          }}
                        >
                          <div style={{ fontWeight: 600 }}>{item.stepTitle}</div>
                          <div style={{ marginTop: "4px", color: "#475569" }}>Action: {item.action}</div>
                          <div style={{ marginTop: "4px", color: "#475569" }}>Actor: {item.actor}</div>
                          <div style={{ marginTop: "4px", color: "#475569" }}>Next: {item.nextTitle}</div>
                          <div style={{ marginTop: "4px", fontSize: "12px", color: "#64748b" }}>
                            {item.time}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    border: "1px dashed #cbd5e1",
                    borderRadius: "14px",
                    padding: "18px",
                    color: "#64748b",
                  }}
                >
                  No runtime instance selected yet. Click <strong>Start Instance</strong>.
                </div>
              )}
            </div>

            {/* Instance List */}
            <div style={cardStyle()}>
              <h3 style={{ marginTop: 0 }}>Instance List</h3>
              <p style={{ color: "#64748b", fontSize: "14px" }}>
                All simulated workflow runs
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {instances.length ? (
                  instances.map((instance) => {
                    const currentNode = getNodeById(instance.currentStepId);
                    const selected =
                      selectedInstanceId === instance.id ||
                      (!selectedInstanceId && instances[0]?.id === instance.id);

                    return (
                      <button
                        key={instance.id}
                        onClick={() => setSelectedInstanceId(instance.id)}
                        style={{
                          border: selected ? "2px solid #0f172a" : "1px solid #e5e7eb",
                          borderRadius: "14px",
                          padding: "12px",
                          textAlign: "left",
                          background: "#fff",
                          cursor: "pointer",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                          <div style={{ fontWeight: 700 }}>{instance.name}</div>
                          <span style={badgeStyle("#f1f5f9", "#334155")}>{instance.status}</span>
                        </div>
                        <div style={{ marginTop: "6px", fontSize: "12px", color: "#64748b" }}>
                          Current step: {currentNode?.title || "End"}
                        </div>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px" }}>
                          <span style={badgeStyle("#f1f5f9", "#334155")}>
                            Priority: {instance.priority}
                          </span>
                          <span style={badgeStyle("#f1f5f9", "#334155")}>
                            History: {instance.history.length} events
                          </span>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div
                    style={{
                      border: "1px dashed #cbd5e1",
                      borderRadius: "14px",
                      padding: "14px",
                      color: "#64748b",
                      fontSize: "14px",
                    }}
                  >
                    No process instances yet. Use <strong>Start Instance</strong>.
                  </div>
                )}
              </div>

              <div
                style={{
                  marginTop: "14px",
                  border: "1px solid #e5e7eb",
                  background: "#f8fafc",
                  borderRadius: "14px",
                  padding: "12px",
                  fontSize: "13px",
                  color: "#475569",
                }}
              >
                <strong>How to test:</strong>
                <ul style={{ marginTop: "8px", paddingLeft: "18px" }}>
                  <li>Design or modify the workflow in Designer mode</li>
                  <li>Click <strong>Start Instance</strong></li>
                  <li>Open a task from the inbox</li>
                  <li>Approve, reject, or route branches</li>
                  <li>Check the execution history</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
