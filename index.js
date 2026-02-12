import makeWASocket, { useSingleFileAuthState, DisconnectReason } from "baileys";
import { Boom } from "@hapi/boom";
import qrcode from "qrcode-terminal";

const { state, saveState } = useSingleFileAuthState("./sessions/auth_info.json");

const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
});

sock.ev.on("creds.update", saveState);

sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
        qrcode.generate(qr, { small: true });
    }

    if (connection === "close") {
        const reason = (lastDisconnect.error as Boom)?.output?.statusCode;
        console.log("Connection closed. Reason:", reason);
        if (reason !== DisconnectReason.loggedOut) {
            startBot(); // reconectar
        }
    } else if (connection === "open") {
        console.log("✅ Bot conectado!");
    }
});

// Mensagens recebidas
sock.ev.on("messages.upsert", async (msg) => {
    const message = msg.messages[0];
    if (!message.message || message.key.fromMe) return;

    const from = message.key.remoteJid;
    const text = message.message.conversation || message.message.extendedTextMessage?.text;

    if (text?.toLowerCase() === "ping") {
        await sock.sendMessage(from, { text: "Pong!" });
    }
});

function startBot() {
    console.log("Iniciando bot...");
}