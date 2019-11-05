/*
 * Notes.js -> The main javascript file containing our implementation of Notes, Library, and important functions.
 */
var raw_notes = [];
/*
 * A function that returns a list of notes or creates one if it does not exist
 */
async function loadNotes(){
    /* 
     * Calls chrome storage to retrieve array of notes, which is passed into a callback function.
     * The notes only persist within the callback function, so any functionality that needs access to it 
     * must be inside the callback function param
    */
    console.log("Retrieving the current library...");
    chrome.storage.sync.get({'library': []}, function(lib){
        raw_notes = lib.library;
        makeDivs();
        chrome.storage.sync.get({'activeNote':-1},function(activeID){
            openNote(activeID.activeNote);
        });
    });
}

async function makeDivs(){
    raw_notes.forEach(function(note){
        $(".note-index").append('<div class="note-tile btn btn-block" data-id=' + note["id"] + '>' + note.title + '</div>');
    });
    addOpenNoteListener();
}

/*
 * Wrapper method for chrome.storage.set(library)
 * Updates the 'library' key value in chrom storage with the param value
 */
async function saveLib(){
    chrome.storage.sync.set({'library': raw_notes}, function(){
            console.log("Library successfully saved.");
            $('#autosave-label').text('Autosave completed');
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
        raw_notes.push(newNote);
        saveLib();
        $(".note-index").append('<div class="note-tile btn btn-block" data-id=' + curID + '>' + title + '</div>');
        addOpenNoteListener()
        openNote(curID);
    });

}

/*
 * Functions for the library object. Allows for creation, deletion, editing, and retrieval of notes.
 */

async function editNote(id, title, body, color){  
     //Find the Note with matching ID and change values
    for (note of raw_notes) {
        if (note["id"] == id) {
            if (title) { note["title"] = title };
            if (body) { note["body"] = body };
            if (color) {note["color"] = color };
        };
    };
    saveLib();
    $(".btn-block").remove();
    makeDivs();
    $('.note-tile').removeClass('current-note-tile');
    $(".note-tile[data-id='" + id + "']").addClass('current-note-tile');
    addOpenNoteListener();
}


async function deleteNote(deleteID){
    
    //Filter the library to remove note with ID matching deleteID
    var delIndex = -1;
    for (var i = 0; i < raw_notes.length; i++) {
        if (raw_notes[i]["id"] == deleteID) {
            delIndex = i;
        };
    };
    
    //console.log($(".btn-block"));
    $(".btn-block").remove();
    raw_notes.splice(delIndex,1);
    makeDivs();
    openNote(-1);
    saveLib();
}

function openNote(id) {
    console.log("opening note "+id);
    if(id == -1){
        if(raw_notes.length>0){
            var note = raw_notes[0];
            populateCanvas(id,note["title"],note["body"]);
        } else {
            populateCanvas(null,"not a note","not a note");
        }
        return;
    }
    for (note of raw_notes) {
        if (note["id"] == id) {
            $('.note-tile').removeClass('current-note-tile');
            $("div[data-id='" + id + "']").addClass('current-note-tile');
            populateCanvas(id,note["title"],note["body"]);
            return;
        }
    }
    console.log("Note with id ("+id+") not found");
    openNote(-1);
}

function populateCanvas(id,title,body){
    $("#current-note-display").attr("data-id", id);
    $("#current-note-title").html(title);
    Quill.find(document.querySelector("#current-note-body")).setText(body);
    //set active note id in storage
    chrome.storage.sync.set({'activeNote': id}, function(){
            console.log("Active note id("+id+") successfully saved.");
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

        console.log("id: "+id+" title: "+title+" body: "+body+" color: "+color); 
        editNote(id=id, title=title, body=body, color=color);
    }
}

function addDeleteNoteListener() {
    document.getElementById("delete-btn").onclick = function() {
        //Retrieve note ID and pass to deleteNote function
        var id = $("#current-note-display")[0].getAttribute("data-id");
        deleteNote(id);
    }
}

/*
 * Adds onclick function to each note tile that displays its contents in the editor
 */
function addOpenNoteListener() {

    setTimeout(function(){

        notes = document.getElementsByClassName("note-tile");

        for (var i = 0; i < notes.length; i++) {
            //var id = notes[i].getAttribute("data-id");
            notes[i].addEventListener("click", function(event){         
                var targetElement = event.target || event.srcElement;
                var id = targetElement.getAttribute("data-id");
                openNote(id);
            });
            
        }

    }, 500);

}

document.addEventListener("DOMContentLoaded", function(){
    loadNotes();
    addCreateNoteListener();
    addEditNoteListener();
    addDeleteNoteListener();
})