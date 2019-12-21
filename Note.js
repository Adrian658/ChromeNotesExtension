/*
 * Notes.js -> The main javascript file containing our implementation of Notes, Library, and important functions.
 */

var raw_notes = [];
var userPreferences;
var hashtagRegex = /\B(\#[a-zA-Z0-9]+\b)/g;
var titleDisplayLen = 17;
var HTMLDocumentation = "<blockquote><strong>Thanks for downloading </strong><strong class='ql-hash-phrase'>#Notility</strong><strong>!</strong> We provide a clean and simple solution for in-browser note taking. This project is a work in progress so don't expect Google Docs level editing, but we are consistently making improvements. If you notice any bugs or have any suggestions leave us a comment on the <a href='https://chrome.google.com/webstore/detail/notility-simple-note-taki/hogihdfpkilgcmenhklcllklgnkndglp' target='_blank'>Chrome Store</a>.</blockquote><p><br></p><p><span class='ql-hash-phrase'>#Documentation</span></p><h2><strong>Tagging Notes</strong></h2><p>You can tag a note by adding <span style='color: white;' class='ql-hash-phrase'>#</span> immediately followed by a tag phrase anywhere within the note body. This will assign that tag to the note.</p><p>You can then:</p><ul><li>view all tags across all notes through the 'Tags' menu in the left sidebar and filter notes by said tags</li><li>search for tags (see Searching section)</li><li>double click on a tag in the editor to display all notes with the corresponding tag</li></ul><p><br></p><h2><strong>Storage</strong></h2><p>Notes are currently stored locally, ie. on the machine you are currently using. There is a 5MB limit on storage for google chrome extensions. We are in the process of migrating to Google Cloud storage so notes can be shared across your Google User profile.</p><p><br></p><h2><strong>Searching</strong></h2><p>Search criteria input into the search bar can search through notes in two different ways</p><ul><li>if a normal text string is entered: notes with titles that contain the search criteria will be returned</li><li>if the search criteria begins with a <span style='color: white;' class='ql-hash-phrase'>#</span>: notes that contain hashes matching the search criteria will be returned</li></ul><p><br></p><h2><strong>Auto-Saving</strong></h2><p>Notes are saved automatically</p><ul><li>1.5 seconds after the last change is made to the editor</li><li>when a new note is opened</li><li>when the extension is closed</li></ul><p><br></p><h2><strong>Pull URL</strong></h2><p>Automatically insert a link to the current chrome tab using the 'Insert URL' button located in the note options menu (top right)</p><p><br></p><h2><strong>Download Notes</strong></h2><p>Download notes as:</p><ul><li>raw text files (.txt)</li><li>rich text files (.rtf)</li><li>HTML files (.html)</li></ul><p>*RTF downloads do not support all styling attributes, namely coloring</p><p>*We are working on PDF export capability</p><p><br></p><h2><strong>Focus Mode</strong></h2><p>Expand your note to full screen by clicking on the magnifying glass in the main options menu (upper left)</p><p><br></p><h2><strong>Change Color Scheme</strong></h2><p>Change the color scheme to fit your personal taste by navigating to the color palette icon in the main options menu</p><p><br></p><h2><strong>Resizing</strong></h2><p>Modify the size of the extension by navigating to the expand icon in the main options menu</p><p><br></p><h2><strong>Dark Mode</strong></h2><p>Click the toggle switch in the toolbar to toggle dark mode</p><p><br></p><p><br></p><h2 class='ql-align-center'><u>Known Bugs</u></h2><p>Pasting content after a hashtag indiscriminately applies formatting to the pasted content.</p><p>.rtf downloads do not support all styles and as a result are sometimes corrupted when downloading heavily styled notes.</p>"
var colorSchemes = {
    "Spotify": ["#191314", "#3f3b3c", "#64d761", "#3f9ed7", "#64d761", "#64d761", "black", "#dddddd", "white"],
    "Rainbow": ["#5BC0EB", "#64d761", "#FA7921", "#FDE74C", "#E55934", "#FDE74C", "whitesmoke", "black", "black"],
    "Facebook": ["#191970", "#0057da", "#005fed", "#7fffd4", "#7fffd4", "#7fffd4", "white", "black", "black"],
    "IKEA": ["#293250", "#08176b", "#ffd55a", "#6dd47e", "#6dd47e", "#ffd55a", "black", "white", "white"],
    "Royalty": ["#481D24", "#901E2D", "#901E2D", "#FFC857", "#FFC857", "#FFC857", "whitesmoke", "black", "black"],
    "Elegant": ["#143d59", "#1f5b86", "#f4b41a", "#f5f5f5", "#f4b41a", "#f4b41a", "black", "black", "black"],
    "Peachy": ["#5B0E2D", "#7c133d", "#f9858b", "#ed335f", "#ffa781", "#ffa781", "black", "#dddddd", "black"],
    "Chillaxation": ["#104c91", "#1f8ac0", "#efc98f", "#25a0dd", "#25a0dd", "#efc98f", "black", "whitesmoke", "white"],
    "Sunset": ["#2c4096", "#c73967", "#fa6164", "#fdd422", "#fdd422", "#fdd422", "black", "black", "black"],
    "Mountains": ["#945562", "#cb906d", "#452b40", "#ffb74c", "#452b40", "#452b40", "white", "black", "white"],
    "SunFlower": ["#153d02", "#5b9b37", "#ffdf00", "#a94300", "#ffb000", "#ffdf00", "black", "black", "black"]
}


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
            createNote("Welcome to Notility!", HTMLDocumentation, "");
            openNote(-1);
            return;
        }
        raw_notes.sort(function(a,b){
            return (a.order-b.order);
        });

        renderNotes();
        initSortable();
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

