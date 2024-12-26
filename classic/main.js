// Import the scheduleOperatorReplacement function
import { scheduleOperatorReplacement } from './bossreplace.js';

// Parse the JSON data
let nextTime;
let boss;
export let bosses;

// Changes for a test
let guessedBosses = [];
let lastSolvedTimestamp;

window.onload = async function () {
    // Load boss and operator data
    const operatorResponse = await fetch('./boss.json');
    boss = await operatorResponse.json();
    nextTime = new Date(boss[0].nextChange);
    const operatorsResponse = await fetch('./bosses.json');
    bosses = await operatorsResponse.json();
    lastSolvedTimestamp = localStorage.getItem('lastSolvedTimestamp');

    loadTriedBosses();

    // Get the saved mode from localStorage
    let savedMode = localStorage.getItem('mode');
    let lastGuessedBoss = localStorage.getItem('lastGuessedBoss');

    checkDailyStreak();

    // Reset the daily win status if the last guessed boss doesn't match
    if (lastGuessedBoss !== boss[0].name || lastGuessedBoss === null) {
        localStorage.setItem('dailyWon', 'false');
        if (guessedBosses.length > 0) {
            localStorage.setItem('guessedBosses', []);
            guessedBosses = [];
        }
    }

    // Open the saved mode
    if (savedMode === 'daily') {
        dailyMode();
    } else if (savedMode === 'endless') {
        endlessMode();
    } else {
        let input = document.getElementById('inputField');
        if (input) {
            input.disabled = true;
        }
    }

    /*// Call fetchDailyData once immediately, then every 5 seconds
    fetchDailyData();
    setInterval(fetchDailyData, 5000);
    fetchEndlessSolved();
    setInterval(fetchEndlessSolved, 5000);*/

    // Start the game
    askForGuess();

    // Schedule the operator replacement for midnight
/*    const nextTimes = getNextMidnightEST();
    startCountdown(nextTimes, countdownTime);*/
    scheduleOperatorReplacement();
};

function checkDailyStreak() {
    // If the last visit was more than 24 hours, set the streak count to 0
    let dateNow = new Date().getTime();

    if ((dateNow >= (lastSolvedTimestamp + 24 * 60 * 60 * 1000)) && new Date().getUTCHours() > 18) {
        console.log('Daily streak reset');
        localStorage.setItem('dailyStreakCount', 0);
    }
}

// Create a container for the keys
let keysContainer = document.createElement('div');
keysContainer.className = 'classic-answers-container';

// Create a row for the keys
let keysRow = document.createElement('div');
keysRow.className = 'answer-titles square-container animate__animated animate__fadeIn';

// Create boxes for the keys
let keys = ["name", "solo_level", "hitpoints", "attack_style", "release_year", "region", "solo"];
keys.forEach(key => {
    let box = document.createElement('div');
    box.className = 'square square-title';
    box.style.flexBasis = 'calc(5% - 4px)';

    let content = document.createElement('div');
    content.className = 'square-content';
    content.textContent = key.charAt(0).toUpperCase() + key.slice(1);

    box.appendChild(content);
    keysRow.appendChild(box);
});

// Append the keys row to the keys container
keysContainer.appendChild(keysRow);

function updateModeIndicator(mode) {
    const modeIndicator = document.getElementById('mode-indicator');
    modeIndicator.textContent = `Current mode: ${mode}`;
    if (mode === 'Daily'){
        let button = document.createElement('button')
        button.className = 'de_button'
        button.innerHTML = 'Endless Mode'
        button.onclick = function() {
            endlessMode()
        }
        modeIndicator.appendChild(button)

    }else if( mode === 'Endless'){
        let button = document.createElement('button')
        button.className = 'de_button'
        button.innerHTML = 'Daily Mode'
        button.onclick = function() {
            dailyMode()
        }
        modeIndicator.appendChild(button)
    }
    guessedBosses = [];

}
let dailyGuesses = 0;
let endlessGuesses = 0;
let bossToGuess
let dailyResult = 0;
let endlessResult = 0;

