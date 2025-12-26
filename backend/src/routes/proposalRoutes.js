import express from "express";
import { getProposalsForRfp } from "../controllers/proposalController.js";

const router = express.Router();

router.get("/rfp/:rfpId", getProposalsForRfp);

export default router;
