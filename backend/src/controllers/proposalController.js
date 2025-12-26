import { Proposal } from "../models/Proposal.js";

export const getProposalsForRfp = async (req, res) => {
  try {
    const proposals = await Proposal.find({ rfp: req.params.rfpId }).populate("vendor");
    res.json(proposals);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch proposals" });
  }
};