window.endlessMode = function() {
    // Logic for endless mode
    updateModeIndicator('Endless');
    localStorage.setItem('mode', 'endless');
    displayStreak();
    endlessGuesses = setEndlessGuesses();
    bossToGuess = setBossToGuess();
    loadTriedBosses()
    var event = new CustomEvent('clearUsedNames');
    window.dispatchEvent(event);
    // Find the winning screen and remove it if it exists
    clear();
    // Enable the input
    let input = document.getElementById('inputField');
    if (input) {
        input.disabled = false;
    }
}
window.dailyMode = function () {
    // Enable the input
    let input = document.getElementById('inputField');
    if (input) {
        input.disabled = localStorage.getItem('dailyWon') === 'true';
    }
    // Logic for daily mode
    updateModeIndicator('Daily');
    localStorage.setItem('mode', 'daily');
    displayDailyStreak();
    dailyGuesses = setDailyGuesses();
    bossToGuess = setBossToGuess();
    const event = new CustomEvent('clearUsedNames');
    window.dispatchEvent(event);
    clear();
    if(localStorage.getItem('dailyWon') === 'true'){
        displayWinningScreen()
    }
    //Use guess and askForGuess as needed
}
// numbers
let dailyStreakCount = localStorage.getItem('dailyStreakCount') || 0;

    // Function to handle a new guess

function guess(bossName) {
    const mode = localStorage.getItem('mode');
    handleGuesses(mode);

    const boss = findBoss(bossName);
    if (!boss) {
        return askForGuess();
    }


    compareBosses(boss, bossToGuess);
    compareOperators(boss, bossToGuess, bossName.replace(/ /g, '_')); // Compare visually
    saveTriedBosses();

    if (bossName.toLowerCase() === bossToGuess.name.toLowerCase()) {
        handleWinning(bossName, mode);
    } else {
        askForGuess();
    }
}

function handleGuesses(mode) {
    if (mode === 'daily') {
        tutoButton();
        dailyGuesses++;
        localStorage.setItem('dailyGuesses', dailyGuesses);
    } else if (mode === 'endless') {
        tutoButton();
        endlessGuesses = endlessGuesses + 1;
        localStorage.setItem('endlessGuesses', endlessGuesses);
    }
}

function findBoss(bossName) {
    return bosses.find(
        boss => typeof boss.name === 'string' && boss.name.toLowerCase() === bossName.toLowerCase()
    );
}

function compareBosses(boss, bossToGuess) {
    const keys = ["name", "solo_level", "hitpoints", "attack_style", "release_year", "region", "solo"];
    let sharedCriteria = false;

    keys.forEach(key => {
        if (processKeyComparison(boss, bossToGuess, key, false)) {
            sharedCriteria = true; // Update sharedCriteria if any key matches
        }
    });

    return sharedCriteria; // Return whether any criteria matched
}

function processKeyComparison(boss, bossToGuess, key, isVisual) {
    const squareClasses = {
        good: 'square-good',
        bad: 'square-bad',
        partial: 'square-partial',
    };

    if (key === 'release_year' || key === 'hitpoints' || key === 'solo_level') {
        if (boss[key] === bossToGuess[key]) {
            logComparison(isVisual, key, boss[key], squareClasses.good, "✅");
            return true; // Match found
        } else {
            const icon = boss[key] < bossToGuess[key] ? "⬆️" : "⬇️";
            logComparison(isVisual, key, boss[key], squareClasses.bad, icon);
            return false; // No match
        }
    } else if (Array.isArray(boss[key]) && Array.isArray(bossToGuess[key])) {
        const arraysAreEqual = boss[key].length === bossToGuess[key].length &&
            boss[key].every((value, index) => value === bossToGuess[key][index]);
        if (arraysAreEqual) {
            logComparison(isVisual, key, boss[key].join(", "), squareClasses.good, "✅");
            return true;
        } else {
            // Check for partial matches
            const matchingRoles = boss[key].filter(role => bossToGuess[key].includes(role));
            if (matchingRoles.length > 0) {
                logComparison(isVisual, key, boss[key].join(", "), squareClasses.partial, "🟠");
                return false;
            } else {
                logComparison(isVisual, key, boss[key].join(", "), squareClasses.bad, "🔴");
                return false;
            }
        }
    } else if (boss[key] === bossToGuess[key]) {
        logComparison(isVisual, key, boss[key], squareClasses.good, "✅");
        return true; // Match found
    } else {
        logComparison(isVisual, key, boss[key], squareClasses.bad, "🔴");
        return false; // No match
    }
}

