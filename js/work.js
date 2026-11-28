"use strict";

/* ==========================================================
   LOU REYES — INDIVIDUAL WORK PAGE

   01. CORE HELPERS
   02. UNIVERSAL GALLERY NAVIGATION
   03. PROJECT DATA
   04. SHARED PRESENTATION COMPONENTS
   05. EDITORIAL
   06. PACKAGING
   07. BRAND IDENTITY
   08. DIGITAL
   09. UI/UX
   10. PHOTOGRAPHY
   11. POSTERS
   12. DEFAULT PRESENTATION
   13. IMAGE INFORMATION
   14. PROJECT RENDERER
   15. NEXT PROJECT
   16. LIGHTBOX
   17. THEME
   18. FULLSCREEN NAVIGATION
   19. INITIALIZATION
========================================================== */


/* ==========================================================
   01. CORE HELPERS
========================================================== */

const $ = id => document.getElementById(id);

const pad = number =>
  String(number).padStart(2, "0");


/* ----------------------------------------------------------
   PROJECT STATE
---------------------------------------------------------- */

const workState = {
  project: null,
  images: [],
  lightboxIndex: 0,
  zoom: 1,
  panX: 0,
  panY: 0,
  lastFocus: null
};


/* ----------------------------------------------------------
   URL HELPERS
---------------------------------------------------------- */

function getProjectId() {

  const params = new URLSearchParams(
    window.location.search
  );

  return params.get("project");

}


function getCategoryTitle(id) {

  const category = CATEGORIES.find(
    item => item.id === id
  );

  return category ? category.title : id;

}


/* ----------------------------------------------------------
   IMAGE DATA
---------------------------------------------------------- */

function getImageData(image, index) {

  if (typeof image === "string") {

    return {
      src: image,
      label: `IMAGE ${pad(index + 1)}`,
      description: "",
      credits: [],
      group: "mockup"
    };

  }

  return {
    src: image.src,

    label:
      image.label ||
      `IMAGE ${pad(index + 1)}`,

    description:
      image.description || "",

    credits:
      Array.isArray(image.credits)
        ? image.credits
        : [],

    group:
      image.group || "mockup"
  };

}


function normalizeImages(images) {

  return (images || [])
    .map(getImageData)
    .filter(image =>
      typeof image.src === "string" &&
      image.src
    );

}


/* ----------------------------------------------------------
   ELEMENT CREATION
---------------------------------------------------------- */

function makeElement(tag, className, text) {

  const element = document.createElement(tag);

  if (className) {
    element.className = className;
  }

  if (text !== undefined) {
    element.textContent = text;
  }

  return element;

}


/* ==========================================================
   02. UNIVERSAL GALLERY NAVIGATION

   Single shared implementation.

   Every gallery uses this controller.

   The controller owns:
   - Arrow elements and icons
   - Click handling
   - Keyboard navigation
   - Navigation boundaries
   - Disabled states
   - Activation feedback
   - Interaction availability

   Galleries own:
   - Their current image
   - Their total image count
   - Their unique presentation animation
========================================================== */


/* ----------------------------------------------------------
   KEYBOARD AVAILABILITY
---------------------------------------------------------- */

function workGalleryKeyboardAllowed(event) {

  if (
    event.defaultPrevented ||
    event.ctrlKey ||
    event.altKey ||
    event.metaKey ||
    event.shiftKey
  ) {
    return false;
  }

  if (
    event.key !== "ArrowLeft" &&
    event.key !== "ArrowRight"
  ) {
    return false;
  }

  if (
    document.querySelector(".work-lightbox.open") ||
    document.body.classList.contains("menu-open")
  ) {
    return false;
  }

  const target = event.target;

  if (
    target instanceof Element &&
    target.closest(
      'input, textarea, select, [contenteditable]:not([contenteditable="false"])'
    )
  ) {
    return false;
  }

  return true;

}

function setGalleryArrowIcon(button, direction) {

  const namespace =
    "http://www.w3.org/2000/svg";

  const svg = document.createElementNS(
    namespace,
    "svg"
  );

  svg.setAttribute("viewBox", "0 0 32 32");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.1");
  svg.setAttribute("stroke-linecap", "square");
  svg.setAttribute("stroke-linejoin", "miter");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");

  const path = document.createElementNS(
    namespace,
    "path"
  );

  path.setAttribute(
    "d",
    direction === -1
      ? "M27 16H5 M12 9L5 16L12 23"
      : "M5 16H27 M20 9L27 16L20 23"
  );

  svg.appendChild(path);

  button.replaceChildren(svg);

  button.type = "button";

  button.classList.add(
    "work-gallery-arrow"
  );

  button.setAttribute(
    "aria-label",
    direction === -1
      ? "Previous image"
      : "Next image"
  );

}


/* ----------------------------------------------------------
   UNIVERSAL NAVIGATION CONTROLLER
---------------------------------------------------------- */

function createGalleryNavigation({
  element,
  previous,
  next,
  getIndex,
  getCount,
  onNavigate,
  isActive = () => true,
  isBusy = () => false,
  loop = false
}) {

  setGalleryArrowIcon(previous, -1);
  setGalleryArrowIcon(next, 1);

  let activatedButton = null;
  let activationTimer = null;


  /* ========================================================
     UNIVERSAL BUTTON STATES
  ======================================================== */

  function sync() {

    const index = getIndex();
    const count = getCount();

    const unavailable =
      !isActive() ||
      isBusy() ||
      count < 2;

    const activating =
      activatedButton !== null;

    previous.disabled =
      unavailable ||
      (!loop && index <= 0) ||
      (
        activating &&
        activatedButton !== previous
      );

    next.disabled =
      unavailable ||
      (!loop && index >= count - 1) ||
      (
        activating &&
        activatedButton !== next
      );

  }


  /* ========================================================
     CLEAR ACTIVATION
  ======================================================== */

  function clearActivation() {

    clearTimeout(activationTimer);

    previous.classList.remove(
      "is-activated"
    );

    next.classList.remove(
      "is-activated"
    );

    activatedButton = null;

    sync();

  }


  /* ========================================================
     ACTIVATE BUTTON
  ======================================================== */

  function activate(button) {

    clearTimeout(activationTimer);

    previous.classList.remove(
      "is-activated"
    );

    next.classList.remove(
      "is-activated"
    );

    activatedButton = button;

    button.classList.add(
      "is-activated"
    );

    sync();

    activationTimer = setTimeout(() => {

      if (activatedButton === button) {
        clearActivation();
      }

    }, 220);

  }


  /* ========================================================
     UNIVERSAL NAVIGATION
  ======================================================== */

  function move(direction) {

    if (
      !element.isConnected ||
      !isActive() ||
      isBusy()
    ) {
      return false;
    }

    sync();

    const button =
      direction === -1
        ? previous
        : next;

    if (button.disabled) {
      return false;
    }

    const target =
      getIndex() + direction;

    if (
      !loop &&
      (
        target < 0 ||
        target >= getCount()
      )
    ) {
      return false;
    }

    const result = onNavigate(direction);

    if (result === false) {
      return false;
    }

    activate(button);

    return true;

  }


  /* ========================================================
     POINTER CONTROLS
  ======================================================== */

  previous.addEventListener(
    "click",
    () => move(-1)
  );

  next.addEventListener(
    "click",
    () => move(1)
  );


  /* ========================================================
     KEYBOARD CONTROLS
  ======================================================== */

  function handleKeydown(event) {

    if (!element.isConnected) {

      document.removeEventListener(
        "keydown",
        handleKeydown
      );

      clearTimeout(activationTimer);

      return;

    }

    if (!workGalleryKeyboardAllowed(event)) {
      return;
    }

    const direction =
      event.key === "ArrowRight"
        ? 1
        : -1;

    if (move(direction)) {
      event.preventDefault();
    }

  }

  document.addEventListener(
    "keydown",
    handleKeydown
  );


  /* ========================================================
     INITIAL STATE
  ======================================================== */

  sync();

  return {
    sync
  };

}

/* ==========================================================
   03. PROJECT DATA
========================================================== */

function findProject() {

  const id = getProjectId();

  return PROJECTS.find(
    project => project.id === id
  ) || null;

}


/* ==========================================================
   04. SHARED PRESENTATION COMPONENTS
========================================================== */


/* ----------------------------------------------------------
   IMAGE BUTTON
---------------------------------------------------------- */

function makeImageButton(image, index, className = "") {

  const button = makeElement(
    "button",
    `work-image-button ${className}`
  );

  button.type = "button";

  button.setAttribute(
    "aria-label",
    `View ${image.label} fullscreen`
  );

  const img = document.createElement("img");

  img.src = image.src;
  img.alt = image.label;

  img.loading =
    index === 0 ? "eager" : "lazy";

  img.decoding = "async";

  button.appendChild(img);

  button.addEventListener("click", () => {
    openLightbox(index);
  });

  return button;

}


/* ==========================================================
   SHARED STANDARD IMAGE GALLERY

   Used by:
   - Packaging Mockups
   - Packaging Assets
   - Identity Applications
   - Identity Assets
   - Digital Design Gallery

   All navigation uses createGalleryNavigation().
========================================================== */

