const express = require("express");
const axios = require("axios");
const router = express.Router();

/**
 * Execute user code using Piston API
 */
router.post("/", async (req, res) => {
  try {
    const { language, code, stdin } = req.body;

    if (!language || !code) {
      return res.status(400).json({ message: "Language and code are required" });
    }

    const runtimes = {
      javascript: { lang: "javascript", version: "18.15.0" },
      python: { lang: "python", version: "3.10.0" },
      cpp: { lang: "cpp", version: "10.2.0" },
      java: { lang: "java", version: "15.0.2" },
      html: { lang: "html", version: "latest" },
    };

    const runtime = runtimes[language];
    if (!runtime) {
      return res.status(400).json({ message: "Unsupported language" });
    }

    const payload = {
      language: runtime.lang,
      version: runtime.version,
      files: [{ content: code }],
      stdin: stdin || "",   // 🔥 ADD SUPPORT FOR INPUT
    };

    const response = await axios.post(
      "https://emkc.org/api/v2/piston/execute",
      payload,
      { timeout: 20000 }
    );

    const result = response.data;

    return res.json({
      output: result.run?.output || "",
      error: result.run?.stderr || "",
      language: runtime.lang,
    });
  } catch (err) {
    console.error("Run error:", err.response?.data || err.message);
    res.status(500).json({
      message: err.response?.data?.message || "Execution failed",
    });
  }
});

module.exports = router;
