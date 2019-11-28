/*
 * Notes.js -> The main javascript file containing our implementation of Notes, Library, and important functions.
 */
var raw_notes = [];
var hashtagRegex = /\B(\#[a-zA-Z0-9]+\b)/g;

/* 
This means the # symbol of a hash must not bump into other words
var improvedHashtagRegex = /([^a-zA-Z0-9])\B(\#[a-zA-Z0-9]+\b)/g;
*/

/*
 *  DEPRECATED method for filtering notes containing key phrase in title or body
 */
function filterNotes(filter){
    filter = filter.toLowerCase();
    filteredIds = [];
    raw_notes.forEach(function(note){
        if(note["title"].toLowerCase().includes(filter) || note["body"].toLowerCase().includes(filter)){
            filteredIds.push(Number(note["id"]));
        }
    });
    return filteredIds;
}

/*********************************** Loading and rendering note and hash elements ***********************************/

/*
 * Retrieves from Chrome storage all notes, displays previews of all notes, and brings up editing function for most recently accessed note
 */
function loadNotes(hash){

    console.log("Retrieving the current library...");
    chrome.storage.local.get({'library': []}, function(lib){
        raw_notes = lib.library;

        /* If the user has no notes, create a default new one and open it for them */
        if (raw_notes.length == 0) {
            createNote("Give Me a Title!", "Start your new note!", "green");
            openNote(-1);
            return;
        }

        renderNotes();
        /* If the notes are being loaded from a hash search, filter the appropriate notes */
        if (hash) {
            chooseFilter(hash);
            document.getElementById("searcher").value = hash;
        }

        /* Open a note for editing */
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

    $('#new-note-btn').show();
    clearNotesDisplay("notes");
    raw_notes.forEach(function(note){
        $(".note-index").append('<div class="note-tile btn btn-block transition-quick" data-id=' + note["id"] + '>' + trimTitle(note["title"]) + '</div>');
    });
    addTileListener();

}

/*
 *  Loads in all hashes across all notes
 */
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

/*
 *  Renders the input list of hashes as tiles in the index section
 */
function renderHashes(hashes) {

    $('#new-note-btn').hide();
    clearNotesDisplay("hashes");
    hashes.forEach(function(hash) {
        $(".note-index").append('<div class="note-tile btn btn-block transition-quick" data-id=' + hash + '>' + trimTitle(hash) + '</div>');
    });
    addTileListener(id=null, type="hash");

}

/*
 *  Clears the current tiles from the index display
 */
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
 *  Displays contents of the specified note in the current note display
 */
function openNote(id) {

    console.log("opening note "+id);
    if (id == -1) { //id is -1 when no id was found in parent function, so open last note in library
        if(raw_notes.length>0){
            var note = raw_notes[raw_notes.length-1];
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
    setTimeout(function(){
        highlightHashes(hashtagRegexEnd);
    }, 1);
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
            var note = raw_notes[raw_notes.length-1];
            id = note["id"];
        }
        var targetElement = findNoteElement(id);
        targetElement.classList.add('active-note');
    }

}


/*********************************** Basic CRUD functions for notes ***********************************/

/*
 * Wrapper method for chrome.storage.set(library)
 * Updates the 'library' key value in chrome storage with the param value
 */
function saveLib(){
    chrome.storage.local.set({'library': raw_notes}, function(){
            console.log("Library successfully saved.");
    });
}

/* 
 * Takes new note metadata as input, retrieves the Library, creates a new Note with the params, and adds to the Library
 */
function createNote(title,body,color){

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

function editNote(id, title, body, color, hashes){

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
    var editor = Quill.find(document.querySelector("#current-note-body"));
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
    editNote(id=id, title=null, body=body, color=null, hashes=hashes);
    if ($('.note-index').hasClass('hashes')) {
        loadHashes();
    }
    $('#autosave-label').text('Changes saved');
    $("#tags").html(hashes);

}

/*
 *  Saves the current notes title and displays the updated tile in the corresponding note tile
 */
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

/*
 *  Trims the title string so it can be displayed in a note tile
 */
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

    //Find ID of new note to open
    var openID;
    (delIndex == 0) ? (openId = -1) : (openID = raw_notes[delIndex-1]["id"]);

    //Remove note from DOM and open a different note for display
    findNoteElement(deleteID).remove();
    openNote(openID);
    changeNoteHighlight(openID);

}

/*********************************** Dynamic hash formatting functions ***********************************/

/*
 *  Applies or removes custom hash formatting starting at a given undex until the hash end
 *  Assumes given start index corresponds to a hash so format is applied to the end of given hash
 */
function applyHashFormatting(quill, changeIndex, regex, format) {

    quillText = quillGetText(quill);
    var hashEndIndex;

    //Don't remove hash formatting when user types hash ending character immediately before beginning of a hash
    if (quillText[changeIndex] == "#" && !format) {
        return;
    }

    //Finds where the hash ends starting from the changeIndex
    for (hashEndIndex = changeIndex; hashEndIndex < quillText.length; hashEndIndex++) {
        if (regex.exec(quillText[hashEndIndex])) {
            break;
        }
    }

    quill.formatText(changeIndex, hashEndIndex-changeIndex, 'hash', format);

}

/*
 *  Iterates through quill document, highlighting all hashes
 */
function highlightHashes(regex) {

    var editor = Quill.find(document.querySelector("#current-note-body"));
    var bodyText = quillGetText(editor);
    for (var i=0; i < bodyText.length; i++) {
        if (bodyText[i] == "#") {
            applyHashFormatting(editor, i, regex, 'phrase');
        }
    }

}

/*
 *  Override for quill.getText()
 *  Necessary because quill.getText() returns formulas as strings whereas the editor treats formula as a single index position
 *  And because hash formatting relies on indices, custom method must be developed that treats formulas as a single character
 */
function quillGetText(quill) {
    var contents = quill.getContents();
    var quillText = "";

    for (op of contents.ops) {
        var opInsert = op.insert;
        if (opInsert == "[object Object]") { //If the op is inserting a formula, insert a single char instead to simulate single index
            opInsert = "O"; //Arbitrary value to represent a formula
        }
        quillText = quillText.concat(opInsert);
    }
    return quillText;
}

/*
 *  Called when backspace is pressed by the user
 *  Finds the character and index at which character was deleted
 *  Adjusts the formatting of text if a # was deleted or a hash was joined with immediately ensuing word
 */
function findDeleteChar(quill, oldDelta, changeIndex, regex) {

    var indexCounter = 0;
    var opsCounter = -1;
    var delIndex = changeIndex;
    var op;
    var opLength;

    //Finds the character which was deleted given the index of the change
    while (opsCounter <= oldDelta.ops.length) {
        opsCounter+=1;
        op = oldDelta.ops[opsCounter].insert;
        opLength = op.length;
        if (indexCounter+opLength > delIndex) {
            delIndex = delIndex-indexCounter;
            break;
        }
        else {
            indexCounter += opLength;
        }
    }

    //User deleted a hashtag, remove formatting from truncated text
    if (op[delIndex] == "#") {
        applyHashFormatting(quill, changeIndex, regex, false);
        return
    }

    //Check if the user backspaced immediately after a hash ending, meaningthey joined the following text with a hash, so format the joined text
    opsCounter = opsCounter-1;
    op = oldDelta.ops[opsCounter];
    if (op && op.attributes && op.attributes.hash == "phrase" && changeIndex==indexCounter) {
        applyHashFormatting(quill, changeIndex, regex, 'phrase');
    }

}

/*********************************** Functions which add event listeners to appropriate elements ***********************************/

/*
 *  Adds listener to create note button
 */
function addCreateNoteListener() {
    document.getElementById('new-note-btn').onclick = function() {
        createNote('Give Me a Title!', "", 'red');
        setTimeout(function(){
            $("#note-index-container").scrollTop($("#note-index-container")[0].scrollHeight);
        }, 100);
    }
}

/*
 *  Adds listener to delete note button
 */
function addDeleteNoteListener() {
    document.getElementById("delete-btn").onclick = function() {
        var id = findCurrentNote();
        deleteNote(id);
    }
}

/*
 *  Adds listener to display notes button
 */
function addFilterNoteListener() {
    document.getElementById("note-filter-btn").onclick = function() {
        document.getElementById("searcher").value = "";
        loadNotes();

        /* Change formatting of filter buttons */
        this.classList.add("active-display");
        document.getElementById("tags-filter-btn").classList.remove("active-display");

        $("#new-note-hr").show();
        $("#note-index-container").css('height', '342px');
    }
}

/*
 *  Adds listener to display hashes function 
 */
function addFilterHashesListener() {
    document.getElementById("tags-filter-btn").onclick = function() {
        document.getElementById("searcher").value = "";
        loadHashes();

        /* Change formatting of filter buttons */
        this.classList.add("active-display");
        document.getElementById("note-filter-btn").classList.remove("active-display");

        $("#new-note-hr").hide();
        $("#note-index-container").css('height', '410px');
    }
}

/*
 *  Adds listener to download button that downloads the current note as a .txt file 
 */
function addDownloadListener() {

    element = $('#download-btn');

    /* When button is hovered, the link is set to download the current note
       Workaround because onclick did not register the correct href */
    element.hover(function(event){

        var targetElement = $(this)[0];
        var text = Quill.find(document.querySelector("#current-note-body")).getText();
        var blob = new Blob([text], {type: 'text/plain'});
        var output = window.URL.createObjectURL(blob);
        targetElement.download = $("#current-note-title")[0].innerHTML;
        targetElement.href = output;
    });
}

/*
 *  Adds listener to citation button which inserts a link to the active chrome tab in the current note body 
 */
function addCitationButtonListener() {

    document.getElementById("citation-btn").onclick = function() {
        
        chrome.tabs.query({active: true}, function(tabs){
            var tabURL = tabs[0].url;
            var tabTitle = tabs[0].title;
            var quill = Quill.find(document.querySelector("#current-note-body"));
            quill.focus();
            console.log(quill.hasFocus())
            var focusIndex = quill.getSelection().index;
            (!tabTitle) ? tabTitle = tabURL : {};
            quill.insertText(focusIndex, tabTitle, 'link', tabURL);
        });

    }

}

function findTitle(url) {
    jQuery.get(url, function(data){
        var html = data.responseText;
        var regex = /\<title\>(.*)\<\/title\>/;
        var result = regex.exec(html);
    });
}


/* 
 * Add onclick function to each note tile that displays its contents in the editor
 */
function addTileListener(id, type="note") {

    /* Timeout needed to ensure elements are properly loaded before attaching listeners */
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
 * Adds the open note (hash) onclick function to a specified note (hash) block div
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

            document.getElementById("note-filter-btn").classList.add("active-display");
            document.getElementById("tags-filter-btn").classList.remove("active-display");

            loadNotes(hash);
    
        });
    }
}