function createStandardGallery(entries, options = {}) {

  /* --------------------------------------------------------
     STRUCTURE
  -------------------------------------------------------- */

  const panel = makeElement(
    "div",
    "website-view-panel"
  );

  const gallery = makeElement(
    "div",
    "website-design-gallery"
  );

  const visual = makeElement(
    "div",
    "website-design-visual"
  );

  const imageButton = makeElement(
    "button",
    "work-image-button website-design-image"
  );

  imageButton.type = "button";

  const imageElement = document.createElement("img");

  imageElement.decoding = "async";

  imageButton.appendChild(imageElement);

  const placeholder = makeElement(
    "p",
    "shared-gallery-placeholder",
    "IMAGES COMING SOON"
  );

  visual.append(
    imageButton,
    placeholder
  );


  /* --------------------------------------------------------
     CONTROLS
  -------------------------------------------------------- */

  const controls = makeElement(
    "div",
    "website-design-controls"
  );

  const counter = makeElement(
    "span",
    "micro"
  );

  const instruction = makeElement(
    "span",
    "micro muted",
    options.instruction || "EXPLORE THE IMAGES"
  );

  const arrows = makeElement(
    "div",
    "website-design-arrows"
  );

  const previous = makeElement("button");
  const next = makeElement("button");

  arrows.append(
    previous,
    next
  );

  controls.append(
    counter,
    instruction,
    arrows
  );


  /* --------------------------------------------------------
     PROGRESS
  -------------------------------------------------------- */

  const progress = makeElement(
    "div",
    "website-design-progress"
  );

  const progressFill = makeElement(
    "div",
    "website-design-progress-fill"
  );

  progress.appendChild(progressFill);


  /* --------------------------------------------------------
     ASSEMBLE
  -------------------------------------------------------- */

  gallery.append(
    visual,
    controls,
    progress
  );

  panel.appendChild(gallery);


  /* --------------------------------------------------------
     STATE
  -------------------------------------------------------- */

  let current = 0;
  let navigation = null;


  /* --------------------------------------------------------
     IMAGE INFORMATION EVENT
  -------------------------------------------------------- */

  function notifyImage(index) {

    window.dispatchEvent(
      new CustomEvent("work:image-change", {
        detail: { index }
      })
    );

  }


  /* --------------------------------------------------------
     IMAGE LOADING
  -------------------------------------------------------- */

  imageElement.addEventListener("load", () => {

    visual.classList.remove("is-missing");

  });

  imageElement.addEventListener("error", () => {

    visual.classList.add("is-missing");

  });


  /* --------------------------------------------------------
     DISPLAY IMAGE
  -------------------------------------------------------- */

  function showImage(index) {

    if (
      index < 0 ||
      index >= entries.length
    ) {
      return;
    }

    current = index;

    const entry = entries[current];
    const image = entry.image;

    visual.classList.remove("is-missing");

    imageElement.alt = image.label;
    imageElement.src = image.src;

    imageButton.setAttribute(
      "aria-label",
      `View ${image.label} fullscreen`
    );

    imageButton.onclick = () => {

      openLightbox(entry.index);

    };

    counter.textContent =
      `${pad(current + 1)} / ${pad(entries.length)}`;

    progressFill.style.width =
      `${((current + 1) / entries.length) * 100}%`;

    navigation?.sync();

    notifyImage(entry.index);

  }


  /* --------------------------------------------------------
     UNIVERSAL NAVIGATION
  -------------------------------------------------------- */

  navigation = createGalleryNavigation({

    element: panel,

    previous,
    next,

    getIndex: () => current,

    getCount: () => entries.length,

    isActive: () => (
      !panel.hidden &&
      (!options.isActive || options.isActive())
    ),

    onNavigate: direction => {

      showImage(current + direction);

    }

  });


  /* --------------------------------------------------------
     REFRESH
  -------------------------------------------------------- */

  function refresh() {

    if (!entries.length) {

      visual.classList.add("is-missing");

      imageElement.removeAttribute("src");

      imageButton.disabled = true;

      counter.textContent = "00 / 00";

      progressFill.style.width = "0%";

      navigation.sync();

      return;

    }

    imageButton.disabled = false;

    showImage(
      Math.min(
        current,
        entries.length - 1
      )
    );

  }


  /* --------------------------------------------------------
     INITIALIZATION
  -------------------------------------------------------- */

  refresh();


  /* --------------------------------------------------------
     PUBLIC INTERFACE
  -------------------------------------------------------- */

  return {
    panel,
    refresh
  };

}

/* ==========================================================
   05. EDITORIAL — INTERACTIVE ARTBOOK
========================================================== */

