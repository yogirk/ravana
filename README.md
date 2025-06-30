![Ravana](ravana.png)

# Ravana AI Desktop App

Ravana is a cross-platform desktop application built with Electron that allows you to use multiple AI assistants like Gemini, ChatGPT, and Claude in a single, organized, tabbed interface. It currently supports Gemini, ChatGPT, Claude, NotebookLM, Meta AI, and Perplexity. 

In Indian mythology, Ravana's 10 heads are often interpreted as a symbol of his vast knowledge and wisdom. Ask your favourite LLM about Ravana to learn more :) 

## Features

- **Tabbed Interface**: Open each AI assistant in its own tab.
- **Full Tab Management**: Add, close, and reorder tabs with drag-and-drop.
- **Persistent Sessions**: Stay logged in to your services across app restarts.
- **Onboarding**: A simple first-time setup to choose your favorite AIs.
- **Light & Dark Themes**: Switch between themes to match your preference.
- **Cross-Platform**: Works on macOS, Windows, and Linux.

---

## How Authentication Works

### For End-Users (Distributed App)

If you download the final, packaged version of Ravana (e.g., the `.dmg` or `.exe` file), you do not need to do anything. The developer and his friend Gemini, who built the application have already bundled their credentials securely inside the app package. It will work out of the box.

### For Developers

This application requires Google OAuth credentials to function. The method for handling these keys differs between developing the app and distributing it.

If you clone this repository to work on the code, you **must** provide your own Google OAuth credentials.

1.  **Get Credentials**: Go to the [Google Cloud Console](https://console.cloud.google.com/) and create an **OAuth 2.0 Client ID** for a **Web application**. Make sure to add `http://localhost:3000/callback` as an **Authorized redirect URI**.
2.  **Create Config File**: In the project root, make a copy of `config.example.json` and rename it to `config.json`.
3.  **Add Your Keys**: Open your new `config.json` and paste your Client ID and Client Secret into the respective fields. This file is listed in `.gitignore`, so your keys will never be committed.
4.  **Install & Run**:
    ```bash
    # Install dependencies
    npm install

    # Run the app in development mode
    npm start
    ```
---

## Building for Distribution

When you are ready to create a distributable version of the app to share with others, ensure you have your `config.json` file created and filled out as described in the developer setup. Then, run the build command:

```bash
npm run dist
```
