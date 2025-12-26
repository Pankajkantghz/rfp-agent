import { getGeminiModel } from "../config/gemini.js";
import { Proposal } from "../models/Proposal.js";
import { Vendor } from "../models/Vendor.js";
import { Rfp } from "../models/Rfp.js";

export const generateStructuredRfp = async (req, res) => {
  try {
    const { prompt } = req.body;
    const model = getGeminiModel();
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Convert the following description into STRICT JSON format.
Fields: title, description, budget, deliveryTimeline, paymentTerms, warranty,
requirements: array of { item, quantity:number, details }.

⚠ Rules:
- quantity MUST always be a number. If quantity is not provided, set it to 0.
- Return ONLY raw JSON. No explanation, no markdown, no code block.

User description: ${prompt}`

            }
          ]
        }
      ]
    });
    const text = result.response.text();
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    const jsonString = text.slice(jsonStart, jsonEnd + 1);
    const parsed = JSON.parse(jsonString);
    res.json(parsed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to generate structured RFP", error: err.message });
  }
};

export const parseVendorEmail = async (req, res) => {
  try {
    console.log("BODY:", req.body);

    const { rfpId, vendorId, emailBody, rawEmailId } = req.body;
    const model = getGeminiModel();
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
             text: `Extract ONLY structured proposal data from this vendor email.
Output MUST be raw JSON with the fields:
price:number, currency, deliveryTimeline, paymentTerms, warranty,
otherTerms: array of { key, value }.

Rules:
- price MUST always be a number (remove symbols like ₹, $, commas).
- Return ONLY JSON. Do NOT add explanation, text, markdown or codeblock.

Email content: ${emailBody}`

            }
          ]
        }
      ]
    });
    const text = result.response.text();
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    const jsonString = text.slice(jsonStart, jsonEnd + 1);
    const parsed = JSON.parse(jsonString);

    const proposal = await Proposal.create({
      rfp: rfpId,
      vendor: vendorId,
      rawEmailId,
      ...parsed
    });

    res.status(201).json(proposal);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to parse vendor email", error: err.message });
  }
};

export const compareProposals = async (req, res) => {
  try {
    const { rfpId } = req.params;
    const proposals = await Proposal.find({ rfp: rfpId }).populate("vendor");
    const rfp = await Rfp.findById(rfpId);
    const model = getGeminiModel();

    const summaryPrompt = `
You are comparing vendor proposals for an RFP.
Return ONLY raw JSON with this exact structure:
{
  "proposals": [
    { "vendorId": string, "vendorName": string, "score": number, "summary": string }
  ],
  "recommendation": string
}

Scoring rules:
- Lower price = higher score
- Faster delivery = higher score
- Longer warranty = higher score
- Better terms = higher score

VendorId MUST match proposals[i].vendor._id.
VendorName MUST match proposals[i].vendor.name exactly.

RFP: ${JSON.stringify(rfp)}
Proposals: ${JSON.stringify(proposals)}
`;

    const result = await model.generateContent(summaryPrompt);
    const text = result.response.text();
    const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
    const parsed = JSON.parse(json);

    // Save AI score & summary into proposals
    for (const p of parsed.proposals || []) {
      const match = proposals.find(pr =>
        p.vendorId === String(pr.vendor._id) ||
        p.vendorName === pr.vendor.name
      );
      if (match) {
        match.aiScore = p.score;
        match.aiSummary = p.summary;
        await match.save();
      }
    }

    res.json(parsed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to compare proposals", error: err.message });
  }
};

