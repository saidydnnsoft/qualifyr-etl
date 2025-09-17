import axios from "axios";

async function extractOne(tableName, appSheetConfig) {
  const url = `https://${appSheetConfig.appsheetRegion}/api/v2/apps/${appSheetConfig.appId}/tables/${tableName}/Action`;
  const payload = { Action: "Find" };

  try {
    const { data } = await axios.post(url, payload, {
      headers: {
        ApplicationAccessKey: appSheetConfig.appKey,
        "Content-Type": "application/json",
      },
    });
    return data;
  } catch (err) {
    console.error(
      `❌ Error extracting from ${tableName}:`,
      err.response?.data || err.message
    );
    return [];
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

  const data = await Promise.all(
    tableConfigs.map(({ name }) => extractOne(name, appSheetConfig))
  );

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
