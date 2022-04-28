export function numeroALetras(cantidad, moneda) {
  var numero = 0;
  cantidad = filterNum(cantidad);
  cantidad = parseFloat(cantidad);

  if (cantidad == "0.00" || cantidad == "0") {
    return "CERO 00/100 ";
  } else {
    var ent = cantidad.toString().split(".");
    var arreglo = separar_split(ent[0]);
    var longitud = arreglo.length;

    switch (longitud) {
      case 1:
        numero = unidades(arreglo[0]);
        break;
      case 2:
        numero = decenas(arreglo[0], arreglo[1]);
        break;
      case 3:
        numero = centenas(arreglo[0], arreglo[1], arreglo[2]);
        break;
      case 4:
        numero = unidadesdemillar(
          arreglo[0],
          arreglo[1],
          arreglo[2],
          arreglo[3]
        );
        break;
      case 5:
        numero = decenasdemillar(
          arreglo[0],
          arreglo[1],
          arreglo[2],
          arreglo[3],
          arreglo[4]
        );
        break;
      case 6:
        numero = centenasdemillar(
          arreglo[0],
          arreglo[1],
          arreglo[2],
          arreglo[3],
          arreglo[4],
          arreglo[5]
        );
        break;
      case 7:
        numero = unidadesdemillon(
          arreglo[0],
          arreglo[1],
          arreglo[2],
          arreglo[3],
          arreglo[4],
          arreglo[5],
          arreglo[6]
        );
        break;
      case 8:
        numero = decenasdemillon(
          arreglo[0],
          arreglo[1],
          arreglo[2],
          arreglo[3],
          arreglo[4],
          arreglo[5],
          arreglo[6],
          arreglo[7]
        );
        break;
      case 9:
        numero = centenasdemillon(
          arreglo[0],
          arreglo[1],
          arreglo[2],
          arreglo[3],
          arreglo[4],
          arreglo[5],
          arreglo[6],
          arreglo[7],
          arreglo[8]
        );
        break;
      default:
        numero =
          "______________________________________________________________________";
        break;
    }

    ent[1] = isNaN(ent[1]) ? "00" : ent[1];

    if (cantidad == "1000000" && numero == "UN MILLÓN MIL ") {
      numero = "UN MILLÓN ";
    }

    var divisibleEntreUnMillon = parseInt(cantidad) % 1000000;

    if (divisibleEntreUnMillon == 0) {
      numero = numero.replace("MILLONES MIL", "MILLONES");
    }

    if (moneda) {
      if (cantidad == "1000000" && numero == "UN MILLÓN ") {
        numero = "UN MILLÓN DE";
      }
      if (divisibleEntreUnMillon == 0 && parseInt(cantidad) > 1000000) {
        numero = numero.replace("MILLONES", "MILLONES DE");
      }
      return numero + " " + moneda + " " + ent[1] + "/100";
    } else {
      return numero + ent[1] + "/100";
    }
  }
}

const filterNum = (str) => {
  const numericalChar = new Set([
    ".",
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
  ]);
  str = str
    .split("")
    .filter((char) => numericalChar.has(char))
    .join("");
  return str;
};

function unidades(unidad) {
  var unidades = Array(
    "UN ",
    "DOS ",
    "TRES ",
    "CUATRO ",
    "CINCO ",
    "SEIS ",
    "SIETE ",
    "OCHO ",
    "NUEVE "
  );

  return unidades[unidad - 1];
}

