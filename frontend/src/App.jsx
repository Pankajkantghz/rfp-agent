import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  generateStructuredRfp,
  createRfp,
  fetchRfps,
  clearGenerated
} from "./features/rfpSlice";
import { fetchVendors, createVendor } from "./features/vendorSlice";
import { fetchProposalsForRfp, compareProposals } from "./features/proposalSlice";

const App = () => {
  const dispatch = useDispatch();
  const rfps = useSelector((state) => state.rfps.items);
  const generated = useSelector((state) => state.rfps.generated);
  const vendors = useSelector((state) => state.vendors.items);
  const proposalsByRfp = useSelector((state) => state.proposals.byRfp);
  const comparison = useSelector((state) => state.proposals.comparison);

  const [prompt, setPrompt] = useState("");
  const [selectedRfpId, setSelectedRfpId] = useState(null);
  const [selectedVendors, setSelectedVendors] = useState([]);
  const [newVendor, setNewVendor] = useState({ name: "", email: "" });

  useEffect(() => {
    dispatch(fetchRfps());
    dispatch(fetchVendors());
  }, [dispatch]);

  const handleGenerate = () => {
    dispatch(generateStructuredRfp(prompt));
  };

  const handleSaveRfp = () => {
    if (generated) {
      dispatch(createRfp(generated));
    }
  };

  const handleCreateVendor = (e) => {
    e.preventDefault();
    if (!newVendor.name || !newVendor.email) return;
    dispatch(createVendor(newVendor));
    setNewVendor({ name: "", email: "" });
  };

  const handleLoadProposals = (rfpId) => {
    setSelectedRfpId(rfpId);
    dispatch(fetchProposalsForRfp(rfpId));
    dispatch(compareProposals(rfpId));
  };

  const handleSendRfp = async () => {
    if (!selectedRfpId || selectedVendors.length === 0) return;
    await fetch("http://localhost:5000/api/rfps/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rfpId: selectedRfpId,
        vendorIds: selectedVendors
      })
    });
    alert("RFP sent (check backend logs / email inbox).");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "sans-serif" }}>
      <div style={{ flex: 1, padding: "1rem", borderRight: "1px solid #ddd" }}>
        <h2>Create RFP (Gemini)</h2>
        <textarea
          rows={6}
          style={{ width: "100%", marginBottom: "0.5rem" }}
          placeholder="Describe what you want to buy, budget, delivery, terms..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <button onClick={handleGenerate}>Generate Structured RFP</button>

        {generated && (
          <div style={{ marginTop: "1rem" }}>
            <h3>Preview structured RFP</h3>
            <pre
              style={{
                background: "#f3f3f3",
                padding: "0.5rem",
                maxHeight: "200px",
                overflow: "auto"
              }}
            >
              {JSON.stringify(generated, null, 2)}
            </pre>
            <button onClick={handleSaveRfp}>Save RFP</button>
            <button onClick={() => dispatch(clearGenerated())}>Discard</button>
          </div>
        )}

        <h2 style={{ marginTop: "2rem" }}>Vendors</h2>
        <form onSubmit={handleCreateVendor} style={{ marginBottom: "1rem" }}>
          <input
            placeholder="Vendor name"
            value={newVendor.name}
            onChange={(e) => setNewVendor((v) => ({ ...v, name: e.target.value }))}
          />
          <input
            placeholder="Vendor email"
            value={newVendor.email}
            onChange={(e) => setNewVendor((v) => ({ ...v, email: e.target.value }))}
          />
          <button type="submit">Add Vendor</button>
        </form>
        <ul>
          {vendors.map((v) => (
            <li key={v._id}>
              <label>
                <input
                  type="checkbox"
                  value={v._id}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedVendors((prev) =>
                      e.target.checked ? [...prev, id] : prev.filter((x) => x !== id)
                    );
                  }}
                />{" "}
                {v.name} ({v.email})
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div style={{ flex: 1.2, padding: "1rem" }}>
        <h2>RFPs</h2>
        <ul>
          {rfps.map((r) => (
            <li key={r._id}>
              <button onClick={() => handleLoadProposals(r._id)}>{r.title}</button>
            </li>
          ))}
        </ul>

        <button
          style={{ marginTop: "0.5rem" }}
          disabled={!selectedRfpId || selectedVendors.length === 0}
          onClick={handleSendRfp}
        >
          Send selected RFP to checked vendors
        </button>

        {selectedRfpId && (
          <div style={{ marginTop: "1rem" }}>
            <h3>Proposals for selected RFP</h3>
            <pre
              style={{
                background: "#f3f3f3",
                padding: "0.5rem",
                maxHeight: "200px",
                overflow: "auto"
              }}
            >
              {JSON.stringify(proposalsByRfp[selectedRfpId] || [], null, 2)}
            </pre>
          </div>
        )}

        {comparison && (
          <div style={{ marginTop: "1rem" }}>
            <h3>AI Comparison</h3>
            <pre
              style={{
                background: "#f3f3f3",
                padding: "0.5rem",
                maxHeight: "200px",
                overflow: "auto"
              }}
            >
              {JSON.stringify(comparison, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
