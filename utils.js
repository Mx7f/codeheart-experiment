function capitalize(text) {
    return toUpperCase(text[0]) + toLowerCase(text.substring(1));
}


function shallowClone(x) {
    var y;
    if (isArray(x)) {
        y = makeArray(x.length);
        for (var i = 0; i < x.length; ++i) {
            y[i] = x[i];
        }
    } else if (isObject(x)) {
        y = Object.create(Object.getPrototypeOf(x));
        for (var p in x) {
            if (x.hasOwnProperty(p)) { y[p] = x[p]; }
        }
    } else {
        // function, string, boolean, and number are immutable
        y = x;
    }

    return y;
}


function fillTextWordWrap(maxWidth, lineHeight, text, x, y, color, style, xAlign, yAlign) {
    xAlign = (xAlign === undefined) ? 'start' : xAlign;
    yAlign = (yAlign === undefined) ? 'alphabetic' : yAlign;

    _ch_ctx.textAlign    = xAlign;
    _ch_ctx.textBaseline = yAlign;
    _ch_ctx.font         = style;
    _ch_ctx.fillStyle    = color;

    var words = text.split(' ');
    var line = '';

    for (var n = 0; n < words.length; ++n) {
        var testLine = line + words[n];
        var testWidth = _ch_ctx.measureText(testLine).width;
        if (testWidth > maxWidth) {
            // Fail: draw the line
            try { _ch_ctx.fillText(line, x, y); } catch (e) {}
            line = words[n] + ' ';
            y += lineHeight;
        } else {
            // Succeed; add the word (and maybe whitespace) to the
            // line and continue
            line = testLine + ((n === words.length - 1) ? '' : ' ');
        }
    }

    // Draw the final line fragment
    try { _ch_ctx.fillText(line, x, y); } catch (e) {}
}

/** Saves a text file to the filename in the default download directory. */
function downloadTextFile(filename, text) {
    var textFileAsBlob    = new Blob([text], {type:'text/plain'});
    var downloadLink      = document.createElement("a");
    downloadLink.href     = window.webkitURL.createObjectURL(textFileAsBlob);
    downloadLink.download = filename;
    downloadLink.click();    
}


/** Prompts the user for a filename, and then invokes the callback
    with the file's contents. The callback will never be invoked
    if the user cancels the dialog. */
function openLocalTextFile(callback) {
    // Create an input box
    var input    = document.createElement("input");

    input.type   = "file";
    input.accept = "text/plain";
    var onClick = function(event) {
        var fileReader = new FileReader();
        fileReader.onload = function(fileLoadedEvent) {
            callback(fileLoadedEvent.target.result);
        };

        fileReader.readAsText(input.files[0], "UTF-8");
        // The input object should now become garbage collected
    };
    input.addEventListener("change", onClick, false);

    // Trigger the click event
    input.click();
}


function clamp(v, low, high) {
    return Math.max(low, Math.min(high, v));
}


/** Loads a file from a URL, blocking until it is available.  The URL
    must be on the same server as the game and can be relative.  The
    result is stored in a string.  If it is binary data, it will be
    correctly represented within the string as ASCII.  If the file is
    not found, returns undefined.

    Example of use to parse JSON:
    
     var mydata = JSON.parse(getRemoteFileAsString("foo.json"));

    The file must be on the same domain as the program was originally
    loaded from.  For example, if your program is at
    http://example.com/test/play.html, then you can only load other
    files from domain example.com.

    On Chrome, this function cannot be used when running directly off
    the local file system without first disabling web security because
    Chrome considers every file on the local filesystem to be a
    different domain.  On OS X, you can work around this by launching
    Chrome in developer mode as:

     open -a Google\ Chrome --args --disable-web-security

    or

     chrome --allow-file-access-from-files

    You can also avoid this problem by always running under a web
    server, even when developing.  To load a web server in a directory
    on OS X, type:

     python -m SimpleHTTPServer
 */
function getRemoteFileAsString(url) {
    if (window.XMLHttpRequest) {
        xhttp = new XMLHttpRequest();
    } else {
        xhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }

    var asynchronous = false;
    var result;
    try {
        xhttp.open("GET", url, asynchronous);
        xhttp.send();
        result = xhttp.responseText;
    } catch (e) {
        return undefined;
    }

    if (xhttp.status === 0) {
        return result;
    } else {
        return undefined;
    }
}


function loadSoundArray(filename) {
    return loadAssetArray(filename, loadSound);
}


function loadImageArray(filename) {
    return loadAssetArray(filename, loadImage);
}


function loadAssetArray(filename, load) {
    var array = false;

    if (filename) {
        var i = indexOf(filename, "[");
        if (i == -1) {
            // One frame of animation
            array = [load(filename)];
        } else {
            var before = substring(filename, 0, i);
            var after = substring(filename, i + 3, length(filename));
            var num = parseInt(substring(filename, i + 1, i + 2));

            array = [];
            for (i = 0; i < num; ++i) {
                array[i] = load(before + i + after);
            }
        }
    }

    return array;
}

/** Creates an object whose members are the values provided (that
    happen to map to the same strings) and that is immutable. 

    var Mode = makeEnum("TITLE", "PLAY", "GAME_OVER");

    When the proxy API is more widely supported, this will also
    give errors when trying to access undefined properties.

    (http://soft.vub.ac.be/~tvcutsem/proxies/assets/proxy_examples/helloproxy.html)
*/
function makeEnum() {
    var e = {};
    for (var i = 0; i < arguments.length; ++i) {
        e[arguments[i]] = arguments[i];
    }
    return Object.freeze(e);
}
