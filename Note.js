/*
 * Notes.js -> The main javascript file containing our implementation of Notes, Library, and important functions.
 */

/*
 * Class: Note
 * Objective: Contains the constructor for a note, as well as the ability to update the note and filter it by hashtags.
 */
/*class Note {

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
}*/

/*
 * Class: Library
 * Objective: Contains the constructor for a library, as well as 
 *            methods to allow creation, deletion, updating, searching, and retrieval of notes.
 */
/*class Library {

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
}*/

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
 * Takes new note metadata as input, retrieves the Library, creates a new Note with the params, and adds to the Library
 */
async function createNote(title,body,color){

    //Get the value of idCounter
    chrome.storage.sync.get({'idCounter': 0}, function(curID){

        //Get numeric value of idCounter
        curID = curID.idCounter;

        //Note is created which is a dictionary
        var newNote = {
            "id": curID,
            "title": title,
            "body": body,
            "color": color
        };

        //Increment value of idCounter
        chrome.storage.sync.set({'idCounter': curID+1}, function(){
            return;
        });

        //Get the library. Add the new note to it. Save Library.
        getLib(function(lib){
            console.log("lib is: ", lib);
            lib.push(newNote);
            saveLib(lib);
        });

        //Populate DOM elements with new note information
        $("#current-note-display").attr("data-id", curID);
        $("#current-note-title").html(title);
        Quill.find(document.querySelector("#current-note-body")).setText(body);
        $(".note-index").append('<div class="note-tile btn btn-block">' + title + '</div>');
        
    });

}

/*
 * Functions for the library object. Allows for creation, deletion, editing, and retrieval of notes.
 */

async function editNote(id, title, body, color){
    
    getLib(function(lib){

        //Find the Note with matching ID and change values
        for (note of lib) {
            if (note["id"] == id) {
                if (title) { note["title"] = title };
                if (body) { note["body"] = body };
                if (color) {note["color"] = color };
            };
        };

        saveLib(lib);

    });

}


async function deleteNote(deleteID){
    
    getLib(function(lib){

        //Filter the library to remove note with ID matching deleteID
        lib = lib.filter(function(note){
            return note["id"] != deleteID;
        });

        saveLib(lib);

    });

}

async function populateNotes() {

    getLib(function(lib){

        lib.forEach(function(note){
            $(".note-index").append('<div class="note-tile btn btn-block" data-id=' + note["id"] + '>' + note.title + '</div>');
        });

    });

}

function openNote(id) {

    getLib(function(lib){

        for (note of lib) {
            if (note["id"] == id) {
                $("#current-note-display").attr("data-id", id);
                $("#current-note-title").html(note["title"]);
                Quill.find(document.querySelector("#current-note-body")).setText(note["body"]);
            };
        };

    });

}

function addCreateNoteListener() {
    document.getElementById('new-note-btn').onclick = function() {
        createNote('New Note', 'New Note Body', 'red');
    }
}

function addEditNoteListener() {
    document.getElementById("save-btn").onclick = function() {
        //Retrieve Title and Body content and pass in to editNote function
        var id = $("#current-note-display")[0].getAttribute("data-id");
        var title = $("#current-note-title").text();
        var body = Quill.find(document.querySelector("#current-note-body")).getText();
        var color = "Some random color";
        editNote(id=id, title=title, body=body, color=color);
    }
}

function addDeleteNoteListener() {
    document.getElementById("delete-btn").onclick = function() {
        //Retrieve note ID and pass to deleteNote function
        deleteNote();
    }
}

/* THIS DOES NOT WORK AS INTENDED
 * Intended functionality is to add onclick function to each note tile that displays its contents in the editor
 * Currently it just displays the contents of the last note tile no matter which tile is clicked on
 *  This is because when adding the onclick function, I cant figure out how to freeze the value of 'id', so id's last value
 *  is 2, which is what is passed into openNote and diplays contents of note with id=2
 *  Not sure how to fix
 */
function addOpenNoteListener() {

    setTimeout(function(){

        notes = document.getElementsByClassName("note-tile");

        for (var i = 0; i < notes.length; i++) {
            var id = notes[i].getAttribute("data-id");
            notes[i].addEventListener("click", function() {
                console.log(id);
                openNote(id);
            });
            
        }

    }, 500);

}

document.addEventListener("DOMContentLoaded", function(){
    getLib(function(){
        console.log("Library initialization finished.");
    });
    populateNotes();
    addOpenNoteListener();
    addCreateNoteListener();
    addEditNoteListener();
    addDeleteNoteListener();
})