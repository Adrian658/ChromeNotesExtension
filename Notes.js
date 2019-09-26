/*
 * Class: Notes
 * 
 */
class Notes {

    constructor(id, title, text, color) {
        this.id = id;
        this.title = title;
        this.text = text;
        this.color = color;
    }

    update(title,text,color){
        this.title = title;
        this.text = text;
        this.color = color;
    }

    filter(hashtags){
        //todo, return boolean
    }
}

/*
 * Class: Library
 */
class Library {

    constructor() {
        this.idCounter = 1;
        this.notes = [];
    }

    binarySearch(id){
        //binary search this.notes, return array index
    }

    createNote(title,text,color){
        //assign id based on this object's id counter
        //append new object to array
        this.idCounter+=1;
    }
    editNote(id,title,text,color){
        //binary search id => index
        //edit node object in array with corresponding index
    }
    deleteNote(id){
        //binary search id => index
        //delete from array based on index
    }
    getNotes(){
        //add filter later
        return this.notes;
    }
}
lib = null;
function getLib(){
    //grab Library object when script starts
    //if not found(ie. first time using app on this machine), create new library object and save
    //lib = localStorage["lib"]
}
getLib();
function getNotes(){
    return lib.getNotes();
}
function editNote(id,title,text,color){
    lib.editNote(id,title,text,color);
}
function createNote(title,text,color){
    lib.createNote(title,text,color);
}
function deleteNote(id){
    lib.deleteNote(id);
}
