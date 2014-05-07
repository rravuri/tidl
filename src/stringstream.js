    var sutil = {};

    // from CodeMirror
    // Counts the column offset in a string, taking tabs into account.
    // Used mostly to find indentation.
    function countColumn(string, end, tabSize, startIndex, startValue) {
        if (end === null) {
            end = string.search(/[^\s\u00a0]/);
            if (end == -1) end = string.length;
        }
        for (var i = startIndex || 0, n = startValue || 0; i < end; ++i) {
            if (string.charAt(i) == "\t") n += tabSize - (n % tabSize);
            else ++n;
        }
        return n;
    }

    // STRING STREAM

    // Fed to the mode parsers, provides helper functions to make
    // parsers more succinct.

    // The character stream used by a mode's parser.
    sutil.StringStream = function StringStream(string, tabSize) {
        this.pos = this.start = 0;
        this.string = string;
        this.tabSize = tabSize || 8;
        this.lastColumnPos = this.lastColumnValue = 0;
    };

    sutil.StringStream.prototype = {
        eol: function () { return this.pos >= this.string.length; },
        sol: function () { return this.pos === 0; },
        peek: function () { return this.string.charAt(this.pos) || undefined; },
        next: function () {
            if (this.pos < this.string.length)
                return this.string.charAt(this.pos++);
        },
        eat: function (match) {
            var ch = this.string.charAt(this.pos);
            var ok;
            if (typeof match == "string") ok = ch == match;
            else ok = ch && (match.test ? match.test(ch) : match(ch));
            if (ok) { ++this.pos; return ch; }
        },
        eatWhile: function (match) {
            var start = this.pos;
            while (this.eat(match)) { }
            return this.pos > start;
        },
        eatSpace: function () {
            var start = this.pos;
            while (/[\s\u00a0]/.test(this.string.charAt(this.pos)))++this.pos;
            return this.pos > start;
        },
        skipToEnd: function () { this.pos = this.string.length; },
        skipTo: function (ch) {
            var found = this.string.indexOf(ch, this.pos);
            if (found > -1) { this.pos = found; return true; }
        },
        backUp: function (n) { this.pos -= n; },
        column: function () {
            if (this.lastColumnPos < this.start) {
                this.lastColumnValue = countColumn(this.string, this.start, this.tabSize, this.lastColumnPos, this.lastColumnValue);
                this.lastColumnPos = this.start;
            }
            return this.lastColumnValue;
        },
        indentation: function () { return countColumn(this.string, null, this.tabSize); },
        match: function (pattern, consume, caseInsensitive) {
            if (typeof pattern == "string") {
                var cased = function (str) { return caseInsensitive ? str.toLowerCase() : str; };
                var substr = this.string.substr(this.pos, pattern.length);
                if (cased(substr) == cased(pattern)) {
                    if (consume !== false) this.pos += pattern.length;
                    return true;
                }
            } else {
                var match = this.string.slice(this.pos).match(pattern);
                if (match && match.index > 0) return null;
                if (match && consume !== false) this.pos += match[0].length;
                return match;
            }
        },
        current: function () { return this.string.slice(this.start, this.pos); }
    };

    // See if "".split is the broken IE version, if so, provide an
    // alternative way to split lines.
    sutil.splitLines = "\n\nb".split(/\n/).length != 3 ? function (string) {
        var pos = 0, result = [], l = string.length;
        while (pos <= l) {
            var nl = string.indexOf("\n", pos);
            if (nl == -1) nl = string.length;
            var line = string.slice(pos, string.charAt(nl - 1) == "\r" ? nl - 1 : nl);
            var rt = line.indexOf("\r");
            if (rt != -1) {
                result.push(line.slice(0, rt));
                pos += rt + 1;
            } else {
                result.push(line);
                pos = nl + 1;
            }
        }
        return result;
    } : function (string) { return string.split(/\r\n?|\n/); };

    if (this.CodeMirror || false) {
        CodeMirror.defineMode("tidl", _createTokenizer);
        sutil.StringStream = CodeMirror.StringStream;
        sutil.splitLines = CodeMirror.splitLines;
    }