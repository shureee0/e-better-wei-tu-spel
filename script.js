// wrappable description box
document.querySelectorAll(".description-box").forEach(wrapper => {
  const text = wrapper.querySelector(".description");
  const button = wrapper.querySelector(".description-button");

  const collapsedHeight = text.clientHeight;

  button.addEventListener("click", () => {
    const expanded = text.classList.toggle("expanded");

    if (expanded) {
      text.style.maxHeight = text.scrollHeight + "px";
      button.textContent = "show les";
      text.classList.add('elipsis');
    } else {
      text.style.maxHeight = collapsedHeight + "px";
      button.textContent = "ried môr";
      let elipsisTimeout;
      clearTimeout(elipsisTimeout);
      elipsisTimeout = setTimeout(() => {
        text.classList.remove('elipsis');
      }, 300);
    }
  });

  window.addEventListener("resize", () => {
    if (text.classList.contains("expanded")) {
      text.style.maxHeight = text.scrollHeight + "px";
    }
  })
});

// converter
const textarea = document.getElementById("input");
const output = document.getElementById("output");
const placeholder = output.dataset.placeholder;
const readingBox = document.getElementById("reading");
const letterBox = document.getElementById("letter");
let selectedManually = false;

  // dictionary
let dictionary = {};
let letters = {};

fetch("dictionary.json")
  .then(res => res.json())
  .then(data => {
    dictionary = data;
    // Update entry count
    const entryCount = Object.keys(dictionary).length;
    const entriesElement = document.querySelector(".entries-number");
    if (entriesElement) {
      entriesElement.textContent = `${entryCount} entriz in thi dikcioneri.`;
    }
  })
  .catch(err => {
    console.error("Failed to load dictionary:", err);
  });

fetch("letters.json")
  .then(res => res.json())
  .then(data => {
    letters = data;
  })
  .catch(err => {
    console.error("Failed to load letters:", err);
  });

  // updated input
textarea.addEventListener("input", () => {
  const isPhone = window.innerWidth <= 768;
  textarea.style.height = isPhone ? "0rem" : "8rem";
  textarea.style.height = textarea.scrollHeight + "px";
  
  updateOutput();
});

  // update output
function updateOutput() {
  if (!selectedManually) {
    readingBox.textContent = "";
    letterBox.textContent = "";
  }

  if (textarea.value.trim() === "") {
    output.textContent = placeholder;
    output.classList.add("placeholder");
    
    selectedManually = false;
    readingBox.textContent = "";
    letterBox.textContent = "";
  } else {
    output.classList.remove("placeholder");
    findInDictionary();
  }
}

  // look up words in dictionary
function findInDictionary() {
  const text = textarea.value
  output.innerHTML = "";

  // create tokens (words and non-words)
  const tokens = text.match(/[A-Za-z]+|[^A-Za-z]+/g);
  if (!tokens) return;

  let lastKey = null;

  // Check if the input is ONLY a single word with no other characters (no spaces, punctuation, etc.)
  const isSingleWord = /^[A-Za-z]+$/.test(text.trim());
  let singleWordKey = null;

  tokens.forEach(token => {
    // if it's not a word
    if (!/^[A-Za-z]+$/.test(token)) {
      const character = document.createElement("span");
      character.textContent = token;
      output.appendChild(character);
      return;
    }

    const key = token.toLowerCase();

    if (dictionary[key]) {
      lastKey = key;
      singleWordKey = key;
      const entries = dictionary[key];

      // If it's a single word with multiple entries, show all options
      if (isSingleWord && entries.length > 1) {
        entries.forEach((entry) => {
          // Create a container for each entry
          const entryDiv = document.createElement("div");
          entryDiv.className = "output-section";

          // Add title if it exists
          if (entry.title) {
            const title = document.createElement("span");
            title.textContent = `${entry.title}: `;
            title.className = "output-title";
            entryDiv.appendChild(title);
          }

          // Add clickable spelling button
          const button = document.createElement("button");
          button.textContent = entry.spelling;
          button.className = "explanation-button";

          button.addEventListener("click", () => {
            selectedManually = true;
            buildReadingBox(entry.explanation);
            // automatically update letter box with first letter
            const firstReading = entry.explanation[0];
            if (firstReading && firstReading.letters && firstReading.letters.length > 0) {
              const firstLetter = firstReading.letters[0];
              buildLetterBox(firstLetter.class);
            }
          });

          entryDiv.appendChild(button);
          output.appendChild(entryDiv);
        });
      } else {
        // Normal mode: show first translation
        const firstEntry = entries[0];
        const firstTranslation = firstEntry.spelling;

        const button = document.createElement("button");
        button.textContent = firstTranslation;
        button.className = "explanation-button";

        button.addEventListener("click", () => {
          selectedManually = true;
          if (entries && entries.length > 0) {
            buildReadingBox(entries[0].explanation);
            // automatically update letter box with first letter
            const firstReading = entries[0].explanation[0];
            if (firstReading && firstReading.letters && firstReading.letters.length > 0) {
              const firstLetter = firstReading.letters[0];
              buildLetterBox(firstLetter.class);
            }
          }
        });

        output.appendChild(button);
      }
    } else {
      const span = document.createElement("span");
      span.textContent = token;
      span.className = "muted-text";

      output.appendChild(span);
    }
  })

  // on the first dictionary match
  if (!selectedManually && lastKey) {
    const entries = dictionary[lastKey];
    if (entries && entries.length > 0) {
      buildReadingBox(entries[0].explanation);
      // automatically update letter box with first letter
      const firstReading = entries[0].explanation[0];
      if (firstReading && firstReading.letters && firstReading.letters.length > 0) {
        const firstLetter = firstReading.letters[0];
        buildLetterBox(firstLetter.class);
      }
    }
  }
}

