import express from "express";
import { fetchEmails } from "../controllers/emailController.js";

const router = express.Router();

router.get("/fetch", fetchEmails);

export default router;
