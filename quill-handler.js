
var changeCount = 0; //Keeps track of the number of changes made to Quill editor
var hashtagRegexEnd = /[ .!?\\:;(){}]/

/*
 *  Creates the Quill editor
 */
function createEditor() {

    var Font = Quill.import('formats/font');
    Font.whitelist = ['roboto', 'inconsolata', 'mirza', 'arial', 'snellroundhand', 'impact'];
    Quill.register(Font, true);

    //Assign instance of Quill to appropriate HTML section
    var quill = new Quill('#current-note-body', {
        theme: 'snow',
        scrollingContainer: '#scrolling-container',
        modules: {
            toolbar: '#toolbar'
        },
        bounds: '#scrolling-container'
    });

    //Set Quill editor to auto-save after making changes
    
    quill.on('text-change', function(delta, oldDelta, source) {

        //If the change was made by a user
        if (source == "user") {

            console.log(delta);

            quillLength = quill.getText().length;

            //If the user changes the font of the whole document at once, rehighlight hashes
            if (delta.ops[0].retain == quillLength-1) {
                highlightHashes();
            }

            //Check if the user is entering the first character in the editor, and change font to Arial if so
            if (quillLength <= 2) {
                quill.formatText(0, 1, 'font', 'arial');
            }

            //If the change made was the user pressing the spacebar, check if they finished or modified a hash and apply formatting
            if (hashtagRegexEnd.exec(delta.ops[1].insert)) {
                highlightHashes(delta.ops[0].retain, "punctuation");
            } //If the user pressed backspace, check if they deleted a # and remove formatting from the truncated hash text
            else if (delta.ops[1].delete == 1) {
                highlightHashes(delta.ops[0].retain, "backspace");
            }
            else { //highlight all hashes
                highlightHashes();
            }
            
            //Save the note if the user does not make changes after current change
            $('#autosave-label').text('Saving changes...');
            changeCount += 1;
            saveNoteWrapper(changeCount, 1500);
        }

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

//Executes when the page is loaded
document.addEventListener("DOMContentLoaded", function(){
    createEditor()
});