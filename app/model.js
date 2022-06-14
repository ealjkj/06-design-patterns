class Model {
    constructor() {
        this.notes = {};
        this.indexOrderList = []; // [3, 40, 21]  
        this.filterValue = '';
    }
    pullFromDB() {
        if(!localStorage.currentId) localStorage.currentId = 0;
        if(localStorage.notes) this.notes = JSON.parse(localStorage.notes); 
        if(localStorage.indexOrderList) this.indexOrderList = JSON.parse(localStorage.indexOrderList); 
    }
    pushToDB() {
        localStorage.notes = JSON.stringify(this.notes);
        localStorage.indexOrderList = JSON.stringify(this.indexOrderList);
    }
    deleteNote(id) {
        delete this.notes[id];
        this.indexOrderList = this.indexOrderList.filter(value => value!=id);
        this.pushToDB();
    }
    createNote(id, note) {
        this.notes[id] = note;
        this.indexOrderList.unshift(id);
        this.pushToDB();
    }
    editNote(id, note) {
        this.notes[id] = Object.assign(this.notes[id], note);
        this.pushToDB();
    }
    insertNote(id, note, position) {
        this.notes[id] = note;
        this.indexOrderList.splice(position, 0, id);
        this.pushToDB();
    }
    setNote(id, note) {
        this.notes[id] = note;
        this.pushToDB();
    }
    getNote(id) {
        return this.notes[id];
    }
    getOrderedNotes(indexOrderList = this.indexOrderList) {

        return indexOrderList.map(value => this.getNote(value));
    }
    setFilteredValue(value){
        this.filterValue = value;
    }
    getFilteredNotes(indexOrderList = this.indexOrderList) {
        return model.getOrderedNotes(indexOrderList).filter(note => {
            const textInclusion = note.text.toUpperCase().includes(this.filterValue.toUpperCase());
            const titleInclusion = note.title.toUpperCase().includes(this.filterValue.toUpperCase());
            return textInclusion || titleInclusion;
        });
    }
    getPosition(id) {
        return this.indexOrderList.indexOf(id);
    }
    resetTempOrder() {
        this.tempOrder = [...this.indexOrderList];
    }
    changeToLeftOfInTemp(noteIdToChange, noteIdToPlace) {
        const indexToChangeOnArray = this.tempOrder.indexOf(noteIdToChange);
        const indexToPlaceOnArray = this.tempOrder.indexOf(noteIdToPlace);

        this.tempOrder.splice(indexToChangeOnArray, 1);
        this.tempOrder.splice(indexToPlaceOnArray, 0, noteIdToChange);

        return indexToChangeOnArray;
    }
    changeToRightOfInTemp(noteIdToChange, noteIdToPlace){
        const indexToChangeOnArray = this.tempOrder.indexOf(noteIdToChange);
        const indexToPlaceOnArray = this.tempOrder.indexOf(noteIdToPlace);
        
        this.tempOrder.splice(indexToChangeOnArray, 1);
        this.tempOrder.splice(indexToPlaceOnArray, 0, noteIdToChange);

        return indexToChangeOnArray;
    }
}


const model = new Model();
export { model };
