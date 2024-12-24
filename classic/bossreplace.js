export function scheduleOperatorReplacement() {
    fetch('serverTime.php')
        .then(response => response.text())
        .then(serverTime => {
            var now = new Date(serverTime);

            fetch('boss.json')
                .then(response => response.json())
                .then(bosses => {
                    var boss = bosses[0]; // Assuming the boss is the first item in the array

                    if (boss.nextChange) {
                        var nextChange = new Date(boss.nextChange);

                        if (now > nextChange) {
                            // The boss needs to be changed, call replaceBoss
                            replaceBoss();
                        } else {
                            // The boss is still valid, use it
                            //console.log('Operator:', boss);

                            // Calculate the delay until the nextChange time in milliseconds
                            var delay = nextChange - now;
                            //console.log('Delay until next change:', delay);

                            // Schedule the boss replacement
                            setTimeout(replaceBoss, delay);
                        }
                    } else {
                        // nextChange property doesn't exist, call replaceBoss
                        replaceBoss();
                    }
                });
        });
}
function replaceBoss() {
    // Get the server time
    fetch('serverTime.php')
        .then(response => response.text())
        .then(serverTime => {
            var now = new Date(serverTime);

            // Load the bosses from the JSON file
            fetch('bosses.json')
                .then(response => response.json())
                .then(bosses => {
                    // Get a random operator
                    var newBoss = bosses[Math.floor(Math.random() * bosses.length)];

                    // Add a timestamp for the next change
                    var nextChange = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0);
                    if (now > nextChange) {
                        nextChange.setDate(nextChange.getDate() + 1);
                    }
                    newBoss.nextChange = nextChange;

                    console.log('New boss:', newBoss); // Add this line

                    // Wrap the new operator in an array
                    var newBossArray = [newBoss];

                    // Convert the new operator array to a JSON string
                    var jsonString = JSON.stringify(newBossArray);

                    // Send the JSON string to a server-side script to save it back to the JSON file
                    fetch('saveOperators.php', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: jsonString,
                    });
                });
        });
}
