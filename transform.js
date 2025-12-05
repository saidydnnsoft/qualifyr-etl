import { formatDate, generateRandomString } from "./utils.js";

function transform_dim_criterios_de_evaluacion(data) {
  const criterios = data.criterios_de_evaluacionArr;
  return criterios.map((criterio) => {
    return {
      id: criterio["Row ID"],
      nombre: criterio.nombre_criterio,
    };
  });
}

function transform_dim_obra(data) {
  const obras = data.obrasArr;
  return obras.map((obra) => {
    return {
      id: obra["Row ID"],
      nombre: obra.nombre_obra,
    };
  });
}

function transform_dim_corte_evaluacion(data) {
  const cortesDeEvaluacion = data.cortes_de_evaluacionArr;
  return cortesDeEvaluacion.map((corte) => {
    return {
      id: corte["Row ID"],
      id_fecha: formatDate(corte.fecha_corte),
    };
  });
}

function transform_dim_fecha(data) {
  const uniqueDateStrings = new Set();
  if (data.evaluacionesArr) {
    data.evaluacionesArr.forEach((e) => {
      if (e.fecha_evaluacion) {
        const formattedDate = formatDate(e.fecha_evaluacion);
        if (formattedDate) uniqueDateStrings.add(formattedDate);
      }
    });
  }

  if (data.cortes_de_evaluacionArr) {
    data.cortes_de_evaluacionArr.forEach((c) => {
      if (c.fecha_corte) {
        const formattedDate = formatDate(c.fecha_corte);
        if (formattedDate) uniqueDateStrings.add(formattedDate);
      }
    });
  }

  const days = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];
  const months = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  const dimDateRows = [];

  for (const dateStr of uniqueDateStrings) {
    if (!dateStr) continue;

    const dateObj = new Date(dateStr + "T00:00:00Z");

    const year = dateObj.getUTCFullYear();
    const month = dateObj.getUTCMonth() + 1;
    const day = dateObj.getUTCDate();
    const dayOfWeek = dateObj.getUTCDay();

    dimDateRows.push({
      id: dateStr,
      anio: year,
      num_mes: month,
      nombre_mes: months[month - 1],
      num_dia: day,
      num_dia_semana: dayOfWeek,
      nombre_dia: days[dayOfWeek],
      trimestre: `Q${Math.floor((month - 1) / 3) + 1}`,
    });
  }
  return dimDateRows;
}

function transform_dim_tipo_proveedor(data) {
  const tipos_de_proveedores = data.tipos_de_proveedoresArr;
  return tipos_de_proveedores.map((tipo) => {
    return {
      id: tipo["Row ID"],
      nombre: tipo.nombre_tipo_proveedor,
    };
  });
}

function transform_dim_proveedor(data) {
  const proveedores = data.proveedoresArr;
  return proveedores.map((proveedor) => {
    return {
      id: proveedor["Row ID"],
      nombre: proveedor.nombre_proveedor,
      id_tipo_proveedor: proveedor.id_tipo_proveedor,
    };
  });
}

function transform_dim_roles(data) {
  const roles = data.rolesArr;
  return roles.map((role) => {
    return {
      id: role["Row ID"],
      nombre: role.nombre_rol,
    };
  });
}

function transform_dim_usuarios(data) {
  const usuarios = data.usuariosArr;
  return usuarios.map((usuario) => {
    return {
      id: usuario["Row ID"],
      nombre: usuario.nombre_usuario,
      id_rol: usuario.id_rol,
    };
  });
}