function logComparison(isVisual, key, value, squareClass, icon) {
    if (isVisual) {
        const square = document.createElement('div');
        square.className = `square animate__animated animate__flipInY ${squareClass}`;
        const content = document.createElement('div');
        content.className = 'square-content';
        content.textContent = `${icon} ${value}`;
        square.appendChild(content);
        return square; // Return visual element
    } else {
        console.log(`${icon} ${key}: ${value}`); // Log to console
    }
}

function compareOperators(boss, bossToGuess, scoredName) {
    const keys = ["name", "solo_level", "hitpoints", "attack_style", "release_year", "region", "solo"];
    let sharedCriteria = false;

    const container = document.getElementById('answercon');
    let answerClassic = document.createElement('div');
    answerClassic.className = 'classic-answer';

    let squareContainer = document.createElement('div');
    squareContainer.className = 'square-container';

    // Create the image square
    let imgSquare = document.createElement('div');
    imgSquare.className = 'square animate__animated animate__flipInY';

    let img = document.createElement('img');
    img.src = `../images/mobs/${scoredName}.png`; // Placeholder image logic
    console.log(scoredName);
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';

    imgSquare.appendChild(img);
    imgSquare.classList.add('square-title');
    squareContainer.appendChild(imgSquare);

    keys.forEach(key => {
        let square = document.createElement('div');
        square.className = 'square animate__animated animate__flipInY';

        let content = document.createElement('div');
        content.className = 'square-content';

        if (key === 'release_year' || key === 'hitpoints' || key === 'solo_level') {
            if (boss[key] < bossToGuess[key]) {
                square.classList.add('square-higher');
                content.textContent = `${boss[key]}`;
            } else if (boss[key] > bossToGuess[key]) {
                square.classList.add('square-lower');
                content.textContent = `${boss[key]}`;
            } else {
                square.classList.add('square-good');
                content.textContent = `${boss[key]}`;
                sharedCriteria = true;
            }
        } else if (Array.isArray(boss[key]) && Array.isArray(bossToGuess[key])) {
            const arraysAreEqual = boss[key].length === bossToGuess[key].length &&
                boss[key].every((value, index) => value === bossToGuess[key][index]);

            if (arraysAreEqual) {
                square.classList.add('square-good');
                content.textContent = boss[key].join(', ');
                sharedCriteria = true;
            } else {
                // Check for partial matches
                const matchingRoles = boss[key].filter(role => bossToGuess[key].includes(role));
                if (matchingRoles.length > 0) {
                    square.classList.add('square-partial');
                    content.textContent = boss[key].join(', ');
                } else {
                    square.classList.add('square-bad');
                    content.textContent = boss[key].join(', ');
                }
            }
        } else if (boss[key] === bossToGuess[key]) {
            square.classList.add('square-good');
            content.textContent = boss[key];
            sharedCriteria = true;
        } else {
            square.classList.add('square-bad');
            content.textContent = boss[key];
        }

        square.appendChild(content);
        squareContainer.appendChild(square);
    });

    answerClassic.appendChild(squareContainer);
    container.prepend(answerClassic); // Insert at the top
}

function handleWinning(bossName, mode) {
    console.log(`You won! The boss was ${bossToGuess.name}`);

    if (mode === 'daily') {
        localStorage.setItem('dailyWon', 'true');
        localStorage.setItem('lastGuessedOp', bossName);
    }
    problemSolved();
    displayWinningScreen();

}

// Helper function to calculate the next midnight EST
function getNextMidnightEST() {
    // Get the current date and time in the EST timezone
    const now = new Date();
    const estNow = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));

    // Set to midnight of the next day in EST
    const estMidnight = new Date(estNow);
    estMidnight.setDate(estMidnight.getDate() + 1); // Move to the next day
    estMidnight.setHours(0, 0, 0, 0); // Set time to midnight

    // Return the EST midnight time as UTC timestamp
    return estMidnight.getTime();
}

function startCountdown(nextTime, countdownTime) {
    let countdownInterval = setInterval(() => {
        const now = new Date().getTime();
        const distance = nextTime - now;

        if (distance < 0) {
            clearInterval(countdownInterval);
            countdownTime.innerHTML = "Refresh the site to get the new boss";
            return;
        }
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        countdownTime.innerHTML = `${hours}h ${minutes}m ${seconds}s`;
    }, 1000);
}

