import http from "node:http";
import url from "node:url";
import {
  deleteProductById,
  getCategories,
  getDiscountedGoods,
  getGoods,
  getGoodsByCategory,
  getGoodsByPage,
  getGoodsBySearch,
  getGoodsBySearchAndPage,
  getProductById,
  updateProductById,
} from "./databaseModule.js";
import { readFile } from "node:fs/promises";

const NOT_FOUND_MESSAGE = "Не найдено";
const SERVER_ERROR_MESSAGE = "Внутренняя ошибка сервера";
const SUCCESS_ADD_MESSAGE = "Товар успешно добавлен";
const SUCCESS_DELETE_MESSAGE = "Товар успешно удален";
const SUCCESS_OPTIONS_MESSAGE = "Успешный предварительный запрос";
const INVALID_REQUEST_MESSAGE = "Неверный запрос";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Credentials": true,
  "Access-Control-Allow-Methods": "POST, PATCH, GET, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Origin, Content-Type, X-Auth-Token",
};

const endDatabaseServerError = (response) => {
  console.error("Ошибка при чтении данных из БД:", error.message);
  response.writeHead(500, {
    ...corsHeaders,
    "Content-Type": "application/json",
  });
  response.end(JSON.stringify({ message: SERVER_ERROR_MESSAGE }));
};

const handleGoodsRequest = async (response, query) => {
  try {
    let goods;

    if (query.search && query.page) {
      goods = await getGoodsBySearchAndPage(query.search, query.page);
    } else if (query.search) {
      goods = await getGoodsBySearch(query.search);
    } else if (query.page) {
      goods = await getGoodsByPage(query.page);
    } else {
      goods = await getGoods();
    }

    response.writeHead(200, {
      ...corsHeaders,
      "Content-Type": "application/json",
    });
    response.end(JSON.stringify({ goods }));
  } catch (error) {
    endDatabaseServerError(response);
  }
};

// получить информацию о товаре по его идентификатору
const handleProductRequest = async (response, pathname) => {
  try {
    const product = await getProductById(pathname.split("/").at(-1));

    if (product === undefined) {
      response.writeHead(404, {
        ...corsHeaders,
        "Content-Type": "application/json",
      });
      response.end(JSON.stringify({ message: NOT_FOUND_MESSAGE }));
      return;
    }

    response.writeHead(200, {
      ...corsHeaders,
      "Content-Type": "application/json",
    });
    response.end(JSON.stringify(product));
  } catch (error) {
    endDatabaseServerError(response);
  }
};

// изменить информацию о товаре по его идентификатору
const handleUpdateProduct = async (request, response, pathname) => {
  try {
    const id = pathname.split("/").at(-1);
    const product = await getProductById(id);

    if (product === undefined) {
      response.writeHead(400, {
        ...corsHeaders,
        "Content-Type": "application/json",
      });
      response.end(JSON.stringify({ message: INVALID_REQUEST_MESSAGE }));
      return;
    }

    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
    });

    request.on("end", async () => {
      const data = JSON.parse(body);
      if (data.discount === false) {
        data.discount = 0;
      }
      delete data.image;

      await updateProductById(id, data);
      response.writeHead(200, {
        ...corsHeaders,
        "Content-Type": "application/json",
      });
      response.end(JSON.stringify(await getProductById(id)));
    });
  } catch (error) {
    endDatabaseServerError(response);
  }
};

// удалить товар по его идентификатору
const handleDeleteProduct = async (response, pathname) => {
  try {
    const goodsLengthBeforeDeleting = (await getGoods()).length;
    await deleteProductById(pathname.split("/").at(-1));
    const goodsLengthAfterDeleting = (await getGoods()).length;

    if (goodsLengthAfterDeleting === goodsLengthBeforeDeleting) {
      response.writeHead(400, {
        ...corsHeaders,
        "Content-Type": "application/json",
      });
      response.end(JSON.stringify({ message: INVALID_REQUEST_MESSAGE }));
      return;
    }

    response.writeHead(200, {
      ...corsHeaders,
      "Content-Type": "application/json",
    });
    response.end(JSON.stringify({ message: SUCCESS_DELETE_MESSAGE }));
  } catch (error) {
    endDatabaseServerError(response);
  }
};

