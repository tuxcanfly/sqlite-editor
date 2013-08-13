// prepare to collect some needed Data in F

var f = {
    mimeType: 'application/x-sqlite-3',
    filename: 'test.sqlite',
    url: undefined,
    downloadUrl: undefined
}

// Open a database
var db = SQL.open();

// Run a command in the database
function execute(commands) {
    console.debug(commands);
    try {
        var data = db.exec(commands.replace(/\n/g, '; '));
        print(JSON.stringify(data, null, '  '));
        return data;
    }
    catch (e) {
        console.error(e);
    }
}


// Connect to the HTML element we 'print' to
function print(text) {
    var element = document.getElementById('output');
    element.innerHTML = text.replace(/\n/g, '<br>');
}



function grabDB(cb) {


    // create a Blob w/the DB data
	var blob = new Blob([db.exportData()],{type: f.mimeType});

    // we will need a FileReader to read the Blob
    // read blob AS DataUrl and store in F

    var reader = new FileReader();
    reader.onload = function(e) {
        f.url = e.target.result;
        f.downloadUrl = f.mimeType + ':' + f.filename + ':' + f.url;
        console.log('done reading blob, size:'+f.url.length);
        cb();
    };
    reader.readAsDataURL(blob);

}


// details of what happens when a file is Dropped
    function makeTheDrop(event, cb) {
        var file = event.dataTransfer.files[0];
        zone.classList.remove('error');
        zone.classList.remove('success');
        var reader = new FileReader();
        reader.onload = function(e) {
            // run callback passing in the file TEXT
            try {
                cb(e.target.result);
                zone.classList.add('success');
                $(dropStatus)
                    .addClass('alert-success')
                    .removeClass('hidden');
                dropStatus.innerText = 'Success! Opened file '+file.name+', size:'+file.size;
            } catch (err) {
                zone.classList.add('error');
            }

        };
        reader.onerror = function() {
            $(dropStatus)
                .addClass('alert-error')
                .removeClass('hidden');
            dropStatus.innerText = 'Error! Unable to open file '+file.name+' size:'+file.size;
        };
        reader.readAsBinaryString(file);
        return false;
    }

function dragIn(z){
    ['dragOut','error','success'].forEach(function(e){
        z.classList.remove(e);
    });
    z.classList.add('dragEnter');
}

function dragOut(z) {
    ['dragEnter','error','success'].forEach(function(e){
        z.classList.remove(e);
    });
    z.classList.add('dragOut');
}

function showTable(e) {
    var $el = $(this),
    $table = $(".table-container"),
    table = $el.data("table"),
    q = "SELECT * FROM " + table  + " LIMIT 10;";

    $(".new-row").removeClass("hidden");
    $table.empty();
    result = execute(q);
    $.each(result, function (i, row) {
        var $tr = $("<tr />"),
            $thead_tr = $("<tr />"),
            $tbody = $("<tbody />"),
            $thead = $("<thead />");
        if (i==0) {
            $.each(row, function (k, header) {
                $thead.append(
                    $thead_tr.append(
                        $("<th />") .text(header.column)
                    )
                );
            });
            $table.append($thead);
        }
        $table.append($tbody);
        $.each(row, function (j, cell) {
            $tbody.append(
                $tr.append(
                    $("<td />") .text(cell.value)
                )
            );
        });
    });
}

zone.ondragenter = function(){ dragIn(zone); return false; };
zone.ondragover = function(){ dragIn(zone); return false; };
zone.ondragleave = function(){ dragOut(zone); return false; };
zone.ondrop = function(event) {
            makeTheDrop(event,function(x){
                db=SQL.open(x);
				var q = "SELECT name FROM sqlite_master WHERE type='table';";
                result = execute(q);
                $('.tables').empty();
                $.each(result, function (i, row) {
                    $(".tables")
                        .append(
                            $("<li />").
                                append($("<a />")
                                        .attr("href", "#table_" + row[0].value)
                                        .attr("data-table", row[0].value)
                                        .attr("data-toggle", "tab")
                                        .text(row[0].value)
                                        .on('click', showTable)
                            )
                    )
                });
            });
            dragOut(zone);
            return false;
};


sqlButt.onclick = function(event){
    execute(commands.value);
};

dbLink.onclick = function(event) {
    grabDB(function(){
        dbDrag.style.display='inherit';
    });  
};

dbDrag.ondragstart = function(event) {
    event.dataTransfer.setData('DownloadUrl', f.downloadUrl);
};

dbDrag.ondragend = function(event) {
    dbDrag.style.display='none';
};

$("#id_new-row-modal").on("show", function () {
    var table = $(".nav-tabs .active a").data("table");
    result = execute("pragma table_info('" + table + "');");
    $(".new-row-form").empty();
    $.each(result, function (i, col) {
        // pk check
        if (col[5].value === "0") {
            $(".new-row-form")
                .data("table", table)
                .append(
                    $("<div />")
                        .addClass("control-group")
                        .append($("<label />")
                                    .addClass("control-label")
                                    .attr("for", "id_" + col[1].value)
                                    .text(col[1].value)
                        )
                        .append($("<div />")
                                    .addClass("controls")
                                    .append($("<input />")
                                                .data("col", col[1].value)
                                                .attr("type", "text")
                                                .attr("id", "id_" + col[1].value)
                                    )
                    )
                )
        }
    });
});

$(".row-save").on("click", function () {
    var table = $(".new-row-form").data("table"),
        props = $(".new-row-form input").map(function () { return $(this).data("col"); }).toArray(),
        vals = $(".new-row-form input").map(function () { return $(this).val(); }).toArray();
        q = "INSERT INTO `" + table + "` (" + props.join(", ") + ")" + " VALUES ('" + vals.join("', '") + "')";
    result = execute(q);
    $(".nav-tabs .active a").triggerHandler("click");
});
