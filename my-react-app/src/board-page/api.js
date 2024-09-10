// api.js
const headers = new Headers({ "ngrok-skip-browser-warning": "true" });
export const fetchResultsCount = async (pageNumber, pageSize, queryParameters, routeParameters) => {
  const urlParams = new URLSearchParams({
    ...queryParameters,
    ...routeParameters,
    page: pageNumber,
    pageSize,
  });

  const response = await fetch(`/api/v1/search/count?${urlParams}`, {
    headers,
  });
  return response.json();
};

const gradesCache = new Map();

export const fetchGrades = async (boardName) => {
  if (gradesCache.has(boardName)) {
    return gradesCache.get(boardName);
  }

  const response = await fetch(`/api/v1/grades/${boardName}`, { headers });
  const data = await response.json();

  gradesCache.set(boardName, data);

  return data;
};

const anglesCache = new Map();

export const fetchAngles = async (boardName, layout) => {
  const cacheKey = `${boardName}_${layout}`
  if (anglesCache.has(cacheKey)) {
    return anglesCache.get(cacheKey);
  }

  const response = await fetch(`/api/v1/angles/${boardName}/${layout}`, { headers });
  const data = (await response.json()).flat();

  anglesCache.set(cacheKey, data);

  return data;
};

export const fetchResults = async (pageNumber, pageSize, queryParameters, routeParameters) => {
  const urlParams = new URLSearchParams({
    ...queryParameters,
    ...routeParameters,
    page: pageNumber,
    pageSize,
  });

  const response = await (await fetch(`/api/v1/search?${urlParams}`, { headers })).json();

  return response.map((row) => ({
    uuid: row[0],
    setter: row[1],
    name: row[2],
    instructions: row[3],
    holds: row[4],
    angle: row[5],
    ascents: row[6],
    grade: row[7],
    gradeAdjustment: `${row[9]}`.replace("0.", "."),
    stars: Math.round(row[8] * 100) / 100,
    mystery2: row[10],
  }));
};

export const fetchBetaCount = async (board, uuid) => {
  const response = await fetch(`/api/v1/${board}/beta/${uuid}`, { headers });
  return response.json().length;
};

export const fetchBoardDetails = async (board, layout, size, set_ids) => {
  const apiUrl = `/api/v1/get_board_details/${board}/${layout}/${size}/${set_ids}`;
  const response = await fetch(apiUrl, { headers });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};