function displayWinningScreen() {
    const mode = localStorage.getItem('mode');
    const dailyWon = localStorage.getItem('dailyWon') === 'true';
    const endId = document.getElementById('endId');

    if (mode === 'daily' && dailyWon) {
        dailyResult = localStorage.getItem('dailyResult');
    }

    // Main container
    const finishedDiv = document.createElement('div');
    finishedDiv.className = 'finished';

    const emptyDiv = document.createElement('div');
    const backgroundEndDiv = document.createElement('div');
    backgroundEndDiv.className = 'background-end';

    // "gg wp" header
    const ggDiv = document.createElement('div');
    ggDiv.className = 'gg';
    ggDiv.innerHTML = 'gg wp';

    // Answer section
    const ggAnswerDiv = document.createElement('div');
    ggAnswerDiv.className = 'gg-answer';

    const firstInnerDiv = document.createElement('div');
    const img = document.createElement('img');
    img.width = 80;
    img.height = 80;
    img.className = 'gg-icon';
    img.src = `../images/mobs/${bossToGuess.name.replace(/ /g, '_')}.png`;
    firstInnerDiv.appendChild(img);
    ggAnswerDiv.appendChild(firstInnerDiv);

    const secondInnerDiv = document.createElement('div');
    const ggYouSpan = document.createElement('span');
    ggYouSpan.className = 'gg-you';
    ggYouSpan.innerHTML = 'You guessed:';
    secondInnerDiv.appendChild(ggYouSpan);

    secondInnerDiv.appendChild(document.createElement('br'));

    const ggNameDiv = document.createElement('div');
    ggNameDiv.className = 'gg-name';
    ggNameDiv.innerHTML = bossToGuess.name;
    secondInnerDiv.appendChild(ggNameDiv);

    ggAnswerDiv.appendChild(secondInnerDiv);

    // Number of tries
    const nthTriesDiv = document.createElement('div');
    nthTriesDiv.className = 'nthtries';
    const tries = mode === 'daily' ? dailyGuesses : endlessGuesses;
    nthTriesDiv.innerHTML = `Number of tries: ${tries}`;

    const nthSpan = document.createElement('span');
    nthSpan.className = 'nth';
    nthSpan.innerHTML = mode === 'daily' ? dailyResult : null;
    nthTriesDiv.appendChild(nthSpan);

    // Assemble and append elements
    backgroundEndDiv.appendChild(ggDiv);
    backgroundEndDiv.appendChild(ggAnswerDiv);
    backgroundEndDiv.appendChild(nthTriesDiv);

    // Countdown or restart button
    if (mode === 'daily') {
        const countdown = document.createElement('div');
        countdown.className = 'next-boss next-boss';

        const nextTitle = document.createElement('div');
        nextTitle.className = 'next-title';
        nextTitle.innerHTML = 'Next boss in:';
        countdown.appendChild(nextTitle);

        const countdownTime = document.createElement('div');
        countdownTime.className = 'modal-time';
        countdownTime.id = 'countdown';
        countdown.appendChild(countdownTime);

        const nextTime = getNextMidnightEST();
        startCountdown(nextTime, countdownTime);

        backgroundEndDiv.appendChild(countdown);
    } else if (mode === 'endless') {
        const button = document.createElement('button');
        button.className = 'de_button';
        button.innerHTML = 'Play Again';
        button.id = 'restartButton';
        backgroundEndDiv.appendChild(button);
    }

    emptyDiv.appendChild(backgroundEndDiv);
    finishedDiv.appendChild(emptyDiv);
    endId.appendChild(finishedDiv);

    const target = finishedDiv.getBoundingClientRect().top + window.scrollY;
    let start;

    requestAnimationFrame(function scroll(timestamp) {
        start ??= timestamp;
        const progress = Math.min((timestamp - start) / 1500, 1);
        window.scrollTo(0, window.scrollY + (target - window.scrollY) * progress);
        if (progress < 1) requestAnimationFrame(scroll);
    });

    restartButton();

    localStorage.setItem('endlessGuesses', 0)
    localStorage.setItem('dailyGuesses', 0)
}

