function createEditor() {
    var quill = new Quill('.current-note-body', {
        theme: 'snow'
    });

    // Save periodically
    var Delta = Quill.import('delta');
    var change = new Delta();
    quill.on('text-change', function(delta) {
    change = change.compose(delta);
    });

    setInterval(function() {
        if (change.length() > 0) {
        console.log('Saving changes...', change);
        $('#autosave-label').text('Saving changes...');
        var id = $("#current-note-display")[0].getAttribute("data-id");
        var title = $("#current-note-title").text();
        var body = Quill.find(document.querySelector("#current-note-body")).getText();
        var color = "Some random color";
        //Send entire document
        editNote(id, title, body, color);
        $('#autosave-label').text('Autosave completed');
        change = new Delta();
        }
    }, 3000);
}

//Executes when the page is loaded
document.addEventListener("DOMContentLoaded", function(){
    //chrome.extension.getBackgroundPage().console.log('foo');
    createEditor()
});