import { startServer } from "./modules/serverModule.js";

const server = startServer();
server.listen(3000, () => {
  console.log("Сервер запущен на 3000 порту");
});
