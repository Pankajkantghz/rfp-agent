import { Rfp } from "../models/Rfp.js";
import { Vendor } from "../models/Vendor.js";
import { Proposal } from "../models/Proposal.js";
import { sendRfpEmails } from "../services/emailService.js";

export const createRfp = async (req, res) => {
  try {
    let payload = { ...req.body };

    // Convert budget string to Number: "$50,000" → 50000
    if (payload.budget && typeof payload.budget === "string") {
      payload.budget = Number(payload.budget.replace(/[^0-9.-]+/g, ""));
    }

    // 🛠 FIX: Normalize requirements
    if (payload.requirements && Array.isArray(payload.requirements)) {
      payload.requirements = payload.requirements.map(r => ({
        ...r,
        quantity: isNaN(Number(r.quantity)) ? 0 : Number(r.quantity) // <— key fix
      }));
    }

    const rfp = await Rfp.create(payload);
    res.status(201).json(rfp);
  } catch (err) {
    console.error(err);
    res.status(400).json({
      message: "Failed to create RFP",
      error: err.message
    });
  }
};



export const getRfps = async (req, res) => {
  try {
    const rfps = await Rfp.find().sort({ createdAt: -1 });
    res.json(rfps);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch RFPs" });
  }
};

export const getRfpById = async (req, res) => {
  try {
    const rfp = await Rfp.findById(req.params.id);
    if (!rfp) return res.status(404).json({ message: "RFP not found" });
    const proposals = await Proposal.find({ rfp: rfp._id }).populate("vendor");
    res.json({ rfp, proposals });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch RFP" });
  }
};

export const sendRfpToVendors = async (req, res) => {
  try {
    const { rfpId, vendorIds } = req.body;
    const rfp = await Rfp.findById(rfpId);
    if (!rfp) return res.status(404).json({ message: "RFP not found" });
    const vendors = await Vendor.find({ _id: { $in: vendorIds } });
    await sendRfpEmails(rfp, vendors);
    rfp.status = "sent";
    await rfp.save();
    res.json({ message: "RFP sent to vendors" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send RFP" });
  }
};
