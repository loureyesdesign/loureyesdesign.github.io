
/* ==========================================================
   LOU REYES — THE ARCHIVE
   CINEMATIC COLLECTION INDEX
========================================================== */

"use strict";


/* ==========================================================
   01. HELPERS
========================================================== */

const $ = id => document.getElementById(id);

const pad = number =>
  String(number).padStart(2, "0");


/* ==========================================================
   02. RENDER COLLECTION CARDS
========================================================== */

function renderArchive() {

  const grid = $("archiveGrid");

  if (!grid) return;

  grid.replaceChildren();

  if (
    typeof CATEGORIES === "undefined" ||
    !Array.isArray(CATEGORIES)
  ) {
    console.error("Archive categories are unavailable.");
    return;
  }

  const total = CATEGORIES.length;

  CATEGORIES.forEach((category, index) => {

    const card = document.createElement("a");

    card.className = "archive-card";

    card.href =
      `collection.html?category=${encodeURIComponent(
        category.id
      )}`;

    card.dataset.category = category.id;
    card.dataset.title = category.title.toUpperCase();
    card.dataset.number = pad(index + 1);

    card.dataset.description =
      category.subtitle ||
      `Explore the ${category.title} collection.`;

    card.setAttribute(
      "aria-label",
      `Explore ${category.title} collection`
    );


    /* IMAGE */

    const image = document.createElement("div");
    image.className = "archive-card-image";

    const img = document.createElement("img");

    img.src = category.image;
    img.alt = `${category.title} collection`;

    // All six cards are visible immediately on desktop.
    img.loading = "eager";
    img.decoding = "async";

    image.appendChild(img);


    /* CARD LABEL */

    const meta = document.createElement("div");
    meta.className = "archive-card-meta";

    const title = document.createElement("span");
    title.className = "archive-card-title";
    title.textContent = category.title.toUpperCase();

    const number = document.createElement("span");
    number.className = "archive-card-number";
    number.textContent = pad(index + 1);

    meta.append(title, number);


    /* ASSEMBLE */

    card.append(image, meta);

    grid.appendChild(card);

  });

  const subtitle = $("archiveSubtitle");

  if (subtitle) {
    subtitle.textContent =
      `${total === 6 ? "SIX" : pad(total)} COLLECTIONS — ONE PRACTICE`;
  }

}


/* ==========================================================
   03. CINEMATIC ARCHIVE INTERACTION
========================================================== */

function initializeArchiveInteraction() {

  const archive = $("archiveShowcase");
  const grid = $("archiveGrid");

  const title = $("archiveTitle");
  const subtitle = $("archiveSubtitle");

  const description = $("archiveDescription");


  const backgrounds = [
    $("archiveBackgroundA"),
    $("archiveBackgroundB")
  ];

  if (
    !archive ||
    !grid ||
    !title ||
    !subtitle ||
    !description
  ) {
    return;
  }

  const cards = [
    ...grid.querySelectorAll(".archive-card")
  ];

  if (!cards.length) return;

  const total = cards.length;

  const touch = window.matchMedia(
    "(hover: none), (pointer: coarse)"
  );

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  const defaultDescription =
    "Select a collection to explore its contents.";

  let activeCard = null;
  let titleTimer = null;
  let resetTimer = null;
  let backgroundIndex = 0;


  /* ========================================================
     03A. DYNAMIC TITLE
  ======================================================== */

  function changeTitle(value) {

    clearTimeout(titleTimer);

    title.classList.toggle(
      "long-title",
      value.length > 10
    );

    if (title.textContent.trim() === value) {
      title.classList.remove("is-changing");
      return;
    }

    if (reducedMotion.matches) {
      title.textContent = value;
      title.classList.remove("is-changing");
      return;
    }

    title.classList.add("is-changing");

    titleTimer = setTimeout(() => {
      title.textContent = value;
      title.classList.remove("is-changing");
    }, 160);

  }


  /* ========================================================
     03B. CINEMATIC BACKGROUND
  ======================================================== */

  function changeBackground(src) {

    if (!src) {

      backgrounds.forEach(background => {
        background.classList.remove("is-visible");
      });

      return;
    }

    const nextIndex = 1 - backgroundIndex;

    const next = backgrounds[nextIndex];
    const previous = backgrounds[backgroundIndex];

    next.src = src;

    next.classList.add("is-visible");
    previous.classList.remove("is-visible");

    backgroundIndex = nextIndex;

  }


  /* ========================================================
     03C. ACTIVATE CATEGORY
  ======================================================== */

  function activate(card) {

    clearTimeout(resetTimer);

    if (activeCard === card) return;

    activeCard = card;

    const image = card.querySelector("img");

    const name = card.dataset.title;
    const number = card.dataset.number;

    archive.classList.add("has-selection");

    cards.forEach(item => {
      item.classList.toggle(
        "is-active",
        item === card
      );
    });

    changeTitle(name);

    if (image) {
      changeBackground(image.currentSrc || image.src);
    }

    subtitle.textContent =
      `SELECTED COLLECTION / ${number}`;

    description.textContent =
      card.dataset.description;


  }


  /* ========================================================
     03D. RESTORE DEFAULT ARCHIVE
  ======================================================== */

  function reset() {

    activeCard = null;

    archive.classList.remove("has-selection");

    cards.forEach(card => {
      card.classList.remove("is-active");
    });

    changeTitle("ARCHIVE");

    changeBackground(null);

    subtitle.textContent =
      `${total === 6 ? "SIX" : pad(total)} COLLECTIONS — ONE PRACTICE`;

    description.textContent = defaultDescription;

  }

  
  /* ========================================================
    ARCHIVE RETURN STATE
    Preserve the category after returning from Collection.
  ======================================================== */

  let returningFromCollection = false;

  window.archiveTransitionSelect = function(categoryId) {
    const card = cards.find(item =>
      item.dataset.category === categoryId
    );

    if (!card) return;

    returningFromCollection = true;
    activate(card);
  };

  window.archiveTransitionArmReset = function() {
    if (!returningFromCollection) return;

    function onPointerMove(event) {
      if (event.pointerType === "touch") return;

      returningFromCollection = false;

      document.removeEventListener(
        "pointermove",
        onPointerMove
      );

      const hoveredCard = event.target.closest(
        "#archiveGrid .archive-card"
      );

      if (hoveredCard) {
        activate(hoveredCard);
      } else {
        reset();
      }
    }

    document.addEventListener(
      "pointermove",
      onPointerMove
    );
  };


  /* ========================================================
     03E. MOUSE, KEYBOARD AND TOUCH
  ======================================================== */

  cards.forEach(card => {

    card.addEventListener("mouseenter", () => {

      if (!touch.matches) {
        activate(card);
      }

    });

    card.addEventListener("focus", () => {
      activate(card);
    });

    card.addEventListener("click", event => {

      // Touchscreens:
      // First tap selects and previews the category.
      // Second tap opens the Collection page.

      if (touch.matches && activeCard !== card) {
        event.preventDefault();
        activate(card);
      }

    });

  });


  /* ========================================================
     03F. RETURN TO DEFAULT ON MOUSE EXIT
  ======================================================== */

  grid.addEventListener("mouseleave", () => {

    if (returningFromCollection) return;

    if (touch.matches) return;

    clearTimeout(resetTimer);

    resetTimer = setTimeout(() => {
      reset();
    }, 180);

  });


  /* ========================================================
     03G. KEYBOARD FOCUS
  ======================================================== */

  grid.addEventListener("focusout", () => {

    setTimeout(() => {

      if (
        !touch.matches &&
        !grid.contains(document.activeElement)
      ) {
        reset();
      }

    }, 0);

  });


  /* ========================================================
     03I. BROWSER RESTORATION
  ======================================================== */

  window.addEventListener("pageshow", event => {

    if (event.persisted) {
      reset();
    }

  });

}


