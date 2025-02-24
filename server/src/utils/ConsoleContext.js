export const ConsoleContext = {
    messages: [],
    addMessage(type, message) {
        this.messages.push({ type, message });
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
};