function decenas(decena, unidad) {
  var diez = Array(
    "ONCE ",
    "DOCE ",
    "TRECE ",
    "CATORCE ",
    "QUINCE",
    "DIECISEIS ",
    "DIECISIETE ",
    "DIECIOCHO ",
    "DIECINUEVE "
  );
  var decenas = Array(
    "DIEZ ",
    "VEINTE",
    "TREINTA",
    "CUARENTA",
    "CINCUENTA",
    "SESENTA",
    "SETENTA",
    "OCHENTA",
    "NOVENTA"
  );
  var veinte = "";

  if (decena == 0 && unidad == 0) {
    return "";
  }

  if (decena == 0 && unidad > 0) {
    return unidades(unidad);
  }

  if (decena == 1) {
    if (unidad == 0) {
      return decenas[decena - 1];
    } else {
      return diez[unidad - 1];
    }
  } else if (decena == 2) {
    if (unidad == 0) {
      return decenas[decena - 1];
    } else if (unidad == 1) {
      return (veinte = "VEINTE Y" + "UNO");
    } else {
      return (veinte = "VEINTE" + unidades(unidad));
    }
  } else {
    if (unidad == 0) {
      return decenas[decena - 1] + " ";
    }
    if (unidad == 1) {
      return decenas[decena - 1] + " Y " + "UNO ";
    }

    return decenas[decena - 1] + " Y " + unidades(unidad);
  }
}

function centenas(centena, decena, unidad) {
  var centenas = Array(
    "CIENTO ",
    "DOSCIENTOS ",
    "TRESCIENTOS ",
    "CUATROCIENTOS ",
    "QUINIENTOS ",
    "SEISCIENTOS ",
    "SETECIENTOS ",
    "OCHOCIENTOS ",
    "NOVECIENTOS "
  );

  if (centena == 0 && decena == 0 && unidad == 0) {
    return "";
  }
  if (centena == 1 && decena == 0 && unidad == 0) {
    return "CIEN ";
  }

  if (centena == 0 && decena == 0 && unidad > 0) {
    return unidades(unidad);
  }

  if (decena == 0 && unidad == 0) {
    return centenas[centena - 1] + "";
  }

  if (decena == 0) {
    var numero = centenas[centena - 1] + "" + decenas(decena, unidad);
    return numero.replace(" Y ", " ");
  }
  if (centena == 0) {
    return decenas(decena, unidad);
  }

  return centenas[centena - 1] + "" + decenas(decena, unidad);
}

function unidadesdemillar(unimill, centena, decena, unidad) {
  var numero = unidades(unimill) + "MIL " + centenas(centena, decena, unidad);
  numero = numero.replace("UN MIL ", "MIL ");
  if (unidad == 0) {
    return numero.replace(" Y ", " ");
  } else {
    return numero;
  }
}

function decenasdemillar(decemill, unimill, centena, decena, unidad) {
  var numero =
    decenas(decemill, unimill) + "MIL " + centenas(centena, decena, unidad);
  return numero;
}

function centenasdemillar(
  centenamill,
  decemill,
  unimill,
  centena,
  decena,
  unidad
) {
  var numero = 0;
  numero =
    centenas(centenamill, decemill, unimill) +
    "MIL " +
    centenas(centena, decena, unidad);

  return numero;
}

function unidadesdemillon(
  unimillon,
  centenamill,
  decemill,
  unimill,
  centena,
  decena,
  unidad
) {
  var numero =
    unidades(unimillon) +
    "MILLONES " +
    centenas(centenamill, decemill, unimill) +
    "MIL " +
    centenas(centena, decena, unidad);
  numero = numero.replace("UN MILLONES ", "UN MILLÓN ");
  if (unidad == 0) {
    return numero.replace(" Y ", " ");
  } else {
    return numero;
  }
}

function decenasdemillon(
  decemillon,
  unimillon,
  centenamill,
  decemill,
  unimill,
  centena,
  decena,
  unidad
) {
  var numero =
    decenas(decemillon, unimillon) +
    "MILLONES " +
    centenas(centenamill, decemill, unimill) +
    "MIL " +
    centenas(centena, decena, unidad);
  return numero;
}

function centenasdemillon(
  centenamillon,
  decemillon,
  unimillon,
  centenamill,
  decemill,
  unimill,
  centena,
  decena,
  unidad
) {
  var numero = 0;
  numero =
    centenas(centenamillon, decemillon, unimillon) +
    "MILLONES " +
    centenas(centenamill, decemill, unimill) +
    "MIL " +
    centenas(centena, decena, unidad);

  return numero;
}

function separar_split(texto) {
  var contenido = new Array();
  for (var i = 0; i < texto.length; i++) {
    contenido[i] = texto.substr(i, 1);
  }
  return contenido;
}
