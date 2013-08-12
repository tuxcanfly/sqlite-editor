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
    try {
        var data = db.exec(commands.replace(/\n/g, '; '));
        print(JSON.stringify(data, null, '  '));
    }
    catch (e) {
        print(e);
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
        dropStatus.innerText = 'Loading filename:'+file.name+' size:'+file.size+' ... ';
        var reader = new FileReader();
        reader.onload = function(e) {
            // run callback passing in the file TEXT
            try {
                cb(e.target.result);
                zone.classList.add('success');
                dropStatus.innerText += '[success reading file filename:'+file.name+' size:'+file.size+']';
            } catch (err) {
                zone.classList.add('error');
            }

        };
        reader.onerror = function() {
            dropStatus.innerText += '[error reading file filename:'+file.name+' size:'+file.size+']';
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

zone.ondragenter = function(){ dragIn(zone); return false; };
zone.ondragover = function(){ dragIn(zone); return false; };
zone.ondragleave = function(){ dragOut(zone); return false; };
zone.ondrop = function(event) {
            makeTheDrop(event,function(x){
                db=SQL.open(x);
				var q = "SELECT name FROM sqlite_master WHERE type='table';";
				commands.innerText = q;
                execute(q);
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