// получить список дисконтных товаров
const handleDiscountedGoodsRequest = async (response) => {
  try {
    const goods = await getDiscountedGoods();
    response.writeHead(200, {
      ...corsHeaders,
      "Content-Type": "application/json",
    });
    response.end(JSON.stringify({ goods }));
  } catch (error) {
    endDatabaseServerError(response);
  }
};

// получить список товаров по категории
const handleGoodsByCategoryRequest = async (response, pathname) => {
  try {
    const goods = await getGoodsByCategory(
      decodeURI(pathname.split("/").at(-1))
    );

    response.writeHead(200, {
      ...corsHeaders,
      "Content-Type": "application/json",
    });
    response.end(JSON.stringify(goods));
  } catch (error) {
    endDatabaseServerError(response);
  }
};

// получить список категорий товаров
const handleCategoriesRequest = async (response) => {
  try {
    const categories = (await getCategories()).map((item) => item.category);
    response.writeHead(200, {
      ...corsHeaders,
      "Content-Type": "application/json",
    });
    response.end(JSON.stringify(categories));
  } catch (error) {
    endDatabaseServerError(response);
  }
};

// получить общую стоимость всех товаров
const handleTotalRequest = async (response) => {
  try {
    const goods = await getGoods();
    const total = goods.reduce((sum, item) => sum + item.price * item.count, 0);
    response.writeHead(200, {
      ...corsHeaders,
      "Content-Type": "application/json",
    });
    response.end(JSON.stringify(total));
  } catch (error) {
    endDatabaseServerError(response);
  }
};

// получить ответ на предварительный запрос
const handlePreflightRequest = (response) => {
  response.writeHead(200, {
    ...corsHeaders,
    "Content-Type": "application/json",
  });
  response.end(JSON.stringify({ message: SUCCESS_OPTIONS_MESSAGE }));
};

// получить изображение по идентификатору товара
const handleImageRequest = async (response, pathname) => {
  try {
    const filename = pathname.split("/").at(-1);
    const image = await readFile("image/" + filename);

    response.writeHead(200, {
      ...corsHeaders,
      "Content-Type": "image/png",
    });
    response.end(image);
  } catch (error) {
    console.error("Ошибка при чтении изображения:", error.message);
    response.writeHead(500, {
      ...corsHeaders,
      "Content-Type": "application/json",
    });
    response.end(JSON.stringify({ message: SERVER_ERROR_MESSAGE }));
  }
};

export const startServer = () => {
  const server = http.createServer((request, response) => {
    const { pathname, query } = url.parse(request.url, true);

    if (
      pathname.startsWith("/api/goods/categories") &&
      request.method === "GET"
    ) {
      handleGoodsByCategoryRequest(response, pathname);
      return;
    }

    if (pathname.startsWith("/api/goods") && request.method === "GET") {
      if (!pathname.endsWith("goods") && !pathname.endsWith("goods/")) {
        handleProductRequest(response, pathname);
        return;
      }

      handleGoodsRequest(response, query);
      return;
    }

    if (pathname.startsWith("/api/goods") && request.method === "PATCH") {
      handleUpdateProduct(request, response, pathname);
      return;
    }

    if (pathname.startsWith("/api/goods") && request.method === "DELETE") {
      handleDeleteProduct(response, pathname);
      return;
    }

    if (pathname.startsWith("/api/discount") && request.method === "GET") {
      handleDiscountedGoodsRequest(response);
      return;
    }

    if (pathname.startsWith("/api/categories") && request.method === "GET") {
      handleCategoriesRequest(response);
      return;
    }

    if (pathname.startsWith("/api/total") && request.method === "GET") {
      handleTotalRequest(response);
      return;
    }

    if (pathname.startsWith("/image") && request.method === "GET") {
      handleImageRequest(response, pathname);
      return;
    }

    if (request.method === "OPTIONS") {
      handlePreflightRequest(response);
      return;
    }

    response.writeHead(404, { ...headers, "Content-Type": "application/json" });
    response.end(JSON.stringify({ message: NOT_FOUND_MESSAGE }));
  });

  return server;
};