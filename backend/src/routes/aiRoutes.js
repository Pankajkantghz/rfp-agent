import express from "express";
import { generateStructuredRfp, parseVendorEmail, compareProposals } from "../controllers/aiController.js";

const router = express.Router();

router.post("/rfp-structure", generateStructuredRfp);
router.post("/parse-vendor-email", parseVendorEmail);
router.get("/compare/:rfpId", compareProposals);

export default router;
