import { extract } from "./extract.js";
import { transform } from "./transform.js";
import { arrayToCSV } from "./utils.js";

const data = await extract();
const { factPlanEvaluacion, factEvaluacion, factEstadoDeProveedores } =
  transform(data);

// console.log(factEstadoDeProveedores);

// Export to CSV files
console.log("📊 Exporting data to CSV files...");
arrayToCSV(factEstadoDeProveedores, "fact_estado_de_proveedores.csv");
console.log("✅ All exports completed!");
