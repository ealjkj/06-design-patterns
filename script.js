import { view } from "./app/view.js";
import { model } from "./app/model.js";

let createOrEdit;
let editMode = false;
let numberId = location.hash === '' ? -1 : Number(location.hash.slice(1));

class Manager {
    constructor() {
        this.history = [];
    }
    executeCommand(command, ...args) {
        command.execute(...args);
        this.history.push(command);
    }
    undo() {
        const command = this.history.pop();
        command.undo();
    }
}

const manager = new Manager();

// Commands ----------------------------------------------------
// --------------------------------------------------------

class EditNoteCommand {
    constructor(id) {
        this.editedNoteId = id; 
        this.previousNote = Object.assign({}, model.getNote(id));
    }
    execute(newNote) {
        model.editNote(this.editedNoteId, newNote);
        view.updateNote(model.getNote(this.editedNoteId), this.editedNoteId);
    } 
    undo() {
        model.setNote(this.editedNoteId, this.previousNote);
        view.updateNote(this.previousNote, this.editedNoteId);
    }
} 

class DeleteNoteCommand {
    constructor(id) {
        this.deletedNoteId = id;
        this.note = Object.assign({}, model.getNote(id));
        this.notePosition = model.getPosition(id);
    }
    execute() {
        model.deleteNote(this.deletedNoteId);
        view.loadAllNotes(model.getFilteredNotes());
    }
    undo() {
        model.insertNote(this.deletedNoteId, this.note, this.notePosition);
        view.loadAllNotes(model.getFilteredNotes());
    }
}

class CreateNoteCommand {
    execute(newNote) {
        this.createdNoteId = localStorage.currentId;
        model.createNote(this.createdNoteId, newNote);
        view.loadAllNotes(model.getFilteredNotes());
        
        //
        localStorage.currentId = Number(localStorage.currentId) + 1;
    }
    undo() {
        model.deleteNote(this.createdNoteId);
        view.loadAllNotes(model.getFilteredNotes());
    }
}

class ChangeOrderCommand {
    constructor(aboveId, belowId, pos) {
        this.aboveId = aboveId;
        this.belowId = belowId;
        this.pos = pos;
        this.previousOrder = [...model.indexOrderList];
    }

    execute() {
        model.indexOrderList = model.tempOrder;
        model.pushToDB();
        view.loadAllNotes(model.getFilteredNotes());
    }

    undo() {
        model.indexOrderList = this.previousOrder;
        view.loadAllNotes(model.getFilteredNotes());
    }
}


// Subscriptions -------------------------------------------------
// -------------------------------------------------

view.subscribe('deleteNote', (topic, context) => {
    const deleteNoteCommand = new DeleteNoteCommand(context.id);
    manager.executeCommand(deleteNoteCommand);
});

view.subscribe('createClicked', (topic, context) => {
    createOrEdit = 'create';
    location.hash = localStorage.currentId;
    view.loadEditor({title: '', text: ''});
    editMode = true;
});

view.subscribe('noteClicked', (topic, context) => {
    createOrEdit = 'edit';
    location.hash = context.id;
    editMode = true;
});

view.subscribe('closeEditor', (topic, context) => {
    let today = new Date();
    let note = {
        title: context.title,
        text: context.text,
        lastEditDate: formatDate(today),
        id: context.id
    }
    if(createOrEdit === 'edit') {
        let editNoteCommand = new EditNoteCommand(context.id);
        manager.executeCommand(editNoteCommand, note); 
    } else {
        note.creationDate = formatDate(today);
        let createNoteCommand = new CreateNoteCommand();
        manager.executeCommand(createNoteCommand, note);
        createOrEdit = 'edit';
    }
    location.hash = '';
});

view.subscribe('searching', (topic, context) => {
    model.setFilteredValue(context.content);
    view.loadAllNotes(model.getFilteredNotes());
});

view.subscribe('dragStarted', (topic, context) => {
    model.resetTempOrder();
});

view.subscribe('tempOrderChanged', (topic, context) => {
    if(context.pos === 'right') {
        model.changeToLeftOfInTemp(context.aboveId, context.belowId);
    } else {
        model.changeToRightOfInTemp(context.aboveId, context.belowId);
    }
});

view.subscribe('drop', (topic, context) => {
    const changeOrderCommand = new ChangeOrderCommand(context.aboveId, context.belowId, context.pos);
    manager.executeCommand(changeOrderCommand);
});

view.subscribe('undo', (topic, context) => {
    if (manager.history.length !== 0 && !editMode) {
        manager.undo();
    }
});
// Events-------------------------------------------------------------
// --------------------------------
addEventListener('hashchange', e =>{
    if(numberHash() in model.notes) {
        loadEditor(numberHash());
    }
    else if(createOrEdit !== 'create') {
        view.hideEditor();
        editMode = false;
    }
});

addEventListener('keydown', e => {
    if(e.ctrlKey && e.key === "z" && manager.history.length !== 0 && !editMode) {
        manager.undo();
    }
})

// Functions -----------------------------------------------------------
// ------------------------------------------------------

function formatDate(date) {
    const DD = ('00' + date.getDate()).slice(-2);
    const MM = ('00' + (date.getMonth()+1)).slice(-2);
    const YYYY = date.getFullYear();
    const hh = date.getHours();
    const mm = date.getMinutes();
    const ss = date.getSeconds();

    return `${MM}/${DD}/${YYYY} ${hh}:${mm}:${ss}`;
}

function numberHash() {
    return location.hash === '' ? -1 : Number(location.hash.slice(1));
}

function loadEditor(id, createOrEdit = 'edit') {
    createOrEdit = createOrEdit;
    location.hash = id;
    view.loadEditor(model.getNote(id));
    editMode = true;
}
// Workflow start! -------------------------------------------------
// -------------------------------------------------

model.pullFromDB();

// Load all notes
view.loadAllNotes(model.getOrderedNotes());

//If valid hash detected, click on that note
if(numberId in model.notes) {
    loadEditor(numberId);
}

// Debuging -------------------------------------------------------------
window.editMode = editMode;
window.createOrEdit = createOrEdit;
window.model = model;