function renderEditorial(images, container) {

  if (!images.length) return;


  /* --------------------------------------------------------
     01. STRUCTURE
  -------------------------------------------------------- */

  const artbook = makeElement(
    "div",
    "work-artbook"
  );

  const stage = makeElement(
    "div",
    "artbook-stage"
  );

  const book = makeElement(
    "div",
    "editorial-book"
  );

  const controls = makeElement(
    "div",
    "artbook-controls"
  );

  const counter = makeElement(
    "span",
    "micro"
  );

  const instruction = makeElement(
    "span",
    "micro muted",
    "TURN THE PAGES"
  );

  const arrows = makeElement(
    "div",
    "artbook-arrows"
  );

  const previous = makeElement("button");
  const next = makeElement("button");

  arrows.append(previous, next);

  controls.append(
    counter,
    instruction,
    arrows
  );

  const progress = makeElement(
    "div",
    "artbook-progress"
  );

  const progressFill = makeElement(
    "div",
    "artbook-progress-fill"
  );

  progress.appendChild(progressFill);

  const caption = makeElement(
    "div",
    "artbook-caption micro"
  );


  /* --------------------------------------------------------
     02. STATE
  -------------------------------------------------------- */

  let current = 0;
  let busy = false;
  let destroyed = false;

  let activeAnimation = null;
  let navigation = null;


  /* --------------------------------------------------------
     03. IMAGE ELEMENTS
  -------------------------------------------------------- */

  function createImage() {

    const image = document.createElement("img");

    image.alt = "";
    image.draggable = false;
    image.decoding = "async";

    return image;

  }


  function createHalf(className) {

    const element = makeElement(
      "div",
      `editorial-half ${className}`
    );

    const image = createImage();

    element.appendChild(image);

    return {
      element,
      image
    };

  }


  const underSpread = makeElement(
    "div",
    "editorial-spread editorial-under"
  );

  const fullSpread = createImage();

  fullSpread.className = "editorial-full-image";

  underSpread.appendChild(fullSpread);

  const staticHalf = createHalf(
    "editorial-static-half"
  );

  const sheet = makeElement(
    "div",
    "editorial-turn-sheet"
  );

  const front = createHalf(
    "editorial-sheet-face editorial-sheet-front"
  );

  const back = createHalf(
    "editorial-sheet-face editorial-sheet-back"
  );

  sheet.append(
    front.element,
    back.element
  );

  book.append(
    underSpread,
    staticHalf.element,
    sheet
  );

  sheet.style.visibility = "hidden";

  staticHalf.element.style.visibility = "hidden";


  /* --------------------------------------------------------
     04. IMAGE CACHE
  -------------------------------------------------------- */

  const imageCache = new Map();

  function loadOriginal(index) {

    return new Promise((resolve, reject) => {

      const image = new Image();

      image.decoding = "async";

      image.onload = async () => {

        try {
          await image.decode();
        } catch (error) {
          // Continue when the image is available.
        }

        resolve(image);

      };

      image.onerror = () => {

        reject(
          new Error(
            `Unable to load editorial image ${index + 1}`
          )
        );

      };

      image.src = images[index].src;

    });

  }


  function prepareImage(index) {

    if (
      index < 0 ||
      index >= images.length
    ) {
      return Promise.resolve(null);
    }

    if (imageCache.has(index)) {
      return imageCache.get(index);
    }

    const promise = loadOriginal(index)
      .then(() => images[index].src)
      .catch(error => {

        console.warn(
          "Editorial image loading fallback:",
          error
        );

        return images[index].src;

      });

    imageCache.set(index, promise);

    return promise;

  }


  /* --------------------------------------------------------
     05. NEIGHBOURING SPREADS
  -------------------------------------------------------- */

  let backgroundPreparing = false;

  async function prepareNearby() {

    if (
      backgroundPreparing ||
      busy ||
      destroyed
    ) {
      return;
    }

    backgroundPreparing = true;

    const nearby = [
      current + 1,
      current - 1,
      current + 2,
      current - 2
    ];

    try {

      for (const index of nearby) {

        if (destroyed || busy) break;

        if (
          index < 0 ||
          index >= images.length
        ) {
          continue;
        }

        if (Math.abs(index - current) > 1) {

          await new Promise(resolve => {
            setTimeout(resolve, 80);
          });

        }

        if (destroyed || busy) break;

        await prepareImage(index);

      }

    } finally {

      backgroundPreparing = false;

    }

  }


  /* --------------------------------------------------------
     06. IMAGE HELPERS
  -------------------------------------------------------- */

  async function assignImage(element, src) {

    if (element.getAttribute("src") !== src) {
      element.src = src;
    }

    if (!element.complete) {

      await new Promise(resolve => {

        const done = () => {

          element.removeEventListener(
            "load",
            done
          );

          element.removeEventListener(
            "error",
            done
          );

          resolve();

        };

        element.addEventListener("load", done);
        element.addEventListener("error", done);

      });

    }

    if (
      element.naturalWidth &&
      typeof element.decode === "function"
    ) {

      try {
        await element.decode();
      } catch (error) {
        // Continue with the loaded image.
      }

    }

  }


  function setSide(half, side) {

    half.element.classList.toggle(
      "editorial-left",
      side === "left"
    );

    half.element.classList.toggle(
      "editorial-right",
      side === "right"
    );

  }


  function nextFrame() {

    return new Promise(resolve => {
      requestAnimationFrame(resolve);
    });

  }


  /* --------------------------------------------------------
     07. SHARED CONTROL UPDATES
  -------------------------------------------------------- */

  function updateControls() {

    counter.textContent =
      `${pad(current + 1)} / ${pad(images.length)}`;

    caption.textContent =
      images[current].label;

    progressFill.style.width =
      `${((current + 1) / images.length) * 100}%`;

    navigation?.sync();

    window.dispatchEvent(
      new CustomEvent("work:image-change", {
        detail: {
          index: current
        }
      })
    );

  }


  /* --------------------------------------------------------
     08. RESTING SPREAD
  -------------------------------------------------------- */

  async function showSpread(index) {

    const src = await prepareImage(index);

    if (destroyed) return;

    await assignImage(
      fullSpread,
      src || images[index].src
    );

    if (destroyed) return;

    current = index;

    staticHalf.element.style.visibility =
      "hidden";

    sheet.style.visibility = "hidden";

    sheet.style.transform = "";

    sheet.classList.remove(
      "turn-forward",
      "turn-backward"
    );

    updateControls();

    prepareNearby();

  }


  /* --------------------------------------------------------
     09. 3D PAGE TURN
  -------------------------------------------------------- */

  async function turnPage(direction) {

    if (busy || destroyed) return;

    const target = current + direction;

    if (
      target < 0 ||
      target >= images.length
    ) {
      return;
    }

    busy = true;

    updateControls();

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    try {

      if (reducedMotion) {

        await showSpread(target);

        return;

      }

      const [currentSrc, targetSrc] =
        await Promise.all([
          prepareImage(current),
          prepareImage(target)
        ]);

      if (destroyed) return;

      const forward = direction > 0;

      const stationarySide = forward
        ? "left"
        : "right";

      const turningSide = forward
        ? "right"
        : "left";

      setSide(
        staticHalf,
        stationarySide
      );

      setSide(
        front,
        turningSide
      );

      setSide(
        back,
        stationarySide
      );

      sheet.classList.remove(
        "turn-forward",
        "turn-backward"
      );

      sheet.classList.add(
        forward
          ? "turn-forward"
          : "turn-backward"
      );

      await Promise.all([
        assignImage(
          staticHalf.image,
          currentSrc
        ),
        assignImage(
          front.image,
          currentSrc
        ),
        assignImage(
          back.image,
          targetSrc
        )
      ]);

      if (destroyed) return;

      sheet.style.transform =
        "rotateY(0deg)";

      staticHalf.element.style.visibility =
        "visible";

      sheet.style.visibility =
        "visible";

      await nextFrame();
      await nextFrame();

      if (destroyed) return;

      fullSpread.src = targetSrc;

      activeAnimation = sheet.animate(
        [
          {
            transform: "rotateY(0deg)"
          },
          {
            transform: forward
              ? "rotateY(-180deg)"
              : "rotateY(180deg)"
          }
        ],
        {
          duration: 580,
          easing: "cubic-bezier(.42, 0, .2, 1)",
          fill: "forwards"
        }
      );

      try {

        await activeAnimation.finished;

      } catch (error) {

        // The animation was interrupted.

      }

      if (destroyed) return;

      sheet.style.visibility = "hidden";

      staticHalf.element.style.visibility =
        "hidden";

      activeAnimation.cancel();
      activeAnimation = null;

      current = target;

      updateControls();

      prepareNearby();

    } catch (error) {

      console.error(
        "Editorial page turn:",
        error
      );

      staticHalf.element.style.visibility =
        "hidden";

      sheet.style.visibility = "hidden";

      if (!destroyed) {
        await showSpread(current);
      }

    } finally {

      busy = false;

      if (!destroyed) {

        updateControls();

        prepareNearby();

      }

    }

  }


  /* --------------------------------------------------------
     10. UNIVERSAL NAVIGATION
  -------------------------------------------------------- */

  navigation = createGalleryNavigation({

    element: artbook,

    previous,
    next,

    getIndex: () => current,

    getCount: () => images.length,

    isBusy: () => busy || destroyed,

    onNavigate: direction => {
      turnPage(direction);
    }

  });


  /* --------------------------------------------------------
     11. LIGHTBOX INTERACTION
  -------------------------------------------------------- */

  book.addEventListener("click", () => {

    if (!busy && !destroyed) {
      openLightbox(current);
    }

  });

  book.style.cursor = "zoom-in";

  book.setAttribute(
    "aria-label",
    "Interactive editorial publication"
  );


  /* --------------------------------------------------------
     12. INITIALIZATION
  -------------------------------------------------------- */

  const referenceImage = new Image();

  referenceImage.onload = () => {

    if (
      referenceImage.naturalWidth &&
      referenceImage.naturalHeight
    ) {

      book.style.aspectRatio =
        `${referenceImage.naturalWidth} / ${referenceImage.naturalHeight}`;

    }

  };

  referenceImage.src = images[0].src;

  stage.appendChild(book);

  artbook.append(
    stage,
    controls,
    progress,
    caption
  );

  container.appendChild(artbook);

  fullSpread.src = images[0].src;

  showSpread(0);


  /* --------------------------------------------------------
     13. CLEANUP
  -------------------------------------------------------- */

  const observer = new MutationObserver(() => {

    if (
      book.isConnected ||
      destroyed
    ) {
      return;
    }

    destroyed = true;

    if (activeAnimation) {
      activeAnimation.cancel();
    }

    observer.disconnect();

    imageCache.clear();

  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

}

/* ==========================================================
   06. PACKAGING — MOCKUPS & ASSETS
========================================================== */

function renderPackaging(images, container) {

  if (!images.length) return;


  /* --------------------------------------------------------
     01. TAB SWITCHER
  -------------------------------------------------------- */

  const switcher = makeElement(
    "div",
    "website-view-switch"
  );

  switcher.setAttribute("role", "group");

  switcher.setAttribute(
    "aria-label",
    "Packaging presentation mode"
  );

  const mockupButton = makeElement(
    "button",
    "active",
    "MOCKUPS"
  );

  const assetsButton = makeElement(
    "button",
    "",
    "ASSETS"
  );

  mockupButton.type = "button";
  assetsButton.type = "button";

  switcher.append(
    mockupButton,
    assetsButton
  );


  /* --------------------------------------------------------
     02. ORGANIZE IMAGES
  -------------------------------------------------------- */

  const mockupImages = [];
  const assetImages = [];

  images.forEach((image, index) => {

    const entry = {
      image,
      index
    };

    if (image.group === "assets") {

      assetImages.push(entry);

    } else {

      mockupImages.push(entry);

    }

  });


  /* --------------------------------------------------------
     03. CREATE GALLERIES
  -------------------------------------------------------- */

  const mockups = createStandardGallery(
    mockupImages,
    {
      instruction: "EXPLORE THE MOCKUPS"
    }
  );

  const assets = createStandardGallery(
    assetImages,
    {
      instruction: "EXPLORE THE ASSETS"
    }
  );


  /* --------------------------------------------------------
     04. TAB NAVIGATION
  -------------------------------------------------------- */

  function switchView(mode) {

    const isMockup = mode === "mockup";

    mockups.panel.hidden = !isMockup;
    assets.panel.hidden = isMockup;

    mockupButton.classList.toggle(
      "active",
      isMockup
    );

    assetsButton.classList.toggle(
      "active",
      !isMockup
    );

    mockupButton.setAttribute(
      "aria-pressed",
      String(isMockup)
    );

    assetsButton.setAttribute(
      "aria-pressed",
      String(!isMockup)
    );

    if (isMockup) {

      mockups.refresh();

    } else {

      assets.refresh();

    }

  }


  mockupButton.addEventListener(
    "click",
    () => switchView("mockup")
  );

  assetsButton.addEventListener(
    "click",
    () => switchView("assets")
  );


  /* --------------------------------------------------------
     05. INITIALIZATION
  -------------------------------------------------------- */

  container.append(
    switcher,
    mockups.panel,
    assets.panel
  );

  switchView("mockup");

}


/* ==========================================================
   07. BRAND IDENTITY

   Brand Identity
   Applications
   Assets
========================================================== */

function renderIdentity(images, container) {

  if (!images.length) return;


  /* --------------------------------------------------------
     01. ORGANIZE IMAGES
  -------------------------------------------------------- */

  const identityImages = [];
  const applicationImages = [];
  const assetImages = [];

  images.forEach((image, index) => {

    const entry = {
      image,
      index
    };

    if (image.group === "identity") {

      identityImages.push(entry);

    } else if (image.group === "assets") {

      assetImages.push(entry);

    } else {

      applicationImages.push(entry);

    }

  });


  /* --------------------------------------------------------
     02. PRESENTATION
  -------------------------------------------------------- */

  const presentation = makeElement(
    "section",
    "work-identity"
  );

  const switcher = makeElement(
    "div",
    "website-view-switch identity-view-switch"
  );

  switcher.setAttribute("role", "group");

  switcher.setAttribute(
    "aria-label",
    "Brand identity presentation mode"
  );

  const tabs = [
    {
      id: "identity",
      label: "BRAND IDENTITY"
    },
    {
      id: "applications",
      label: "APPLICATIONS"
    },
    {
      id: "assets",
      label: "ASSETS"
    }
  ];

  const buttons = {};
  const panels = {};

  tabs.forEach(tab => {

    const button = makeElement(
      "button",
      "",
      tab.label
    );

    button.type = "button";

    const panel = makeElement(
      "div",
      "website-view-panel identity-view-panel"
    );

    buttons[tab.id] = button;
    panels[tab.id] = panel;

    switcher.appendChild(button);

  });


  /* --------------------------------------------------------
     03. BRAND IDENTITY SLIDESHOW
  -------------------------------------------------------- */

  const slideshow = makeElement(
    "div",
    "identity-slideshow"
  );

  const stage = makeElement(
    "div",
    "identity-slide-stage"
  );

  const slideButton = makeElement(
    "button",
    "work-image-button identity-slide-button"
  );

  slideButton.type = "button";

  const slideImage = document.createElement("img");

  slideImage.alt = "";
  slideImage.decoding = "async";
  slideImage.draggable = false;

  slideButton.appendChild(slideImage);

  stage.appendChild(slideButton);

  const imagePlaceholder = makeElement(
    "p",
    "identity-image-placeholder",
    "IMAGES COMING SOON"
  );

  stage.appendChild(imagePlaceholder);


  /* --------------------------------------------------------
     IMAGE LOADING
  -------------------------------------------------------- */

  slideImage.addEventListener("error", () => {

    stage.classList.add("is-missing");

  });

  slideImage.addEventListener("load", () => {

    stage.classList.remove("is-missing");

  });


  /* --------------------------------------------------------
     CONTROLS
  -------------------------------------------------------- */

  const controls = makeElement(
    "div",
    "identity-slide-controls"
  );

  const counter = makeElement(
    "span",
    "micro"
  );

  const instruction = makeElement(
    "span",
    "micro muted",
    "EXPLORE THE IDENTITY"
  );

  const arrows = makeElement(
    "div",
    "identity-slide-arrows"
  );

  const previous = makeElement("button");
  const next = makeElement("button");

  arrows.append(
    previous,
    next
  );

  controls.append(
    counter,
    instruction,
    arrows
  );


  /* --------------------------------------------------------
     PROGRESS
  -------------------------------------------------------- */

  const progress = makeElement(
    "div",
    "identity-slide-progress"
  );

  const progressFill = makeElement(
    "div",
    "identity-slide-progress-fill"
  );

  progress.appendChild(progressFill);

  slideshow.append(
    stage,
    controls,
    progress
  );


  /* --------------------------------------------------------
     EMPTY STATE
  -------------------------------------------------------- */

  if (identityImages.length) {

    panels.identity.appendChild(slideshow);

  } else {

    panels.identity.appendChild(
      makeElement(
        "p",
        "micro muted",
        "IMAGES COMING SOON"
      )
    );

  }


  /* --------------------------------------------------------
     04. STATE
  -------------------------------------------------------- */

  let current = 0;
  let activeTab = "identity";
  let navigation = null;


  /* --------------------------------------------------------
     05. DISPLAY SLIDE
  -------------------------------------------------------- */

  function showSlide(index) {

    if (
      index < 0 ||
      index >= identityImages.length
    ) {
      return;
    }

    current = index;

    const entry = identityImages[current];

    stage.classList.remove("is-missing");

    slideImage.src = entry.image.src;
    slideImage.alt = entry.image.label;

    slideButton.setAttribute(
      "aria-label",
      `View ${entry.image.label} fullscreen`
    );

    counter.textContent =
      `${pad(current + 1)} / ${pad(identityImages.length)}`;

    progressFill.style.width =
      `${((current + 1) / identityImages.length) * 100}%`;

    navigation?.sync();

    window.dispatchEvent(
      new CustomEvent("work:image-change", {
        detail: {
          index: entry.index
        }
      })
    );

  }


  /* --------------------------------------------------------
     LIGHTBOX
  -------------------------------------------------------- */

  slideButton.addEventListener("click", () => {

    if (!identityImages.length) return;

    openLightbox(
      identityImages[current].index
    );

  });


  /* --------------------------------------------------------
     06. APPLICATIONS & ASSETS
  -------------------------------------------------------- */

  const applicationGallery = createStandardGallery(
    applicationImages,
    {
      instruction: "EXPLORE THE APPLICATIONS",

      isActive: () =>
        activeTab === "applications"
    }
  );

  const assetGallery = createStandardGallery(
    assetImages,
    {
      instruction: "EXPLORE THE ASSETS",

      isActive: () =>
        activeTab === "assets"
    }
  );

  panels.applications.appendChild(
    applicationGallery.panel
  );

  panels.assets.appendChild(
    assetGallery.panel
  );


  /* --------------------------------------------------------
     07. TAB NAVIGATION
  -------------------------------------------------------- */

  function switchView(mode) {

    activeTab = mode;

    tabs.forEach(tab => {

      const active = tab.id === mode;

      panels[tab.id].hidden = !active;

      buttons[tab.id].classList.toggle(
        "active",
        active
      );

      buttons[tab.id].setAttribute(
        "aria-pressed",
        String(active)
      );

    });

    if (mode === "applications") {

      applicationGallery.refresh();

    }

    if (mode === "assets") {

      assetGallery.refresh();

    }

    if (
      mode === "identity" &&
      identityImages.length
    ) {

      showSlide(current);

    }

    navigation?.sync();

  }


  tabs.forEach(tab => {

    buttons[tab.id].addEventListener(
      "click",
      () => switchView(tab.id)
    );

  });


  /* --------------------------------------------------------
     08. UNIVERSAL NAVIGATION
  -------------------------------------------------------- */

  navigation = createGalleryNavigation({

    element: presentation,

    previous,
    next,

    getIndex: () => current,

    getCount: () => identityImages.length,

    isActive: () =>
      activeTab === "identity",

    onNavigate: direction => {

      showSlide(current + direction);

    }

  });


  /* --------------------------------------------------------
     09. INITIALIZATION
  -------------------------------------------------------- */

  presentation.append(
    switcher,
    panels.identity,
    panels.applications,
    panels.assets
  );

  container.appendChild(presentation);

  if (identityImages.length) {

    showSlide(0);

  }

  switchView("identity");

}

/* ==========================================================
   08. DIGITAL — INTERACTIVE WEBSITE EXPERIENCE
========================================================== */

function renderWebsite(images, container, project) {

  const presentationHeading =
    document.querySelector(".work-minimal-heading");

  if (presentationHeading) {
    presentationHeading.style.display = "none";
  }


  /* --------------------------------------------------------
     01. MAIN EXPERIENCE
  -------------------------------------------------------- */

  const experience = makeElement(
    "section",
    "website-experience"
  );

  const heading = makeElement(
    "div",
    "website-experience-heading"
  );

  const headingLeft = makeElement("div");

  headingLeft.append(
    makeElement(
      "span",
      "micro",
      "DIGITAL / INTERACTIVE"
    ),
    makeElement(
      "h3",
      "",
      "Explore the website."
    )
  );

  heading.append(
    headingLeft,
    makeElement(
      "span",
      "micro",
      "01 / EXPERIENCE"
    )
  );


  /* --------------------------------------------------------
     02. PRESENTATION TOOLBAR
  -------------------------------------------------------- */

  const toolbar = makeElement(
    "div",
    "website-experience-toolbar"
  );

  const switcher = makeElement(
    "div",
    "website-view-switch packaging-view-switch"
  );

  switcher.setAttribute("role", "group");

  switcher.setAttribute(
    "aria-label",
    "Website presentation mode"
  );

  const interactiveButton = makeElement(
    "button",
    "",
    "LIVE WEBSITE"
  );

  const galleryButton = makeElement(
    "button",
    "",
    "DESIGN GALLERY"
  );

  interactiveButton.type = "button";
  galleryButton.type = "button";

  switcher.append(
    interactiveButton,
    galleryButton
  );


  /* --------------------------------------------------------
     DEVICE CONTROLS
  -------------------------------------------------------- */

  const deviceControls = makeElement(
    "div",
    "live-preview-actions"
  );

  deviceControls.setAttribute(
    "role",
    "group"
  );

  deviceControls.setAttribute(
    "aria-label",
    "Preview device"
  );

  const desktopButton = makeElement(
    "button",
    "active",
    "DESKTOP"
  );

  const mobileButton = makeElement(
    "button",
    "",
    "MOBILE"
  );

  desktopButton.type = "button";
  mobileButton.type = "button";

  deviceControls.append(
    desktopButton,
    mobileButton
  );

  toolbar.append(
    switcher,
    deviceControls
  );


  /* --------------------------------------------------------
     03. LIVE WEBSITE PANEL
  -------------------------------------------------------- */

  const interactivePanel = makeElement(
    "div",
    "website-view-panel"
  );

  const live = project.livePreview;

  const hasLiveWebsite = Boolean(
    live &&
    live.enabled &&
    live.url
  );

  let stage = null;

  if (hasLiveWebsite) {

    const preview = makeElement(
      "section",
      "live-preview"
    );

    stage = makeElement(
      "div",
      "live-preview-stage"
    );

    const iframe = document.createElement("iframe");

    iframe.src = live.url;

    iframe.title =
      `${project.title} interactive website`;

    iframe.loading = "lazy";

    stage.appendChild(iframe);

    const externalLink = makeElement(
      "a",
      "live-preview-external",
      "OPEN FULL WEBSITE ↗"
    );

    externalLink.href = live.url;
    externalLink.target = "_blank";
    externalLink.rel = "noopener noreferrer";

    preview.append(
      stage,
      externalLink
    );

    interactivePanel.appendChild(preview);

  } else {

    interactivePanel.appendChild(
      makeElement(
        "p",
        "micro muted",
        "INTERACTIVE PREVIEW COMING SOON"
      )
    );

  }


  /* --------------------------------------------------------
     04. DESIGN GALLERY
  -------------------------------------------------------- */

  const galleryPanel = makeElement(
    "div",
    "website-view-panel"
  );

  galleryPanel.hidden = true;

  const designEntries = images.map(
    (image, index) => ({
      image,
      index
    })
  );

  const designGallery = createStandardGallery(
    designEntries,
    {
      instruction: "EXPLORE THE DESIGNS",

      isActive: () => !galleryPanel.hidden
    }
  );

  galleryPanel.appendChild(
    designGallery.panel
  );


  /* --------------------------------------------------------
     05. DEVICE SWITCHING
  -------------------------------------------------------- */

  function switchDevice(mode) {

    const isMobile = mode === "mobile";

    if (stage) {

      stage.classList.toggle(
        "mobile",
        isMobile
      );

    }

    desktopButton.classList.toggle(
      "active",
      !isMobile
    );

    mobileButton.classList.toggle(
      "active",
      isMobile
    );

    desktopButton.setAttribute(
      "aria-pressed",
      String(!isMobile)
    );

    mobileButton.setAttribute(
      "aria-pressed",
      String(isMobile)
    );

  }


  desktopButton.addEventListener(
    "click",
    () => switchDevice("desktop")
  );

  mobileButton.addEventListener(
    "click",
    () => switchDevice("mobile")
  );


  /* --------------------------------------------------------
     06. LIVE / DESIGN GALLERY SWITCHING
  -------------------------------------------------------- */

  function switchView(mode) {

    const isInteractive =
      mode === "interactive";

    interactivePanel.hidden =
      !isInteractive;

    galleryPanel.hidden =
      isInteractive;

    interactiveButton.classList.toggle(
      "active",
      isInteractive
    );

    galleryButton.classList.toggle(
      "active",
      !isInteractive
    );

    interactiveButton.setAttribute(
      "aria-pressed",
      String(isInteractive)
    );

    galleryButton.setAttribute(
      "aria-pressed",
      String(!isInteractive)
    );

    deviceControls.hidden =
      !isInteractive ||
      !hasLiveWebsite;

    const imageInformation =
      container.querySelector(
        ".work-image-information"
      );

    if (imageInformation) {

      imageInformation.hidden =
        isInteractive;

    }

    if (!isInteractive) {

      designGallery.refresh();

    }

  }


  interactiveButton.addEventListener(
    "click",
    () => switchView("interactive")
  );

  galleryButton.addEventListener(
    "click",
    () => switchView("gallery")
  );


  /* --------------------------------------------------------
     07. INITIALIZATION
  -------------------------------------------------------- */

  experience.append(
    heading,
    toolbar,
    interactivePanel,
    galleryPanel
  );

  container.appendChild(experience);

  switchDevice("desktop");

  switchView(
    hasLiveWebsite
      ? "interactive"
      : "gallery"
  );

}

/* ==========================================================
   09. UI/UX — CINEMATIC SCREEN SPOTLIGHT

   Horizontal screen previews
   Natural-height LUMEN introduction
   Scrollable screenshots
   Fullscreen image viewing
   Universal gallery navigation
========================================================== */

function renderUIUX(images, container) {

  if (!images.length) return;


  /* --------------------------------------------------------
     01. STRUCTURE
  -------------------------------------------------------- */

  const gallery = makeElement(
    "div",
    "work-uiux"
  );

  const stage = makeElement(
    "div",
    "uiux-spotlight"
  );

  const projectId = getProjectId();

  let current = 0;
  let navigation = null;


  /* --------------------------------------------------------
     02. HORIZONTAL PREVIEW RAILS
  -------------------------------------------------------- */

  const leftRail = makeElement(
    "div",
    "uiux-preview-rail uiux-preview-rail-left"
  );

  const rightRail = makeElement(
    "div",
    "uiux-preview-rail uiux-preview-rail-right"
  );


  function createRailPreview(image, index) {

    const button = makeElement(
      "button",
      "uiux-preview"
    );

    button.type = "button";

    button.setAttribute(
      "aria-label",
      `Go to screen ${pad(index + 1)}: ${image.label}`
    );

    const img = document.createElement("img");

    img.src = image.src;
    img.alt = image.label;

    img.loading = "lazy";
    img.decoding = "async";
    img.draggable = false;

    button.appendChild(img);

    button.addEventListener("click", () => {

      goTo(index);

    });

    return button;

  }


  function renderPreviewRails() {

    leftRail.replaceChildren();
    rightRail.replaceChildren();

    images.forEach((image, index) => {

      if (index === current) return;

      const preview = createRailPreview(
        image,
        index
      );

      if (index < current) {

        leftRail.appendChild(preview);

      } else {

        rightRail.appendChild(preview);

      }

    });

    leftRail.classList.toggle(
      "is-empty",
      current === 0
    );

    rightRail.classList.toggle(
      "is-empty",
      current === images.length - 1
    );

    leftRail.scrollLeft =
      leftRail.scrollWidth;

    rightRail.scrollLeft = 0;

  }


  /* --------------------------------------------------------
     03. MAIN SCREEN
  -------------------------------------------------------- */

  const main = makeElement(
    "div",
    "uiux-main"
  );

  const mainVisual = makeElement(
    "div",
    "uiux-main-visual"
  );

  mainVisual.tabIndex = 0;

  mainVisual.setAttribute(
    "role",
    "region"
  );

  mainVisual.setAttribute(
    "aria-label",
    "Application screen preview"
  );

  const mainButton = makeElement(
    "button",
    "work-image-button uiux-main-button"
  );

  mainButton.type = "button";

  const mainImage = document.createElement("img");

  mainImage.alt = "";
  mainImage.draggable = false;
  mainImage.decoding = "async";

  mainButton.appendChild(mainImage);
  mainVisual.appendChild(mainButton);
  main.appendChild(mainVisual);

  stage.append(
    leftRail,
    main,
    rightRail
  );


  /* --------------------------------------------------------
     04. CAPTION
  -------------------------------------------------------- */

  const details = makeElement(
    "div",
    "uiux-spotlight-details"
  );

  const copy = makeElement(
    "div",
    "uiux-spotlight-copy"
  );

  const eyebrow = makeElement(
    "span",
    "micro uiux-spotlight-eyebrow"
  );

  const heading = makeElement(
    "h3",
    "uiux-spotlight-title"
  );

  const description = makeElement(
    "p",
    "uiux-spotlight-description"
  );

  copy.append(
    eyebrow,
    heading,
    description
  );


  /* --------------------------------------------------------
     05. CONTROLS
  -------------------------------------------------------- */

  const controls = makeElement(
    "div",
    "uiux-controls"
  );

  const counter = makeElement(
    "span",
    "micro"
  );

  const instruction = makeElement(
    "span",
    "micro muted",
    "EXPLORE THE INTERFACE"
  );

  const arrows = makeElement(
    "div",
    "uiux-arrows"
  );

  const previous = makeElement("button");
  const next = makeElement("button");

  arrows.append(
    previous,
    next
  );

  controls.append(
    counter,
    instruction,
    arrows
  );

  details.append(
    copy,
    controls
  );


  /* --------------------------------------------------------
     06. PROGRESS
  -------------------------------------------------------- */

  const progress = makeElement(
    "div",
    "uiux-progress"
  );

  const progressFill = makeElement(
    "div",
    "uiux-progress-fill"
  );

  progress.appendChild(progressFill);


  /* --------------------------------------------------------
     07. ASSEMBLE
  -------------------------------------------------------- */

  gallery.append(
    stage,
    details,
    progress
  );

  container.appendChild(gallery);


  /* --------------------------------------------------------
     08. RENDER ACTIVE SCREEN
  -------------------------------------------------------- */

  function renderScreen() {

    const active = images[current];

    const isIntroScreen =
      projectId === "lumen" &&
      current === 0;

    mainVisual.classList.toggle(
      "is-intro-screen",
      isIntroScreen
    );

    mainVisual.scrollTop = 0;

    mainImage.src = active.src;
    mainImage.alt = active.label;

    mainButton.setAttribute(
      "aria-label",
      `View ${active.label} fullscreen`
    );

    mainButton.onclick = () => {

      openLightbox(current);

    };

    renderPreviewRails();

    eyebrow.textContent =
      `${pad(current + 1)} / ${pad(images.length)} — THE INTERFACE`;

    heading.textContent =
      active.label;

    description.textContent =
      active.description || "";

    description.hidden =
      !description.textContent;

    counter.textContent =
      `${pad(current + 1)} / ${pad(images.length)}`;

    progressFill.style.width =
      `${((current + 1) / images.length) * 100}%`;

    navigation?.sync();

  }


  /* --------------------------------------------------------
     09. SCREEN NAVIGATION
  -------------------------------------------------------- */

  function goTo(index) {

    if (
      index < 0 ||
      index >= images.length ||
      index === current
    ) {
      return;
    }

    current = index;

    renderScreen();

    window.dispatchEvent(
      new CustomEvent("work:image-change", {
        detail: {
          index: current
        }
      })
    );

  }


  /* --------------------------------------------------------
     10. UNIVERSAL GALLERY NAVIGATION
  -------------------------------------------------------- */

  navigation = createGalleryNavigation({

    element: gallery,

    previous,
    next,

    getIndex: () => current,

    getCount: () => images.length,

    onNavigate: direction => {

      goTo(current + direction);

    }

  });


  /* --------------------------------------------------------
     11. INITIAL DISPLAY
  -------------------------------------------------------- */

  renderScreen();

}


/* ==========================================================
   10. PHOTOGRAPHY — MINIMAL IMAGE GALLERY

   No arrow navigation.
   No additional labels.
   Images open in the shared lightbox.
========================================================== */

function renderPhotography(images, container) {

  if (!images.length) return;

  const gallery = makeElement(
    "div",
    "work-photography-grid"
  );

  images.forEach((image, index) => {

    const item = makeElement(
      "figure",
      "work-photography-item"
    );

    const button = makeImageButton(
      image,
      index,
      "work-photography-button"
    );

    item.appendChild(button);

    gallery.appendChild(item);

  });

  container.appendChild(gallery);

}

/* ==========================================================
   11. POSTERS — REVOLVING CAROUSEL
========================================================== */

function renderPosters(images, container) {

  if (!images.length) return;


  /* --------------------------------------------------------
     01. STRUCTURE
  -------------------------------------------------------- */

  const gallery = makeElement(
    "section",
    "work-poster-carousel"
  );

  const stage = makeElement(
    "div",
    "poster-carousel-stage"
  );

  const slots = [-1, 0, 1].map(offset => {

    const slot = makeElement(
      "div",
      `poster-carousel-slot ${
        offset === 0 ? "is-center" : "is-side"
      }`
    );

    const button = makeElement(
      "button",
      "poster-carousel-image"
    );

    button.type = "button";

    const image = document.createElement("img");

    image.decoding = "async";
    image.draggable = false;

    button.appendChild(image);
    slot.appendChild(button);
    stage.appendChild(slot);

    return {
      offset,
      slot,
      button,
      image
    };

  });


  /* --------------------------------------------------------
     02. CONTROLS
  -------------------------------------------------------- */

  const controls = makeElement(
    "div",
    "poster-carousel-controls"
  );

  const counter = makeElement(
    "span",
    "micro"
  );

  const instruction = makeElement(
    "span",
    "micro muted",
    "EXPLORE THE POSTERS"
  );

  const arrows = makeElement(
    "div",
    "poster-carousel-arrows"
  );

  const previous = makeElement("button");
  const next = makeElement("button");

  arrows.append(previous, next);

  controls.append(
    counter,
    instruction,
    arrows
  );


  /* --------------------------------------------------------
     03. PROGRESS
  -------------------------------------------------------- */

  const progress = makeElement(
    "div",
    "poster-carousel-progress"
  );

  const progressFill = makeElement(
    "div",
    "poster-carousel-progress-fill"
  );

  progress.appendChild(progressFill);


  /* --------------------------------------------------------
     04. ASSEMBLE
  -------------------------------------------------------- */

  gallery.append(
    stage,
    controls,
    progress
  );

  container.appendChild(gallery);


  /* --------------------------------------------------------
     05. STATE
  -------------------------------------------------------- */

  let current = 0;
  let busy = false;
  let navigation = null;

  const dimensions = new Map();

  function wrapPosterIndex(index) {
    return (
      (index % images.length) + images.length
    ) % images.length;
  }


  /* --------------------------------------------------------
     06. IMAGE LOADING
  -------------------------------------------------------- */

  async function preparePoster(index) {

  index = wrapPosterIndex(index);

    if (dimensions.has(index)) {
      return;
    }

    const image = new Image();

    image.src = images[index].src;

    try {

      await image.decode();

    } catch (error) {

      // The normal image remains available.

    }

    dimensions.set(index, {
      width: image.naturalWidth || 1,
      height: image.naturalHeight || 1
    });

  }


  /* --------------------------------------------------------
     07. RENDER CAROUSEL
  -------------------------------------------------------- */

  function render() {

    slots.forEach(({ offset, slot, button, image }) => {

      const index = wrapPosterIndex(
        current + offset
      );

      const available =
        offset === 0 || images.length > 1;

      slot.hidden = !available;

      if (!available) {
        image.removeAttribute("src");
        return;
      }

      const poster = images[index];

      image.src = poster.src;
      image.alt = poster.label;

      image.loading =
        offset === 0 ? "eager" : "lazy";

      button.setAttribute(
        "aria-label",
        offset === 0
          ? `View ${poster.label} fullscreen`
          : `Select ${poster.label}`
      );

      button.onclick = () => {

        if (busy) return;

        if (offset === 0) {

          openLightbox(current);

        } else {

          navigate(offset);

        }

      };

    });

    counter.textContent =
      `${pad(current + 1)} / ${pad(images.length)}`;

    progressFill.style.width =
      `${((current + 1) / images.length) * 100}%`;

    navigation?.sync();

    window.dispatchEvent(
      new CustomEvent("work:image-change", {
        detail: {
          index: current
        }
      })
    );

  }


  /* --------------------------------------------------------
     08. POSTER GEOMETRY
  -------------------------------------------------------- */

 function getPosterRect(index, slotIndex) {

    index = wrapPosterIndex(index);

    const slot = slots[slotIndex].slot;

    const slotRect =
      slot.getBoundingClientRect();

    const referenceImage =
      slots[slotIndex].image;

    const maxHeightValue =
      getComputedStyle(referenceImage).maxHeight;

    const parsedHeight =
      parseFloat(maxHeightValue);

    const heightLimit =
      Number.isFinite(parsedHeight)
        ? parsedHeight
        : window.innerHeight;

    const size = dimensions.get(index) || {
      width: 1,
      height: 1
    };

    const ratio =
      size.width / size.height;

    const width = Math.min(
      size.width,
      slotRect.width,
      heightLimit * ratio
    );

    const height = width / ratio;

    return {
      left:
        slotRect.left +
        (slotRect.width - width) / 2,

      top:
        slotRect.top +
        (slotRect.height - height) / 2,

      width,
      height
    };

  }


  /* --------------------------------------------------------
     09. ANIMATION
  -------------------------------------------------------- */

  async function navigate(direction) {

    if (busy) return;

    if (images.length < 2) return;

    const nextIndex = wrapPosterIndex(
      current + direction
    );


    busy = true;
    navigation?.sync();

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let overlay = null;

    try {

      const nearby = [
        current - 1,
        current,
        current + 1,
        nextIndex - 1,
        nextIndex,
        nextIndex + 1
      ].map(wrapPosterIndex);

      await Promise.all(
        [...new Set(nearby)].map(preparePoster)
      );

      if (reducedMotion) {

        current = nextIndex;
        render();

        return;

      }

      const duration = 620;

      const easing =
        "cubic-bezier(.22, 1, .36, 1)";

      const stageRect =
        stage.getBoundingClientRect();

      overlay = document.createElement("div");

      Object.assign(overlay.style, {
        position: "fixed",
        inset: "0",
        zIndex: "9999",
        pointerEvents: "none",
        overflow: "hidden",

        clipPath: `inset(
          ${Math.max(0, stageRect.top)}px
          ${Math.max(0, window.innerWidth - stageRect.right)}px
          ${Math.max(0, window.innerHeight - stageRect.bottom)}px
          ${Math.max(0, stageRect.left)}px
        )`
      });

      document.body.appendChild(overlay);

      const animations = [];


      /* ----------------------------------------------------
         MOVING POSTER
      ---------------------------------------------------- */

      function animatePoster(
        index,
        fromRect,
        toRect,
        fromOpacity = 1,
        toOpacity = 1
      ) {

        index = wrapPosterIndex(index);

        const poster = images[index];

        const image = document.createElement("img");

        image.src = poster.src;
        image.alt = poster.label || "";

        Object.assign(image.style, {
          position: "fixed",
          left: `${fromRect.left}px`,
          top: `${fromRect.top}px`,
          width: `${fromRect.width}px`,
          height: `${fromRect.height}px`,
          maxWidth: "none",
          maxHeight: "none",
          objectFit: "contain",
          pointerEvents: "none",
          margin: "0",
          opacity: String(fromOpacity)
        });

        overlay.appendChild(image);

        animations.push(
          image.animate(
            [
              {
                left: `${fromRect.left}px`,
                top: `${fromRect.top}px`,
                width: `${fromRect.width}px`,
                height: `${fromRect.height}px`,
                opacity: fromOpacity
              },
              {
                left: `${toRect.left}px`,
                top: `${toRect.top}px`,
                width: `${toRect.width}px`,
                height: `${toRect.height}px`,
                opacity: toOpacity
              }
            ],
            {
              duration,
              easing,
              fill: "forwards"
            }
          )
        );

      }


      /* ----------------------------------------------------
         CURRENT POSTER POSITIONS
      ---------------------------------------------------- */

      const leftRect =
        slots[0].image.getBoundingClientRect();

      const centerRect =
        slots[1].image.getBoundingClientRect();

      const rightRect =
        slots[2].image.getBoundingClientRect();


      /* ----------------------------------------------------
        FORWARD
      ---------------------------------------------------- */

      if (direction > 0) {

        /* LEFT POSTER EXITS */

        animatePoster(
          current - 1,
          leftRect,
          {
            ...leftRect,
            left:
              stageRect.left -
              leftRect.width -
              30
          },
          .4,
          .4
        );

        /* CENTER MOVES LEFT */

        animatePoster(
          current,
          centerRect,
          getPosterRect(current, 0),
          1,
          .4
        );

        /* RIGHT MOVES TO CENTER */

        animatePoster(
          current + 1,
          rightRect,
          getPosterRect(current + 1, 1),
          .4,
          1
        );

        /* NEXT POSTER ENTERS FROM RIGHT */

        const incoming =
          getPosterRect(current + 2, 2);

        animatePoster(
          current + 2,
          {
            ...incoming,
            left: stageRect.right + 30
          },
          incoming,
          .4,
          .4
        );


      /* ----------------------------------------------------
        BACKWARD
      ---------------------------------------------------- */

      } else {

        /* RIGHT POSTER EXITS */

        animatePoster(
          current + 1,
          rightRect,
          {
            ...rightRect,
            left: stageRect.right + 30
          },
          .4,
          .4
        );

        /* CENTER MOVES RIGHT */

        animatePoster(
          current,
          centerRect,
          getPosterRect(current, 2),
          1,
          .4
        );

        /* LEFT MOVES TO CENTER */

        animatePoster(
          current - 1,
          leftRect,
          getPosterRect(current - 1, 1),
          .4,
          1
        );

        /* PREVIOUS POSTER ENTERS FROM LEFT */

        const incoming =
          getPosterRect(current - 2, 0);

        animatePoster(
          current - 2,
          {
            ...incoming,
            left:
              stageRect.left -
              incoming.width -
              30
          },
          incoming,
          .4,
          .4
        );

      }


      /* ----------------------------------------------------
         COMPLETE MOVEMENT
      ---------------------------------------------------- */

      stage.style.visibility = "hidden";

      await Promise.all(
        animations.map(animation =>
          animation.finished.catch(() => {})
        )
      );

      current = nextIndex;

      render();

    } catch (error) {

      console.error(
        "Poster carousel navigation:",
        error
      );

    } finally {

      stage.style.visibility = "";

      overlay?.remove();

      busy = false;

      navigation?.sync();

    }

  }


  /* --------------------------------------------------------
     10. UNIVERSAL NAVIGATION
  -------------------------------------------------------- */

  navigation = createGalleryNavigation({

    element: gallery,

    previous,
    next,

    getIndex: () => current,

    getCount: () => images.length,

    isBusy: () => busy,

    loop: true,

    onNavigate: direction => {

      navigate(direction);

    }

  });


  /* --------------------------------------------------------
     11. INITIAL DISPLAY
  -------------------------------------------------------- */

  preparePoster(0);

  if (images.length > 1) {
    preparePoster(1);
  }

  render();

}

/* ==========================================================
   12. DEFAULT — STANDARD IMAGE PRESENTATION
========================================================== */

function renderDefault(images, container) {

  const grid = makeElement(
    "div",
    "work-default-grid"
  );

  images.forEach((image, index) => {

    const item = makeElement(
      "div",
      "work-default-item"
    );

    const visual = makeElement(
      "div",
      "work-default-image"
    );

    visual.appendChild(
      makeImageButton(image, index)
    );

    const label = makeElement(
      "div",
      "work-image-label"
    );

    label.append(
      makeElement(
        "span",
        "",
        image.label
      ),
      makeElement(
        "span",
        "",
        `${pad(index + 1)} / ${pad(images.length)}`
      )
    );

    item.append(
      visual,
      label
    );

    grid.appendChild(item);

  });

  container.appendChild(grid);

}


/* ==========================================================
   13. SHARED IMAGE INFORMATION
========================================================== */

function renderImageInformation(images, container) {

  if (!images.length) return;


  /* --------------------------------------------------------
     01. STRUCTURE
  -------------------------------------------------------- */

  const section = makeElement(
    "section",
    "work-image-information"
  );

  const number = makeElement(
    "span",
    "work-image-information-number"
  );

  const title = makeElement(
    "h2",
    "work-image-information-title"
  );

  const description = makeElement(
    "p",
    "work-image-information-description"
  );

  const creditRow = makeElement(
    "div",
    "work-image-information-credit-row"
  );

  const creditLabel = makeElement(
    "span",
    "work-image-information-key",
    "IMAGE CREDITS"
  );

  const creditList = makeElement(
    "div",
    "work-image-information-credits"
  );

  creditRow.append(
    creditLabel,
    creditList
  );

  section.append(
    number,
    title,
    description,
    creditRow
  );


  /* --------------------------------------------------------
     02. UPDATE INFORMATION
  -------------------------------------------------------- */

  function updateInformation(index) {

    if (
      index < 0 ||
      index >= images.length
    ) {
      return;
    }

    const image = images[index];

    number.textContent =
      `${pad(index + 1)} / ${pad(images.length)} — IMAGE INFORMATION`;

    title.textContent =
      image.label ||
      `IMAGE ${pad(index + 1)}`;

    description.textContent =
      image.description || "";

    description.hidden =
      !image.description;

    creditList.replaceChildren();


    /* ------------------------------------------------------
       IMAGE CREDITS
    ------------------------------------------------------ */

    (image.credits || []).forEach(credit => {

      if (typeof credit === "string") {

        creditList.appendChild(
          makeElement(
            "span",
            "",
            credit
          )
        );

        return;

      }

      if (!credit || !credit.name) {
        return;
      }

      const creditText = [
        credit.name,
        credit.source
      ].filter(Boolean).join(" / ");

      const item = makeElement(
        credit.url ? "a" : "span",
        "",
        creditText
      );

      if (credit.url) {

        item.href = credit.url;
        item.target = "_blank";
        item.rel = "noopener noreferrer";

      }

      creditList.appendChild(item);

    });

    creditRow.hidden =
      !creditList.childElementCount;

  }


  /* --------------------------------------------------------
     03. IMAGE SYNCHRONIZATION
  -------------------------------------------------------- */

  window.addEventListener(
    "work:image-change",
    event => {

      updateInformation(
        event.detail.index
      );

    }
  );


  /* --------------------------------------------------------
     04. INITIALIZATION
  -------------------------------------------------------- */

  updateInformation(0);

  container.appendChild(section);

  return section;

}


/* ==========================================================
   14. PROJECT RENDERER
========================================================== */

function renderWork() {

  const project = findProject();


  /* --------------------------------------------------------
     01. PROJECT NOT FOUND
  -------------------------------------------------------- */

  if (!project) {

    document.title =
      "Project Not Found — Lou Reyes";

    $("workTitle").textContent =
      "NOT FOUND.";

    $("workHeroDescription").textContent =
      "This project could not be found.";

    $("workPresentation").textContent = "";

    $("workNextTitle").textContent =
      "THE ARCHIVE";

    $("workNext").href =
      "archive.html";

    return;

  }


  /* --------------------------------------------------------
     02. PROJECT STATE
  -------------------------------------------------------- */

  workState.project = project;

  workState.images = normalizeImages(
    project.images
  );

  const isPhotography =
    String(project.layout).toLowerCase() === "photography" ||
    String(project.category).toLowerCase() === "photography";

  document.body.classList.toggle(
    "work-is-photography",
    isPhotography
  );

  const category = getCategoryTitle(
    project.category
  );


  /* --------------------------------------------------------
     03. PRESENTATION LABELS
  -------------------------------------------------------- */

  const presentationLabels = {

    editorial: [
      "THE PUBLICATION",
      "AN INTERACTIVE EDITORIAL ARCHIVE"
    ],

    packaging: [
      "THE PACKAGING",
      "MOCKUPS & DESIGN DETAILS"
    ],

    identity: [
      "THE IDENTITY",
      "BRAND SYSTEM & APPLICATIONS"
    ],

    website: [
      "THE WEBSITE",
      "A DIGITAL EXPERIENCE"
    ],

    uiux: [
      "THE INTERFACE",
      "SCREENS & INTERACTIONS"
    ],

    photography: [
      "THE PHOTOGRAPHY",
      "A VISUAL COLLECTION"
    ],

    poster: [
      "THE POSTERS",
      "A VISUAL EXPLORATION"
    ],

    posters: [
      "THE POSTERS",
      "A VISUAL EXPLORATION"
    ],

    default: [
      "THE WORK",
      "A VISUAL EXPLORATION"
    ]

  };

  const presentationLabel =
    presentationLabels[project.layout] ||
    presentationLabels.default;

  const labelElement = $(
    "workPresentationLabel"
  );


  if (labelElement) {

    labelElement.textContent =
      presentationLabel[0];

  }

  /* --------------------------------------------------------
     04. PAGE CONTENT
  -------------------------------------------------------- */

  document.title =
    `${project.title} — Lou Reyes`;

  const pageDescription =
    $("pageDescription");

  if (pageDescription) {

    pageDescription.content =
      project.description || "";

  }

  $("workHeroImage").src =
    project.image;

  $("workHeroImage").alt =
    `${project.title} artwork`;

  $("workEyebrow").textContent =
    `${category.toUpperCase()} / ${project.type.toUpperCase()}`;

  $("workTitle").textContent =
    project.title;

  $("workHeroDescription").textContent =
    project.description || project.type;

  $("workHeroYear").textContent =
    project.year || "";

  $("workBack").href =
    `collection.html?category=${encodeURIComponent(project.category)}`;


  /* --------------------------------------------------------
     05. PRESENTATION CONTAINER
  -------------------------------------------------------- */

  const container = $("workPresentation");

  container.replaceChildren();


  /* --------------------------------------------------------
     06. PROJECT PRESENTATION
  -------------------------------------------------------- */

  if (!workState.images.length) {

    container.appendChild(
      makeElement(
        "p",
        "micro muted",
        "IMAGES COMING SOON"
      )
    );

  } else {

    switch (project.layout) {

      case "editorial":

        renderEditorial(
          workState.images,
          container
        );

        break;


      case "packaging":

        renderPackaging(
          workState.images,
          container
        );

        break;


      case "identity":

        renderIdentity(
          workState.images,
          container
        );

        break;


      case "website":

        renderWebsite(
          workState.images,
          container,
          project
        );

        break;


      case "uiux":

        renderUIUX(
          workState.images,
          container
        );

        break;


      case "photography":

        renderPhotography(
          workState.images,
          container
        );

        break;


      case "poster":
      case "posters":

        renderPosters(
          workState.images,
          container
        );

        break;


      default:

        if (project.category === "photography") {

          renderPhotography(
            workState.images,
            container
          );

        } else if (
          ["poster", "posters"].includes(
            String(project.category).toLowerCase()
          ) ||
          ["poster", "posters"].includes(
            String(project.type).toLowerCase()
          )
        ) {

          renderPosters(
            workState.images,
            container
          );

        } else {

          renderDefault(
            workState.images,
            container
          );

        }

        break;

    }

  }


  /* --------------------------------------------------------
     07. IMAGE INFORMATION
  -------------------------------------------------------- */

  if (!isPhotography) {

    const information = renderImageInformation(
      workState.images,
      container
    );

    const live = project.livePreview;

    if (
      information &&
      project.layout === "website" &&
      live?.enabled &&
      live.url
    ) {

      information.hidden = true;

    }

  }


  /* --------------------------------------------------------
     08. NEXT PROJECT
  -------------------------------------------------------- */

  renderNextProject(project);

}

/* ==========================================================
   15. NEXT PROJECT
========================================================== */

function renderNextProject(project) {

  const sameCategory = PROJECTS.filter(
    item => item.category === project.category
  );

  const index = sameCategory.findIndex(
    item => item.id === project.id
  );


  /* --------------------------------------------------------
     SINGLE PROJECT
  -------------------------------------------------------- */

  if (sameCategory.length <= 1) {

    $("workNextLabel").textContent =
      "CONTINUE EXPLORING";

    $("workNextTitle").textContent =
      "THE ARCHIVE";

    $("workNextCategory").textContent =
      "EXPLORE ALL COLLECTIONS";

    $("workNext").href =
      "archive.html";

    return;

  }

  $("workNextLabel").textContent =
    "NEXT PROJECT";


  /* --------------------------------------------------------
     NEXT PROJECT IN CATEGORY
  -------------------------------------------------------- */

  const next = sameCategory[
    (index + 1) % sameCategory.length
  ];

  $("workNextTitle").textContent =
    next.title;

  $("workNextCategory").textContent =
    getCategoryTitle(
      next.category
    ).toUpperCase();

  $("workNext").href =
    `work.html?project=${encodeURIComponent(next.id)}`;

}


/* ==========================================================
   16. SHARED IMAGE LIGHTBOX
========================================================== */


/* ----------------------------------------------------------
   TRANSFORM
---------------------------------------------------------- */

function updateLightboxTransform() {

  $("lightboxImage").style.transform =
    `translate(${workState.panX}px, ${workState.panY}px) scale(${workState.zoom})`;

  $("lightboxZoomLevel").textContent =
    `${Math.round(workState.zoom * 100)}%`;

  $("lightboxStage").classList.toggle(
    "zoomed",
    workState.zoom > 1
  );

}


/* ----------------------------------------------------------
   RESET ZOOM
---------------------------------------------------------- */

function resetLightboxZoom() {

  workState.zoom = 1;
  workState.panX = 0;
  workState.panY = 0;

  updateLightboxTransform();

}


/* ----------------------------------------------------------
   DISPLAY IMAGE
---------------------------------------------------------- */

function showLightboxImage(index) {

  const images = workState.images;

  if (!images.length) return;

  workState.lightboxIndex =
    (index + images.length) % images.length;

  const image =
    images[workState.lightboxIndex];

  $("lightboxImage").src = image.src;
  $("lightboxImage").alt = image.label;

  $("lightboxTitle").textContent =
    `${workState.project.title.toUpperCase()} / ${image.label}`;

  $("lightboxCounter").textContent =
    `${pad(workState.lightboxIndex + 1)} / ${pad(images.length)}`;

  resetLightboxZoom();

}


/* ----------------------------------------------------------
   OPEN LIGHTBOX
---------------------------------------------------------- */

function openLightbox(index) {

  const lightbox = $("workLightbox");

  workState.lastFocus =
    document.activeElement;

  showLightboxImage(index);

  lightbox.inert = false;

  lightbox.classList.add("open");

  lightbox.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.classList.add(
    "work-lightbox-open"
  );

  $("lightboxClose").focus();

}


/* ----------------------------------------------------------
   CLOSE LIGHTBOX
---------------------------------------------------------- */

function closeLightbox() {

  const lightbox = $("workLightbox");

  if (!lightbox.classList.contains("open")) {
    return;
  }

  lightbox.classList.remove("open");

  lightbox.inert = true;

  lightbox.setAttribute(
    "aria-hidden",
    "true"
  );

  document.body.classList.remove(
    "work-lightbox-open"
  );

  resetLightboxZoom();

  if (
    workState.lastFocus &&
    workState.lastFocus.isConnected
  ) {

    workState.lastFocus.focus();

  }

}


/* ----------------------------------------------------------
   CHANGE ZOOM
---------------------------------------------------------- */

function changeLightboxZoom(amount) {

  workState.zoom = Math.max(
    1,
    Math.min(
      4,
      workState.zoom + amount
    )
  );

  if (workState.zoom === 1) {

    workState.panX = 0;
    workState.panY = 0;

  }

  updateLightboxTransform();

}


/* ==========================================================
   LIGHTBOX INITIALIZATION
========================================================== */

function initializeLightbox() {


  /* --------------------------------------------------------
     CLOSE
  -------------------------------------------------------- */

  $("lightboxClose").addEventListener(
    "click",
    closeLightbox
  );


  /* --------------------------------------------------------
     IMAGE NAVIGATION
  -------------------------------------------------------- */

  $("lightboxPrev").addEventListener(
    "click",
    () => {

      showLightboxImage(
        workState.lightboxIndex - 1
      );

    }
  );

  $("lightboxNext").addEventListener(
    "click",
    () => {

      showLightboxImage(
        workState.lightboxIndex + 1
      );

    }
  );


  /* --------------------------------------------------------
     ZOOM CONTROLS
  -------------------------------------------------------- */

  $("lightboxZoomIn").addEventListener(
    "click",
    () => changeLightboxZoom(.25)
  );

  $("lightboxZoomOut").addEventListener(
    "click",
    () => changeLightboxZoom(-.25)
  );

  $("lightboxZoomReset").addEventListener(
    "click",
    resetLightboxZoom
  );


  /* --------------------------------------------------------
     KEYBOARD
  -------------------------------------------------------- */

  document.addEventListener(
    "keydown",
    event => {

      if (
        !$("workLightbox").classList.contains("open")
      ) {
        return;
      }

      if (event.key === "Escape") {

        event.preventDefault();

        closeLightbox();

      }

      if (event.key === "ArrowLeft") {

        event.preventDefault();

        showLightboxImage(
          workState.lightboxIndex - 1
        );

      }

      if (event.key === "ArrowRight") {

        event.preventDefault();

        showLightboxImage(
          workState.lightboxIndex + 1
        );

      }

      if (
        event.key === "+" ||
        event.key === "="
      ) {

        event.preventDefault();

        changeLightboxZoom(.25);

      }

      if (event.key === "-") {

        event.preventDefault();

        changeLightboxZoom(-.25);

      }


      /* ----------------------------------------------------
         FOCUS CONTAINMENT
      ---------------------------------------------------- */

      if (event.key === "Tab") {

        const focusable = [
          ...$("workLightbox").querySelectorAll(
            "button"
          )
        ].filter(button => !button.disabled);

        if (!focusable.length) return;

        const first = focusable[0];

        const last = focusable[
          focusable.length - 1
        ];

        if (
          event.shiftKey &&
          document.activeElement === first
        ) {

          event.preventDefault();

          last.focus();

        } else if (
          !event.shiftKey &&
          document.activeElement === last
        ) {

          event.preventDefault();

          first.focus();

        }

      }

    }
  );


  /* --------------------------------------------------------
   TOUCH NAVIGATION, PINCH ZOOM AND POINTER DRAGGING
  -------------------------------------------------------- */

  const stage = $("lightboxStage");

  const activePointers = new Map();

  let gesture = null;

  const SWIPE_DISTANCE = 55;
  const SWIPE_LIMIT = 100;
  const MAX_ZOOM = 4;

  function pointerDistance(a, b) {
    return Math.hypot(
      b.x - a.x,
      b.y - a.y
    );
  }

  function clampZoom(value) {
    return Math.max(
      1,
      Math.min(MAX_ZOOM, value)
    );
  }

  function resetGesture() {
    gesture = null;
    stage.classList.remove("dragging");
  }

  stage.addEventListener(
    "pointerdown",
    event => {

      if (!event.isPrimary && event.pointerType === "mouse") {
        return;
      }

      activePointers.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY
      });

      stage.setPointerCapture(event.pointerId);

      const pointers = [...activePointers.values()];

      if (pointers.length === 1) {

        gesture = {
          type: "single",

          startX: event.clientX,
          startY: event.clientY,

          panX: workState.panX,
          panY: workState.panY,

          zoom: workState.zoom,

          pointerType: event.pointerType,

          moved: false
        };

        if (workState.zoom > 1) {
          stage.classList.add("dragging");
        }

      }

      if (pointers.length === 2) {

        gesture = {
          type: "pinch",

          distance: pointerDistance(
            pointers[0],
            pointers[1]
          ),

          zoom: workState.zoom,

          panX: workState.panX,
          panY: workState.panY
        };

        stage.classList.add("dragging");

      }

    }
  );

  stage.addEventListener(
    "pointermove",
    event => {

      if (!activePointers.has(event.pointerId)) {
        return;
      }

      activePointers.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY
      });

      if (!gesture) return;

      const pointers = [...activePointers.values()];

      /* TWO-FINGER PINCH */

      if (
        gesture.type === "pinch" &&
        pointers.length === 2
      ) {

        const distance = pointerDistance(
          pointers[0],
          pointers[1]
        );

        const scale = distance / Math.max(
          gesture.distance,
          1
        );

        workState.zoom = clampZoom(
          gesture.zoom * scale
        );

        const midpointX =
          (pointers[0].x + pointers[1].x) / 2;

        const midpointY =
          (pointers[0].y + pointers[1].y) / 2;

        const rect = stage.getBoundingClientRect();

        const offsetX =
          midpointX - (rect.left + rect.width / 2);

        const offsetY =
          midpointY - (rect.top + rect.height / 2);

        const zoomRatio =
          workState.zoom / Math.max(gesture.zoom, 1);

        workState.panX =
          gesture.panX + offsetX * (1 - zoomRatio);

        workState.panY =
          gesture.panY + offsetY * (1 - zoomRatio);

        if (workState.zoom === 1) {
          workState.panX = 0;
          workState.panY = 0;
        }

        updateLightboxTransform();

        return;
      }

      /* SINGLE-POINTER MOVEMENT */

      if (
        gesture.type === "single" &&
        pointers.length === 1
      ) {

        const dx =
          event.clientX - gesture.startX;

        const dy =
          event.clientY - gesture.startY;

        if (Math.hypot(dx, dy) > 8) {
          gesture.moved = true;
        }

        /* PAN WHEN ZOOMED */

        if (workState.zoom > 1) {

          workState.panX = gesture.panX + dx;
          workState.panY = gesture.panY + dy;

          updateLightboxTransform();

        }

      }

    }
  );

  function finishPointer(event, cancelled = false) {

    if (!activePointers.has(event.pointerId)) {
      return;
    }

    const wasSingleGesture =
      gesture &&
      gesture.type === "single" &&
      activePointers.size === 1;

    if (
      !cancelled &&
      wasSingleGesture &&
      gesture.pointerType === "touch" &&
      workState.zoom === 1
    ) {

      const dx =
        event.clientX - gesture.startX;

      const dy =
        event.clientY - gesture.startY;

      const horizontalSwipe =
        Math.abs(dx) >= SWIPE_DISTANCE &&
        Math.abs(dx) > Math.abs(dy) * 1.4;

      const verticalWithinLimit =
        Math.abs(dy) < SWIPE_LIMIT;

      if (
        horizontalSwipe &&
        verticalWithinLimit
      ) {

        if (dx < 0) {

          showLightboxImage(
            workState.lightboxIndex + 1
          );

        } else {

          showLightboxImage(
            workState.lightboxIndex - 1
          );

        }

      }

    }

    activePointers.delete(event.pointerId);

    if (
      stage.hasPointerCapture(event.pointerId)
    ) {
      stage.releasePointerCapture(event.pointerId);
    }

    if (activePointers.size === 0) {

      resetGesture();

    } else if (gesture?.type === "pinch") {

      /*
        After a pinch, require a new gesture
        before allowing swipe navigation.
      */

      gesture = null;

      stage.classList.remove("dragging");

    }

  }

  stage.addEventListener(
    "pointerup",
    event => finishPointer(event)
  );

  stage.addEventListener(
    "pointercancel",
    event => finishPointer(event, true)
  );

  stage.addEventListener(
    "lostpointercapture",
    event => {

      activePointers.delete(event.pointerId);

      if (activePointers.size === 0) {
        resetGesture();
      }

    }
  );


  /* --------------------------------------------------------
     WHEEL ZOOM
  -------------------------------------------------------- */

  stage.addEventListener(
    "wheel",
    event => {

      if (
        !$("workLightbox").classList.contains("open")
      ) {
        return;
      }

      event.preventDefault();

      changeLightboxZoom(
        event.deltaY < 0 ? .25 : -.25
      );

    },
    {
      passive: false
    }
  );

}