/*
 *  DEPRECATED
 *  Adds listener to note options button which displays additional functions to be applied to the current note 

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
*/

/*
 * DEPRECATED 
 * Opens or closes the note options 

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
*/

/*
 *  Adds listener to current note title to save when focus is lost
 */
function addTitleListener() {

    $('#current-note-title').blur(function() {
        saveTitle();
    });

    document.getElementById('current-note-title').addEventListener('keydown' ,function(event) {
        var targetElement = event.target || event.srcElement;
        if (event.key == "Enter") {
            targetElement.blur();
        }
        else if (targetElement.textContent.length > 25 && event.key != "Backspace" && event.key != "ArrowLeft" && event.key != "ArrowRight") {
            event.preventDefault();
        }
    });

}

/*
 *  Adds listener to search input 
 */
function addFilterListener(){
    $("#searcher").on("keyup click input", function () {
        var val = $(this).val();
        if (val.length) {
            $(".note-index .note-tile").hide().filter(function () {
                console.log($(this).get(0));
                return $(this).get(0).innerText.toLowerCase().indexOf(val.toLowerCase()) != -1;
            }).show();
        }
        else {
            $(".note-index .note-tile").show();
        }
    });
}


/*********************************** Helper functions ***********************************/

/*
 * Find a note tile from the note tile display corresponding to passed in id
 * @param id - id of note to find from notes display
 */