function askForGuess() {
    // Get the button and input field elements
    const submitButton = document.getElementById('submitButton');
    const inputField = document.getElementById('inputField');
    const autobox = document.querySelector(".auto-box");

    // Create a set of boss names for faster lookups
    const bossNamesSet = new Set(bosses.map(boss => boss.name));

    // Function to handle user input validation and guessing logic
    function handleGuess() {
        const userInput = inputField.value.trim(); // Trim whitespace

        // Validation checks
        if (guessedBosses.includes(userInput) || userInput === "" || !bossNamesSet.has(userInput)) {
            return;
        }

        // Add the boss to the guessed list and process the guess
        guessedBosses.push(userInput);
        guess(userInput);

        // Clear the input field after processing the guess
        inputField.value = '';
    }
    // Add event listener to autobox for input field selection
    autobox.addEventListener('click', () => inputField.select());

    // Add event listeners for both button and input actions
    submitButton.addEventListener('click', handleGuess);
}


// When a user solves a problem
function problemSolved() {
    if(localStorage.getItem('mode') === 'endless'){
        // Get the current streak from local storage
        let currentStreak = localStorage.getItem('streak');

        // If there's no current streak, this is the first problem the user has solved
        if (!currentStreak) {
            currentStreak = 0;
        }
        // Increment the streak
        currentStreak++;
        // Save the new streak to local storage
        localStorage.setItem('streak', currentStreak);

        // Display the new streak
        displayStreak()
    } else if (localStorage.getItem('mode') === 'daily'){

        // Increment the daily streak
        dailyStreakCount++;
        // Save the new daily streak to local storage
        localStorage.setItem('dailyStreakCount', dailyStreakCount.toString())
        // Display the new streak
        document.getElementById('dailyStreakDisplay').textContent = `Your daily streak increased and is now at ${dailyStreakCount}`;
    }
}

function displayStreak() {
    // Get the current streak from local storage
    let currentStreak = localStorage.getItem('streak');
    // Get the 'streakDisplay' element
    const streakDisplay = document.getElementById('streakDisplay');
    const dataDailyStreak = document.getElementById('alreadyDailySolved');
    // var dataGlobalSolvedEndless = document.getElementById('globalSolvedEndless');

    // Show the 'streakDisplay' element
    streakDisplay.style.display = '';
    // If there's no current streak, this is the user's first visit
    if (!currentStreak) {
        currentStreak = 0;
    }
    // Display the current streak
    if (currentStreak === 0){
        document.getElementById('streakDisplay').textContent = 'You have never solved Osrsdle';
    } else if (currentStreak > 1){
        document.getElementById('streakDisplay').textContent = `You have solved Osrsdle ${currentStreak} times`;
    }
    const dailyStreakDisplay = document.getElementById('dailyStreakDisplay');
    dailyStreakDisplay.style.display = 'none'
    dataDailyStreak.style.display = 'none'
}

function displayDailyStreak() {
    // Get the daily streak from local storage
    let dailyStreak = localStorage.getItem('dailyStreakCount');
    var dailyStreakDisplay = document.getElementById('dailyStreakDisplay');
    var dataGlobalSolvedEndless = document.getElementById('globalSolvedEndless');
    var dataDailyStreak = document.getElementById('alreadyDailySolved');
    dailyStreakDisplay.style.display = '';
    // If there's no daily streak, this is the user's first visit
    if (dailyStreak === null) {
        dailyStreak = 0;
    }
    // Display the daily streak
    if (dailyStreak === 0){
        document.getElementById('dailyStreakDisplay').textContent = 'You have no daily streak';
    } else if (dailyStreak > 1){
        document.getElementById('dailyStreakDisplay').textContent = `Your daily streak is: ${dailyStreak}`;
    }
    // Get the 'streakDisplay' element
    var streakDisplay = document.getElementById('streakDisplay');

    // Hide the 'streakDisplay' element
    streakDisplay.style.display = 'none';
    dataGlobalSolvedEndless.style.display = 'none'
    dataDailyStreak.style.display = ''
}

// Save the tried bosses
function saveTriedBosses() {
  if (localStorage.getItem('mode') === 'daily') {
    localStorage.setItem('guessedBosses', JSON.stringify(guessedBosses));
  }
}

// Load the tried bosses
function loadTriedBosses() {
  if (localStorage.getItem('mode') === 'daily') {
    const savedTriedOperators = localStorage.getItem('guessedBosses');

    if (savedTriedOperators) {
      guessedBosses = JSON.parse(savedTriedOperators);
    } else {
      guessedBosses = [];
    }
    // Dispatch a custom event when guessedBosses is loaded
    window.dispatchEvent(new Event('guessedOperatorsLoaded'));
  }else{
    guessedBosses = [];
    window.dispatchEvent(new Event('guessedOperatorsLoaded'));
  }
}

