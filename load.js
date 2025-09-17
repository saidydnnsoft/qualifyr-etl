import { BigQuery } from "@google-cloud/bigquery";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

async function loadTableData(bq, datasetId, tableId, rows) {
  if (!rows || rows.length === 0) {
    console.log(`ℹ️ No rows to load into ${datasetId}.${tableId}. Skipping.`);
    return;
  }
  if (!datasetId || !tableId) {
    const errorMessage = `Missing datasetId or tableId for loading. Dataset: ${datasetId}, Table: ${tableId}. Skipping.`;
    console.error(`❌ ${errorMessage}`);
    throw new Error(errorMessage);
  }

  const table = bq.dataset(datasetId).table(tableId);
  const tmpFileName = `data-${tableId.replace(/_/g, "-")}-${Date.now()}.ndjson`;
  const tmpFile = path.join(os.tmpdir(), tmpFileName);

  fs.writeFileSync(tmpFile, rows.map((r) => JSON.stringify(r)).join("\n"));

  const metadata = {
    sourceFormat: "NEWLINE_DELIMITED_JSON",
    writeDisposition: "WRITE_TRUNCATE",
  };

  let job;

  try {
    [job] = await table.load(tmpFile, metadata);
    console.log(
      `🚀 Load job for ${tableId} (ID: ${job.id}) initiated. Checking initial status...`
    );

    if (job?.status?.errors) {
      console.error(
        `❌ Load job ${job.id} for ${tableId} reported errors upon initiation:`
      );
      job.status.errors.forEach((err) =>
        console.error(
          `  Message: ${err.message}, Reason: ${err.reason}, Location: ${err.location}`
        )
      );
      const errorMessages = job.status.errors
        .map(
          (e) => `${e.reason}: ${e.message} (Location: ${e.location || "N/A"})`
        )
        .join("; ");
      throw new Error(
        `BigQuery load for ${tableId} (Job ID: ${job.id}) failed with errors: ${errorMessages}`
      );
    }

    if (job?.status?.state === "DONE") {
      console.log(
        `✅ BigQuery load job ${job.id} for ${datasetId}.${tableId} reported as DONE immediately.`
      );
    } else {
      console.warn(
        `⚠️ Load job ${job.id} for ${tableId} initiated. Current state: ${
          job?.status?.state || "UNKNOWN"
        }. Full status:`,
        job?.status
      );
    }
  } catch (error) {
    const jobIdInfo = job?.id ? `(Job ID: ${job.id}) ` : "(Job ID: UNKNOWN) ";
    console.error(
      `❌ Error during BigQuery load initiation for ${datasetId}.${tableId} ${jobIdInfo}: ${error.message}`
    );
    if (error.errors) {
      error.errors.forEach((err) =>
        console.error(`  API Error Detail: ${err.message}`)
      );
    }
    throw error;
  } finally {
    try {
      if (fs.existsSync(tmpFile)) {
        fs.unlinkSync(tmpFile);
      }
    } catch (unlinkErr) {
      console.warn(`⚠️ Failed to delete temp file ${tmpFile}:`, unlinkErr);
    }
  }
}

export async function loadAll(transformedData) {
  const datasetId = process.env.DATASET_ID;
  if (!datasetId) {
    throw new Error("DATASET_ID environment variable must be set.");
  }
  const bq = new BigQuery();

  // Define table IDs from environment variables
  const tableIds = {
    dim_criterio: process.env.DIM_CRITERIO_TABLE_ID,
    dim_corte_evaluacion: process.env.DIM_CORTE_EVALUACION_TABLE_ID,
    dim_obra: process.env.DIM_OBRA_TABLE_ID,
    dim_fecha: process.env.DIM_FECHA_TABLE_ID,
    dim_tipo_proveedor: process.env.DIM_TIPO_PROVEEDOR_TABLE_ID,
    dim_proveedor: process.env.DIM_PROVEEDOR_TABLE_ID,
    dim_rol: process.env.DIM_ROL_TABLE_ID,
    dim_usuario: process.env.DIM_USUARIO_TABLE_ID,
    fact_plan_evaluacion: process.env.FACT_PLAN_EVALUACION_TABLE_ID,
    fact_evaluacion: process.env.FACT_EVALUACION_TABLE_ID,
  };

  // Validate all table IDs are present
  for (const key in tableIds) {
    if (!tableIds[key]) {
      console.warn(
        `⚠️ Environment variable for ${key.toUpperCase()}_TABLE_ID is not set. Skipping this table.`
      );
    }
  }

  // Load dimensions first
  if (tableIds.dim_criterio)
    await loadTableData(
      bq,
      datasetId,
      tableIds.dim_criterio,
      transformedData.dimCriterio
    );
  if (tableIds.dim_corte_evaluacion)
    await loadTableData(
      bq,
      datasetId,
      tableIds.dim_corte_evaluacion,
      transformedData.dimCorteEvaluacion
    );
  if (tableIds.dim_obra)
    await loadTableData(
      bq,
      datasetId,
      tableIds.dim_obra,
      transformedData.dimObra
    );
  if (tableIds.dim_fecha)
    await loadTableData(
      bq,
      datasetId,
      tableIds.dim_fecha,
      transformedData.dimFecha
    );
  if (tableIds.dim_tipo_proveedor)
    await loadTableData(
      bq,
      datasetId,
      tableIds.dim_tipo_proveedor,
      transformedData.dimTipoProveedor
    );
  if (tableIds.dim_proveedor)
    await loadTableData(
      bq,
      datasetId,
      tableIds.dim_proveedor,
      transformedData.dimProveedor
    );
  if (tableIds.dim_rol)
    await loadTableData(
      bq,
      datasetId,
      tableIds.dim_rol,
      transformedData.dimRol
    );
  if (tableIds.dim_usuario)
    await loadTableData(
      bq,
      datasetId,
      tableIds.dim_usuario,
      transformedData.dimUsuario
    );

  // Load fact tables
  if (
    tableIds.fact_plan_evaluacion &&
    transformedData.factPlanEvaluacion &&
    transformedData.factPlanEvaluacion.length > 0
  ) {
    await loadTableData(
      bq,
      datasetId,
      tableIds.fact_plan_evaluacion,
      transformedData.factPlanEvaluacion
    );
  }
  if (
    tableIds.fact_evaluacion &&
    transformedData.factEvaluacion &&
    transformedData.factEvaluacion.length > 0
  ) {
    await loadTableData(
      bq,
      datasetId,
      tableIds.fact_evaluacion,
      transformedData.factEvaluacion
    );
  }

  console.log("✅ All loading tasks initiated.");
}
