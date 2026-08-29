# 🎮 Skyrim Latest Mods Tracker

A live web app that displays the latest published mods for Skyrim and Fallout with auto-refresh capabilities.

## Features

✨ **Live Updates** - Display the newest published mods from Bethesda.net

🔄 **Auto-Refresh** - Automatically refresh every 30 seconds, 1 minute, or 5 minutes

🎮 **Multi-Platform** - Filter by platform (PC, Xbox One, PlayStation 4)

🕹️ **Multi-Game** - Support for Skyrim and Fallout 4

📊 **Mod Statistics** - View downloads, favorites, and publication dates

🌐 **Fully Responsive** - Works on desktop, tablet, and mobile devices

⚡ **Fast & Lightweight** - Pure HTML/CSS/JavaScript, no heavy dependencies

## Live Demo

🌍 Visit: [https://mahdy47hd-jpg.github.io/skyrim-latest-mods-tracker/](https://mahdy47hd-jpg.github.io/skyrim-latest-mods-tracker/)

## Usage

1. **Select Game** - Choose between Skyrim or Fallout 4
2. **Choose Platform** - Pick PC, Xbox One, or PlayStation 4
3. **Set Auto-Refresh** - Enable automatic refreshing at your preferred interval
4. **Browse Mods** - Click on any mod card to view it on Bethesda.net
5. **Manual Refresh** - Click the "Refresh Now" button anytime

## How It Works

- Fetches latest mods from Bethesda's API
- Displays up to 50 of the newest published mods
- Shows mod name, author, description, downloads, favorites, and publication date
- Auto-refreshes at user-selected intervals
- Responsive design works on all screen sizes

## Technical Stack

- **HTML5** - Semantic markup
- **CSS3** - Modern styling with animations
- **JavaScript (ES6+)** - Fetch API, async/await
- **GitHub Pages** - Hosting

## API

This app uses the Bethesda.net public API endpoint:
```
https://bethesda.net/api/magiclinks/v2/magiclinks
```

Parameters:
- `game` - `skyrim` or `fallout4`
- `platform` - `WINDOWS`, `XB1`, or `PS4`
- `sortBy` - `latest`

## Contributing

Have ideas for improvements? Feel free to:
- 🐛 Report bugs
- ✨ Suggest new features
- 🔧 Submit pull requests

## License

MIT License - Feel free to use and modify for your own projects!

## Disclaimer

This project is not affiliated with Bethesda Game Studios or ZeniMax Media. Skyrim and Fallout are trademarks of their respective owners.
