$("#searcher").on("keyup click input", function () {
    var val = $(this).val();
    filteredIds = filterNotes(val);
    if (val.length) {
        $(".note-index .note-tile").hide().filter(function () {
            var div = $(this).get(0);
            var dataid = Number(div.getAttribute("data-id"));
            return filteredIds.includes(dataid);
        }).show();
    }
    else {
        $(".note-index .note-tile").show();
    }
});