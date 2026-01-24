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
let customWordSelections = {}; // Track custom selections for words
let manuallySelectedWords = {}; // Track which words have been manually selected from dropdown

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
    customWordSelections = {};
    manuallySelectedWords = {};
    readingBox.textContent = "";
    letterBox.textContent = "";
  } else {
    output.classList.remove("placeholder");
    findInDictionary();
  }
}

  // Capitalize word based on input pattern
function capitalizeByPattern(word, inputWord) {
  if (!inputWord) return word;
  
  // Rule 1: If input is 1 letter and uppercase, capitalize first letter of output
  if (inputWord.length === 1 && inputWord === inputWord.toUpperCase()) {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }
  
  // Rule 2: If input is longer and both first and last letters are uppercase, make all uppercase
  if (inputWord.length > 1 && 
      inputWord.charAt(0) === inputWord.charAt(0).toUpperCase() && 
      inputWord.charAt(inputWord.length - 1) === inputWord.charAt(inputWord.length - 1).toUpperCase()) {
    return word.toUpperCase();
  }
  
  // Rule 3: If input is longer and starts with uppercase but doesn't end with uppercase, capitalize first letter only
  if (inputWord.length > 1 && 
      inputWord.charAt(0) === inputWord.charAt(0).toUpperCase() && 
      inputWord.charAt(inputWord.length - 1) === inputWord.charAt(inputWord.length - 1).toLowerCase()) {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }
  
  // Default: lowercase
  return word.toLowerCase();
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

  // Track which word instances are present in current input
  const currentWordInstances = new Set();
  let wordInstanceCounter = {};

  tokens.forEach(token => {
    // if it's not a word
    if (!/^[A-Za-z]+$/.test(token)) {
      const character = document.createElement("span");
      character.textContent = token;
      output.appendChild(character);
      return;
    }

    const key = token.toLowerCase();
    
    // Track instances: "they" appears twice -> "they_0", "they_1"
    if (!wordInstanceCounter[key]) {
      wordInstanceCounter[key] = 0;
    }
    const instanceKey = `${key}_${wordInstanceCounter[key]}`;
    wordInstanceCounter[key]++;
    currentWordInstances.add(instanceKey);

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
          const capitalizedSpelling = capitalizeByPattern(entry.spelling, text.trim());
          button.textContent = capitalizedSpelling;
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
        // Normal mode: show translation
        const selectedIndex = customWordSelections[instanceKey] || 0;
        const selectedEntry = entries[selectedIndex];
        const translation = selectedEntry.spelling;
        
        // Apply capitalization based on THIS specific instance's casing
        const capitalizedTranslation = capitalizeByPattern(translation, token);

        const wordWrapper = document.createElement("span");
        wordWrapper.className = "word-wrapper";
        wordWrapper.style.position = "relative";
        wordWrapper.style.display = "inline-block";

        const button = document.createElement("button");
        button.textContent = capitalizedTranslation;
        button.className = "explanation-button";

        // Show count badge if multiple entries and not manually selected
        if (entries.length > 1 && !manuallySelectedWords[instanceKey]) {
          const badge = document.createElement("sup");
          badge.textContent = entries.length;
          badge.className = "entry-count-badge";
          button.appendChild(badge);
        }

        button.addEventListener("click", () => {
          selectedManually = true;
          if (entries.length > 1) {
            // Show dropdown
            showEntryDropdown(wordWrapper, instanceKey, entries, selectedIndex, token);
          } else {
            buildReadingBox(entries[0].explanation);
            const firstReading = entries[0].explanation[0];
            if (firstReading && firstReading.letters && firstReading.letters.length > 0) {
              const firstLetter = firstReading.letters[0];
              buildLetterBox(firstLetter.class);
            }
          }
        });

        wordWrapper.appendChild(button);
        output.appendChild(wordWrapper);
      }
    } else {
      const span = document.createElement("span");
      span.textContent = token;
      span.className = "muted-text";

      output.appendChild(span);
    }
  })

  // Clean up selections for word instances no longer in input
  Object.keys(customWordSelections).forEach(instanceKey => {
    if (!currentWordInstances.has(instanceKey)) {
      delete customWordSelections[instanceKey];
      delete manuallySelectedWords[instanceKey];
    }
  });

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

function showEntryDropdown(parentElement, instanceKey, entries, currentIndex, originalToken) {
  // Remove any existing dropdown
  const existingDropdown = document.querySelector(".entry-dropdown");
  if (existingDropdown) {
    existingDropdown.remove();
  }

  const dropdown = document.createElement("div");
  dropdown.className = "entry-dropdown";

  entries.forEach((entry, index) => {
    const option = document.createElement("div");
    option.className = "dropdown-option" + (index === currentIndex ? " selected" : "");

    if (entry.title) {
      const title = document.createElement("span");
      title.textContent = entry.title;
      title.className = "dropdown-title";
      option.appendChild(title);
    }

    const spelling = document.createElement("span");
    // Apply capitalization to dropdown options based on the original token
    spelling.textContent = capitalizeByPattern(entry.spelling, originalToken);
    spelling.className = "dropdown-spelling";
    option.appendChild(spelling);

    option.addEventListener("click", () => {
      customWordSelections[instanceKey] = index;
      manuallySelectedWords[instanceKey] = true;
      dropdown.remove();
      updateOutput();
      selectedManually = true;
      buildReadingBox(entry.explanation);
      const firstReading = entry.explanation[0];
      if (firstReading && firstReading.letters && firstReading.letters.length > 0) {
        const firstLetter = firstReading.letters[0];
        buildLetterBox(firstLetter.class);
      }
    });

    dropdown.appendChild(option);
  });

  // Append to body to use fixed positioning
  document.body.appendChild(dropdown);

  // Position the dropdown
  setTimeout(() => {
    const buttonRect = parentElement.getBoundingClientRect();
    let top = buttonRect.bottom + 8; // 8px offset for margin-top

    // Get the dropdown dimensions
    const dropdownWidth = dropdown.offsetWidth;
    
    // Try to align with button left, but adjust if off-screen
    let left = buttonRect.left;
    
    // Check if dropdown goes off-screen to the right
    if (left + dropdownWidth > window.innerWidth - 10) {
      // Move it left so it fits on screen
      left = window.innerWidth - dropdownWidth - 10;
    }

    // Make sure it doesn't go off-screen to the left
    if (left < 10) {
      left = 10;
    }

    dropdown.style.left = left + "px";
    dropdown.style.top = top + "px";

    // Close dropdown when clicking outside
    document.addEventListener("click", function closeDropdown(e) {
      if (!parentElement.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.remove();
        document.removeEventListener("click", closeDropdown);
      }
    });
  }, 0);
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