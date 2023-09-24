import "dotenv/config";
import { default as Knex } from "knex";
import { attachPaginate } from "knex-paginate";

const DB = "goods";

const knex = Knex({
  client: "pg",
  connection: {
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
});

attachPaginate();

// knex('users').where('columnName', 'like', '%rowlikeme%')

// получить весь список товаров
export const getGoods = async () => await knex(DB);

// получить список товаров по поиску
export const getGoodsBySearch = async (search) =>
  await knex(DB).whereILike("title", `%${search}%`);

// получить список товаров по странице
export const getGoodsByPage = async (page) =>
  (await knex(DB).paginate({ perPage: 10, currentPage: page })).data;

// получить список товаров по поиску и странице
export const getGoodsBySearchAndPage = async (search, page) => {
  return (
    await knex(DB)
      .whereILike("title", `%${search}%`)
      .paginate({ perPage: 10, currentPage: page })
  ).data;
};

// создать новый товар
export const addProduct = async (product) => {
  await knex(DB).insert(product);
};

// получить информацию о товаре по его идентификатору
export const getProductById = async (id) =>
  await knex(DB).where({ id }).first();

// изменить информацию о товаре по его идентификатору
export const updateProductById = async (id, info) => {
  await knex(DB).where({ id }).update(info);
};

// удалить товар по его идентификатору
export const deleteProductById = async (id) => {
  await knex(DB).where({ id }).del();
};

// получить список дисконтных товаров
export const getDiscountedGoods = async () =>
  await knex(DB).whereNot("discount", 0);

// получить список товаров по категории
export const getGoodsByCategory = async (category) =>
  await knex(DB).whereILike("category", category);

// получить список категорий товаров
export const getCategories = async () => await knex(DB).distinct("category");