function initSortable() {
    sortable = $("#note-index");
    sortable.sortable({
        update: function(event, ui) {
            setNoteOrder();
        }
    });
}

function setNoteOrder() {
    order = sortable.sortable('toArray', {attribute: 'data-id'});
    for (note of raw_notes) {
        id = note.id;
        note.order = order.indexOf(id.toString());
    }
    saveLib();
}

/*
 *  Renders a new note tile div for each note in storage in the note index section
 */
function renderNotes(){
    $('#new-note-btn').show();
    $("#new-note-hr").show();
    $("#note-index-container").css('height', '');
    clearNotesDisplay("notes");
    raw_notes.forEach(function(note){
        $(".note-index").append('<li class="note-tile btn btn-block transition-quick" data-id=' + note["id"] + '>' + trimTitle(note["title"], titleDisplayLen) + '</li>');
    });
    addTileListener();
    $(function() {
        $("#note-index").sortable();
    });
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
    renderHashes(Array.from(global_hashes).sort((a,b) => a.localeCompare(b)));
}

/*
 *  Renders the input list of hashes as tiles in the index section
 */
function renderHashes(hashes) {

    $('#new-note-btn').hide();
    $("#new-note-hr").hide();
    $("#note-index-container").css('height', '410px');
    clearNotesDisplay("hashes");
    hashes.forEach(function(hash) {
        $(".note-index").append('<div class="note-tile btn btn-block transition-quick" data-id=' + hash + '>' + trimTitle(hash, titleDisplayLen) + '</div>');
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
        Quill.find(document.querySelector("#current-note-body")).history.stack.undo = [];
        highlightHashes(hashtagRegexEnd);
        $(".ql-cursor").remove();
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
            "hashes": [],
            "order": raw_notes.length
        };

        //Increment value of idCounter
        chrome.storage.local.set({'idCounter': curID+1}, function(){
            return;
        });

        raw_notes.push(newNote);
        saveLib();

        //Add note tile to notes display
        $(".note-index").append('<div class="note-tile btn btn-block transition-quick" data-id=' + curID + '>' + title + '</div>');
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
    addHashListener();
    $('#autosave-label').text('Saved');
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
        curNote.innerHTML = trimTitle(title, titleDisplayLen);
    }

}

/*
 *  Trims the title string so it can be displayed in a note tile
 */