function findNoteElement(id) {
    return document.querySelectorAll("[data-id='" + id + "'][class~=btn-block]")[0];
}

/*
 *  Find id of current note being displayed
 */
function findCurrentNote() {
    return $("#current-note-display")[0].getAttribute("data-id");
}

/* 
 *  Returns the given note
 */
function findNote(id) {
    for (note of raw_notes) {
        if (note["id"] == id) {
            return note;
        }
    }
    return "No note with matching ID";
}

function noteOptionsListener() {
    $("#note-options-container").hover(function(){
        $("#note-options-display").show("blind", { direction: "up" }, 500);
        $("#options-icon").removeClass("fa-bars");
        $("#options-icon").addClass("fa-chevron-up");
    }, function(){
        $("#note-options-display").stop(true, true).hide();
        $("#options-icon").removeClass("fa-chevron-up");
        $("#options-icon").addClass("fa-bars");
    });
}

/*
 *  Adds all element listeners
 */
function addElementListeners() {
    addCreateNoteListener();
    addDeleteNoteListener();
    addFilterNoteListener();
    addFilterHashesListener();
    addTitleListener();
    addDownloadListener();
    addCitationButtonListener();
    addModeSwitchListeners();
    noteOptionsListener();
}

/*
 * Code that is run when document loads
 */
document.addEventListener("DOMContentLoaded", function(){
    loadNotes();
    determineFocusMode();
    addElementListeners();
})

/*********************************** Focus mode functions ***********************************/

function focusMode() {
    var sidebar = $('#note-container');
    var curNote = $('#current-note-display');
    var btn = $('#index-show-btn');

    sidebar.hide();
    curNote.removeClass('cust-col-8');
    curNote.addClass('cust-col-12');
    btn.show();
}

function browseMode() {
    var sidebar = $('#note-container');
    var curNote = $('#current-note-display');
    var btn = $('#index-show-btn');

    sidebar.show();
    curNote.removeClass('cust-col-12');
    curNote.addClass('cust-col-8');
    btn.hide();
}

function addModeSwitchListeners() {
    document.getElementById('index-hide-btn').addEventListener('click' ,function(event) {
        chrome.storage.local.set({'preferenceFocus': true}, function(){
            focusMode(); 
        });
    });

    document.getElementById('index-show-btn').addEventListener('click' ,function(event) {
        chrome.storage.local.set({'preferenceFocus': false}, function(){
            browseMode();
        });
    });
}

function determineFocusMode() {
    chrome.storage.local.get({'preferenceFocus': 'false'}, function(store){
        (store.preferenceFocus) ? focusMode() : {};
    });
}