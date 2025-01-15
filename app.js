import mysql from 'mysql2/promise';
import fetch from 'node-fetch';
import moment from 'moment';
import { config } from './config.js';

function log(message, type = 'info') {
    const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
    const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
    console.log(logMessage);
}

async function createDbConnection(retries = 5, delay = 5000) {
    for (let i = 0; i < retries; i++) {
        try {
            return await mysql.createConnection(config.database);
        } catch (error) {
            log(`Database connection failed (Attempt ${i + 1}/${retries}): ${error.message}`, 'error');
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

async function getTopPlayers() {
    let connection;
    try {
        connection = await createDbConnection();
        const [results] = await connection.execute("SELECT firstname, lastname, accounts, job FROM users");

        const players = results.map(row => {
            const accounts = row.accounts ? JSON.parse(row.accounts) : { black_money: 0, bank: 0, money: 0 };
            const blackMoney = accounts.black_money || 0;
            const bankMoney = accounts.bank || 0;
            const cashMoney = accounts.money || 0;
            const totalMoney = blackMoney + bankMoney + cashMoney;
            const fractionName = row.job !== 'unemployed' ? row.job.charAt(0).toUpperCase() + row.job.slice(1) : 'Unemployed';

            return {
                firstname: row.firstname,
                lastname: row.lastname,
                total_money: totalMoney,
                cash_money: cashMoney,
                bank_money: bankMoney,
                black_money: blackMoney,
                fraction: fractionName
            };
        });

        return players.sort((a, b) => b.total_money - a.total_money).slice(0, 20);
    } catch (error) {
        log(`Error fetching top players: ${error.message}`, 'error');
        throw error;
    } finally {
        if (connection) await connection.end();
    }
}

async function getTopFractions() {
    let connection;
    try {
        connection = await createDbConnection();
        const [results] = await connection.execute(`
            SELECT account_name, money 
            FROM addon_account_data 
            WHERE owner IS NULL 
            ORDER BY money DESC
            LIMIT 10
        `);

        return results.map(row => ({
            fraction_name: row.account_name.replace("society_", "").toUpperCase(),
            money: row.money
        }));
    } catch (error) {
        log(`Error fetching top fractions: ${error.message}`, 'error');
        throw error;
    } finally {
        if (connection) await connection.end();
    }
}

async function sendToDiscord(webhook, payload, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(webhook, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.status === 204) return true;
            
            throw new Error(`HTTP Status: ${response.status}`);
        } catch (error) {
            log(`Discord Webhook Error (Attempt ${i + 1}/${retries}): ${error.message}`, 'error');
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
    return false;
}

async function sendPlayersToDiscord(players) {
    if (!players.length) return;

    const totalSums = players.reduce((acc, player) => {
        acc.totalCash += player.cash_money;
        acc.totalBank += player.bank_money;
        acc.totalBlack += player.black_money;
        return acc;
    }, { totalCash: 0, totalBank: 0, totalBlack: 0 });

    const currentTime = moment().format("DD.MM.YYYY - HH:mm");
    let message = "**Top 20 Players based on total capital**\n\n";

    players.forEach((player, i) => {
        const trophy = i < 3 ? "🏆" : "";
        const totalMoney = player.total_money.toLocaleString().replace(/,/g, ".");
        const cashMoney = player.cash_money.toLocaleString().replace(/,/g, ".");
        const bankMoney = player.bank_money.toLocaleString().replace(/,/g, ".");
        const blackMoney = player.black_money.toLocaleString().replace(/,/g, ".");

        message += `#${i + 1} ${trophy}\n`;
        message += `${player.firstname} ${player.lastname}\n`;
        message += `Total Money: ${totalMoney} €\n`;
        message += `Cash: ${cashMoney} €\n`;
        message += `Bank: ${bankMoney} €\n`;
        message += `Black Money: ${blackMoney} €\n\n`;
    });

    message += "\n**💰 Total Money in Circulation 💰**\n";
    message += `Cash: ${totalSums.totalCash.toLocaleString().replace(/,/g, ".")} €\n`;
    message += `Bank Money: ${totalSums.totalBank.toLocaleString().replace(/,/g, ".")} €\n`;
    message += `Black Money: ${totalSums.totalBlack.toLocaleString().replace(/,/g, ".")} €\n`;
    message += `Total: ${(totalSums.totalCash + totalSums.totalBank + totalSums.totalBlack).toLocaleString().replace(/,/g, ".")} €\n\n`;
    message += `**FIRSTSANCHEZ | MONEY Statistics | ${currentTime}**`;

    const payload = {
        username: "FIRSTSANCHEZ Player Statistics",
        embeds: [{
            description: message,
            avatar_url: config.bot.logoUrl,
            color: 0xFFA500
        }]
    };

    await sendToDiscord(config.webhooks.players, payload);
}

async function sendFractionsToDiscord(fractions) {
    if (!fractions.length) return;

    const currentTime = moment().format("DD.MM.YYYY - HH:mm");
    let message = "**Top 10 Fractions based on their capital**\n\n";

    fractions.forEach((fraction, i) => {
        const trophy = i < 3 ? "🏆" : "";
        message += `#${i + 1} ${trophy} - ${fraction.fraction_name}\n`;
        message += `Money: ${fraction.money.toLocaleString().replace(/,/g, ".")} €\n\n`;
    });

    message += `**FIRSTSANCHEZ | FRACTION Statistics | ${currentTime}**`;

    const payload = {
        username: "FIRSTSANCHEZ Fraction Statistics",
        embeds: [{
            description: message,
            avatar_url: config.bot.logoUrl,
            color: 0xFFA500
        }]
    };

    await sendToDiscord(config.webhooks.fractions, payload);
}

// Main function
async function main() {
    log('Bot starting...');
    
    process.on('uncaughtException', (error) => {
        log(`Unhandled error: ${error.message}`, 'error');
        log(error.stack, 'error');
    });

    process.on('unhandledRejection', (reason, promise) => {
        log(`Unhandled promise rejection: ${reason}`, 'error');
    });

    while (true) {
        try {
            log('Starting new update cycle...');

            log('Fetching top 20 players...');
            const topPlayers = await getTopPlayers();
            log('Sending top 20 players to Discord...');
            await sendPlayersToDiscord(topPlayers);

            log('Fetching top 10 fractions...');
            const topFractions = await getTopFractions();
            log('Sending top 10 fractions to Discord...');
            await sendFractionsToDiscord(topFractions);

            log(`Update cycle completed. Waiting ${config.bot.updateInterval} seconds until next update...`);
        } catch (error) {
            log(`Error in update cycle: ${error.message}`, 'error');
            log(error.stack, 'error');
        }

        await new Promise(resolve => setTimeout(resolve, config.bot.updateInterval * 1000));
    }
}

// Start the bot
main().catch(error => {
    log(`Critical error starting the bot: ${error.message}`, 'error');
    log(error.stack, 'error');
    process.exit(1);
});
