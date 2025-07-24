![Ravana](ravana.png)

# Ravana: An Integrated AI Services Hub

Ravana is a cross-platform desktop application built with Electron that allows you to use multiple AI assistants like Gemini, ChatGPT, and Claude in a single, organized, tabbed interface. It currently supports Gemini, ChatGPT, Claude, NotebookLM, Meta AI, and Perplexity. 

In Indian mythology, Ravana's 10 heads are often interpreted as a symbol of his vast knowledge and wisdom. Ask your favourite LLM about Ravana to learn more :) 

## Features

- **Tabbed Interface**: Open each AI assistant in its own tab.
- **Full Tab Management**: Add, remove, and reorder tabs with drag-and-drop.
- **Customizable Layouts**: Switch between a  top navigation bar and a sidebar basaed on your preference.
- **Persistent Sessions**: Stay logged in to your services across app restarts.
- **Onboarding**: A simple first-time setup to choose your favorite AI Assistants.
- **Light & Dark Themes**: Switch between themes to match your preference. Although, it's just a gimmick at this point. Not all apps support dark mode. 
- **Cross-Platform**: Works on macOS, Windows. 

---

### 🚀 Getting Started

### For End-Users 

Headover to [release](https://github.com/yogirk/ravana/releases) and download the latest `.dmg` or `.exe`

### For Developers

**Prerequisites**

To build and run this application, you need the following installed :
- Node.js (version 18 or later is recommended)
- npm

```bash
git clone https://github.com/yogirk/ravana.git
cd ravana
npm install
```
For development mode

```bash
npm start
```

## Building for Distribution

When you are ready to create a distributable version of the app to share with others, run the build command:

```bash
npm run dist
```
### 📁 Project Structure

```bash
ravana/
├── build/
│   └── icons/
│       └── icon.png        # Application icon for builds
├── src/
│   ├── assets/
│   │   └── logos/          # SVG logos for AI services
│   ├── css/
│   │   └── style.css       # All application styles and themes
│   ├── js/
│   │   ├── app.js          # Renderer process logic for the main application window
│   │   └── onboarding.js   # Renderer process logic for the settings/onboarding modal
│   ├── app.html            # Main application user interface
│   ├── onboarding.html     # Onboarding/Settings user interface
│   └── preload.js          # Secure bridge between the main and renderer processes
├── main.js                 # The Electron main process entry point
└── package.json            # Project metadata, dependencies, and build scripts
```

_This application was developed with the assistance of *Gemini*_.