function trimTitle(title, trimLen) {
    if (title.length > trimLen) {
        return title.slice(0, trimLen-2) + "...";
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

/*********************************** User preference functions ***********************************/

/**
 * Loads user preferences from chrome storage and configures app accordingly
 */
function loadUserPreferences(preload=false) {
    default_preferences = {'focusMode': false, 'darkMode': false, 'colorScheme': 'Spotify', 'size': 'normal'};
    chrome.storage.local.get({'preferences': default_preferences}, function(obj) {
        userPreferences = obj.preferences;
        if (preload) {
            determineSize(true);
        }
        else {
            determineFocusMode();
            determineDarkMode();
            determineColorScheme();
        }
    });
}

/**
 * Changes UI to focus mode
 */
function focusMode() {
    $('#note-container').hide();
    $('#current-note-display').removeClass('cust-col-8').addClass('cust-col-12');
    $('#index-show-btn').show();
    $("#index-show-btn, #autosave-label").css('margin-left', '15px');
    $("#cur-note-body-container").css('padding', '0 15px 15px 15px');
    $("#scrolling-container").css('height', '87%');
    $("#current-note-title").css('margin', '0 0 0 auto');
}

/**
 * Changes UI to browse mode
 */
function browseMode() {
    $('#note-container').show();
    $('#current-note-display').removeClass('cust-col-12').addClass('cust-col-8');
    $('#index-show-btn').hide();
    $("#index-show-btn, #autosave-label").css('margin-left', '0px');
    $("#cur-note-body-container").css('padding', '0px 15px 20px 0px');
    $("#cur-note-body-container").css('background', 'none');
    $("#scrolling-container").css('height', '83%');
    $("#current-note-title").css('margin', '0 0 0 0');
}

function browseModeWrapper() {
    userPreferences.focusMode = false;
    chrome.storage.local.set({'preferences': userPreferences}, function(){
        browseMode();
    });
}

function focusModeWrapper() {
    userPreferences.focusMode = true;
    chrome.storage.local.set({'preferences': userPreferences}, function(){
        focusMode(); 
    });
}

/**
 * Determines if user preferences indicate focus mode
 */
function determineFocusMode() {
    (userPreferences.focusMode) ? focusMode() : {};
}

/**
 * Event listeners for focus and browse mode
 * Change user preferences and initiate function to change UI
 */
function addModeSwitchListeners() {
    document.getElementById('index-hide-btn').addEventListener('click' ,function(event) {
        focusModeWrapper();
    });

    document.getElementById('index-show-btn').addEventListener('click' ,function(event) {
        browseModeWrapper();
    });
}

/**
 * Changes UI to small mode and minimizes to only the editor
 */
function smallMode(initiate=true) {
    if (initiate) {
        $('#note-container').hide();
        $('#current-note-display').removeClass('cust-col-8').addClass('cust-col-12');
        $("#index-show-btn, #autosave-label").css('margin-left', '15px');
        $("#cur-note-body-container").css('padding', '0 15px 15px 15px');
        $("#scrolling-container").css('height', '82%');
        $("#current-note-title").css('margin', '0 0 0 15px');

        document.getElementById('title-container-row').insertBefore(document.getElementById('ext-options-container'), document.getElementById('current-note-title-container'));
        $("#ext-options-container").css("padding", "0 15px 0 15px");
        $("#current-note-title-container").css("padding-top", "0");
        $("#title-container").css("height", "15%");
        $("#note-row").css("height", "85%");
        $("#index-hide-btn").hide();
        $("#resize-display").css('left', '-15px');
        $("#themes-display").css('left', '-25px');
    }
    else {
        document.getElementById('sidebar-top').appendChild(document.getElementById('ext-options-container'));
        $("#ext-options-container").css("padding", "");
        $("#current-note-title-container").css("padding-top", "");
        $("#title-container").css("height", "10%");
        $("#note-row").css("height", "90%");
        $("#index-hide-btn").show();
        $("#resize-display").css('left', '');
        $("#themes-display").css('left', '-85px');
    }
}

/**
 * Changes the size of the extension based on discrete input size
 */
function changeSize(size, initial) {
    var fromSmall = false;
    (userPreferences.size == 'small') ? fromSmall = true : {};
    userPreferences.size = size;
    chrome.storage.local.set({'preferences': userPreferences}, function(){
        switch(size) {
            case "small":
                $('#extension-container').css('width', '400px');
                titleDisplayLen = 8;
                smallMode();
                break;
            case "normal":
                if (fromSmall) {
                    browseModeWrapper(); smallMode(false);
                }
                titleDisplayLen = 17;
                (!initial) ? loadNotes() : {};
                $('#extension-container').css('width', '600px');
                break;
            case "large":
                if (fromSmall) {
                    browseModeWrapper(); smallMode(false);
                }
                titleDisplayLen = 28;
                (!initial) ? loadNotes() : {};
                $('#extension-container').css('width', '800px');
                break;
        }
    });
}

/*
*   Determines and sets size of extension according to user preferences
*/
function determineSize(initial=false) {
    changeSize(userPreferences.size, initial);
}

/**
 * Adds listeners to resize buttons
 */
function addResizeListener() {
    document.getElementById('large-btn').addEventListener('click', function(event){
        changeSize('large');
    });
    document.getElementById('normal-btn').addEventListener('click', function(event){
        changeSize('normal');
    });
    document.getElementById('small-btn').addEventListener('click', function(event){
        changeSize('small');
    });
}

/**
 * Changes UI for editor and toolbar based on whether dark mode param is set
 */
function darkMode(preference) {
    if (preference) { //turn dark mode on
        $("#current-note-body").css({
            'color': 'white',
            'background-color': '#2a2a2a'
        });
        $("#toolbar").css({
            'background-color': '#1b1b1b'
        });
        $(".ql-snow .ql-fill, .ql-snow .ql-stroke.ql-fill").css('fill', 'white');
        $(".ql-snow .ql-stroke, .ql-snow .ql-stroke.ql-fill").css('stroke', 'white');
        $(".ql-snow .ql-picker .ql-picker-label").css('color', 'rgb(118, 118, 118)');

        //Change dark mode button colors
        $("#dark-mode-btn")[0].checked = true;
        $("#dark-mode-bulb").css('color', 'white');
    }
    else { //turn dark mode off
        $("#current-note-body").css({
            'color': 'black',
            'background-color': 'white'
        });
        $("#toolbar").css({
            'background-color': 'white'
        });
        $(".ql-snow .ql-fill, .ql-snow .ql-stroke.ql-fill").css('fill', '#444');
        $(".ql-snow .ql-stroke, .ql-snow .ql-stroke.ql-fill").css('stroke', '#444');
        $(".ql-snow .ql-picker .ql-picker-label").css('color', 'rgb(68, 68, 68)');

        //Change dark mode button colors
        $("#dark-mode-btn")[0].checked = false;
        $("#dark-mode-bulb").css('color', '#444')
    }
}

/**
 * Determines if user preferences indicate dark mode
 */
function determineDarkMode() {
    (userPreferences.darkMode) ? darkMode(true) : {};
}

/*
 *  Add listener to switch dark mode
 */
function addDarkModeListener() {
    document.getElementById("dark-mode-btn").addEventListener("click", function(){
        userPreferences.darkMode = !userPreferences.darkMode;
        chrome.storage.local.set({"preferences": userPreferences}, function(){
            darkMode(userPreferences.darkMode);
        });
    });
}

/**
 * Initiates color scheme change based on style parameter
 */
function setColorScheme(style) {
    var rootStyle = document.documentElement.style;
    var color_keys = ["--color_dark", "--color_gradient_end", "--color_light", "--color_accent1", "--color_accent2", "--color_accent3", "--color_button_txt", "--color_highlighted_txt", "--color_options_txt"];
    applyCSSColorChanges(rootStyle, color_keys, colorSchemes[style]);
}

/**
 * Applies css color changes specified in color_vals to the given variable names in color_keys
 */
function applyCSSColorChanges(rootStyle, color_keys, color_vals) {
    for (var i=0; i < color_keys.length; i++) {
        rootStyle.setProperty(color_keys[i], color_vals[i]);
    }
}

/**
 * Determines the users preferred color scheme when they first open the extension
 */
function determineColorScheme() {
    setColorScheme(userPreferences.colorScheme);
}

/**
 * Add listener to notility banner and changes color scheme on click
 */
function addColorSchemeListener() {
    
    var elements = $('.theme-btn');

    elements.click(function(self) {
        userPreferences.colorScheme = self.currentTarget.id;
        chrome.storage.local.set({'preferences': userPreferences}, function(){
            setColorScheme(userPreferences.colorScheme);
        });
    });

    elements.hover(function(self) {
        var rootStyle = document.documentElement.style;
        color = self.currentTarget.id;
        colors = colorSchemes[color];
        rootStyle.setProperty('--preview_color_dark', colors[0])
        rootStyle.setProperty('--preview_color_light', colors[2])
        rootStyle.setProperty('--preview_color_accent1', colors[3])
    }, function() {});

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

    function closeDeletePrompt() {
        $("#modal-delete").css("display", "none");
        $("#note-options-display").hide();
    }

    document.getElementById("delete-prompt-btn").onclick = function() {
        $("#modal-delete").css("display", "block");
        $("#delete-note-title").html($("#current-note-title")[0].innerHTML);
    }
    document.getElementById("modal-close-btn").onclick = closeDeletePrompt;
    document.getElementById("delete-cancel-btn").onclick = closeDeletePrompt;
    document.getElementById("delete-confirm-btn").onclick = function() {
        var id = findCurrentNote();
        deleteNote(id);
        closeDeletePrompt();
    }
}

/*
 *  Adds listener to display notes button
 */
function addFilterNoteListener() {
    document.getElementById("note-filter-btn").onclick = function() {
        document.getElementById("searcher").value = "";
        $("#searcher").css('border-radius', '0 4px 4px 4px')
        loadNotes();

        /* Change formatting of filter buttons */
        this.classList.add("active-display");
        document.getElementById("tags-filter-btn").classList.remove("active-display");
    }
}

/*
 *  Adds listener to display hashes function 
 */
function addFilterHashesListener() {
    document.getElementById("tags-filter-btn").onclick = function() {
        document.getElementById("searcher").value = "";
        $("#searcher").css('border-radius', '4px 0 4px 4px')
        loadHashes();

        /* Change formatting of filter buttons */
        this.classList.add("active-display");
        document.getElementById("note-filter-btn").classList.remove("active-display");
    }
}

/*
 *  Adds listener to download button that downloads the current note as a .txt file 
 */
function addDownloadListener() {

    /* When button is hovered, the link is set to download the current note
       Workaround because onclick did not register the correct href */

    /* .txt Download */
    element = $('#download-btn');
    element.hover(function(event){
        var targetElement = $(this)[0];
        var text = Quill.find(document.querySelector("#current-note-body")).getText();
        var blob = new Blob([text], {type: 'text/plain'});
        var output = window.URL.createObjectURL(blob);
        targetElement.download = $("#current-note-title")[0].innerHTML;
        targetElement.href = output;
    });

    /* .html Download */
    element1 = $('#download-html-btn');
    element1.click(function(event){
        
        var html = Quill.find(document.querySelector("#current-note-body")).root.innerHTML;
        var element = document.createElement('a');

        element.setAttribute('href', 'data:text/html;charset=utf-8,' + encodeURIComponent(html));
        element.setAttribute('download', $("#current-note-title")[0].innerHTML);

        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    });

    /* .rtf Download */
    element2 = $('#download-rtf-btn')
    element2.hover(function(event){
        var targetElement = $(this)[0];
        var html = Quill.find(document.querySelector("#current-note-body")).root.innerHTML;
        var rtf = convertHtmlToRtf(html);
        var blob = new Blob([rtf], {type: 'application/rtf'});
        var output = window.URL.createObjectURL(blob);
        targetElement.download = $("#current-note-title")[0].innerHTML;
        targetElement.href = output;
    });

    /* PDF Download */
    /*document.getElementById('pdf-download').addEventListener('click', function(){
        
        html2canvas(document.querySelector('#download-btn')).then(canvas => {
			let pdf = new jsPDF('p', 'mm', 'a4');
			pdf.addImage(canvas.toDataURL('image/jpeg'), 'jpeg', 0, 0, 211, 298);
			pdf.save("test.pdf");
        });
        
    });*/
}

/*function printPDF () {
    const domElement = document.getElementById('current-note-body')
    html2canvas(domElement, { onclone: (document) => {
    }})
    .then((canvas) => {
        const img = canvas.toDataURL('image/png');
        const pdf = new jsPDF();
        pdf.addImage(img, 'JPEG', 0, 0, 400, 1400);
        pdf.save('test.pdf');
    })
}*/


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
        $("#note-options-display").hide();
    }

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
            var hash = targetElement.getAttribute("data-id");

            document.getElementById("note-filter-btn").classList.add("active-display");
            document.getElementById("tags-filter-btn").classList.remove("active-display");

            loadNotes(hash);
    
        });
    }
}

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
        else if (targetElement.textContent.length > 31 && event.key != "Backspace" && event.key != "ArrowLeft" && event.key != "ArrowRight") {
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

function addOptionsListeners() {

    //Add listener for main note options menu
    $("#note-options-container").hover(function(){
        $("#note-options-display").show("blind", { direction: "up" }, 250);
        $("#options-icon").removeClass("fa-ellipsis-h");
        $("#options-icon").addClass("fa-chevron-down");
    }, function(){
        $("#note-options-display").stop(true, true).hide();
        $("#options-icon").removeClass("fa-chevron-down");
        $("#options-icon").addClass("fa-ellipsis-h");
    });

    //Add listener for download menu
    $("#download-container").hover(function(){
        $("#download-display").show("blind", { direction: "right" }, 250);
        $("#download-display-btn").css("color", "var(--color_accent2)");
    }, function(){
        $("#download-display").stop(true, true).hide();
        $("#download-display-btn").css("color", "var(--color_options_txt)");
    });

    //Add listener for extension options menu
    $("#ext-options-btn").click(function(self){
        console.log('clicked');
        if ($("#ext-options-display").is(":hidden")) {
            $(this).css("width", "100%");
            $("#ext-options-btn").removeClass("fa-bars").addClass("fa-caret-right");
            $("#ext-options-display").show("blind", { direction: "left" }, 250);
        }
        else {
            $(this).css("width", "");
            $("#ext-options-btn").removeClass("fa-caret-right").addClass("fa-bars");
            $("#ext-options-display").hide("blind", { direction: "left" }, 250);
        }
    });

    //Add listener for resize menu
    $("#resize-container").hover(function(){
        $("#resize-display").show("fade", null, 250);
        $("#resize-display-btn").css("color", "var(--color_accent2)");
    }, function(){
        $("#resize-display").stop(true, true).hide("fade", null, 250);
        $("#resize-display-btn").css("color", "var(--color_options_txt)");
    });
    $(".resize-btn").click(function(){
        $("#resize-display").hide();
    });

    //Add listener for themes menu
    $("#themes-container").hover(function(){
        $("#themes-display").show("fade", null, 250);
    }, function(){
        $("#themes-display").stop(true, true).hide("fade", null, 250);
    });
}

function addHashListener() {
    $(".ql-hash-phrase").dblclick(function(){
        loadNotes(this.innerHTML);
    });
}

function addOnCloseListener() {
    window.onblur = function(){
        saveNote();
    }
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

/*
 *  Adds all element listeners
 */
function addElementListeners() {
    addDarkModeListener();
    addColorSchemeListener();
    addResizeListener();
    addCreateNoteListener();
    addDeleteNoteListener();
    addFilterNoteListener();
    addFilterHashesListener();
    addTitleListener();
    addDownloadListener();
    addCitationButtonListener();
    addModeSwitchListeners();
    addOnCloseListener();
    addOptionsListeners();
}

/*
 * Code that is run when document loads
 */
loadUserPreferences(true);
document.addEventListener("DOMContentLoaded", function(){
    loadNotes();
    loadUserPreferences();
    addElementListeners();
})