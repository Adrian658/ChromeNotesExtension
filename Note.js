/*
 * Notes.js -> The main javascript file containing our implementation of Notes, Library, and important functions.
 */
var raw_notes = [];
var hashtagRegex = /\B(\#[a-zA-Z0-9]+\b)/g;

/*
 * Retrieved from Chrome storage all notes, displays previews of all notes, and brings up editing function for most recently
 * accessed note
 */
function loadNotes(hash){

    console.log("Retrieving the current library...");
    chrome.storage.local.get({'library': []}, function(lib){
        raw_notes = lib.library;

        if (raw_notes.length == 0) { //If the user has no notes, create a default new one and open it for them
            createNote("New Note", "Start your new note!", "green");
            openNote(-1);
            return;
        }

        renderNotes();
        if (hash) {
            chooseFilter(hash);
            document.getElementById("searcher").value = hash;
        }
        chrome.storage.local.get({'activeNote':-1},function(activeID){
            openNote(activeID.activeNote);
            changeNoteHighlight(activeID.activeNote);
        });

    });
    
}

/*
 *  Renders a new note tile div for each note in storage in the note index section
 */
function renderNotes(){

    clearNotesDisplay("notes");
    raw_notes.forEach(function(note){
        $(".note-index").append('<div class="note-tile btn btn-block" data-id=' + note["id"] + '>' + trimTitle(note["title"]) + '</div>');
    });
    addTileListener();

}

function loadHashes() {

    global_hashes = new Set([]);
    for (note of raw_notes) {
        hashes = note["hashes"];
        if (hashes == null) {
            continue;
        }
        for (hash of hashes) {
            global_hashes.add(hash);
        }
    }

    renderHashes(global_hashes);

}

function renderHashes(hashes) {

    clearNotesDisplay("hashes");
    hashes.forEach(function(hash) {
        $(".note-index").append('<div class="note-tile btn btn-block" data-id=' + hash + '>' + hash + '</div>');
    });
    addTileListener(id=null, type="hash");

}

function clearNotesDisplay(type) {

    noteIdx = $(".note-index");
    noteIdx.removeClass("notes hashes");
    noteIdx.addClass(type);
    noteIdx = noteIdx[0];
    var range = document.createRange();
    range.selectNodeContents(noteIdx);
    range.deleteContents();

}

/*
 * Wrapper method for chrome.storage.set(library)
 * Updates the 'library' key value in chrome storage with the param value
 */
async function saveLib(){
    chrome.storage.local.set({'library': raw_notes}, function(){
            console.log("Library successfully saved.");
    });
}

/* 
 * Takes new note metadata as input, retrieves the Library, creates a new Note with the params, and adds to the Library
 */
async function createNote(title,body,color){

    //Get the value of idCounter
    chrome.storage.local.get({'idCounter': 0}, function(curID){

        //Get numeric value of idCounter
        curID = curID.idCounter;

        //Note is created which is a dictionary
        var newNote = {
            "id": curID,
            "title": title,
            "body": body,
            "color": color,
            "hashes": []
        };

        //Increment value of idCounter
        chrome.storage.local.set({'idCounter': curID+1}, function(){
            return;
        });

        raw_notes.push(newNote);
        saveLib();

        //Add note tile to notes display
        $(".note-index").append('<div class="note-tile btn btn-block" data-id=' + curID + '>' + title + '</div>');
        try {
            changeNoteHighlight();
        }
        catch (error) {}
        changeNoteHighlight(curID);
        addTileListener(curID); //Add openNote listener to newly created note tile
        openNote(curID);//Open current note in note display
    });

}

/*
 * Updates a notes content and replaces front end elements with updated values
 */

async function editNote(id, title, body, color, hashes){

     //Find the Note with matching ID and change values in backend storage
    for (note of raw_notes) {
        if (note["id"] == id) {
            if (title) { note["title"] = title };
            if (body) { note["body"] = body };
            if (color) { note["color"] = color };
            note["hashes"] = hashes;
        };
    };
    saveLib();

}

/*
 *  Retrieve the body of the Quill editor and update the note's contents in storage
 */
function saveNote() {

    //Updated variables of current note
    var id = $("#current-note-display")[0].getAttribute("data-id");
    //var title = $("#current-note-title").text();
    var editor = Quill.find(document.querySelector("#current-note-body"))
    var body = editor.root.innerHTML;
    var body_text = editor.getText();

    //Find and store all hashtags
    var hash_set = new Set([]);
    var hashes = body_text.match(hashtagRegex);
    if (hashes) {
        for (hash of hashes) {
            hash_set.add(hash);
        }
        var hashes = Array.from(hash_set);
    }

    //Save note with new variables
    //Ideally we should just be saving the body here
    editNote(id=id, title=null, body=body, color=null, hashes=hashes);
    if ($('.note-index').hasClass('hashes')) {
        loadHashes();
    }
    $('#autosave-label').text('Changes saved');
    $("#tags").html(hashes);

}

function highlightHashes(changeIndex, changeType) {

    quill = Quill.find(document.querySelector("#current-note-body"));
    str = quill.getText();
    var hashMatch;
    var hashBeginIndices = [];
    var hashLengths = [];
    var hashEndIndices = [];

    while ( (hashMatch = hashtagRegex.exec(str)) != null ) {
        var hash = hashMatch[0];
        var startIndex = hashMatch.index;
        var length = hash.length;

        hashBeginIndices.push(startIndex);
        hashLengths.push(length);
        hashEndIndices.push(hashtagRegex.lastIndex);
        quill.formatText(startIndex, length, 'font', 'impact');
    }

    //Depending on the user keyboard event, check for potential implications on hashes in Quill body
    if (changeType == "space" && hashEndIndices.includes(changeIndex)) {
        formatTextAfterHash(quill, hashEndIndices, hashLengths, changeIndex);
    }
    else if (changeType == "backspace") {
        unboldHash();
    }

}

/*
 *  **** HOLY SHIT I AM WRITTEN SO POORLY I FEEL LIKE A STEPHEN KING NOVEL. PLEASE REWRITE ME AT SOME POINT ****
 *  Changes the font at the users cursor when they finish typing a hash back to the font 
 *  ie. when they type a space or punctuation immdeiately following the hash text
 */
function formatTextAfterHash(quill, hashEndIndices, hashLengths, changeIndex) {

    var previousFontIndex = changeIndex;
    var font;
    while (true) {
        font = quill.getFormat(previousFontIndex-1, previousFontIndex).font;
        previousFontIndex -= 1;
        if (previousFontIndex == 0) {
            font = "arial";
            break;
        }
        if (font == null) {
            continue;
        }
        if (font[0] == "impact" || font == "impact") {
            continue;
        }
        font = font[0];
        break;
    }
    console.log("previousFontIndex: ", previousFontIndex);
    quill.formatText(changeIndex, 1, 'font', font);

}

/*
 *  When the user deletes the # from a hash, clear formatting on the remaining hash text
 */
function unboldHash() {

    previousHashes = document.getElementsByClassName('ql-font-impact');
    for (hash of previousHashes) {
        if (!hash.innerHTML.includes("#")) {
            hash.classList.remove("ql-font-impact");
        }
    }

}

/*
 * **** DEPRECATED ****
 * **** See unboldHash() for current implementation ****
 * When the user deletes the # from a hash, clear formatting on the remaining hash text
 */
function checkUnboldHash(quill, hashBeginIndices, hashEndIndices) {

    var beginClearIndex = 0;
    var endClearIndex;
    var clearLength;
    while ( (endClearIndex = hashBeginIndices.shift()) )  {
        clearLength = endClearIndex - beginClearIndex;
        quill.formatText(beginClearIndex, clearLength, 'bold', false);
        beginClearIndex = hashEndIndices.shift();
    }
    endClearIndex = quill.getText().length-1;
    quill.formatText(beginClearIndex, endClearIndex, 'bold', false);

}

function saveTitle() {

    var id = $("#current-note-display")[0].getAttribute("data-id");
    var title = $("#current-note-title").text();
    editNote(id=id, title=title);

    //Replace title of note block in notes display with new title
    var curNote = findNoteElement(id);
    if (curNote != null) {
        curNote.innerHTML = trimTitle(title);
    }

}

function trimTitle(title) {
    if (title.length > 17) {
        return title.slice(0, 15) + "...";
    }
    return title;
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
            populateCanvas(note["id"], note["title"], note["body"], note["hashes"]);
        } else {
            populateCanvas(null,"not a note","not a note", null);
        }
        return;
    }
    else { //open note with specified id
        for (note of raw_notes) {
            if (note["id"] == id) {
                populateCanvas(id, note["title"], note["body"], note["hashes"]);
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
function populateCanvas(id,title,body,hashes){
    $("#current-note-display").attr("data-id", id);
    $("#current-note-title").html(title);
    $("#tags").html(hashes);
    Quill.find(document.querySelector("#current-note-body")).root.innerHTML = body;
    chrome.storage.local.set({'activeNote': id}, function(){
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

function addFilterNoteListener() {
    document.getElementById("note-filter-btn").onclick = function() {
        document.getElementById("searcher").value = "";
        loadNotes();
    }
}

function addFilterHashesListener() {
    document.getElementById("tags-filter-btn").onclick = function() {
        document.getElementById("searcher").value = "";
        loadHashes();
    }
}


/* 
 * Add onclick function to each note tile that displays its contents in the editor
 */
function addTileListener(id, type="note") {

    setTimeout(function(){

        //Get all note tiles
        elements = document.getElementsByClassName("note-tile");

        if (id != undefined) { //if a specific note is specified
            for (note of elements) { //find the note and add onclick function
                if (note.getAttribute('data-id') == id) {
                    addOpenNoteFunctionality(note, type);
                }
            }
        }
        else { //else add listeners to all notes
            for (note of elements) {
                addOpenNoteFunctionality(note, type);
            }
        }

    }, 500);

}

/*
 * Adds the open note onclick function to a specified note block div
 */
function addOpenNoteFunctionality(element, type) {

    if (type == "note") {
        element.addEventListener("click", function(event){ 

            saveNote();
            changeNoteHighlight();
            $("#tags").html("");
    
            var targetElement = event.target || event.srcElement;
            var id = targetElement.getAttribute("data-id");
            changeNoteHighlight(id);
    
            openNote(id);
    
        });
    }
    else if (type == "hash") {
        element.addEventListener("click", function(event){ 
    
            var targetElement = event.target || event.srcElement;
            var hash = targetElement.innerHTML;

            loadNotes(hash);
    
        });
    }
}

function addDownloadListener() {

    element = $('#download-btn');

    element.hover(function(event){

        var targetElement = $(this)[0];
        var text = Quill.find(document.querySelector("#current-note-body")).getText();
        var blob = new Blob([text], {type: 'text/plain'});
        var output = window.URL.createObjectURL(blob);
        targetElement.download = $("#current-note-title")[0].innerHTML;
        targetElement.href = output;
    });
}

function addNoteOptionsListener() {
    
    document.body.addEventListener('click', function(event) {

        var optionsBtn = document.getElementById('note-options');
        var optionsMenu = $('#note-options-display');
        var path = event.path;
        var element = event.target;

        if (path.includes(optionsBtn)) {
            if (optionsMenu.hasClass('closed')) {
                handleNoteOptionsDisplay(optionsMenu, 'open');
            }
            else {
                handleNoteOptionsDisplay(optionsMenu, 'closed');
            }
        }
        else {
            if (optionsMenu.hasClass('open')) {
                handleNoteOptionsDisplay(optionsMenu, 'closed');
            }
        }

    });

}

function handleNoteOptionsDisplay(optionsMenu, status) {
    if (status == 'open') {
        optionsMenu.slideDown(200);
        optionsMenu.removeClass('closed');
        optionsMenu.addClass('open');
    }
    else if (status == 'closed') {
        optionsMenu.slideUp(200);
        optionsMenu.removeClass('open');
        optionsMenu.addClass('closed');
    }
    else {
        console.log("Error opening or closing note options menu");
    }
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

function addTitleListener() {

    $('#current-note-title').blur(function() {
        saveTitle();
    });

    document.getElementById('current-note-title').addEventListener('keydown' ,function(event) {
        console.log(event.key);
        var targetElement = event.target || event.srcElement;
        if (event.key == "Enter") {
            targetElement.blur();
        }
        else if (targetElement.innerHTML.length > 25 && event.key != "Backspace" && event.key != "ArrowLeft" && event.key != "ArrowRight") {
            event.preventDefault();
        }
    });

}

/*
 * Find a note tile from the note tile display corresponding to passed in id
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

function findNote(id) {
    for (note of raw_notes) {
        if (note["id"] == id) {
            return note;
        }
    }
    return "No note with matching ID";
}

function addElementListeners() {
    addCreateNoteListener();
    addDeleteNoteListener();
    addFilterNoteListener();
    addFilterHashesListener();
    addTitleListener();
    addDownloadListener();
    addNoteOptionsListener();
}

/*
 * Code that is run when document loads
 */
document.addEventListener("DOMContentLoaded", function(){
    loadNotes();
    addElementListeners();
})