export function scheduleOperatorReplacement() {
    const now = new Date();
    const nextMidnight = getNextMidnightEST();

    // Fetch the current boss JSON
    fetch('boss.json')
        .then(response => response.json())
        .then(bosses => {
            const boss = bosses[0]; // Assuming the boss is the first item in the array

            if (boss.nextChange) {
                const nextChange = new Date(boss.nextChange);

                if (now > nextChange) {
                    // If the boss needs to be changed, call replaceBoss
                    replaceBoss();
                } else {
                    // Boss is still valid, schedule the replacement
                    const delay = nextChange - now;
                    setTimeout(replaceBoss, delay);
                }
            } else {
                // If nextChange is not defined, call replaceBoss immediately
                replaceBoss();
            }
        });
}

const fs = require('fs');

function replaceBoss() {
    const now = new Date();
    const nextMidnight = getNextMidnightEST(); // Use your helper function to calculate next midnight EST

    // Fetch bosses JSON
    fetch('bosses.json')
        .then(response => response.json())
        .then(bosses => {
            // Select a random boss
            const newBoss = bosses[Math.floor(Math.random() * bosses.length)];

            // Assign the nextChange time as the next midnight EST
            newBoss.nextChange = new Date(nextMidnight).toISOString(); // Save as ISO string for consistency

            console.log("New Boss Assigned:", newBoss);

            // Wrap the new boss in an array to preserve the format
            const newBossArray = [newBoss];

            // Convert the new boss array to a JSON string
            const jsonString = JSON.stringify(newBossArray);

            // Save the new boss to boss.json while preserving the same JSON format
            fs.writeFile('boss.json', jsonString, 'utf8', (err) => {
                if (err) {
                    console.error("Error saving new boss to boss.json:", err);
                } else {
                    console.log("New boss successfully saved to boss.json.");
                }
            });
        });
}

function getNextMidnightEST() {
    const now = new Date();

    // Get the current time in the EST timezone
    const estNow = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));

    // Set to midnight of the next day in EST
    const estMidnight = new Date(estNow);
    estMidnight.setDate(estMidnight.getDate() + 1); // Move to the next day
    estMidnight.setHours(0, 0, 0, 0); // Set time to midnight

    return estMidnight.getTime(); // Return UTC timestamp
}
