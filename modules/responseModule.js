import { access, writeFile } from "node:fs/promises";

export const NOT_FOUND_MESSAGE = "Не найдено";
export const SERVER_ERROR_MESSAGE = "Внутренняя ошибка сервера";
export const SUCCESS_ADD_MESSAGE = "Товар успешно добавлен";
export const SUCCESS_DELETE_MESSAGE = "Товар успешно удален";
export const SUCCESS_OPTIONS_MESSAGE = "Успешный предварительный запрос";
export const INVALID_REQUEST_MESSAGE = "Неверный запрос";

export const IMAGE_FOLDER = "image";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Credentials": true,
  "Access-Control-Allow-Methods": "POST, PATCH, GET, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Origin, Content-Type, X-Auth-Token",
};

export const endDatabaseServerError = (response) => {
  console.error("Ошибка при чтении данных из БД:", error.message);
  response.writeHead(500, {
    ...corsHeaders,
    "Content-Type": "application/json",
  });
  response.end(JSON.stringify({ message: SERVER_ERROR_MESSAGE }));
};

export const loadImage = async (response, base64, format, id) => {
  try {
    await access(IMAGE_FOLDER);
  } catch (error) {
    if (error.code === "ENOENT") {
      await mkdir(IMAGE_FOLDER);
      console.log("Папка", IMAGE_FOLDER, "создана");
    } else {
      console.error(
        "Ошибка при открытии папки с изображениями:",
        error.message
      );
      response.writeHead(500, {
        ...corsHeaders,
        "Content-Type": "application/json",
      });
      response.end(JSON.stringify({ message: SERVER_ERROR_MESSAGE }));
      return;
    }
  }

  const ext = format === "svg+xml" ? "svg" : format === "jpeg" ? "jpg" : format;

  const base64Image = base64.split(";base64,")[1];
  const filename = `${id}.${ext}`;
  const pathfile = `${IMAGE_FOLDER}/${filename}`;

  await writeFile(pathfile, base64Image, { encoding: "base64" });
  return pathfile;
};

// получить ответ на предварительный запрос
export const handlePreflightRequest = (response) => {
  response.writeHead(200, {
    ...corsHeaders,
    "Content-Type": "application/json",
  });
  response.end(JSON.stringify({ message: SUCCESS_OPTIONS_MESSAGE }));
};
