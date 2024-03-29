
var changeCount = 0; //Keeps track of the number of changes made to Quill editor
var hashtagRegexEnd = /[^a-zA-Z\d\#]/ //regex to recognize the end of a hash 

/* Register custom fonts with Quill */
var Font = Quill.import('formats/font');
Font.whitelist = ['mirza', 'arial', 'snellroundhand', 'impact', 'timesNewRoman', 'typewriter', 'courier', 'appleChancery'];
Quill.register(Font, true);
registerHashFormat();

/*
 *  Creates the Quill editor
 */
function createEditor() {

    //Assign instance of Quill to appropriate HTML section
    var quill = new Quill('#current-note-body', {
        theme: 'snow',
        scrollingContainer: '#scrolling-container',
        modules: {
            toolbar: '#toolbar'
        },
        bounds: '#scrolling-container'
    });

    /* Inititate hash formatting and auto saving when user makes edits */
    quill.on('text-change', function(delta, oldDelta, source) {

        //If the change was made by a user
        if (source == "user") {

            //console.log(source);
            //console.log(oldDelta);

            /* Store information about the change */
            var changeIndex = delta.ops[0].retain;
            var op1 = delta.ops[0];
            var op2 = delta.ops[1];
            var changeChar, backspace;
            (!changeIndex) ? changeIndex = 0 : {};
            (op2) ? changeChar = op2.insert : changeChar = op1.insert;
            (op2) ? backspace = op2.delete == 1 : backspace = op1.delete == 1;

            /* if the character is the first typed on its line, remove hash formatting */
            var quillText = quillGetText(quill);
            var previousChar = quillText[changeIndex-1];
            if (previousChar == "\n") {
                quill.formatText(changeIndex, 1, 'hash', false);
            }

            /* apply hash formatting depending on the character typed by the user */
            if (changeChar == "#") {
                applyHashFormatting(quill, changeIndex, hashtagRegexEnd, 'phrase');
            }
            else if (hashtagRegexEnd.exec(changeChar)) { //users types a character that would end a hash
                applyHashFormatting(quill, changeIndex+1, hashtagRegexEnd, false);
                quill.formatText(changeIndex, 1, 'hash', false);
            }
            else if (backspace) { //user backspaces which could affect hashes
                findDeleteChar(quill, oldDelta, changeIndex, hashtagRegexEnd);
            }
            else if (changeIndex == 0) {
                quill.formatText(changeIndex, 1, 'hash', false);
            }
            //Save the note if the user does not make changes after current change
            $('#autosave-label').text('Saving...');
            changeCount += 1;
            saveNoteWrapper(changeCount);
        }
    });

}

/*
 *  Registers the custom hash format class with Quill
 */
function registerHashFormat() {
    var Parchment = Quill.import("parchment");

    let CustomClass = new Parchment.Attributor.Class('hash', 'ql-hash', {
        scope: Parchment.Scope.INLINE
    });

    Quill.register(CustomClass, true);
}

/*
 * Initiates a wait function and then checks if the changeCount has been incremented while waiting.
 * If so, then the user has made changes since the function was called, so no action is taken.
 * If not, then the user has not made any changes for the timeout value and the current changes are saved.
 */
function saveNoteWrapper(changeCount, timeoutValue=1500) {
    
    localChangeCount = changeCount;

    setTimeout(function(){
        if (localChangeCount == changeCount) {
            //console.log("Change ", localChangeCount, " is being saved");
            saveNote();
            changeCount = 0;
        }
    }, timeoutValue);
}

//Executes when the page is loaded
document.addEventListener("DOMContentLoaded", function(){
    createEditor()
});