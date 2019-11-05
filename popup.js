
var changeCount = 0; //Keeps track of the number of changes made to Quill editor

/*
 *  Creates the Quill editor
 */
function createEditor() {

    //Assign instance of Quill to appropriate HTML section
    var quill = new Quill('.current-note-body', {
        theme: 'snow'
    });

    //Set Quill editor to auto-save after making changes
    var Delta = Quill.import('delta');
    quill.on('text-change', function(delta) {

        $('#autosave-label').text('Saving changes...');
        changeCount += 1;

        //Save the note if the user does not make changes after current change
        saveNoteWrapper(changeCount, 1500);

    });

}

/*
 * Initiates a wait function and then checks if the changeCount has been incremented while waiting.
 * If so, then the user has made changes since the function was called, so no action is taken.
 * If not, then the user has not made any changes for the timeout value and the current changes are saved.
 */
function saveNoteWrapper(changeCount, timeoutValue=3000) {
    
    localChangeCount = changeCount;

    setTimeout(function(){
        if (localChangeCount == changeCount) {
            console.log("Change ", localChangeCount, " is being saved");
            saveNote();
            changeCount = 0;
        }
    }, timeoutValue);
}

/*
 *  Retrieve the body of the Quill editor and update the note's contents in storage
 */
function saveNote() {

    //Updated variables of current note
    var id = $("#current-note-display")[0].getAttribute("data-id");
    var title = $("#current-note-title").text();
    var body = Quill.find(document.querySelector("#current-note-body")).getText();

    //Save note with new variables
    //Ideally we should just be saving the body here
    editNote(id=id, title=title, body=body);
    $('#autosave-label').text('Autosave completed');

}

//Executes when the page is loaded
document.addEventListener("DOMContentLoaded", function(){
    createEditor()
});