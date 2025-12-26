import express from "express";
import { createRfp, getRfps, getRfpById, sendRfpToVendors } from "../controllers/rfpController.js";

const router = express.Router();

router.post("/", createRfp);
router.get("/", getRfps);
router.get("/:id", getRfpById);
router.post("/send", sendRfpToVendors);

export default router;
