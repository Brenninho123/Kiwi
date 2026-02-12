import makeWASocket, { useSingleFileAuthState, DisconnectReason } from "baileys";
import { Boom } from "@hapi/boom";
import qrcode from "qrcode-terminal";
import fs from "fs";

const SESSIONS_PATH = "./sessions";
if (!fs.existsSync(SESSIONS_PATH)) fs.mkdirSync(SESSIONS_PATH);

const { state, saveState } = useSingleFileAuthState(`${SESSIONS_PATH}/auth_info.json`);

const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
});

sock.ev.on("creds.update", saveState);

sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
        console.log("Scan the QR code below to connect:");
        qrcode.generate(qr, { small: true });
    }

    if (connection === "close") {
        const reason = (lastDisconnect.error instanceof Boom ? lastDisconnect.error.output.statusCode : null);
        console.log("Connection closed. Reason:", reason);
        if (reason !== DisconnectReason.loggedOut) {
            startBot(); // reconectar
        }
    } else if (connection === "open") {
        console.log("✅ Bot connected!");
    }
});

sock.ev.on("messages.upsert", async (msg) => {
    const message = msg.messages[0];
    if (!message.message || message.key.fromMe) return;

    const from = message.key.remoteJid;
    const text = message.message.conversation || message.message.extendedTextMessage?.text;

    console.log(`Received message from ${from}: ${text}`);

    // Simple command
    if (text?.toLowerCase() === "ping") {
        await sock.sendMessage(from, { text: "Pong!" });
    } else if (text?.toLowerCase() === "hello") {
        await sock.sendMessage(from, { text: "Hi there! I'm Kiwi bot." });
    }
});

function startBot() {
    console.log("Starting Kiwi bot...");
}