/* ==========================================================
   17. THEME
========================================================== */

function initializeTheme() {

  const light = $("lightTheme");
  const dark = $("darkTheme");
  const themeColor = $("themeColor");

  function applyTheme(theme, save = false) {

    const next =
      theme === "light" ? "light" : "dark";

    const isLight = next === "light";

    document.documentElement.dataset.theme =
      next;

    if (light) {

      light.classList.toggle(
        "active",
        isLight
      );

      light.setAttribute(
        "aria-pressed",
        String(isLight)
      );

    }

    if (dark) {

      dark.classList.toggle(
        "active",
        !isLight
      );

      dark.setAttribute(
        "aria-pressed",
        String(!isLight)
      );

    }

    if (themeColor) {

      themeColor.content =
        isLight ? "#e9e7e1" : "#111111";

    }

    if (save) {

      try {

        localStorage.setItem(
          "lou-reyes-theme",
          next
        );

      } catch (error) {

        // Theme switching remains available.

      }

    }

  }


  light?.addEventListener(
    "click",
    () => applyTheme("light", true)
  );

  dark?.addEventListener(
    "click",
    () => applyTheme("dark", true)
  );

  applyTheme(
    document.documentElement.dataset.theme
  );

}


/* ==========================================================
   18. FULLSCREEN NAVIGATION
========================================================== */

