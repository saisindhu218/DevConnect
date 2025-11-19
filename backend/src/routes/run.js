const express = require("express");
const axios = require("axios");
const router = express.Router();

/**
 * Execute user code using the Piston API (emkc.org)
 * Docs: https://github.com/engineer-man/piston
 *
 * POST /api/run
 * body: { language: "python"|"javascript"|..., code: "..." }
 */
router.post("/", async (req, res) => {
  try {
    const { language, code } = req.body;

    if (!language || !code) {
      return res.status(400).json({ message: "Language and code are required" });
    }

    // Map languages to supported Piston runtimes and versions
    const runtimes = {
      javascript: { lang: "javascript", version: "18.15.0" },
      python: { lang: "python", version: "3.10.0" },
      cpp: { lang: "cpp", version: "10.2.0" },
      java: { lang: "java", version: "15.0.2" },
      html: { lang: "html", version: "latest" }, // placeholder - not executed
    };

    const runtime = runtimes[language];
    if (!runtime) {
      return res.status(400).json({ message: "Unsupported language" });
    }

    // Send request to the Piston execution API
    const response = await axios.post("https://emkc.org/api/v2/piston/execute", {
      language: runtime.lang,
      version: runtime.version,
      files: [{ content: code }],
    }, {
      // optional: increase timeout for longer running programs (ms)
      timeout: 20 * 1000
    });

    const result = response.data;

    return res.json({
      output: result.run?.output || "",
      language: runtime.lang,
    });
  } catch (err) {
    console.error("Run error:", err.response?.data || err.message);
    res.status(500).json({ message: err.response?.data?.message || "Execution failed" });
  }
});

module.exports = router;
