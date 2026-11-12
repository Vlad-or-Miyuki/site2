const canvas = document.querySelector('[data-plan-canvas]');
const stage = document.querySelector('[data-plan-stage]');
const artwork = document.querySelector('[data-plan-artwork]');
const image = document.querySelector('[data-plan-image]');
const buildingHighlights = [...document.querySelectorAll('[data-building-highlight]')];
const floorDownload = document.querySelector('[data-floor-download]');
const floorPdfDownload = document.querySelector('[data-floor-pdf-download]');
const title = document.querySelector('[data-plan-title]');
const floorLabel = document.querySelector('[data-plan-floor]');
const caption = document.querySelector('[data-plan-caption]');
const selectionNote = document.querySelector('[data-plan-selection]');
const zoomValue = document.querySelector('[data-zoom-value]');
const sectionInput = document.querySelector('#section-number');
const sectionMessage = document.querySelector('[data-section-message]');
const floorPlans = document.querySelector('.floor-plans');
const planCopy = document.querySelector('.plan-details__copy');

const planWidth = 4068.96;
const planHeight = 5092.98;
const maxScale = 4.2;

const buildingBounds = {
  '15А': { x: 1942.84, y: 3482, width: 1506, height: 1090 },
  '15Б': { x: 1942.84, y: 2444.1275, width: 455, height: 792 },
  '15В': { x: 1985.84, y: 266.56, width: 1107, height: 1909 },
  '15Г': { x: 3682.84, y: 267.13, width: 196, height: 424 },
  '15Д': { x: 3151.37, y: 2379.13, width: 887.96, height: 966 },
};

const selectionBounds = {
  '15А:1': { x: 2513.84, y: 3482.1275, width: 374, height: 337 },
  '15А:2': { x: 2513.84, y: 3482.1275, width: 374, height: 337 },
  '15Б:1': { x: 1942.84, y: 2444.1275, width: 455, height: 792 },
};

const floorBounds = {
  '15Г:4': buildingBounds['15В'],
};

let selectedBuilding = '15А';
let selectedFloor = 1;
let scale = 1;
let offsetX = 0;
let offsetY = 0;
let dragStart = null;
let baseImageWidth = 0;
let baseImageHeight = 0;

