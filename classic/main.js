// Parse the JSON data
let nextTime
let boss
export let bosses
//changes for a test
let guessedBosses = []
let lastSolvedTimestamp

window.onload = async function() {
    const operatorResponse = await fetch('./boss.json');
    boss = await operatorResponse.json();
    nextTime = new Date(boss[0].nextChange);
    const operatorsResponse = await fetch('./bosses.json')
    bosses = await operatorsResponse.json()
    lastSolvedTimestamp = localStorage.getItem('lastSolvedTimestamp')

    //console.log(boss)
    //console.log(bosses)
    loadTriedOperators()

    // Get the saved mode from localStorage
    let savedMode = localStorage.getItem('mode');
    let lastGuessedBoss = localStorage.getItem('lastGuessedBoss')

    checkDailyStreak();

    // Check if the last guessed Operator is equal to the current boss and if that is not true set dailyWon to false
    if (lastGuessedBoss !== boss[0].name || lastGuessedBoss === null) {
        localStorage.setItem('dailyWon', 'false')

        if (guessedBosses.length > 0) {
            localStorage.setItem('guessedOperators', [])
            guessedBosses = localStorage.getItem('guessedOperators')
        }
    }

    // If a mode was saved, open that mode
    if (savedMode === 'daily') {
        dailyMode();
    } else if (savedMode === 'endless') {
      endlessMode();
    } else {
        // Disable the input
        let input = document.getElementById('inputField');
        if (input) {
            input.disabled = true;
        }
    }
    //console.log(localStorage.getItem('dailyWon'))
    // Call fetchDailyData once immediately, then every 5 seconds
    fetchDailyData();
    setInterval(fetchDailyData, 5000);
    fetchEndlessSolved()
    setInterval(fetchEndlessSolved, 5000);
    // Start the game
    askForGuess();
}

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
    loadTriedOperators()
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

    console.log(`daily: ${dailyGuesses}, endless: ${endlessGuesses}`);

    const boss = findBoss(bossName);
    if (!boss) {
        console.log("🔴 Boss not found");
        return askForGuess();
    }

    console.log("Found boss:", boss);

    compareBosses(boss, bossToGuess);

    if (bossName.toLowerCase() === bossToGuess.name.toLowerCase()) {
        handleWinning(bossName, mode);
    } else {
        handleGuessFeedback(boss, bossToGuess);
        compareOperators(boss, bossToGuess, bossName.replace(/ /g, '_')); // Compare visually
        saveTriedOperators();
        askForGuess();
    }
}

