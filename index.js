const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys")

const TelegramBot = require("node-telegram-bot-api")
const P = require("pino")

// ================================
// CHANGE THIS → TELEGRAM BOT TOKEN
// ================================
const TELEGRAM_TOKEN = "AAEvFc1KDCyTQog_MWQt6HR3msCm2oq0UJw"

// ================================
// CHANGE THIS → YOUR TELEGRAM ID
// ================================
const OWNER_ID = "7679183468"

// ================================
// START TELEGRAM BOT
// ================================
const bot = new TelegramBot(TELEGRAM_TOKEN, {
  polling: true
})

async function startBot() {

  const { state, saveCreds } = await useMultiFileAuthState("auth_info")

  const sock = makeWASocket({
    logger: P({ level: "silent" }),
    auth: state,
    printQRInTerminal: true
  })

  sock.ev.on("creds.update", saveCreds)

  // ================================
  // CONNECTION UPDATE
  // ================================
  sock.ev.on("connection.update", async (update) => {

    const { connection, lastDisconnect } = update

    if (connection === "close") {

      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut

      console.log("Connection closed")

      if (shouldReconnect) {
        startBot()
      }

    } else if (connection === "open") {

      console.log("WhatsApp Bot Connected")

      bot.sendMessage(
        OWNER_ID,
        "✅ WhatsApp Bot Connected Successfully"
      )
    }
  })

  // ================================
  // WHATSAPP MESSAGE LISTENER
  // ================================
  sock.ev.on("messages.upsert", async ({ messages }) => {

    const msg = messages[0]

    if (!msg.message) return

    const sender = msg.key.remoteJid

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text

    console.log("Message:", text)

    // ================================
    // AUTO REPLY
    // ================================
    if (text === "hi") {

      await sock.sendMessage(sender, {
        text: "Hello 👋 Bot is active"
      })
    }

    // ================================
    // SEND MESSAGE LOG TO TELEGRAM
    // ================================
    bot.sendMessage(
      OWNER_ID,
      `📩 New Message\n\nFrom: ${sender}\nMessage: ${text}`
    )
  })

  // ================================
  // TELEGRAM COMMAND
  // TYPE: /say hello
  // ================================
  bot.onText(/\/say (.+)/, async (msg, match) => {

    const chatId = msg.chat.id

    if (chatId.toString() !== OWNER_ID) {
      return bot.sendMessage(chatId, "❌ Not Authorized")
    }

    const text = match[1]

    // ================================
    // CHANGE THIS → TARGET NUMBER
    // ================================
    const number = "2347077674518@s.whatsapp.net"

    await sock.sendMessage(number, {
      text: text
    })

    bot.sendMessage(chatId, "✅ Message Sent")
  })
}

startBot()
