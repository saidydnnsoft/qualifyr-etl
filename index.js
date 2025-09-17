import { http } from "@google-cloud/functions-framework";
import { extract } from "./extract.js";
import { transform } from "./transform.js";
import { loadAll } from "./load.js";

http("runEtl", async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }
  try {
    console.log("🚀 Extracting data...");
    const data = await extract();
    console.log("✅ Extraction complete.");

    console.log("🚀 Transforming data...");
    const transformedData = transform(data);
    console.log("✅ Transformation complete.");

    console.log("🚀 Loading data...");
    await loadAll(transformedData);
    console.log("✅ Load complete.");

    res.send("✅ ETL complete!");
  } catch (error) {
    console.error("❌ ETL failed:", error.message);
    if (error.stack) console.error(error.stack);
    if (error.errors) {
      error.errors.forEach((err) =>
        console.error(
          `BQ Error: ${err.message}, Reason: ${err.reason}, Location: ${err.location}`
        )
      );
    }
    res.status(500).send(`ETL failed: ${error.message}`);
  }
});
