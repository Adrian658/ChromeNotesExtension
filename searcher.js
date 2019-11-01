$("#searcher").on("keyup click input", function () {
    var val = $(this).val();
    if (val.length) {
        $(".note-index .note-tile").hide().filter(function () {
            return $(this).get(0).innerText.toLowerCase().indexOf(val.toLowerCase()) != -1;
        }).show();
    }
    else {
        $(".note-index .note-tile").show();
    }
});