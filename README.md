# FIRSTSANCHEZ Discord Statistics Bot

A Discord bot that regularly fetches player and faction statistics from a MySQL database and posts them via Discord webhooks.

## Features

- Top 20 Players (Total Assets)
- Top 10 Factions (Capital)
- Automatic updates every 12 hours
- Error handling with retry mechanism
- Detailed logging

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

## Configuration

Configuration is done in the `config.js` file:

### Database
```javascript
database: {
    host: "your_host",
    port: 3306,
    user: "your_user",
    password: "your_password",
    database: "your_database",
    charset: "utf8mb4"
}
```

### Discord Webhooks
```javascript
webhooks: {
    players: "your_webhook_url",
    fractions: "your_webhook_url"
}
```

### Bot Configuration
```javascript
bot: {
    logoUrl: "your_logo_url",
    updateInterval: 43200 // 12 hours in seconds
}
```

## Starting the Bot

```bash
npm start
```

## Logging

The bot logs all actions and errors with timestamps. Logs are output to the console and can be redirected to a file if needed:

```bash
npm start > bot.log 2>&1
```

## Error Handling

- Automatic reconnection for database failures
- Retry mechanism for Discord webhooks
- Detailed error logs
- Uncaught exceptions are caught and logged

## Statistics Format

### Player Statistics
- Shows top 20 players based on total money
- Displays for each player:
  - Name
  - Total money
  - Cash
  - Bank balance
  - Black money
- Includes total money circulation statistics

### Faction Statistics
- Shows top 10 factions based on capital
- Displays for each faction:
  - Faction name
  - Total money

## Dependencies

- mysql2: MySQL database connection
- node-fetch: HTTP requests for Discord webhooks
- moment: Date formatting
