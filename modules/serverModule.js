import http from "node:http";
import url from "node:url";
import {
  handleCategoriesRequest,
  handleGoodsByCategoryRequest,
} from "./categoryModule.js";
import {
  handleAddProduct,
  handleDeleteProduct,
  handleDiscountedGoodsRequest,
  handleGoodsRequest,
  handleImageRequest,
  handleProductRequest,
  handleTotalRequest,
  handleUpdateProduct,
} from "./goodsModule.js";
import { NOT_FOUND_MESSAGE, handlePreflightRequest } from "./responseModule.js";
import { corsHeaders } from "./responseModule.js";

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

    if (pathname.startsWith("/api/goods") && request.method === "POST") {
      handleAddProduct(request, response);
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

    response.writeHead(404, {
      ...corsHeaders,
      "Content-Type": "application/json",
    });
    response.end(JSON.stringify({ message: NOT_FOUND_MESSAGE }));
  });

  return server;
};
