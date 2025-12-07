import bot from "./bot";
import "./services/firebase"; // Инициализация Firebase
import * as http from "http";

const PORT = Number(process.env.PORT) || 3000;

// Создаем HTTP сервер ДО запуска бота, чтобы health check работал сразу
const server = http.createServer((req, res) => {
  // Обрабатываем health check на любом пути (для совместимости)
  const url = req.url || "/";
  if (url === "/health" || url === "/" || url.startsWith("/health")) {
    res.writeHead(200, { 
      "Content-Type": "text/plain",
      "Content-Length": "2"
    });
    res.end("OK");
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  }
});

// Запускаем сервер СРАЗУ на всех интерфейсах
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 Health check server listening on 0.0.0.0:${PORT}`);
  console.log(`✅ Health check available at http://0.0.0.0:${PORT}/health`);
});

// Обработка ошибок сервера
server.on("error", (error: any) => {
  console.error("❌ Server error:", error);
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use`);
  }
});

async function startBot() {
  try {
    // Запускаем бота
    if (process.env.TELEGRAM_BOT_TOKEN) {
      await bot.launch();
      console.log("🤖 Telegram bot started successfully!");
    } else {
      console.error("❌ TELEGRAM_BOT_TOKEN is not set!");
      // Не завершаем процесс, чтобы health check продолжал работать
    }
  } catch (error) {
    console.error("❌ Error starting bot:", error);
    // Не завершаем процесс, чтобы health check продолжал работать
  }
}

// Graceful shutdown
process.once("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully...");
  bot.stop("SIGINT");
  server.close(() => {
    process.exit(0);
  });
});

process.once("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully...");
  bot.stop("SIGTERM");
  server.close(() => {
    process.exit(0);
  });
});

// Запускаем бота после того, как сервер уже запущен
startBot();

