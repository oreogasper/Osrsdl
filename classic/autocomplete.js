// Import bosses and functions
import { bosses } from './main.js';
import { getGuessedbosses } from './main.js';

let lowerCaseGuessedOperators;
let matchingNames;

window.addEventListener('guessedOperatorsLoaded', function () {
    // Autocomplete ready
    console.log('autocomplete is ready');

    // Get a list of operator names
    let availableNames = bosses.map(operator => operator.name);
    let usedNames = []; // List of used names

    // Clear used names on custom event
    window.addEventListener('clearUsedNames', function () {
        usedNames = [];
        return usedNames;
    });

    // DOM elements
    const autoBox = document.querySelector('.auto-box');
    const inputField = document.getElementById('inputField');
    const resultsContainer = document.getElementById('output');
    const searchButton = document.getElementById('searchButton'); // Assuming this exists in your HTML

    if (inputField) {
        // Add an input event listener to the input field
        inputField.addEventListener('input', () => {
            let inputValue = inputField.value.trim(); // Trim to remove extra spaces

            // Clear the results container
            resultsContainer.innerHTML = '';

            // Only display matching bosses if the input field is not empty
            if (inputValue) {
                lowerCaseGuessedOperators = getGuessedbosses().map(operator => operator.toLowerCase());
                matchingNames = availableNames.filter(name => {
                    return (
                        name.toLowerCase().startsWith(inputValue.toLowerCase()) &&
                        !usedNames.includes(name.toLowerCase()) &&
                        !lowerCaseGuessedOperators.includes(name.toLowerCase())
                    );
                });

                display(matchingNames);
            } else {
                // Clear the autoBox when the input field is empty
                autoBox.innerHTML = '';
            }
        });
    }

    // Display matching results in the autoBox
    function display(result) {
        const content = result
            .map(
                name =>
                    `<li class="operator-suggestion" onclick="selectInput(this)">
                        <img src="../images/mobs/${name.replace(/ /g, '_')}.png" class="operator-image">
                        ${name}
                    </li>`
            )
            .join('');
        autoBox.innerHTML = `<ul>${content}</ul>`;
    }

    // Handle selection of a suggestion
    window.selectInput = function (list) {
        inputField.value = list.textContent.trim(); // Autofill input field
        autoBox.innerHTML = ''; // Clear suggestions
        usedNames.push(list.textContent.trim().replace(/ /g, '_')); // Add used name

        // Trigger search or further processing
        if (searchButton) {
            searchButton.click(); // Simulate clicking the search button
        } else {
            console.warn('Search button not found. Trigger custom logic here.');
        }
    };
});
