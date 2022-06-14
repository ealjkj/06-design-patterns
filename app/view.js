let noteTemplate = document.getElementById('note-template').content;
let createNoteBtn = document.getElementById('create-note-template').content;
let undoBtn = document.getElementById('undo-btn');

const noteContainer = document.getElementById('note-container');
const searchbox = document.getElementById('search-box');
const modalContainer = document.getElementById('modal-template').content.querySelector('#modal-container');
const modalTextarea = modalContainer.querySelector('#box-text-input'); 
const modalBox = modalContainer.querySelector('.modal-box'); 
let belowId;
let aboveNote;
let enterNotePos

let fragment = new DocumentFragment();

class PubSub {
    constructor() {
        // Storage for topics that can be broadcast or listened to
        this.topics = {};
        // A topic identifier
        this.subUid = -1;
    }

    publish(topic, context) {
        if (!this.topics[topic]) {
            return false;
        }

        const subscribers = this.topics[topic];
        let len = subscribers ? subscribers.length : 0;

        while (len--) {
            subscribers[len].func(topic, context);
        }

        return this;
    }

    subscribe(topic, func) {
        if (!this.topics[topic]) {
            this.topics[topic] = [];
        }

        const token = (++this.subUid).toString();
        this.topics[topic].push({
            token,
            func,
        });
        return token;
    }

    unsubscribe(token) {
        for (const m in this.topics) {
            if (this.topics[m]) {
                for (let i = 0, j = this.topics[m].length; i < j; i++) {
                    if (this.topics[m][i].token === token) {
                        this.topics[m].splice(i, 1);

                        return token;
                    }
                }
            }
        }
        return this;
    }
}

class View extends PubSub {
    loadAllNotes(notes) {
        for(let note of notes){
            createNote(note, note.id, fragment);
        }
        fragment.insertBefore(createNoteBtn.cloneNode(true), fragment.firstChild);
        noteContainer.replaceChildren(fragment);
    } 
    loadEditor( {title, text, lastEditDate, creationDate} ) {
        let textElement = modalBox.querySelector('#box-text-input');
        document.body.appendChild(modalContainer);
    
        modalBox.querySelector('#box-title-input').value = title;
        modalBox.querySelector('#box-last-edit').textContent = `Last edit: ${lastEditDate}`;
        modalBox.querySelector('#box-creation-date').textContent = `Creation date: ${creationDate}`;
        
        //Setting the text and the right size
        textElement.value = text;
        textElement.oninput();
    }
    deleteNote(id) {
        const note = document.querySelector(`[data-id="${id}"]`);
        noteContainer.removeChild(note);
    }
    updateNote(noteData, id) {
        const note = document.querySelector(`[data-id="${id}"]`);
        note.querySelector('.note-title').textContent = noteData.title;
        note.querySelector('.note-text').textContent = noteData.text.slice(0, 400) + '...';
        note.querySelector('.note-last-edit').textContent = `Last edit: ${noteData.lastEditDate}`;   
    }
    hideEditor() {
        document.body.removeChild(modalContainer);
    }
}

// Export
let view = new View();
export { view };


// Events
noteContainer.addEventListener('click', function noteInteraction(e) {
    let note = e.target.closest('.note');
    let del = e.target.closest('#delete-note');
    //delete
    if(del) {
        view.publish('deleteNote', {
            id: note.getAttribute('data-id')
        });
        return;
    }
    // edit
    if(note) {
        view.publish('noteClicked', {
            id: note.getAttribute('data-id')
        });
        return;
    }
    // create
    let btn = e.target.closest('#new-note-btn');
    if(btn) {
        view.publish('createClicked', {});
    }
});

noteContainer.addEventListener('dragstart', e => {
    const note = e.target.closest('.note');
    if(note) {
        aboveNote = note;
        note.classList.add('draggable');
        view.publish('dragStarted', {});
    } 
});

noteContainer.addEventListener('dragend', e => {
    const note = e.target.closest('.note');
    note.classList.remove('draggable');
});

noteContainer.addEventListener('drop', e=> {
    view.publish('drop', {
        belowId: belowId,
        aboveId: aboveNote.dataset.id,
        pos: enterNotePos
    });
})

noteContainer.addEventListener('dragover', e => {
    e.preventDefault()
    const belowNote = e.target.closest('.note:not(.draggable)');
    if(belowNote) {
        belowId = belowNote.dataset.id;
        const noteX = belowNote.getBoundingClientRect().x;
        const noteWidth = belowNote.getBoundingClientRect().width;
        const centerx = noteX + noteWidth/2;
        if(e.x < centerx) {
            enterNotePos = 'left';
            noteContainer.insertBefore(aboveNote, belowNote.nextSibling);
        } else {
            enterNotePos = 'right';
            noteContainer.insertBefore(aboveNote, belowNote)
        }

        view.publish('tempOrderChanged', {
            belowId: belowId,
            aboveId: aboveNote.dataset.id,
            pos: enterNotePos
        });
    }
});


modalContainer.addEventListener('mousedown', function modalInteraction(e) {
    let box = e.target.closest('.modal-box');
    let back = e.target.closest('.back-btn');
    if(!box || back) {
        //Update data
        view.publish('closeEditor', {
            id: Number(location.hash.slice(1)),
            title: modalBox.querySelector('#box-title-input').value,
            text: modalBox.querySelector('#box-text-input').value,
        });
    } 
}); 



modalTextarea.addEventListener('keydown', function tabToSpaces(e) {
    if(e.keyCode === 9) {
        e.preventDefault();
        modalTextarea.setRangeText('  ', modalTextarea.selectionStart, modalTextarea.selectionEnd, 'end');
    }
});

searchbox.addEventListener('keyup', function filterNotes(e){
    view.publish('searching', {
        content: searchbox.value
    });
});

undoBtn.addEventListener('click', e => {
    view.publish('undo');
})

// Functions

function createNote(noteData, id, parent, insertAfter) {
    noteTemplate.querySelector('.note').setAttribute('data-id', id);
    noteTemplate.querySelector('.note-title').textContent = noteData.title;
    noteTemplate.querySelector('.note-text').textContent = noteData.text.slice(0, 400) + '...';
    noteTemplate.querySelector('.note-last-edit').textContent = `Last edit: ${noteData.lastEditDate}`;
    let clone = noteTemplate.cloneNode(true);
    let element = clone.querySelector('.note');
    
    parent.appendChild(clone);
    // if(parent.children.length === 0) parent.appendChild(clone); 
    // else parent.insertBefore(clone, insertAfter ? insertAfter.nextSibling : parent.children[0]);
    
    return element;
}

