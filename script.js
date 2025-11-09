import { API_KEY } from "./config.js";
const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

// Load chat history from localStorage
const savedChat = localStorage.getItem("chatHistory");
if (savedChat) {
    chatBox.innerHTML = savedChat;
    chatBox.scrollTop = chatBox.scrollHeight;
}

function addMessage(message, className) {
    const msgDiv = document.createElement("div");
    msgDiv.classList.add("message", className);
    // If message is an object with 'text' property (from API), use that, otherwise use message directly
    msgDiv.textContent = typeof message === 'object' ? message.text : message;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function showTyping() {
    const typingDiv = document.createElement("div");
    typingDiv.classList.add("message", "bot-message", "typing");
    typingDiv.textContent = "Typing...";
    chatBox.appendChild(typingDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    return typingDiv;
}

async function getBotReply(userMessage) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: userMessage
                    }]
                }]
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.error("API Error:", data);
            throw new Error(data?.error?.message || "An error occurred while fetching the bot reply.");
        }

        const botReply = data?.candidates?.[0]?.content?.parts?.[0];
        if (!botReply) {
            throw new Error("No response from the bot");
        }

        return botReply;
    } catch (error) {
        console.error("Error:", error);
        throw error;
    }
}

async function handleSendMessage() {
    const message = userInput.value.trim();
    if (message === "") return;

    try {
        // Add user message and clear input
        addMessage(message, "user-message");
        userInput.value = "";
        userInput.disabled = true;
        sendBtn.disabled = true;

        // Show typing indicator
        const typingDiv = showTyping();

        // Get bot response
        const botReply = await getBotReply(message);
        
        // Remove typing indicator and show response
        typingDiv.remove();
        addMessage(botReply, "bot-message");

        // Save to localStorage
        localStorage.setItem("chatHistory", chatBox.innerHTML);
    } catch (error) {
        // If typing indicator exists, remove it
        const typingDiv = document.querySelector(".typing");
        if (typingDiv) typingDiv.remove();
        
        // Show error message
        addMessage("Sorry, I encountered an error. Please try again.", "bot-message");
    } finally {
        // Re-enable input
        userInput.disabled = false;
        sendBtn.disabled = false;
        userInput.focus();
    }
}

// Event Listeners
sendBtn.onclick = handleSendMessage;

userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey && !userInput.disabled) {
        e.preventDefault();
        handleSendMessage();
    }
});
