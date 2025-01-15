export const config = {
    database: {
        host: "127.0.0.1",
        port: 3306,
        user: "USERNAME",
        password: "YOUR_DATABASE_PASSWORD",
        database: "DATABASE_NAME",
        charset: "utf8mb4"
    },

    // Bot Configuration
    bot: {
        logoUrl: "https://i.imgur.com/t9EjCoH.png",
        updateInterval: 43200 // 12 Stunden in Sekunden
        // updateInterval: 60 // 1 Minute in Sekunden
        // updateInterval: 300 // 5 Minuten in Sekunden
        // updateInterval: 600 // 10 Minuten in Sekunden
        // updateInterval: 1800 // 30 Minuten in Sekunden
        // updateInterval: 3600 // 1 Stunde in Sekunden
        // updateInterval: 7200 // 2 Stunden in Sekunden
        // updateInterval: 10800 // 3 Stunden in Sekunden
    },

    // Discord Webhooks
    webhooks: {
        players: "YOUR_DISCORD_WEBHOOK_URL",
        fractions: "YOUR_DISCORD_WEBHOOK_URL",
    }
};
