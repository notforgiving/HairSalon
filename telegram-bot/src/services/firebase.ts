import * as admin from "firebase-admin";
import * as dotenv from "dotenv";

dotenv.config();

if (!admin.apps.length) {
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!process.env.FIREBASE_PROJECT_ID || !privateKey || !process.env.FIREBASE_CLIENT_EMAIL) {
    throw new Error(
      "Missing Firebase configuration. Please set FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL environment variables."
    );
  }

  // Обработка приватного ключа
  // Убираем кавычки, если они есть
  privateKey = privateKey.trim();
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1);
  }
  if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
    privateKey = privateKey.slice(1, -1);
  }

  // Заменяем \n на реальные переносы строк
  privateKey = privateKey.replace(/\\n/g, "\n");

  // Убираем лишние пробелы в начале и конце каждой строки
  privateKey = privateKey
    .split("\n")
    .map((line) => line.trim())
    .join("\n");

  // Проверяем, что ключ начинается правильно
  if (!privateKey.includes("BEGIN PRIVATE KEY") || !privateKey.includes("END PRIVATE KEY")) {
    throw new Error(
      "Invalid FIREBASE_PRIVATE_KEY format. Key must include 'BEGIN PRIVATE KEY' and 'END PRIVATE KEY' markers."
    );
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: privateKey,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
    console.log("✅ Firebase Admin initialized successfully");
  } catch (error: any) {
    console.error("❌ Firebase initialization error:", error.message);
    throw new Error(`Failed to initialize Firebase: ${error.message}`);
  }
}

export const db = admin.firestore();

