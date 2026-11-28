
/* ==========================================================
   LOU REYES — COLLECTION PAGE
========================================================== */

"use strict";


/* ==========================================================
   01. HELPERS
========================================================== */

const $ = id => document.getElementById(id);

const pad = number =>
  String(number).padStart(2, "0");

function categoryName(id) {
  return CATEGORIES.find(
    category => category.id === id
  )?.title || id;
}


/* ==========================================================
   02. READ COLLECTION FROM URL
========================================================== */

function getCollectionId() {

  const params = new URLSearchParams(window.location.search);

  return params.get("category");

}


/* ==========================================================
   03. RENDER COLLECTION PROJECTS
========================================================== */

function renderCollectionProjects(projects) {

  const grid = $("collectionGrid");

  grid.replaceChildren();

  if (!projects.length) {

    const empty = document.createElement("div");
    empty.className = "empty-collection";

    empty.textContent =
      "This collection is awaiting its first exhibit.";

    grid.appendChild(empty);
    return;

  }

  projects.forEach((project, index) => {

    const item = document.createElement("a");

    item.className = "collection-item";

    item.href =
      `work.html?project=${encodeURIComponent(project.id)}`;


    /* PROJECT NUMBER */

    const number = document.createElement("span");

    number.className = "collection-item-number";
    number.textContent = pad(index + 1);


    /* PROJECT IMAGE */

    const image = document.createElement("div");

    image.className = "collection-item-image";

    const img = document.createElement("img");

    img.src = project.image;
    img.alt = `${project.title} project cover`;
    img.loading = index < 2 ? "eager" : "lazy";
    img.decoding = "async";

    image.appendChild(img);


    /* PROJECT TITLE */

    const info = document.createElement("div");
    info.className = "collection-item-info";

    const title = document.createElement("h3");
    title.textContent = project.title;

    info.appendChild(title);


    /* PROJECT METADATA */

    const meta = document.createElement("p");
    meta.className = "micro";

    meta.textContent =
      `${categoryName(project.category)}` +
      (project.year ? ` / ${project.year}` : "");


    /* ASSEMBLE */

    item.append(number, image, info, meta);

    grid.appendChild(item);

  });

}


/* ==========================================================
   04. RENDER SELECTED COLLECTION
========================================================== */

function renderCollection() {

  const id = getCollectionId();

  const category = CATEGORIES.find(
    category => category.id === id
  );

  if (!category) {

    document.title = "Collection Not Found — Lou Reyes";

    $("collectionTitle").textContent =
      "NOT FOUND.";

    $("collectionDescription").textContent =
      "This collection could not be found. Return to the archive to explore the available disciplines.";

    $("collectionCount").textContent = "";


    return;

  }

  const projects = PROJECTS.filter(
    project => project.category === category.id
  );

  /* HERO IMAGE */

  const heroImage = $("collectionHeroImage");

  heroImage.src = category.image;
  heroImage.alt = `${category.title} collection artwork`;


  /* COLLECTION CONTENT */
  $("collectionTitle").textContent =
    category.title + ".";

  $("collectionDescription").textContent =
    category.description || "";

  $("collectionCount").textContent =
    `${pad(projects.length)} WORKS`;

  /* PAGE TITLE */

  document.title =
    `${category.title} — Lou Reyes`;


  /* PROJECT GRID */

  renderCollectionProjects(projects);

}


/* ==========================================================
   05. THEME
========================================================== */

function initializeTheme() {

  const lightButton = $("lightTheme");
  const darkButton = $("darkTheme");
  const themeColor = $("themeColor");

  function applyTheme(theme) {

    const nextTheme = theme === "light" ? "light" : "dark";

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

    themeColor.setAttribute(
      "content",
      nextTheme === "light"
        ? "#e9e7e1"
        : "#111111"
    );

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
   06. FULLSCREEN NAVIGATION
========================================================== */

function initializeMenu() {

  const button = $("menuButton");
  const menu = $("menuScreen");
  const label = $("menuLabel");

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
   07. INITIALIZE
========================================================== */

function initializeCollectionPage() {

  if (
    typeof CATEGORIES === "undefined" ||
    typeof PROJECTS === "undefined"
  ) {
    console.error("Portfolio data is unavailable.");

    document.documentElement.classList.add(
      "collection-ready"
    );

    return;
  }

  renderCollection();
  initializeTheme();
  initializeMenu();

  const heroImage = $("collectionHeroImage");

  function revealCollectionPage() {
    document.documentElement.classList.add("collection-ready");
  }

  if (!heroImage || !heroImage.getAttribute("src")) {
    revealCollectionPage();
    return;
  }

  if (heroImage.complete) {
    revealCollectionPage();
  } else {
    heroImage.addEventListener("load", revealCollectionPage, { once: true });
    heroImage.addEventListener("error", revealCollectionPage, { once: true });
  }
}

if (document.readyState === "loading") {

  document.addEventListener(
    "DOMContentLoaded",
    initializeCollectionPage
  );

} else {

  initializeCollectionPage();

}