function clearGuessedOperators() {
    if (localStorage.getItem('mode') === 'daily') {
      localStorage.removeItem('guessedBosses');
    }
  }

function checkWin() {
    var userHasWon = localStorage.getItem('dailyWon') === 'true'
    var dailyStreakCount = localStorage.getItem('dailyStreakCount')
    if (userHasWon) {
     clearGuessedOperators();
     localStorage.setItem('dailyWon', 'false')
     localStorage.setItem('dailyStreakCount', dailyStreakCount + 1)
    }
}

// Select a random boss or take the daily
function setBossToGuess() {
    let bossToGuess;
    if (localStorage.getItem('mode') === 'endless'){
        bossToGuess = localStorage.getItem('bossToGuess');
        if(!bossToGuess || !bossToGuess.length){
            bossToGuess = bosses[Math.floor(Math.random() * bosses.length)];
        }
    } else if (localStorage.getItem('mode') === 'daily'){
        bossToGuess = boss[0];
    }
    return bossToGuess;
}

// Set initial guess count for daily mode
function setDailyGuesses() {
    let storedDailyGuesses = localStorage.getItem('dailyGuesses');
    if(!storedDailyGuesses || isNaN(storedDailyGuesses)){
        localStorage.setItem('dailyGuesses', dailyGuesses);
        dailyGuesses = localStorage.getItem('dailyGuesses')
    } else {
        dailyGuesses = parseInt(storedDailyGuesses);
    }
    return dailyGuesses
}

// Set initial guess count for endless mode
function setEndlessGuesses() {
    let storedEndlessGuesses = localStorage.getItem('endlessGuesses');
    if(!storedEndlessGuesses || isNaN(storedEndlessGuesses)){
        localStorage.setItem('endlessGuesses', endlessGuesses);
        endlessGuesses = localStorage.getItem('endlessGuesses')
    } else {
        endlessGuesses = parseInt(storedEndlessGuesses);
    }
    return endlessGuesses
}

function restartButton() {
    // Get the button element
    const restartButton = document.getElementById('restartButton');

    // Check if the button exists
    if (restartButton) {
        // Add a click event listener to the button
        restartButton.addEventListener('click', function() {
            // localStorage.setItem('guessedBosses', [])
            bossToGuess = setBossToGuess()
            // localStorage.setItem('endlessGuesses', 0)

            guessedBosses = [];
            endlessGuesses = 0
            let input  = document.getElementById('inputField')
                    input.disabled = false
            clear()
            var event = new CustomEvent('clearUsedNames');
            window.dispatchEvent(event);
        });
    }
}

function tutoButton(){
    //Get the tuto element
    var tutoElement = document.getElementById('tuto')
    tutoElement.style.display = 'contents'
/*
    var tutoButton = document.getElementById('close')
    if (tutoButton){
        tutoButton.addEventListener('click', function(){
            tutoElement.style.display = 'none'
        })
    }*/
}

function clear() {
    let answercon = document.getElementById('answercon')
    answercon.innerHTML = ''
    let endId = document.getElementById('endId')
    endId.innerHTML = ''
}

function fetchDailyData() {
    fetch('../../server/dailysolved.php')
        .then(response => response.json())
        .then(data => {
            document.getElementById('alreadyDailySolved').innerHTML = data + ' people already found the boss';
        })
        .catch(error => console.error('Error:', error));
}

function fetchEndlessSolved() {
    fetch('../../server/endlesssolved.php')
        .then(response => {
            if (!response.ok) {
                console.error('HTTP Status:', response.status);
                return response.text().then(text => {
                    console.error('Response Text:', text);
                    throw new Error('Network response was not ok');
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                console.error('Error:', data.error);
            } else {
                document.getElementById('globalSolvedEndless').innerHTML =
                    data.globalSolvedEndless + ' times was the Endless solved.';
            }
        })
        .catch(error => console.error('Fetch Error:', error));

}

export function getGuessedbosses() {
    if (guessedBosses === null) {
        guessedBosses = [];
    }
    return guessedBosses;
}
