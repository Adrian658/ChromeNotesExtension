function createEditor() {
    var quill = new Quill('.current-note-body', {
        theme: 'snow'
    });
}

//Executes when the page is loaded
document.addEventListener("DOMContentLoaded", function(){
    //chrome.extension.getBackgroundPage().console.log('foo');
    createEditor()
});