function updateBuildingHighlight() {
  buildingHighlights.forEach((highlight) => {
    const matchesBuilding = selectedBuilding === 'Все'
      || highlight.dataset.buildingHighlight === selectedBuilding;
    const visible = matchesBuilding && Number(highlight.dataset.highlightFloor) === selectedFloor;
    highlight.setAttribute('visibility', visible ? 'visible' : 'hidden');
  });
}
function updateTransform() {
  stage.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
  updateBuildingHighlight();
  zoomValue.value = `${Math.round(scale * 100)}%`;
  zoomValue.textContent = `${Math.round(scale * 100)}%`;
}
function resizeImageForScale() {
  if (!baseImageWidth || !baseImageHeight) return;
  artwork.style.width = `${baseImageWidth * scale}px`;
  artwork.style.height = `${baseImageHeight * scale}px`;
}
function setScale(value) {
  scale = Math.min(maxScale, Math.max(.6, value));
  resizeImageForScale();
  updateTransform();
}
function fitSelectedBuilding() {
  const maxWidth = Math.min(canvas.clientWidth * .94, 1180);
  const maxHeight = 700;
  baseImageWidth = Math.min(maxWidth, maxHeight * planWidth / planHeight);
  baseImageHeight = baseImageWidth * planHeight / planWidth;

  const selectionKey = `${selectedBuilding}:${selectedFloor}`;
  const bounds = selectionBounds[selectionKey] || floorBounds[selectionKey] || buildingBounds[selectedBuilding];
  if (!bounds) {
    const allViewFit = selectedFloor === 3 ? 1.08 : 1.02;
    scale = [3, 4, 5].includes(selectedFloor)
      ? Math.min(1, (canvas.clientHeight * allViewFit) / baseImageHeight)
      : 1;
    offsetX = 0;
    offsetY = 0;
    resizeImageForScale();
    updateTransform();
    return;
  }

  const containScale = baseImageWidth / planWidth;
  const fitWidth = (canvas.clientWidth * .78) / (bounds.width * containScale);
  const fitHeightRatio = (selectedBuilding === '15А' && [3, 4, 5].includes(selectedFloor))
    || (selectedFloor === 4 && ['15В', '15Г'].includes(selectedBuilding)) ? .9
    : selectedBuilding === '15В' && selectedFloor === 5 ? .86 : .82;
  const fitHeight = (canvas.clientHeight * fitHeightRatio) / (bounds.height * containScale);
  const fitScaleLimit = selectionBounds[`${selectedBuilding}:${selectedFloor}`] ? 3.2 : maxScale;
  scale = Math.min(fitScaleLimit, Math.max(.6, Math.min(fitWidth, fitHeight)));
  offsetX = -((bounds.x + bounds.width / 2) - planWidth / 2) * containScale * scale;
  offsetY = -((bounds.y + bounds.height / 2) - planHeight / 2) * containScale * scale;
  resizeImageForScale();
  updateTransform();
}
function updateLabels() {
  const buildingName = selectedBuilding === 'Все' ? 'Все корпуса' : `Корпус ${selectedBuilding}`;
  title.textContent = buildingName;
  caption.textContent = `${selectedBuilding === 'Все' ? 'Все корпуса' : selectedBuilding} / ${selectedFloor} этаж`;
  updatePlanCopy();
}
function updatePlanCopy() {
  if (selectedFloor === 3) {
    const floorThreeCopy = {
      'Все': 'Номера на этом листе не подписаны. Серые контуры — ориентиры корпусов без подробного плана.',
      '15А': 'Офисный этаж: в исходнике показан общий контур.',
      '15Б': 'В исходнике показаны контур и лестница с лифтом, без отдельных помещений.',
    };
    planCopy.textContent = floorThreeCopy[selectedBuilding] || 'В исходном плане этого этажа номера помещений не подписаны.';
    return;
  }
  if (selectedFloor === 4) {
    const floorFourCopy = {
      'Все': 'Номера на этом листе не подписаны. Серые контуры — ориентиры корпусов без подробного плана.',
      '15А': 'Офисный этаж: в исходнике показан общий контур.',
      '15Б': 'Офисный этаж: в исходнике показан общий контур.',
    };
    planCopy.textContent = floorFourCopy[selectedBuilding] || 'В исходном плане этого этажа номера помещений не подписаны.';
    return;
  }
  if (selectedFloor === 5) {
    const floorFiveCopy = {
      'Все': 'Номера на этом листе не подписаны. Серые контуры — ориентиры корпусов без подробного плана.',
      '15А': 'Офисный этаж: в исходнике показан общий контур.',
      '15В': 'В исходном плане этого этажа номера помещений не подписаны.',
      '15Д': 'Одно крупное помещение без подписанных номеров.',
    };
    planCopy.textContent = floorFiveCopy[selectedBuilding] || 'Подробного плана этого этажа в исходнике нет.';
    return;
  }
  planCopy.textContent = 'Номера и обозначения сохранены из исходных планов. Приближайте схему и перемещайте её, чтобы рассмотреть подписи и полезные места.';
}
function updateFloorAvailability() {
  const floorFiveUnavailable = ['15Б', '15Г'].includes(selectedBuilding);
  document.querySelectorAll('button[data-floor]').forEach((button) => {
    button.disabled = floorFiveUnavailable && Number(button.dataset.floor) === 5;
  });
}
function setBuilding(building) {
  selectedBuilding = building;
  document.querySelectorAll('button[data-building]').forEach((button) => {
    const active = button.dataset.building === building;
    button.classList.toggle('is-selected', active);
    button.setAttribute('aria-pressed', String(active));
  });
  updateFloorAvailability();
  if (selectedFloor === 5 && ['15Б', '15Г'].includes(building)) {
    setFloor(1);
    return;
  }
  fitSelectedBuilding();
  updateLabels();
}
function setFloor(floor) {
  floor = Number(floor);
  if (floor === 5 && ['15Б', '15Г'].includes(selectedBuilding)) return;
  selectedFloor = floor;
  const planUrl = `../assets/plans/floor-${selectedFloor}.svg`;
  image.src = planUrl;
  image.alt = `План ${selectedFloor} этажа комплекса «Аквилон»`;
  floorDownload.href = planUrl;
  floorPdfDownload.href = `../assets/plans/floor-${selectedFloor}.pdf`;
  floorLabel.textContent = `${selectedFloor} этаж`;
  document.querySelectorAll('button[data-floor]').forEach((button) => {
    const active = Number(button.dataset.floor) === selectedFloor;
    button.classList.toggle('is-selected', active);
    button.setAttribute('aria-pressed', String(active));
  });
  selectionNote.hidden = true;
  sectionMessage.textContent = selectedFloor >= 3
    ? 'Номера секций в исходном плане этого этажа не указаны.'
    : 'Введите номер и сверяйте подпись на увеличенном исходном плане.';

  fitSelectedBuilding();
  updateLabels();
}

