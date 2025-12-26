import { fetchVendorEmails } from "../services/emailService.js";

export const fetchEmails = async (req, res) => {
  try {
    const emails = await fetchVendorEmails();
    res.json(emails);
    console.log("Fetched vendor emails:", emails);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch emails", error: err.message });
  }
};


