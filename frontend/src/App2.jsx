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

const App2 = () => {
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
    if (generated) dispatch(createRfp(generated));
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
      body: JSON.stringify({ rfpId: selectedRfpId, vendorIds: selectedVendors })
    });
    alert("RFP sent");
  };

  const handleFetchEmails = async () => {
    await fetch("http://localhost:5000/api/email/fetch");
    alert("Emails fetched");
  };

  return (
    <div className="flex min-h-screen font-sans">

      {/* LEFT SIDE */}
      <div className="flex-1 p-6 border-r border-gray-300">
        <h2 className="text-xl font-semibold mb-3">Create RFP (Gemini)</h2>

        {/* FIXED HEIGHT TEXTAREA */}
        <textarea
          className="w-full max-w-full h-32 resize-none border border-gray-300 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Describe what you want to buy, budget, delivery, terms..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />

        <button
          onClick={handleGenerate}
          className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          Generate Structured RFP
        </button>

        {generated && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Preview structured RFP</h3>
            <pre className="bg-gray-100 border border-gray-300 p-2 rounded text-xs overflow-auto max-h-[350px]">
              {JSON.stringify(generated, null, 2)}
            </pre>

            <div className="mt-3 flex gap-2">
              <button
                onClick={handleSaveRfp}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                Save RFP
              </button>
              <button
                onClick={() => dispatch(clearGenerated())}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        <h2 className="text-xl font-semibold mt-8 mb-2">Vendors</h2>

        <form
          onSubmit={handleCreateVendor}
          className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center"
        >
          <input
            placeholder="Vendor name"
            value={newVendor.name}
            onChange={(e) => setNewVendor((v) => ({ ...v, name: e.target.value }))}
            className="border border-gray-300 rounded px-2 py-1 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            placeholder="Vendor email"
            value={newVendor.email}
            onChange={(e) => setNewVendor((v) => ({ ...v, email: e.target.value }))}
            className="border border-gray-300 rounded px-2 py-1 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            Add Vendor
          </button>
        </form>

        <ul className="space-y-1 text-sm">
          {vendors.map((v) => (
            <li key={v._id}>
              <label
                className={`flex items-center gap-2 p-1 rounded cursor-pointer 
                  ${selectedVendors.includes(v._id) ? "bg-blue-50" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={selectedVendors.includes(v._id)}
                  value={v._id}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedVendors((prev) =>
                      e.target.checked ? [...prev, id] : prev.filter((x) => x !== id)
                    );
                  }}
                />
                {v.name} ({v.email})
              </label>
            </li>
          ))}
        </ul>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex-1 p-6">
        <h2 className="text-xl font-semibold mb-3">RFPs</h2>

        <ul className="space-y-1 mb-3">
          {rfps.map((r) => (
            <li key={r._id}>
              <button
                onClick={() => handleLoadProposals(r._id)}
                className={`text-sm px-2 py-1 rounded 
                  ${
                    selectedRfpId === r._id
                      ? "bg-blue-600 text-white"
                      : "text-blue-700 hover:underline"
                  }`}
              >
                {r.title}
              </button>
            </li>
          ))}
        </ul>

        {/* Action buttons */}
        <div className="flex gap-2 mt-2">
          <button
            disabled={!selectedRfpId || selectedVendors.length === 0}
            onClick={handleSendRfp}
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700"
          >
            Send selected RFP
          </button>

          <button
            onClick={handleFetchEmails}
            className="px-4 py-2 bg-orange-600 text-white text-sm rounded hover:bg-orange-700"
          >
            Fetch Emails
          </button>
        </div>

        {selectedRfpId && (
          <div className="mt-5">
            <h3 className="font-semibold mb-2 text-sm">Proposals</h3>
            <pre className="bg-gray-100 border border-gray-300 p-2 rounded text-xs overflow-auto max-h-[350px]">
              {JSON.stringify(proposalsByRfp[selectedRfpId] || [], null, 2)}
            </pre>
          </div>
        )}

        {comparison && (
          <div className="mt-5">
            <h3 className="font-semibold mb-2 text-sm">AI Comparison</h3>
            <pre className="bg-gray-100 border border-gray-300 p-2 rounded text-xs overflow-auto max-h-[350px]">
              {JSON.stringify(comparison, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default App2;