document.querySelectorAll('button[data-building]').forEach((button) => button.addEventListener('click', () => setBuilding(button.dataset.building)));
document.querySelectorAll('button[data-floor]').forEach((button) => button.addEventListener('click', () => setFloor(button.dataset.floor)));
document.querySelectorAll('[data-zoom]').forEach((button) => button.addEventListener('click', () => {
  if (button.dataset.zoom === 'in') setScale(scale + .2);
  if (button.dataset.zoom === 'out') setScale(scale - .2);
  if (button.dataset.zoom === 'reset') fitSelectedBuilding();
}));

canvas.addEventListener('wheel', (event) => {
  event.preventDefault();
  setScale(scale + (event.deltaY < 0 ? .12 : -.12));
}, { passive: false });
canvas.addEventListener('pointerdown', (event) => {
  if (!event.isPrimary || event.button !== 0 || event.target.closest('.plan-controls, button, a, input')) return;
  event.preventDefault();
  dragStart = {
    pointerId: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    offsetX,
    offsetY,
  };
  canvas.classList.add('is-dragging');
  try { canvas.setPointerCapture(event.pointerId); } catch { /* Pointer capture may be unavailable in embedded previews. */ }
});
canvas.addEventListener('pointermove', (event) => {
  if (!dragStart || event.pointerId !== dragStart.pointerId) return;
  offsetX = dragStart.offsetX + event.clientX - dragStart.x;
  offsetY = dragStart.offsetY + event.clientY - dragStart.y;
  updateTransform();
});
function stopDragging(event) {
  if (!dragStart || (event?.pointerId != null && event.pointerId !== dragStart.pointerId)) return;
  const pointerId = dragStart.pointerId;
  dragStart = null;
  canvas.classList.remove('is-dragging');
  try {
    if (canvas.hasPointerCapture(pointerId)) canvas.releasePointerCapture(pointerId);
  } catch { /* The browser may already have released it. */ }
}
canvas.addEventListener('pointerup', stopDragging);
canvas.addEventListener('pointercancel', stopDragging);
canvas.addEventListener('lostpointercapture', stopDragging);
window.addEventListener('blur', stopDragging);

window.addEventListener('resize', fitSelectedBuilding);

document.querySelector('[data-section-search]').addEventListener('submit', (event) => {
  event.preventDefault();
  const section = sectionInput.value.trim();
  if (!section) { sectionMessage.textContent = 'Введите номер, указанный на плане.'; sectionInput.focus(); return; }
  sectionMessage.textContent = `Увеличьте схему и найдите подпись «${section}» на исходном плане.`;
  setScale(Math.max(scale, 1.25));
  canvas.focus({ preventScroll: true });
});

document.querySelectorAll('[data-show-on-plan]').forEach((link) => link.addEventListener('click', () => {
  setBuilding(link.dataset.building);
  setFloor(link.dataset.floor);
  selectionNote.textContent = `${link.dataset.object} · корпус ${link.dataset.building}, ${link.dataset.floor} этаж. Подпись смотрите на плане.`;
  selectionNote.hidden = false;
}));

document.querySelector('[data-fullscreen]').addEventListener('click', async () => {
  try {
    if (!document.fullscreenElement) await floorPlans.requestFullscreen();
    else await document.exitFullscreen();
  } catch {
    selectionNote.textContent = 'Полноэкранный режим недоступен в этом браузере.';
    selectionNote.hidden = false;
  }
});
document.addEventListener('fullscreenchange', () => {
  const button = document.querySelector('[data-fullscreen]');
  const active = document.fullscreenElement === floorPlans;
  button.innerHTML = active ? '<span aria-hidden="true">⤢</span> Выйти из полного экрана' : '<span aria-hidden="true">⤢</span> На весь экран';
  button.setAttribute('aria-label', active ? 'Выйти из полноэкранного режима' : 'Развернуть схему на весь экран');
});
fitSelectedBuilding();
updateLabels();
