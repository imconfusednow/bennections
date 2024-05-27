const version = 1;

const categories = [
  {
    label: "LEAVE OUT",
    colour: "rgb(249, 223, 109)",
    emoji: "🟨",
    entries: ["SKIP", "MISS", "OMIT", "OVERLOOK"],
    completed: false,
  },
  {
    label: "GET GOOD AT A SKILL",
    colour: "rgb(160, 195, 90)",
    emoji: "🟩",
    entries: ["MASTER", "PERFECT", "HONE", "TRAIN"],
    completed: false,
  },
  {
    label: "____ SALE",
    colour: "rgb(176, 196, 239)",
    emoji: "🟦",
    entries: ["JUMBLE", "WHOLE", "CAR-BOOT", "FIRE"],
    completed: false,
  },
  {
    label: "ENDING IN COMPUTER HARDWARE TERMS",
    colour: "rgb(186, 129, 197)",
    emoji: "🟪",
    entries: ["ANAGRAM", "INCASE", "OVERDRIVE", "TITMOUSE"],
    completed: false,
  },
];

let catMap = {};

categories.forEach((cat) => {
  cat.entries.forEach((entry) => {
    catMap[entry] = cat;
  });
});

const options = categories
  .map((category) => {
    return category.entries;
  })
  .flat();

let lives = 4;

let selected = new Set([]);
let completed = new Set([]);
let guesses = [];

const tileWrapper = document.querySelector("#tile-wrapper");
const livesDiv = document.querySelector("#lives-div");
const shuffleButton = document.querySelector("#shuffle-button");
const submitButton = document.querySelector("#submit-button");
const deselectButton = document.querySelector("#deselect-button");
const finishDialog = document.querySelector("#finish-dialog");
const closeModal = document.querySelector("#close-modal");
const viewResultsButton = document.querySelector("#view-results");
const shareButton = document.querySelector("#share-button");

shuffleButton.addEventListener("click", shuffle);
deselectButton.addEventListener("click", () => {
  clearSelected();
});
submitButton.addEventListener("click", guess);
closeModal.addEventListener("click", () => {
  finishDialog.close();
});
viewResultsButton.addEventListener("click", () => {
  finishDialog.showModal();
});
shareButton.addEventListener("click", () => {
  resultsToClip();
});


function reDraw() {
  tileWrapper.innerHTML = "";
  livesDiv.innerHTML = "";
  const completedCats = new Set([...completed].map((cat) => cat.label));

  drawCategories(completed);

  for (option of options) {
    const currentCategory = catMap[option];
    if (completedCats.has(currentCategory.label)) {
      continue;
    }
    const tile = document.createElement("div");
    tile.innerText = option;
    tile.classList.add("tile");
    tileWrapper.append(tile);
    if (selected.has(option)) {
      selectTile(tile);
    }

    tile.addEventListener("click", (event) => tileClicked(event));
  }

  for (let i in [...Array(lives).keys()]) {
    const life = document.createElement("span");
    life.classList.add("life");
    livesDiv.append(life);
  }

  disableButtons();
}

function drawCategories(currentCategories) {
  for (category of currentCategories) {
    const catBlock = document.createElement("div");
    const label = document.createElement("span");
    const options = document.createElement("span");
    label.innerText = category.label;
    options.innerText = category.entries.join(", ");
    catBlock.append(label, options);
    catBlock.classList.add("category");
    catBlock.style.backgroundColor = category.colour;
    tileWrapper.append(catBlock);
  }
}

function tileClicked(event) {
  const tile = event.currentTarget;
  if (tile.classList.contains("complete")) {
    return;
  }

  if (selected.has(tile.innerText)) {
    selected.delete(tile.innerText);
    saveSet("selected", selected);
    tile.classList.remove("selected");
  } else if (selected.size < 4) {
    selectTile(tile);
  }
  disableButtons();
}

