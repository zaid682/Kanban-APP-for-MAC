const STORE_KEY = 'kanban-bureau-v1';
const palette = ['#E5834D', '#5E9A89', '#D17673', '#798CB5', '#B8964E', '#947B9C'];
const seed = { title: 'Mon tableau', columns: [
  { id: 'todo', name: 'À faire', color: '#798CB5', tasks: [{ id: 'a', title: 'Définir les priorités de la semaine', label: 'Cette semaine', color: '#798CB5' }, { id: 'b', title: 'Préparer le prochain objectif', label: 'Personnel', color: '#E5834D' }] },
  { id: 'doing', name: 'En cours', color: '#E5834D', tasks: [{ id: 'c', title: 'Faire avancer le projet principal', label: 'Aujourd’hui', color: '#E5834D' }] },
  { id: 'done', name: 'Terminé', color: '#5E9A89', tasks: [] }
] };
let state = load();
let editingTask = null;
let editingColumn = null;
let dragged = null;
const $ = (selector) => document.querySelector(selector);
const uid = () => crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;

function load() { try { return JSON.parse(localStorage.getItem(STORE_KEY)) || structuredClone(seed); } catch { return structuredClone(seed); } }
function save() { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
function getColumn(id) { return state.columns.find(column => column.id === id); }
function getTask(id) { for (const column of state.columns) { const task = column.tasks.find(item => item.id === id); if (task) return { task, column }; } }
function defaultPosition(index) {
  const columnWidth = 292, gap = 26, rowHeight = 515;
  return { x: 24 + (index % 4) * (columnWidth + gap), y: 8 + Math.floor(index / 4) * (rowHeight + gap) };
}
function render() {
  $('#boardTitle').textContent = state.title;
  const board = $('#board'); board.innerHTML = '';
  state.columns.forEach((column, index) => {
    const node = $('#columnTemplate').content.firstElementChild.cloneNode(true);
    node.dataset.columnId = column.id; node.style.setProperty('--accent', column.color);
    const position = Number.isFinite(column.x) && Number.isFinite(column.y) ? column : defaultPosition(index);
    node.style.left = `${position.x}px`; node.style.top = `${position.y}px`;
    node.style.width = `${Number.isFinite(column.width) ? column.width : 292}px`;
    const name = node.querySelector('.column-name'); name.textContent = column.name; name.onclick = () => openColumn(column.id);
    node.querySelector('.column-swatch').style.background = column.color;
    node.querySelector('.count').textContent = String(column.tasks.length).padStart(2, '0');
    node.querySelector('.more-button').onclick = () => openColumn(column.id);
    node.querySelector('.add-task').onclick = () => openTask(null, column.id);
    const list = node.querySelector('.task-list');
    list.addEventListener('dragover', event => { event.preventDefault(); list.classList.add('is-over'); });
    list.addEventListener('dragleave', () => list.classList.remove('is-over'));
    list.addEventListener('drop', event => { event.preventDefault(); list.classList.remove('is-over'); moveTask(column.id, event); });
    column.tasks.forEach(task => {
      const item = $('#taskTemplate').content.firstElementChild.cloneNode(true);
      item.dataset.taskId = task.id; item.querySelector('.task-title').textContent = task.title;
      item.querySelector('.task-label').textContent = task.label || 'Sans étiquette'; item.querySelector('.task-dot').style.background = task.color || column.color;
      item.addEventListener('click', () => openTask(task.id, column.id));
      item.addEventListener('dragstart', event => { dragged = { taskId:task.id, sourceId:column.id }; item.classList.add('dragging'); event.dataTransfer.effectAllowed = 'move'; });
      item.addEventListener('dragend', () => { document.querySelectorAll('.task-list').forEach(list => list.classList.remove('is-over')); item.classList.remove('dragging'); });
      list.append(item);
    });
    enableColumnMovement(node, column);
    enableColumnResize(node, column);
    board.append(node);
  });
}
function enableColumnMovement(node, column) {
  const header = node.querySelector('.column-head');
  header.addEventListener('pointerdown', event => {
    if (event.target.closest('button')) return;
    const board = $('#board'), boardRect = board.getBoundingClientRect(), startRect = node.getBoundingClientRect();
    const startX = event.clientX, startY = event.clientY, left = startRect.left - boardRect.left + board.scrollLeft, top = startRect.top - boardRect.top;
    node.classList.add('is-moving'); header.setPointerCapture(event.pointerId);
    const move = moveEvent => {
      const maxX = Math.max(10, board.scrollWidth - node.offsetWidth - 10), maxY = Math.max(10, board.scrollHeight - node.offsetHeight - 10);
      column.x = Math.round(Math.max(10, Math.min(maxX, left + moveEvent.clientX - startX)));
      column.y = Math.round(Math.max(10, Math.min(maxY, top + moveEvent.clientY - startY)));
      node.style.left = `${column.x}px`; node.style.top = `${column.y}px`;
    };
    const stop = () => { node.classList.remove('is-moving'); save(); header.removeEventListener('pointermove', move); header.removeEventListener('pointerup', stop); header.removeEventListener('pointercancel', stop); };
    header.addEventListener('pointermove', move); header.addEventListener('pointerup', stop); header.addEventListener('pointercancel', stop);
  });
}
function enableColumnResize(node, column) {
  const handle = node.querySelector('.column-resize');
  handle.addEventListener('pointerdown', event => {
    event.preventDefault(); event.stopPropagation();
    const startX = event.clientX, startWidth = node.getBoundingClientRect().width;
    node.classList.add('is-resizing'); handle.setPointerCapture(event.pointerId);
    const resize = resizeEvent => {
      column.width = Math.round(Math.max(220, Math.min(560, startWidth + resizeEvent.clientX - startX)));
      node.style.width = `${column.width}px`;
    };
    const stop = () => { node.classList.remove('is-resizing'); save(); handle.removeEventListener('pointermove', resize); handle.removeEventListener('pointerup', stop); handle.removeEventListener('pointercancel', stop); };
    handle.addEventListener('pointermove', resize); handle.addEventListener('pointerup', stop); handle.addEventListener('pointercancel', stop);
  });
}
function moveTask(destinationId, event) {
  if (!dragged) return;
  const source = getColumn(dragged.sourceId), destination = getColumn(destinationId);
  const index = source.tasks.findIndex(task => task.id === dragged.taskId); if (index < 0) return;
  const [task] = source.tasks.splice(index, 1);
  const target = event.target.closest('.task');
  const targetIndex = target ? destination.tasks.findIndex(item => item.id === target.dataset.taskId) : -1;
  destination.tasks.splice(targetIndex < 0 ? destination.tasks.length : targetIndex, 0, task);
  dragged = null; save(); render();
}
function openTask(taskId, columnId) {
  editingTask = taskId ? { taskId, columnId } : { taskId:null, columnId };
  const current = taskId ? getTask(taskId).task : null;
  $('#taskDialogEyebrow').textContent = current ? 'MODIFIER LA TÂCHE' : 'NOUVELLE TÂCHE';
  $('#taskName').value = current?.title || ''; $('#taskLabel').value = current?.label || ''; $('#taskColor').value = current?.color || getColumn(columnId).color;
  $('#deleteTask').style.visibility = current ? 'visible' : 'hidden'; $('#taskDialog').showModal(); $('#taskName').focus();
}
function openColumn(columnId = null) {
  editingColumn = columnId;
  const current = columnId ? getColumn(columnId) : null;
  $('#columnDialogEyebrow').textContent = current ? 'MODIFIER LA COLONNE' : 'NOUVELLE COLONNE';
  $('#columnName').value = current?.name || ''; $('#columnColor').value = current?.color || palette[state.columns.length % palette.length];
  $('#deleteColumn').style.visibility = current ? 'visible' : 'hidden'; $('#columnDialog').showModal(); $('#columnName').focus();
}
$('#addColumn').onclick = () => openColumn();
$('#renameBoard').onclick = () => { const title = prompt('Nom de ton tableau :', state.title); if (title?.trim()) { state.title = title.trim(); save(); render(); } };
$('#taskForm').addEventListener('submit', event => { event.preventDefault(); const title = $('#taskName').value.trim(); if (!title) return; const data = { title, label:$('#taskLabel').value.trim(), color:$('#taskColor').value }; if (editingTask.taskId) Object.assign(getTask(editingTask.taskId).task, data); else getColumn(editingTask.columnId).tasks.push({ id:uid(), ...data }); save(); $('#taskDialog').close(); render(); });
$('#deleteTask').onclick = () => { if (!editingTask?.taskId || !confirm('Supprimer cette tâche ?')) return; const column = getTask(editingTask.taskId).column; column.tasks = column.tasks.filter(task => task.id !== editingTask.taskId); save(); $('#taskDialog').close(); render(); };
$('#columnForm').addEventListener('submit', event => { event.preventDefault(); const name = $('#columnName').value.trim(); if (!name) return; const data = { name, color:$('#columnColor').value }; if (editingColumn) Object.assign(getColumn(editingColumn), data); else state.columns.push({ id:uid(), ...data, ...defaultPosition(state.columns.length), tasks:[] }); save(); $('#columnDialog').close(); render(); });
$('#deleteColumn').onclick = () => { const column = getColumn(editingColumn); if (!column || !confirm(`Supprimer « ${column.name} » et ses tâches ?`)) return; state.columns = state.columns.filter(item => item.id !== editingColumn); save(); $('#columnDialog').close(); render(); };
$('#settingsButton').onclick = () => $('#settingsDialog').showModal();
$('#exportBoard').onclick = () => { const blob = new Blob([JSON.stringify(state,null,2)], {type:'application/json'}); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'sauvegarde-kanban.json'; link.click(); URL.revokeObjectURL(link.href); };
$('#importBoard').onchange = event => { const file = event.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { try { const imported = JSON.parse(reader.result); if (!imported.title || !Array.isArray(imported.columns)) throw new Error(); state = imported; save(); $('#settingsDialog').close(); render(); } catch { alert('Ce fichier ne semble pas être une sauvegarde Kanban valide.'); } }; reader.readAsText(file); };
$('#resetBoard').onclick = () => { if (!confirm('Réinitialiser le tableau ? La sauvegarde actuelle sera remplacée.')) return; state = structuredClone(seed); save(); $('#settingsDialog').close(); render(); };
render();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'));
}