function handleGuesses(mode) {
    if (mode === 'daily') {
        if (dailyGuesses === 0) tutoButton();
        dailyGuesses++;
        localStorage.setItem('dailyGuesses', dailyGuesses);
    } else if (mode === 'endless') {
        if (endlessGuesses === 0) tutoButton();
        endlessGuesses++;
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
        const matchingRoles = boss[key].filter(role => bossToGuess[key].includes(role));
        if (matchingRoles.length > 0) {
            logComparison(isVisual, key, boss[key].join(", "), squareClasses.partial, "🟠");
            return true; // Partial match
        } else {
            logComparison(isVisual, key, boss[key].join(", "), squareClasses.bad, "🔴");
            return false; // No match
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
                square.classList.add('square-bad');
                content.textContent = `⬆️ ${boss[key]}`;
            } else if (boss[key] > bossToGuess[key]) {
                square.classList.add('square-bad');
                content.textContent = `⬇️ ${boss[key]}`;
            } else {
                square.classList.add('square-good');
                content.textContent = `✅ ${boss[key]}`;
                sharedCriteria = true;
            }
        } else if (Array.isArray(boss[key]) && Array.isArray(bossToGuess[key])) {
            const matchingRoles = boss[key].filter(role => bossToGuess[key].includes(role));
            if (matchingRoles.length > 0) {
                square.classList.add('square-partial');
                content.textContent = boss[key].join(', ');
                sharedCriteria = true;
            } else {
                square.classList.add('square-bad');
                content.textContent = boss[key].join(', ');
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

function handleGuessFeedback(boss, bossToGuess) {
    const sharedCriteria = compareBosses(boss, bossToGuess);

    if (sharedCriteria) {
        console.log("🟠 The guessed boss shares some criteria with the boss to find.");
    } else {
        console.log("🔴 The guessed boss does not share any criteria with the boss to find.");
    }
}

// Helper function to calculate the next midnight EST
function getNextMidnightEST() {
    const now = new Date();
    const offset = now.getTimezoneOffset() === 240 ? 4 : 5; // Check for DST
    const nextMidnight = new Date(now);
    nextMidnight.setUTCHours(24 + offset, 0, 0, 0); // Set to next midnight in EST
    return nextMidnight.getTime();
}

// Countdown logic function
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
    if (localStorage.getItem('mode') === 'daily' && localStorage.getItem('dailyWon') === 'true') {
        dailyResult = localStorage.getItem('dailyResult');
    }

    let endId = document.getElementById('endId');
    let finishedDiv = document.createElement('div');
    finishedDiv.className = 'finished';

    let emptyDiv = document.createElement('div');
    let backgroundEndDiv = document.createElement('div');
    backgroundEndDiv.className = 'background-end';

    let ggDiv = document.createElement('div');
    ggDiv.className = 'gg';
    ggDiv.innerHTML = 'gg wp';

    let ggAnswerDiv = document.createElement('div');
    ggAnswerDiv.className = 'gg-answer';

    let firstInnerDiv = document.createElement('div');
    let img = document.createElement('img');
    img.width = 60;
    img.height = 60;
    img.className = "gg-icon";
    img.src = `../images/mobs/${bossToGuess.name.replace(/ /g, '_')}.png`;
    firstInnerDiv.appendChild(img);

    let secondInnerDiv = document.createElement('div');
    let ggYouSpan = document.createElement('span');
    ggYouSpan.className = 'gg-you';
    ggYouSpan.innerHTML = 'You guessed';
    secondInnerDiv.appendChild(ggYouSpan);

    let br = document.createElement('br');
    secondInnerDiv.appendChild(br);

    let ggNameDiv = document.createElement('div');
    ggNameDiv.className = 'gg-name';
    ggNameDiv.innerHTML = bossToGuess.name;
    secondInnerDiv.appendChild(ggNameDiv);

    let nthTriesDiv = document.createElement('div');
    nthTriesDiv.className = 'nthtries';
    nthTriesDiv.innerHTML = 'Number of tries: ';

    let nthSpan = document.createElement('span');
    nthSpan.className = 'nth';
    nthSpan.innerHTML = localStorage.getItem('mode') === 'daily' ? dailyResult : endlessResult;
    nthTriesDiv.appendChild(nthSpan);

    let button = document.createElement('button');
    button.className = 'de_button';
    button.innerHTML = 'Restart';
    button.id = 'restartButton';

    let countdown = document.createElement('div');
    countdown.className = 'next-boss next-boss';

    let nextTitle = document.createElement('div');
    nextTitle.className = 'next-title';
    nextTitle.innerHTML = 'Next boss in:';
    countdown.appendChild(nextTitle);

    let countdownTime = document.createElement('div');
    countdownTime.className = 'modal-time';
    countdownTime.id = 'countdown';
    countdown.appendChild(countdownTime);

    if (localStorage.getItem('mode') === 'daily') {
        const nextTime = getNextMidnightEST();
        startCountdown(nextTime, countdownTime);
    }

    ggAnswerDiv.appendChild(firstInnerDiv);
    ggAnswerDiv.appendChild(secondInnerDiv);
    backgroundEndDiv.appendChild(ggDiv);
    backgroundEndDiv.appendChild(ggAnswerDiv);
    backgroundEndDiv.appendChild(nthTriesDiv);

    if (localStorage.getItem('mode') === 'endless') {
        backgroundEndDiv.appendChild(button);
    } else if (localStorage.getItem('mode') === 'daily') {
        backgroundEndDiv.appendChild(countdown);
    }

    emptyDiv.appendChild(backgroundEndDiv);
    finishedDiv.appendChild(emptyDiv);
    endId.appendChild(finishedDiv);
    restartButton();
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
        if (guessedBosses.includes(userInput)) {
            console.log('This boss has already been guessed.');
            return;
        }
        if (userInput === "") {
            console.log('InputField was empty.');
            return;
        }
        if (!bossNamesSet.has(userInput)) {
            console.log('This boss does not exist.');
            return;
        }

        // Add the boss to the guessed list and process the guess
        guessedBosses.push(userInput);
        guess(userInput);
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
        console.log('before solved: ' + currentStreak)
        // Increment the streak
        currentStreak++;
        console.log('after solved: ' + currentStreak)
        // Save the new streak to local storage
        localStorage.setItem('streak', currentStreak);

        // Display the new streak
        document.getElementById('streakDisplay').textContent = `You solved R6dle already ${currentStreak} times`;
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
    var streakDisplay = document.getElementById('streakDisplay');
    var dataDailyStreak = document.getElementById('alreadyDailySolved');
    var dataGlobalSolvedEndless = document.getElementById('globalSolvedEndless');

    // Show the 'streakDisplay' element
    streakDisplay.style.display = '';
    // If there's no current streak, this is the user's first visit
    if (!currentStreak) {
        currentStreak = 0;
    }
    // Display the current streak
    if (currentStreak === 0){
        document.getElementById('streakDisplay').textContent = 'You have never solved R6dle';
    } else if (currentStreak === 1){
        document.getElementById('streakDisplay').textContent = 'You have solved this r6dle 1 time already';
    } else if (currentStreak > 1){
        document.getElementById('streakDisplay').textContent = `You have solved it ${currentStreak} times already`;
    }
    var dailyStreakDisplay = document.getElementById('dailyStreakDisplay');
    dailyStreakDisplay.style.display = 'none'
    dataDailyStreak.style.display = 'none'

    dataGlobalSolvedEndless.style.display = ''
    dataGlobalSolvedEndless.innerHTML = 'The endless mode was already solved times'
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
    } else if (dailyStreak === 1){
        document.getElementById('dailyStreakDisplay').textContent = 'Your daily streak is: 1';
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
function saveTriedOperators() {
  if (localStorage.getItem('mode') === 'daily') {
    localStorage.setItem('guessedBosses', JSON.stringify(guessedBosses));
  }
}

// Load the tried bosses
function loadTriedOperators() {
  if (localStorage.getItem('mode') === 'daily') {
    const savedTriedOperators = localStorage.getItem('guessedOperators');

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

// Set initial guess count for daily and endless modes
function setGuesses() {
    let guesses = {
        daily: 0,
        endless: 0
    };

    if (localStorage.getItem('mode') === 'endless'){
        let endlessGuesses = localStorage.getItem('guesses.endless');
        if(!endlessGuesses){
            localStorage.setItem('guesses.endless', guesses.endless);
        }
    } else if (localStorage.getItem('mode') === 'daily'){
        let dailyGuesses = localStorage.getItem('guesses.daily');
        if(!dailyGuesses){
            localStorage.setItem('guesses.daily', guesses.daily);
        }
    }
}

// Select a random boss or take the daily
function setBossToGuess() {
    let bossToGuess;
    if (localStorage.getItem('mode') === 'endless'){
        bossToGuess = localStorage.getItem('operatorToGuess');
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
    var restartButton = document.getElementById('restartButton');

    // Check if the button exists
    if (restartButton) {
        // Add a click event listener to the button
        restartButton.addEventListener('click', function() {
            guessedBosses = []
            bossToGuess = setBossToGuess()
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

    var tutoButton = document.getElementById('close')
    if (tutoButton){
        tutoButton.addEventListener('click', function(){
            tutoElement.style.display = 'none'
        })
    }
}

function clear() {
    let answercon = document.getElementById('answercon')
    answercon.innerHTML = ''
    let endId = document.getElementById('endId')
    endId.innerHTML = ''
}


// Call this function whenever a quiz is solved
function incrementSolvedCount() {
    fetch('../../server/datup.php')
        .then(response => response.text())
        .then(data => console.log(data))
        .catch(error => console.error('Error:', error));
}

function fetchDailyData() {
    fetch('../../server/dailysolved.php')
        .then(response => response.json())
        .then(data => {
            document.getElementById('alreadyDailySolved').innerHTML = data + ' people already found the boss';
        })
        .catch(error => console.error('Error:', error));
}
function incrementGlobalSolved() {
    fetch('../../server/endlessup.php')
        .then(response => response.text())
        .then(data => console.log(data))
        .catch(error => console.error('Error:', error));
}

function fetchEndlessSolved() {
    fetch('../../server/endlesssolved.php')
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('Error:', data.error);
            } else {
                document.getElementById('globalSolvedEndless').innerHTML =  data.globalSolvedEndless + ' times was the Endless mode solved already';
            }
        })
        .catch(error => console.error('Error:', error));
}

export function getGuessedbosses() {
    if (guessedBosses === null) {
        guessedBosses = [];
    }
    return guessedBosses;
}
