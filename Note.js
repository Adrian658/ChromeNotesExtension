/*
 * Notes.js -> The main javascript file containing our implementation of Notes, Library, and important functions.
 */
var raw_notes = [];
/*
 * Retrieved from Chrome storage all notes, displays previews of all notes, and brings up editing function for most recently
 * accessed note
 */
async function loadNotes(){

    console.log("Retrieving the current library...");
    chrome.storage.sync.get({'library': []}, function(lib){
        raw_notes = lib.library;
        renderNotes();
        chrome.storage.sync.get({'activeNote':-1},function(activeID){
            openNote(activeID.activeNote);
            changeNoteHighlight(activeID.activeNote);
        });

    });
}

/*
 *  Renders a new note tile div for each note in storage in the note index section
 */
async function renderNotes(){
    raw_notes.forEach(function(note){
        $(".note-index").append('<div class="note-tile btn btn-block" data-id=' + note["id"] + '>' + note.title + '</div>');
    });
    addNoteListener();
}

/*
 * Wrapper method for chrome.storage.set(library)
 * Updates the 'library' key value in chrome storage with the param value
 */
async function saveLib(){
    chrome.storage.sync.set({'library': raw_notes}, function(){
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

        raw_notes.push(newNote);
        saveLib();

        //Add note tile to notes display
        $(".note-index").append('<div class="note-tile btn btn-block" data-id=' + curID + '>' + title + '</div>');
        changeNoteHighlight();
        changeNoteHighlight(curID);
        addNoteListener(curID); //Add openNote listener to newly created note tile
        openNote(curID);//Open current note in note display
    });

}

/*
 * Updates a notes content and replaces front end elements with updated values
 */

async function editNote(id, title, body, color){  

     //Find the Note with matching ID and change values in backend storage
    for (note of raw_notes) {
        if (note["id"] == id) {
            if (title) { note["title"] = title };
            if (body) { note["body"] = body };
            if (color) {note["color"] = color };
        };
    };
    saveLib();

    //Replace title of note block in notes display with new title
    var curNote = findNoteElement(id);
    curNote.innerHTML = title;

}

/*
 *  Retrieve the body of the Quill editor and update the note's contents in storage
 */
function saveNote() {

    //Updated variables of current note
    var id = $("#current-note-display")[0].getAttribute("data-id");
    var title = $("#current-note-title").text();
    var body = Quill.find(document.querySelector("#current-note-body")).root.innerHTML;

    //Save note with new variables
    //Ideally we should just be saving the body here
    editNote(id=id, title=title, body=body);
    $('#autosave-label').text('Changes saved');

}

/*
 *  Deletes a specified note from Chrome storage and from DOM
 */
async function deleteNote(deleteID){
    
    //Find index of note to delete 
    var delIndex = -1;
    for (var i = 0; i < raw_notes.length; i++) {
        if (raw_notes[i]["id"] == deleteID) {
            delIndex = i;
        };
    };

    //Remove note from storage
    raw_notes.splice(delIndex,1);
    saveLib();

    //Remove note from DOM and open a different note for display
    findNoteElement(deleteID).remove();
    openNote(-1);
    changeNoteHighlight(-1);

}

/*
 *  Displays contents of the specified note in the current note display
 */
function openNote(id) {

    console.log("opening note "+id);
    if (id == -1) { //id is -1 when no id was found in parent function, so open first note in library
        if(raw_notes.length>0){
            var note = raw_notes[0];
            populateCanvas(note["id"],note["title"],note["body"]);
        } else {
            populateCanvas(null,"not a note","not a note");
        }
        return;
    }
    else { //open note with specified id
        for (note of raw_notes) {
            if (note["id"] == id) {
                populateCanvas(id,note["title"],note["body"]);
                return;
            }
        }
    }

    console.log("Note with id ("+id+") not found");
    openNote(-1);

}

/*
 * Fill note display fields with current note values
 */
function populateCanvas(id,title,body){
    $("#current-note-display").attr("data-id", id);
    $("#current-note-title").html(title);
    Quill.find(document.querySelector("#current-note-body")).root.innerHTML = body;
    chrome.storage.sync.set({'activeNote': id}, function(){
            console.log("Active note id("+id+") successfully saved.");
    });
}

/****** Functions which add event listeners to appropriate DOM elements ******/

/*
 *  
 */
function addCreateNoteListener() {

    lorem_ipsum = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet justo quis eros dapibus rutrum. Aenean pellentesque accumsan vulputate. Praesent consequat augue id urna commodo finibus. Proin bibendum tellus eros, nec imperdiet massa vehicula non. Sed pulvinar dictum leo ac eleifend. Quisque augue ex, pretium non nunc sed, accumsan porta odio. Donec id facilisis justo. Aliquam vel massa nec erat tincidunt molestie. Sed vitae nibh nec leo posuere volutpat. Mauris bibendum a magna ut pretium."

    document.getElementById('new-note-btn').onclick = function() {
        createNote('New Note', lorem_ipsum, 'red');
    }
}

/*
 *
 */
function addDeleteNoteListener() {
    document.getElementById("delete-btn").onclick = function() {
        //Retrieve note ID and pass to deleteNote function
        var id = findCurrentNote();
        deleteNote(id);
    }
}


/* 
 * Add onclick function to each note tile that displays its contents in the editor
 */
function addNoteListener(id) {

    setTimeout(function(){

        //Get all note tiles
        notes = document.getElementsByClassName("note-tile");

        if (id != undefined) { //if a specific note is specified
            for (var i = 0; i < notes.length; i++) { //find the note and add onclick function
                note = notes[i];
                if (note.getAttribute('data-id') == id) {
                    addOpenNoteFunctionality(note);
                }
            }
        }
        else { //else add listeners to all notes
            for (var i = 0; i < notes.length; i++) {
                addOpenNoteFunctionality(notes[i]);
            }
        }

    }, 500);

}

/*
 * Adds the open note onclick function to a specified note block div
 */
function addOpenNoteFunctionality(note) {

    note.addEventListener("click", function(event){ 

        saveNote()
        changeNoteHighlight();

        var targetElement = event.target || event.srcElement;
        var id = targetElement.getAttribute("data-id");
        changeNoteHighlight(id);

        openNote(id);

    });
}

/*
 * Highlights a note depending on context of arguments
 * If no context is given, removes highlighting from the currently highlighted note
 * If an element is given, highlights it
 */
function changeNoteHighlight(id) {

    if (id == undefined) { //remove highlighting from currently highlighted element
        var id = findCurrentNote();
        var sourceElement = findNoteElement(id);
        sourceElement.classList.remove('active-note');
    }
    else { //add highlighting to selected element
        if (id == -1) {
            var note = raw_notes[0];
            id = note["id"];
        }
        var targetElement = findNoteElement(id);
        targetElement.classList.add('active-note');
    }

}

/*
 * Finda a note tile from the note tile display corresponding to passed in id
 * @param id - id of note to find from notes display
 */
function findNoteElement(id) {
    return document.querySelectorAll("[data-id='" + id + "'][class~=btn-block]")[0];
}

/*
 * Finda id of current note being displayed
 */
function findCurrentNote() {
    return $("#current-note-display")[0].getAttribute("data-id");
}

/*
 * Code that is run when document loads
 */
document.addEventListener("DOMContentLoaded", function(){
    loadNotes();
    addCreateNoteListener();
    addDeleteNoteListener();
})