/* ==========================================================
   04. THEME
========================================================== */

function initializeTheme() {

  const lightButton = $("lightTheme");
  const darkButton = $("darkTheme");
  const themeColor = $("themeColor");

  if (!lightButton || !darkButton) return;

  function applyTheme(theme) {

    const nextTheme =
      theme === "light" ? "light" : "dark";

    document.documentElement.dataset.theme = nextTheme;

    localStorage.setItem(
      "lou-reyes-theme",
      nextTheme
    );

    lightButton.classList.toggle(
      "active",
      nextTheme === "light"
    );

    darkButton.classList.toggle(
      "active",
      nextTheme === "dark"
    );

    if (themeColor) {
      themeColor.setAttribute(
        "content",
        nextTheme === "light"
          ? "#e9e7e1"
          : "#111111"
      );
    }

  }

  lightButton.addEventListener("click", () => {
    applyTheme("light");
  });

  darkButton.addEventListener("click", () => {
    applyTheme("dark");
  });

  applyTheme(
    document.documentElement.dataset.theme
  );

}


/* ==========================================================
   05. FULLSCREEN MENU
========================================================== */

function initializeMenu() {

  const button = $("menuButton");
  const menu = $("menuScreen");
  const label = $("menuLabel");

  if (!button || !menu) return;

  function setMenu(open) {

    menu.classList.toggle("open", open);
    button.classList.toggle("active", open);

    button.setAttribute(
      "aria-expanded",
      String(open)
    );

    button.setAttribute(
      "aria-label",
      open ? "Close navigation" : "Open navigation"
    );

    menu.setAttribute(
      "aria-hidden",
      String(!open)
    );

    menu.inert = !open;

    if (label) {
      label.textContent = open ? "CLOSE" : "MENU";
    }

    document.body.classList.toggle(
      "menu-open",
      open
    );

  }

  button.addEventListener("click", () => {

    setMenu(
      !menu.classList.contains("open")
    );

  });

  document.addEventListener("keydown", event => {

    if (
      event.key === "Escape" &&
      menu.classList.contains("open")
    ) {
      setMenu(false);
      button.focus();
    }

  });

  menu.querySelectorAll("a").forEach(link => {

    link.addEventListener("click", () => {
      setMenu(false);
    });

  });

}


/* ==========================================================
   06. INITIALIZE
========================================================== */

function initializeArchivePage() {

  renderArchive();

  initializeTheme();
  initializeMenu();

  initializeArchiveInteraction();

}


/* ==========================================================
   INITIALIZE ARCHIVE

   The script is loaded at the end of archive.html,
   after the page elements already exist.
========================================================== */

initializeArchivePage();

