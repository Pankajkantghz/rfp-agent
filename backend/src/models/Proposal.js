import mongoose from "mongoose";

const termSchema = new mongoose.Schema({
  key: String,
  value: String
});

const proposalSchema = new mongoose.Schema(
  {
    rfp: { type: mongoose.Schema.Types.ObjectId, ref: "Rfp", required: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true },
    rawEmailId: String,
    price: Number,
    currency: { type: String, default: "USD" },
    deliveryTimeline: String,
    paymentTerms: String,
    warranty: String,
    otherTerms: [termSchema],
    aiScore: Number,
    aiSummary: String,
    aiRecommendation: String
  },
  { timestamps: true }
);

export const Proposal = mongoose.model("Proposal", proposalSchema);
