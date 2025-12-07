import bot from "./bot";
import "./services/firebase"; // Инициализация Firebase
import * as http from "http";

const PORT = process.env.PORT || 3000;

async function startBot() {
  try {
    // Запускаем бота
    if (process.env.TELEGRAM_BOT_TOKEN) {
      await bot.launch();
      console.log("🤖 Telegram bot started successfully!");
      
      // Простой HTTP сервер для health checks (требуется некоторыми платформами)
      const server = http.createServer((req, res) => {
        if (req.url === "/health") {
          res.writeHead(200, { "Content-Type": "text/plain" });
          res.end("OK");
        } else {
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end("Not Found");
        }
      });

      server.listen(PORT, () => {
        console.log(`🌐 Health check server listening on port ${PORT}`);
      });
      
      // Graceful shutdown
      process.once("SIGINT", () => {
        bot.stop("SIGINT");
        server.close();
      });
      process.once("SIGTERM", () => {
        bot.stop("SIGTERM");
        server.close();
      });
    } else {
      console.error("❌ TELEGRAM_BOT_TOKEN is not set!");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Error starting bot:", error);
    process.exit(1);
  }
}

startBot();

