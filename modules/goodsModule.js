import {
  addProduct,
  deleteProductById,
  getDiscountedGoods,
  getGoods,
  getGoodsByPage,
  getGoodsBySearch,
  getGoodsBySearchAndPage,
  getProductById,
  updateProductById,
} from "./databaseModule.js";
import { access, readFile } from "node:fs/promises";
import { readdir, unlink } from "node:fs";
import {
  NOT_FOUND_MESSAGE,
  SERVER_ERROR_MESSAGE,
  SUCCESS_ADD_MESSAGE,
  SUCCESS_DELETE_MESSAGE,
  INVALID_REQUEST_MESSAGE,
  IMAGE_FOLDER,
  corsHeaders,
} from "./responseModule.js";
import { endDatabaseServerError } from "./responseModule.js";

// получить список товаров
export const handleGoodsRequest = async (response, query) => {
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

// создать новый товар
export const handleAddProduct = async (request, response) => {
  try {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
    });

    request.on("end", async () => {
      const data = JSON.parse(body);

      if (typeof data.count === "string") {
        data.count = parseInt(data.count);
      }

      if (typeof data.price === "string") {
        data.price = parseFloat(data.price);
      }

      if (!data.discount) {
        data.discount = 0;
      } else {
        data.discount = parseFloat(data.discount);
      }

      delete data.discont;
      delete data.discount_count;

      let pathfile = "";

      if (data.image.startsWith("data:image")) {
        const format = data.image.match(/^data:image\/([a-z+]+);base64,/i)[1];

        if (["png", "svg+xml", "jpeg"].includes(format)) {
          pathfile = await loadImage(response, data.image, format, data.id);
        }
      }

      await addProduct({ ...data, image: pathfile });

      response.writeHead(200, {
        ...corsHeaders,
        "Content-Type": "application/json",
      });
      response.end(JSON.stringify({ message: SUCCESS_ADD_MESSAGE }));
    });
  } catch (error) {
    endDatabaseServerError(response);
  }
};

// получить информацию о товаре по его идентификатору
export const handleProductRequest = async (response, pathname) => {
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
export const handleUpdateProduct = async (request, response, pathname) => {
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

      if (!data.discount) {
        data.discount = 0;
      }

      if (data.image?.startsWith("data:image")) {
        const format = data.image.match(/^data:image\/([a-z+]+);base64,/i)[1];

        if (["png", "svg+xml", "jpeg"].includes(format)) {
          await loadImage(response, data.image, format, data.id);
        }
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
export const handleDeleteProduct = async (response, pathname) => {
  try {
    const id = pathname.split("/").at(-1);

    const goodsLengthBeforeDeleting = (await getGoods()).length;
    await deleteProductById(id);
    const goodsLengthAfterDeleting = (await getGoods()).length;

    if (goodsLengthAfterDeleting === goodsLengthBeforeDeleting) {
      response.writeHead(400, {
        ...corsHeaders,
        "Content-Type": "application/json",
      });
      response.end(JSON.stringify({ message: INVALID_REQUEST_MESSAGE }));
      return;
    }

    readdir(IMAGE_FOLDER, (err, files) => {
      files.forEach((file) => {
        if (file.split(".")[0] === id)
          unlink(IMAGE_FOLDER + "/" + file, (err) => {
            if (err) {
              console.log("Изображение у товара", id, "отсутствует");
            }
          });
      });
    });

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
export const handleDiscountedGoodsRequest = async (response) => {
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

// получить общую стоимость всех товаров
export const handleTotalRequest = async (response) => {
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

// получить изображение по идентификатору товара
export const handleImageRequest = async (response, pathname) => {
  try {
    const filename = pathname.split("/").at(-1);
    const imagePath = `${IMAGE_FOLDER}/${filename}`;

    try {
      await access(imagePath);
    } catch (error) {
      response.writeHead(400, {
        ...corsHeaders,
        "Content-Type": "application/json",
      });
      response.end(JSON.stringify({ message: INVALID_REQUEST_MESSAGE }));
      return;
    }

    const image = await readFile(imagePath);

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
