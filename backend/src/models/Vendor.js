import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: String,
    company: String,
    notes: String
  },
  { timestamps: true }
);

export const Vendor = mongoose.model("Vendor", vendorSchema);
