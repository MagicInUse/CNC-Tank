import { sendConsoleMessageToClients } from '../server.js';

export const ConsoleContext = {
    messages: [],
    addMessage(type, message) {
        const msg = { type, message, timestamp: new Date() };
        this.messages.push(msg);
        console.log(`[${type.toUpperCase()}] ${message}`);
        sendConsoleMessageToClients(msg);
    }
};