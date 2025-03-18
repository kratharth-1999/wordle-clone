const wordLength = 5;
const totalRows = 6;
let currentIndex = 0;
let currentRow = 0;
let currentGuess = "";
let wordOfTheDay = null;
const loaderRef = document.getElementById("loader");
const successMessageRef = document.getElementById("success-message");
const failureMessageRef = document.getElementById("failure-message");
const container = document.getElementById("wordle-container");

async function getWordOfTheDay() {
    try {
        loaderRef.style.visibility = "visible";
        const wordOfTheDayPromise = await fetch(
            "https://words.dev-apis.com/word-of-the-day"
        );
        if (!wordOfTheDayPromise.ok)
            throw new Error("Error fetching word of the day!");
        const wordOfTheDayResponse = await wordOfTheDayPromise.json();
        return wordOfTheDayResponse.word;
    } catch (error) {
        alert(error.message);
    } finally {
        loaderRef.style.visibility = "hidden";
    }
}

async function isValidWord(word) {
    try {
        loaderRef.style.visibility = "visible";
        const isValidWordPromise = await fetch(
            "https://words.dev-apis.com/validate-word",
            {
                method: "POST",
                body: JSON.stringify({ word: word }),
            }
        );
        if (!isValidWordPromise.ok)
            throw new Error("Error checking the validity of the word!");
        const isValidWordResponse = await isValidWordPromise.json();
        return isValidWordResponse.validWord;
    } catch (error) {
        alert(error.message);
    } finally {
        loaderRef.style.visibility = "hidden";
    }
}

function isLetter(letter) {
    return /^[a-zA-Z]$/.test(letter);
}

function evaluateLetter(letter, index) {
    /* Function used to determine what background color to show for a tile */
    if (wordOfTheDay[index] === letter.toLowerCase())
        return "valid" /* If the letter is in the correct position, return valid */;
    else if (
        (wordOfTheDay.slice(0, index) + wordOfTheDay.slice(index + 1)).includes(
            letter.toLowerCase()
        )
    ) {
        return "partially-valid"; /* If the letter exists but is in a different position then return partially-valid */
    } else {
        return "invalid"; /* If the letter does not exist at all */
    }
}

async function evaluateWord() {
    const validWord = await isValidWord(currentGuess);
    if (!validWord) {
        /* If the word is not a valid <wordLength> letter word then show a red border animation */
        for (let i = 1; i <= wordLength; i++) {
            document
                .getElementById(`letter-${wordLength * currentRow + i}`)
                .classList.add("blink");
        }
    } else {
        for (let i = 1; i <= wordLength; i++) {
            const tile = document.getElementById(
                `letter-${wordLength * currentRow + i}`
            );
            const letterEvaluation = evaluateLetter(tile.innerText, i - 1);
            switch (letterEvaluation) {
                case "valid":
                    tile.classList.add("flip-green");
                    break;
                case "partially-valid":
                    tile.classList.add("flip-yellow");
                    break;
                case "invalid":
                    tile.classList.add("flip-grey");
                    break;
            }
            tile.style.animationDelay = `${(i - 1) * 500}ms`;
        }
        /* Show final result or allow user to guess the next word. Do this only after the previous row evaluation is complete */
        setTimeout(() => {
            if (currentGuess === wordOfTheDay) {
                document.removeEventListener("keydown", handleKeyPress, true);
                successMessageRef.setAttribute("style", "visibility:visible");
            } else if (currentRow == totalRows - 1) {
                document.removeEventListener("keydown", handleKeyPress, true);
                successMessageRef.setAttribute("style", "display:none");
                failureMessageRef.setAttribute("style", "visibility:visible");
                failureMessageRef = failureMessageRef.innerText + wordOfTheDay;
            } else {
                currentIndex = 0;
                currentRow++;
                currentGuess = "";
            }
        }, 500 * wordLength);
    }
}

function handleKeyPress(event) {
    if (isLetter(event.key)) {
        /* Check if the key typed is a valid letter */
        if (currentGuess.length == wordLength)
            return; /* Only <wordLength> letters allowed in a row */
        document.getElementById(
            `letter-${wordLength * currentRow + ++currentIndex}`
        ).innerText = event.key;
        currentGuess += event.key.toLowerCase();
    } else if (event.key === "Enter") {
        if (currentGuess.length != wordLength)
            return; /* User can hit enter only after wordLength letters in a row */
        evaluateWord();
    } else if (event.key === "Backspace") {
        if (currentGuess.length == 0)
            return; /* Backspace does not work if there are no letters */
        document.getElementById(
            `letter-${wordLength * currentRow + currentIndex--}`
        ).innerText = null;
        currentGuess = currentGuess.slice(0, currentGuess.length - 1);
    }
}

async function main() {
    /* Makes the grid from the word length and number of rows variable */
    container.setAttribute(
        "style",
        `grid-template-columns:repeat(${wordLength},1fr)`
    );
    for (let i = 1; i <= wordLength * totalRows; i++) {
        const div = document.createElement("div");
        div.classList.add("letter-box");
        div.id = `letter-${i}`;
        container.appendChild(div);
    }
    wordOfTheDay = await getWordOfTheDay();
    if (wordOfTheDay) document.addEventListener("keydown", handleKeyPress);
}

main();

function handlePlayClick() {
    document.getElementById("overlay").setAttribute("style", "display:none");
    document.getElementById("letter-1").focus();
}