function initializeMenu() {

  const button = $("menuButton");
  const menu = $("menuScreen");
  const label = $("menuLabel");

  if (!button || !menu) return;


  /* --------------------------------------------------------
     MENU STATE
  -------------------------------------------------------- */

  function setMenu(open) {

    menu.classList.toggle(
      "open",
      open
    );

    button.classList.toggle(
      "active",
      open
    );

    button.setAttribute(
      "aria-expanded",
      String(open)
    );

    button.setAttribute(
      "aria-label",
      open
        ? "Close navigation"
        : "Open navigation"
    );

    menu.setAttribute(
      "aria-hidden",
      String(!open)
    );

    menu.inert = !open;

    if (label) {

      label.textContent =
        open ? "CLOSE" : "MENU";

    }

    document.body.classList.toggle(
      "menu-open",
      open
    );

  }


  /* --------------------------------------------------------
     TOGGLE
  -------------------------------------------------------- */

  button.addEventListener(
    "click",
    () => {

      setMenu(
        !menu.classList.contains("open")
      );

    }
  );


  /* --------------------------------------------------------
     ESCAPE
  -------------------------------------------------------- */

  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Escape" &&
        menu.classList.contains("open")
      ) {

        setMenu(false);

        button.focus();

      }

    }
  );


  /* --------------------------------------------------------
     NAVIGATION LINKS
  -------------------------------------------------------- */

  menu.querySelectorAll("a").forEach(link => {

    link.addEventListener(
      "click",
      () => setMenu(false)
    );

  });

}