export function transform_fact_planes_de_evaluacion(data) {
  const evaluacionesArr = data.evaluacionesArr;
  const planesDeEvaluacionArr = data.planes_de_evaluacionArr;
  const usuariosObrasArr = data.usuarios_obrasArr;
  const tiposProveedorRolCriterioArr = data.tipo_proveedor_rol_criterioArr;

  const cortesDeEvaluacionArr = data.cortes_de_evaluacionArr;
  const criteriosDeEvaluacionArr = data.criterios_de_evaluacionArr;
  const tipoProveedorCriteriosPuntajesArr =
    data.tipo_proveedor_criterios_puntajesArr;
  const proveedoresArr = data.proveedoresArr;

  const obrasUsuariosMap = new Map();
  usuariosObrasArr.forEach((ub) => {
    const obraId = ub.id_obra;
    const usuarioId = ub.id_usuario;
    if (!obrasUsuariosMap.has(obraId)) {
      obrasUsuariosMap.set(obraId, new Set());
    }
    obrasUsuariosMap.get(obraId).add(usuarioId);
  });

  const rolesMap = new Map(data.rolesArr.map((role) => [role["Row ID"], role]));

  const proveedoresMap = new Map(
    proveedoresArr.map((proveedor) => [proveedor["Row ID"], proveedor])
  );

  const criteriosDeEvaluacionMap = new Map(
    criteriosDeEvaluacionArr.map((criterio) => [
      criterio["Row ID"],
      criterio.nombre_criterio,
    ])
  );

  const tipoProveedorCriteriosPuntajesMap = new Map(
    tipoProveedorCriteriosPuntajesArr.map((tpcp) => [tpcp["Row ID"], tpcp])
  );

  const planesDeEvaluacionMap = new Map(
    planesDeEvaluacionArr.map((plan) => [plan["Row ID"], plan])
  );

  const tipoProveedorUsuariosMap = new Map();
  tiposProveedorRolCriterioArr.forEach((tprc) => {
    const tipoProveedorId = tprc.id_tipo_proveedor;
    const rolId = tprc.id_rol;
    const rol = rolesMap.get(rolId);
    const relatedUsuarios =
      rol["Related usuarios"]
        ?.split(",")
        .map((id) => id.trim())
        .filter((id) => id) ?? [];

    if (!tipoProveedorUsuariosMap.has(tipoProveedorId)) {
      tipoProveedorUsuariosMap.set(tipoProveedorId, new Set());
    }
    relatedUsuarios.forEach((userId) => {
      tipoProveedorUsuariosMap.get(tipoProveedorId).add(userId);
    });
  });

  const evaluacionesMap = new Map();
  evaluacionesArr.forEach((e) => {
    const llave = `${e.id_obra}-${e.id_proveedor}-${e.id_corte_evaluacion}`;
    if (!evaluacionesMap.has(llave)) evaluacionesMap.set(llave, new Set());
    evaluacionesMap.get(llave).add(e.evaluador);
  });

  const factPlanEvaluacion = [];
  const planesDeEvaluacionIdsMap = new Map();
  for (const corte of cortesDeEvaluacionArr) {
    const relatedPlanes =
      corte["Related planes_de_evaluacions"]
        ?.split(",")
        .map((id) => id.trim())
        .filter((id) => id) ?? [];

    for (const planId of relatedPlanes) {
      const plan = planesDeEvaluacionMap.get(planId);
      const proveedor = proveedoresMap.get(plan.id_proveedor);

      const tipoProveedorId = proveedor.id_tipo_proveedor;
      const obraId = plan.id_obra;
      const proveedorId = plan.id_proveedor;
      const usuarioIdsSegunObra = obrasUsuariosMap.get(obraId) || new Set();

      const usuarioIdsSegunTipoProveedor =
        tipoProveedorUsuariosMap.get(tipoProveedorId) || new Set();
      const usuariosIdsQueDebenCalificar = usuarioIdsSegunObra.intersection(
        usuarioIdsSegunTipoProveedor
      );

      usuariosIdsQueDebenCalificar.forEach((usuarioId) => {
        const llave = `${obraId}-${proveedorId}-${plan.id_corte_evaluacion}`;
        const id_plan_de_evaluacion = generateRandomString();
        const evaluacionRealizada =
          evaluacionesMap?.get(llave)?.has(usuarioId) ?? false;
        factPlanEvaluacion.push({
          id: id_plan_de_evaluacion,
          id_fuente: planId,
          id_corte_evaluacion: plan.id_corte_evaluacion,
          id_obra: plan.id_obra,
          id_proveedor: plan.id_proveedor,
          id_usuario: usuarioId,
          evaluacion_realizada: evaluacionRealizada,
        });

        planesDeEvaluacionIdsMap.set(
          `${obraId}-${proveedorId}-${plan.id_corte_evaluacion}-${usuarioId}`,
          id_plan_de_evaluacion
        );
      });
    }
  }

  const columnasConPuntajes = [
    "1_cumple_con_las_especificaciones_tecnicas",
    "2_entrega_oportuna_del_producto",
    "3_servicio_post-venta",
    "4_entrega_de_certificado_de_calidad",
    "5_cumple_con_las_especificaciones_tecnicas_del_servicio",
    "6_cumple_con_el_programa_de_obra",
    "7_ofrece_capacidad_de_respuesta_ante_las_solicitudes_de_los_clientes",
    "8_aporta_positivamente_a_la_solucion_de_problemas_en_el_proyecto",
    "9_cumple_oportunamente_con_la_documentación_solicitada_para_el_ingreso",
    "10_cumple_oportunamente_con_los_aportes_de_seguridad_social",
    "11_cumple_oportunamente_con_la_realización_de_examenes_ocupacionales",
    "12_participa_activamente_en_actividades_sst_inducciones_capacitaciones",
    "13_cumple_con_el_uso_de_los_elementos_de_proteccion_personal",
    "14_cumple _con_el_reporte_de_todas_las_novedades_del_personal",
    "15_cumple_con_los_reportes_de_accidentes_presentados",
    "16_cumple_oportunamente_con_los_registros_solicitados_del_sg-sst_y_ambiental",
    "17_cumple_con_las_especificaciones_tecnicas_de_los_materiales",
    "18_disponibilidad_del_material",
    "19_entregas_oportunas",
    "20_vigencia_de_licencias_que_apliquen",
    "21_programacion_y_ejecucion_de_los_trabajos_de_campo",
    "22_cumple_con_las_fechas_definidas_para_entrega_de_informes",
    "23_cumple_oportunamente_con_los_registros_solicitados_del_sg-sst_o_cert_calibr",
    "24_cumple_con_el_servicio_dentro_del_programa_establecido",
    "25_cumple_con_los_todos_los_permisos_o_licencias_requeridas",
    "26_continuidad_y_rendimiento_en_la_prestacion_del_servicio",
    "27_suministra_el_personal_competente_para_el_servicio_que_presta",
  ];

  const maximosPuntajesPorTipoProveedorIdCriterioId = new Map();
  Array.from(tipoProveedorCriteriosPuntajesMap.values()).forEach(
    (criterio_puntaje) => {
      const id_tipo_proveedor = criterio_puntaje.id_tipo_proveedor;
      const id_criterio = criterio_puntaje.id_criterio;
      if (!maximosPuntajesPorTipoProveedorIdCriterioId.has(id_tipo_proveedor)) {
        maximosPuntajesPorTipoProveedorIdCriterioId.set(
          id_tipo_proveedor,
          new Map()
        );
      }
      if (
        !maximosPuntajesPorTipoProveedorIdCriterioId
          .get(id_tipo_proveedor)
          .has(id_criterio)
      ) {
        maximosPuntajesPorTipoProveedorIdCriterioId
          .get(id_tipo_proveedor)
          .set(id_criterio, 0);
      }

      const puntaje = maximosPuntajesPorTipoProveedorIdCriterioId
        .get(id_tipo_proveedor)
        .get(id_criterio);

      maximosPuntajesPorTipoProveedorIdCriterioId
        .get(id_tipo_proveedor)
        .set(
          id_criterio,
          criterio_puntaje.puntaje > puntaje
            ? +criterio_puntaje.puntaje
            : puntaje
        );
    }
  );

  const factEvaluacion = [];
  for (const evaluacion of evaluacionesArr) {
    const llave = `${evaluacion.id_obra}-${evaluacion.id_proveedor}-${evaluacion.id_corte_evaluacion}-${evaluacion.evaluador}`;

    if (!planesDeEvaluacionIdsMap.get(llave)) {
      planesDeEvaluacionIdsMap.set(llave, generateRandomString());
    }

    const planId = planesDeEvaluacionIdsMap.get(llave);
    const proveedor = proveedoresMap.get(evaluacion.id_proveedor);
    const tipoProveedorId = proveedor.id_tipo_proveedor;

    const objetosPuntajes = Object.entries(evaluacion)
      .filter(([columna, valor]) => {
        return columnasConPuntajes.includes(columna) && valor !== "";
      })
      .map(([columna, valor]) => {
        const puntajeData = tipoProveedorCriteriosPuntajesMap.get(valor);
        if (!puntajeData) {
          console.warn(`⚠️ Missing puntaje data for valor: ${valor}`);
          return null;
        }
        const puntaje = +puntajeData.puntaje;
        const criterioId = puntajeData.id_criterio;

        return {
          criterioId,
          puntaje,
        };
      })
      .filter(obj => obj !== null);

    objetosPuntajes.forEach((objetoPuntaje) => {
      const criterioId = objetoPuntaje.criterioId;
      const puntaje = objetoPuntaje.puntaje;
      const maximoPuntaje = maximosPuntajesPorTipoProveedorIdCriterioId
        .get(tipoProveedorId)
        .get(criterioId);

      factEvaluacion.push({
        id: generateRandomString(),
        id_fuente: evaluacion["Row ID"],
        id_plan_evaluacion: planId,
        id_criterio: criterioId,
        id_evaluador: evaluacion.evaluador,
        puntaje: puntaje,
        maximo_puntaje: maximoPuntaje,
        id_fecha_evaluacion: formatDate(evaluacion.fecha_evaluacion),
      });
    });
  }

  return {
    factPlanEvaluacion,
    factEvaluacion,
  };
}

export function transform(data) {
  const dimCriterio = transform_dim_criterios_de_evaluacion(data);
  const dimCorteEvaluacion = transform_dim_corte_evaluacion(data);
  const dimObra = transform_dim_obra(data);
  const dimFecha = transform_dim_fecha(data);
  const dimTipoProveedor = transform_dim_tipo_proveedor(data);
  const dimProveedor = transform_dim_proveedor(data);
  const dimRol = transform_dim_roles(data);
  const dimUsuario = transform_dim_usuarios(data);
  const { factPlanEvaluacion, factEvaluacion } =
    transform_fact_planes_de_evaluacion(data);

  return {
    dimCriterio,
    dimCorteEvaluacion,
    dimObra,
    dimFecha,
    dimTipoProveedor,
    dimProveedor,
    dimRol,
    dimUsuario,
    factPlanEvaluacion,
    factEvaluacion,
  };
}