function selectTile(tile) {
  selected.add(tile.innerText);
  tile.classList.add("selected");
  saveSet("selected", selected);
}

function guess() {
  let correct = false;

  for (guess of guesses) {
    if (arraysEqual(guess, [...selected])) {
      toast("Already Guessed");
      return;
    }
  }

  for (category of categories) {
    if (arraysEqual(category.entries, [...selected])) {
      correct = true;
      category.completed = true;
      completed.add(category);
      saveSet("completed", completed);
    } else if (oneAway(category.entries, [...selected])) {
      toast("One away!");
    }
  }

  guesses.push([...selected]);
  localStorage.setItem("guesses", JSON.stringify(guesses));

  if (correct) {
    if (completed.size >= 4) {
      finish();
    }
    clearSelected();
  } else {
    document
      .querySelector(".selected")
      .addEventListener("animationend", reDraw);
    [...document.querySelectorAll(".selected")].forEach((selection) => {
      selection.classList.add("shake");
    });
    lives--;
    localStorage.setItem("lives", lives);

    if (lives <= 0) {
      finish();
    }
  }
}

function arraysEqual(array1, array2) {
  return array1.sort().join(",") === array2.sort().join(",");
}

function oneAway(array1, array2) {
  let count = 0;
  for (entry of array1) {
    if (array2.includes(entry)) {
      count++;
    }
  }
  return count == 3 ? true : false;
}

function clearSelected() {
  selected.clear();
  saveSet("selected", selected);
  reDraw();
}

function shuffle() {
  options.sort(() => Math.random() - 0.5);
  reDraw();
}

function finish() {
  if (lives <= 0) {
    document.querySelector("#feedback").innerText = "Next Time!";
    completed = categories;
    reDraw();
  } else if (guesses.length == 16) {
    document.querySelector("#feedback").innerText = "Perfect!";
  }
  document.querySelector("#buttons-div").hidden = true;
  document.querySelector("#show-results-div").hidden = false;
  addGuesses();
  finishDialog.showModal();
}

function addGuesses() {
  const guessDiv = document.querySelector("#guess-history");
  for (guess of guesses.flat()) {
    const div = document.createElement("div");
    div.classList.add("result-square");
    div.style.backgroundColor = catMap[guess].colour;
    guessDiv.append(div);
  }
}

function disableButtons() {
  if (selected.size > 3) {
    submitButton.disabled = false;
  } else {
    submitButton.disabled = true;
  }
  if (selected.size > 0) {
    deselectButton.disabled = false;
  } else {
    deselectButton.disabled = true;
  }
}

function toast(msg) {
  const toastDiv = document.querySelector("#toast");
  toastDiv.classList.remove("hidden");
  toastDiv.innerText = msg;
  setTimeout(() => {
    toastDiv.classList.add("hidden");
  }, 2000);
}

function getStorage() {
  if (localStorage.getItem("version") != version) {
    localStorage.clear();
    localStorage.setItem("version", version);
  }

  lives = parseInt(localStorage.getItem("lives")) || lives;

  selected = loadSet("selected", selected);
  completed = loadSet("completed", completed);
  guesses = localStorage.getItem("guesses")
    ? JSON.parse(localStorage.getItem("guesses"))
    : guesses;
}

function loadSet(key, fallback) {
  if (localStorage.getItem(key)) {
    return new Set(JSON.parse(localStorage.getItem(key)));
  }
  return fallback;
}

function saveSet(key, value) {
  localStorage.setItem(key, JSON.stringify([...value]));
}

function resultsToClip() {
    let string =`Bennections\nPuzzle #${version}\n`;
    for (guess of guesses) {
        for (option of guess) {
            string += catMap[option].emoji;
        }
        string += "\n";
    }
    navigator.clipboard.writeText(string);
    alert("Copied to Clipboard!");
}

getStorage();
if (completed.size >= 4) {
  finish();
}
shuffle();
reDraw();
