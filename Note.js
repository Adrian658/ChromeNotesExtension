/*
 * Notes.js -> The main javascript file containing our implementation of Notes, Library, and important functions.
 */
function print(str){
    //chrome.extension.getBackgroundPage().console.log(str);
}

print("starting notes.js");
//test();

/*
 * Class: Note
 * Objective: Contains the constructor for a note, as well as the ability to update the note and filter it by hashtags.
 */
class Note {

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

    filter(searchText){
        return (this.text.includes(searchText) || this.title.includes(searchText));
    }
}

/*
 * Class: Library
 * Objective: Contains the constructor for a library, as well as 
 *            methods to allow creation, deletion, updating, searching, and retrieval of notes.
 */
class Library {

    constructor() {
        this.idCounter = 1;
        this.notes = [];
    }

    createNote(title,text,color){
        //assign id based on this object's id counter
        //append new object to array
        var note = new Note(this.idCounter,title,text,color);
        this.notes.push(note);
        this.idCounter+=1;
        return note;
    }
    editNote(id,title,text,color){
        //edit node object in array with corresponding index
        var i;
        for (i = 0; i < this.notes.length; i++) {
          if(this.notes[i].id === id){
            this.notes[i].title = title;
            this.notes[i].text = text;
            this.notes[i].color = color;
            break;
          }
        }
    }
    deleteNote(id){
        //delete from array based on index
        var i;
        for (i = 0; i < this.notes.length; i++) {
          if(this.notes[i].id === id){
            this.notes.splice(i,1);
            break;
          }
        }
    }
    getNotes(filter){
        if(filter == null){
            return this.notes;
        } else {
            var filteredNotes = [];
            var i;
            for(i=0;i<this.notes.length;i++){
                if(this.notes[i].filter(filter)){
                    filteredNotes.push(this.notes[i]);
                }
            }
            return filteredNotes;
        }
    }
}

/*
 * A function that returns a list of notes or creates one if it does not exist
 */
async function getLib(callbackFunc){
    /* 
     * Calls chrome storage to retrieve array of notes, which is passed into a callback function.
     * The notes only persist within the callback function, so any functionality that needs access to it 
     * must be inside the callback function param
    */

    console.log("Retrieving the current library...");
    chrome.storage.sync.get({'library': []}, function(lib){
        lib = lib.library;
        chrome.storage.sync.set({'library': lib}, function(){
            console.log("Library successfully retrieved.");
        });

        //Do stuff with the library
        callbackFunc(lib);
    });
}

/*
 * Wrapper method for chrome.storage.set(library)
 * Updates the 'library' key value in chrom storage with the param value
 */
async function saveLib(lib){

    chrome.storage.sync.set({'library': lib}, function(){
            console.log("Library successfully saved.");
    });

}

/*
 * Functions for the library object. Allows for creation, deletion, editing, and retrieval of notes.
 */
async function getNotes(filter){
    var lib = await getLib();
    return lib;
}


async function editNote(id,title,text,color){
    var lib = await getLib();
    lib.editNote(id,title,text,color);
    saveLib(lib);
}

/* 
 * Takes new note metadata as input, retrieves the Library, creates a new Note with the params, and adds to the Library
 */
async function createNote(title,text,color){

    //Note is created which is a dictionary
    var newNote = {
        "title": title,
        "text": text,
        "color": color
    };

    //Get the library. Add the new note to it. Save Library.
    await getLib(function(lib){
        console.log("lib is: ", lib);
        lib.push(newNote);
        saveLib(lib);
    });

    //Populate DOM elements with new note information
    $("#current-note-title").html(title);
    $("#current-note-body").html(text);
}

async function deleteNote(id){
    var lib = await getLib();
    lib.deleteNote(id);
    saveLib(lib);
}

async function populateNotes() {
    var notes = getNotes();
    console.log(notes);
    if(notes) {
    notes.forEach(function (note) {
        $(".note-index").append('<div class="note-tile btn btn-block">' + note.title + '</div>');
    });
    $(".current-note-title").val(notes[0].title);
    $(".current-note-title").html(notes[0].title);
    $(".current-note-body").html(notes[0].text);
    }
    else {
        $(".current-note-display").html('No notes to display');
    }
}

//Test function for the chrome storage API.
var num = null;
function storage_test(){
    chrome.storage.async.get(['num'],function(data){
        num = data.num;
        num+=1;
        print("num = " + num);
        chrome.storage.async.set({'num':num},function(){
            print("Saved num to sync'd storage");
        });
    });
    return true
}

function addCreateListener() {
    document.getElementById('new-note-btn').onclick = function() {
        createNote('New Note', 'New Note Body', 'red')
    }
}

document.addEventListener("DOMContentLoaded", function(){
    addCreateListener()
})