/* ==========================================================
   19. INITIALIZATION
========================================================== */

function initializeWorkPage() {

  initializeTheme();
  initializeMenu();
  initializeLightbox();


  /* --------------------------------------------------------
     PORTFOLIO DATA
  -------------------------------------------------------- */

  if (
    typeof PROJECTS === "undefined" ||
    typeof CATEGORIES === "undefined"
  ) {

    console.error(
      "Portfolio data could not be loaded."
    );

    $("workTitle").textContent =
      "DATA UNAVAILABLE.";

    document.documentElement.classList.add(
      "work-ready"
    );

    return;

  }


  /* --------------------------------------------------------
     RENDER PROJECT
  -------------------------------------------------------- */

  try {

    renderWork();

  } catch (error) {

    console.error(
      "Work page initialization:",
      error
    );

    document.documentElement.classList.add(
      "work-error"
    );

    $("workTitle").textContent =
      "PRESENTATION UNAVAILABLE.";

    document.documentElement.classList.add(
      "work-ready"
    );

    return;

  }


  /* --------------------------------------------------------
     HERO IMAGE
  -------------------------------------------------------- */

  const heroImage = $("workHeroImage");


  function revealWorkPage() {

    document.documentElement.classList.add(
      "work-ready"
    );

  }


  if (
    !heroImage ||
    !heroImage.getAttribute("src")
  ) {

    revealWorkPage();

    return;

  }


  if (heroImage.complete) {

    revealWorkPage();

  } else {

    heroImage.addEventListener(
      "load",
      revealWorkPage,
      { once: true }
    );

    heroImage.addEventListener(
      "error",
      revealWorkPage,
      { once: true }
    );

  }

}


/* ==========================================================
   START
========================================================== */

if (document.readyState === "loading") {

  document.addEventListener(
    "DOMContentLoaded",
    initializeWorkPage,
    { once: true }
  );

} else {

  initializeWorkPage();

}