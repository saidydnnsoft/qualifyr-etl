import axios from "axios";

async function extractOne(tableName, appSheetConfig, retries = 3) {
  const url = `https://${appSheetConfig.appsheetRegion}/api/v2/apps/${appSheetConfig.appId}/tables/${tableName}/Action`;
  const payload = { Action: "Find" };

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const { data } = await axios.post(url, payload, {
        headers: {
          ApplicationAccessKey: appSheetConfig.appKey,
          "Content-Type": "application/json",
        },
      });
      if (attempt > 0) {
        console.log(`✅ ${tableName} succeeded after ${attempt} retries`);
      }
      return data;
    } catch (err) {
      const is429 = err.response?.status === 429;
      const isLastAttempt = attempt === retries;

      if (is429 && !isLastAttempt) {
        const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff: 1s, 2s, 4s
        console.warn(`⚠️ Rate limited on ${tableName}, retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      console.error(
        `❌ Error extracting from ${tableName}:`,
        err.response?.data || err.message
      );
      return [];
    }
  }
}

export async function extract() {
  const appSheetConfig = {
    appKey: process.env.APP_KEY,
    appId: process.env.APP_ID,
    appsheetRegion: "www.appsheet.com",
  };

  const tableConfigs = [
    { name: "proveedores", asMap: false },
    { name: "tipos_de_proveedores", asMap: false },
    { name: "usuarios", asMap: false },
    { name: "roles", asMap: false },
    { name: "cortes_de_evaluacion", asMap: false },
    { name: "planes_de_evaluacion", asMap: false },
    { name: "obras", asMap: false },
    { name: "tipo_proveedor_rol_criterio", asMap: false },
    { name: "evaluaciones", asMap: false },
    { name: "tipo_proveedor_criterios_puntajes", asMap: false },
    { name: "criterios_de_evaluacion", asMap: false },
    { name: "usuarios_obras", asMap: false },
  ];

  const data = [];
  for (const { name } of tableConfigs) {
    data.push(await extractOne(name, appSheetConfig));
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2s delay between requests
  }

  const successCount = data.filter(d => d.length > 0).length;
  console.log(`📊 Extracted ${successCount}/${tableConfigs.length} tables successfully`);

  const tables = {};
  tableConfigs.forEach(({ name, asMap }, i) => {
    if (asMap) {
      tables[`${name}Map`] = new Map(
        data[i].map((row) => [row["Row ID"], row])
      );
    } else {
      tables[`${name}Arr`] = data[i];
    }
  });

  return tables;
}