function buildReadingBox(readings) {
  readingBox.innerHTML = "";

  // One row wrapper per reading
  readings.forEach((reading) => {
    const row = document.createElement("div");
    row.className = "reading-row";

    // Title line (optional)
    if (reading.title) {
      const title = document.createElement("span");
      title.textContent = `${reading.title}: `;
      title.className = "reading-title";

      row.appendChild(title);
    }

    // Content line: letters + IPA
    const contentRow = document.createElement("div");
    contentRow.className = "reading-content";

    // Spelling chunk (letters + separators)
    const letterPhones = document.createElement("div");
    letterPhones.className = "letter-phones";

    reading.letters.forEach((letterObj, idx) => {
      const button = document.createElement("button");
      button.textContent = letterObj.letter;
      button.className = `letter-button ${letterObj.class}`;
      button.addEventListener("click", () => {
        buildLetterBox(letterObj.class);
      });
      letterPhones.appendChild(button);

      // separator dot between letters (not after last)
      if (idx < reading.letters.length - 1) {
        const dot = document.createElement("span");
        dot.textContent = "·";
        dot.className = "dot";
        letterPhones.appendChild(dot);
      }
    });

    contentRow.appendChild(letterPhones);

    const ipa = document.createElement("span");
    ipa.textContent = `/${reading.reading}/`;
    ipa.className = "ipa";
    contentRow.appendChild(ipa);

    row.appendChild(contentRow);
    readingBox.appendChild(row);
  });
}

function buildLetterBox(letterKey) {
  letterBox.innerHTML = "";
  if (letters[letterKey]) {
    const letterData = letters[letterKey];

    // header
    const letterHeader = document.createElement("div");
    letterHeader.className = "letter-header";

      // representation
    if (letterData.representation) {
      const representation = document.createElement("span");
      representation.textContent = letterData.representation;
      representation.className = "representation";
      letterHeader.appendChild(representation);
    }
    
      // condition name
    if (letterData.name) {
      const letterName = document.createElement("span");
      letterName.textContent = letterData.name;
      letterName.className = "letter-name";
      letterHeader.appendChild(letterName);
    }

      // IPA
    if (letterData.pronunciation && letterData.pronunciation.diaphoneme) {
      const letterPronunciation = document.createElement("span");
      letterPronunciation.textContent = `/${letterData.pronunciation.diaphoneme}/`;
      letterPronunciation.className = "ipa";
      letterHeader.appendChild(letterPronunciation);
    }

    letterBox.appendChild(letterHeader);

    // condition section
    if (letterData.condition) {
      const conditionRow = document.createElement("div");
      conditionRow.className = "letter-section";

      const conditionHeader = document.createElement("span");
      conditionHeader.textContent = "Kondicion:";
      conditionHeader.className = "letter-section-header";
      conditionRow.appendChild(conditionHeader);

      const letterCondition = document.createElement("span");
      letterCondition.textContent = letterData.condition;
      letterCondition.className = "letter-description";
      conditionRow.appendChild(letterCondition);

      letterBox.appendChild(conditionRow);
    }

    // examples section
    if (letterData.examples) {
      const examplesRow = document.createElement("div");
      examplesRow.className = "letter-section";

      const examplesHeader = document.createElement("span");
      examplesHeader.textContent = "Exzampelz:";
      examplesHeader.className = "letter-section-header";
      examplesRow.appendChild(examplesHeader);

      const examplesText = letterData.examples.join(", ");
      const examplesSpan = document.createElement("span");
      examplesSpan.textContent = examplesText;
      examplesSpan.className = "letter-examples";
      examplesRow.appendChild(examplesSpan);

      letterBox.appendChild(examplesRow);
    }

    // note section
    if (letterData.note) {
      const noteRow = document.createElement("div");
      noteRow.className = "letter-section";

      const noteSpan = document.createElement("span");
      noteSpan.textContent = letterData.note;
      noteSpan.className = "letter-description";
      noteRow.appendChild(noteSpan);

      letterBox.appendChild(noteRow);
    }
  }
}

function space(destination) {
  const space = document.createElement("span");
  space.textContent = " ";
  destination.appendChild(space);
}

function lineBreak(destination) {
  const br = document.createElement("br");
  destination.appendChild(br);
}

updateOutput();