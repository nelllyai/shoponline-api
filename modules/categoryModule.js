import { getCategories, getGoodsByCategory } from "./databaseModule.js";
import { corsHeaders } from "./responseModule.js";
import { endDatabaseServerError } from "./responseModule.js";

// получить список товаров по категории
export const handleGoodsByCategoryRequest = async (response, pathname) => {
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
export const handleCategoriesRequest = async (response) => {
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
