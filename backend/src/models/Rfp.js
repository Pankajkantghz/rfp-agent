import mongoose from "mongoose";

const requirementSchema = new mongoose.Schema({
  item: String,
  quantity: Number,
  details: String
});

const rfpSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    budget: Number,
    deliveryTimeline: String,
    paymentTerms: String,
    warranty: String,
    requirements: [requirementSchema],
    status: { type: String, default: "draft" }
  },
  { timestamps: true }
);

export const Rfp = mongoose.model("Rfp", rfpSchema);
