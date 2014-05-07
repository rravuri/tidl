    function _createTokenizer(config, parserConfig) {
        var ID = /^[a-zA-Z][a-zA-Z0-9_]*/;
        var builtintypes = ["boolean", "byte", "short", "int", "long", "float", "double", "decimal", "string", "datetime", "list", "set", "map"];
        function contains(items, item) {
            for (var i = 0; i < items.length; i++) {
                if (typeof item == 'function') {
                    var res = item(items[i], i);
                    if (res) return items[i];
                }
                else if (items[i] == item) {
                    return item;
                }
            }
            return false;
        }

        function tokenString(quote, col) {
            return function _tokenString(stream, state) {
                var data = "", next, end = false, escaped = false;
                while ((next = stream.next()) || false) {
                    if (next === quote && !escaped) {
                        end = true;
                        break;
                    }
                    data += next;
                    escaped = !escaped && next === '\\';
                }
                if (end) {
                    state.tokenizers.shift();
                }
                var token = (quote === '`' || quote === ')' ? 'quote' : 'string');
                state.lastToken = 'v';
                var attribute = state.context[0];
                if (attribute) {
                    try {
                        attribute.Values[attribute.Values.length - 1] = attribute.Values[attribute.Values.length - 1] + data.replace(/\\/g, '') + (end ? '' : '\n');
                    }
                    catch (ex) {
                    }
                    return token + state.ec;
                }
                return token;
            };
        }

        function tokenComment() {
            return function _tokenComment(stream, state) {
                var next, end = false;
                while ((next = stream.next()) || false) {
                    if (next + stream.peek() === "*/") {
                        stream.next();
                        end = true;
                        break;
                    }
                }
                if (end) {
                    state.tokenizers.shift();
                }
                var token = 'comment';
                return token;
            };
        }

        function tokenizeIDList() {
            return function _tokenizeIDList(stream, state) {
                if (stream.eatSpace()) {
                    return null;
                }

                if (stream.match("//")) {
                    stream.skipToEnd();
                    return 'comment';
                }
                if (stream.match("/*")) {
                    state.tokenizers.unshift(tokenComment());
                    return tokenize(stream, state);
                }

                var matches;
                var array = state.context[0];

                if (state.lastToken === '' || state.lastToken == ',') {
                    if ((matches = stream.match(ID)) !== null) {
                        state.lastToken = 'i';
                        array.push(matches[0]);
                        if (contains(builtintypes, matches[0])) {
                            return "builtin";
                        }
                        return "variable-2";
                    }
                }
                else if (state.lastToken == 'i') {
                    if (stream.eat(',')) {
                        state.lastToken = ',';
                        return null;
                    }
                    else if (stream.eat('{')) {
                        state.context.shift();
                        state.tokenizers.shift();
                        state.lastToken = '';
                        state.tokenizers.unshift(tokenizeIobjBody());
                        return 'bracket';
                    }
                }

                stream.next();
                return "error error-mark m-2003";
            };
        }

        function tokenizeType() {
            return function _tokenizeType(stream, state) {
                if (stream.eatSpace()) {
                    return null;
                }

                if (stream.match("//")) {
                    stream.skipToEnd();
                    return 'comment';
                }
                if (stream.match("/*")) {
                    state.tokenizers.unshift(tokenComment());
                    return tokenize(stream, state);
                }

                var matches;
                var type = state.context[0];
                var parent = state.context[1];

                if (type.Name === '') {
                    if ((matches = stream.match(ID)) !== null) {
                        type.Name = matches[0];
                        state.lastToken = 't';
                        if (contains(builtintypes, matches[0])) {
                            return "builtin";
                        }
                        return "variable-2";
                    }
                }
                else if (stream.peek() == '<') {
                    stream.next();
                    state.lastToken = '<';
                    state.context.unshift([]);
                    state.tokenizers.unshift(tokenizeTypeList());
                    return "operator";
                }
                else {
                    if (parent instanceof (Array)) {
                        parent.push(type);
                    }
                    state.context.shift();
                    state.tokenizers.shift();
                    return tokenize(stream, state);
                }
            };
        }

        function tokenizeTypeList() {
            return function _tokenizeTypeList(stream, state) {
                if (stream.eatSpace()) {
                    return null;
                }

                if (stream.match("//")) {
                    stream.skipToEnd();
                    return 'comment';
                }

                if (stream.match("/*")) {
                    state.tokenizers.unshift(tokenComment());
                    return tokenize(stream, state);
                }

                var matches;
                var typeList = state.context[0];
                var type = state.context[1];
                var t;

                if (state.lastToken == '<' || state.lastToken == ',') {
                    if ((matches = stream.match(ID, false)) !== null) {
                        state.context.unshift(new tidl.IdlType());
                        state.tokenizers.unshift(tokenizeType());
                        return tokenize(stream, state);
                    }
                }
                else if (state.lastToken == 't') {
                    if (stream.eat(',')) {
                        state.lastToken = ',';
                        return null;
                    }
                    else if (stream.eat('>')) {
                        state.lastToken = '>';
                        type.Types = typeList.concat([]);
                        state.context.shift();
                        state.tokenizers.shift();
                        return "operator";
                    }
                }
                if (stream.eat(',')) {
                    return null;
                }
                else if (stream.eat('<')) {
                    t = obj.parameters[obj.parameters.length - 1];
                    state.context.unshift(t);
                    state.tokenizers.unshift(tokenizeTypeList());
                    return "operator";
                }
                else if ((matches = stream.match(ID)) !== null) {
                    t = { name: matches[0], type: 'dataType', parameters: [] };
                    obj.parameters.push(t);
                    if (contains(builtintypes, matches[0])) {
                        return "builtin";
                    }
                    return "variable-2";
                }

                if (stream.eat('>')) {
                    state.context.shift();
                    state.tokenizers.shift();
                    return "operator";
                }

                stream.skipToEnd();
                state.tokenizers.shift();
                state.context.shift();
                return "error";
            };
        }

        function tokenizeParam() {
            return function _tokenPList(stream, state) {
                if (stream.eatSpace()) {
                    return null;
                }

                if (stream.match("//")) {
                    stream.skipToEnd();
                    return 'comment';
                }
                if (stream.match("/*")) {
                    state.tokenizers.unshift(tokenComment());
                    return tokenize(stream, state);
                }


                var matches;
                var param = state.context[0];
                var obj = state.context[1];


                if ((matches = stream.match(ID, false)) !== null) {
                    if (matches[0] == 'mandatory' && obj.type != 'enumeration' && param.Mandatory === false) {
                        stream.match(ID);
                        param.Modifiers.push(matches[0]);
                        param.Mandatory = true;
                        return 'keyword';
                    }
                    else if (obj.type == 'enumeration') {
                        stream.match(ID);
                        param.Name = matches[0];
                        state.lastToken = 'p';
                        obj.Parameters[param.Name] = param;
                        state.context.shift();
                        state.tokenizers.shift();
                        obj.Parameters[matches[0]] = param;
                        return 'variable';
                    }
                    else if (param.Type.Name === '') {
                        state.context.unshift(param.Type);
                        state.tokenizers.unshift(tokenizeType());
                        return tokenize(stream, state);
                    }
                    else {
                        stream.match(ID);
                        param.Name = matches[0];
                        state.lastToken = 'p';
                        obj.Parameters[param.Name] = param;
                        state.context.shift();
                        state.tokenizers.shift();
                        //obj[matches[0]] = param;
                        return 'variable';
                    }
                }

                stream.next();
                return "error error-mark m-2003";
            };
        }

        function tokenPList() {
            return function _tokenPList(stream, state) {

                if (stream.eatSpace()) {
                    return null;
                }

                if (stream.match("//")) {
                    stream.skipToEnd();
                    return 'comment';
                }
                if (stream.match("/*")) {
                    state.tokenizers.unshift(tokenComment());
                    return tokenize(stream, state);
                }


                var matches;
                var obj = state.context[0];
                var parentScope = state.context[1];
                var param;
                if (state.lastToken == '(') {
                    if ((matches = stream.match(ID, false)) !== null) {
                        param = new tidl.IdlParam();
                        state.context.unshift(param);
                        state.tokenizers.unshift(tokenizeParam());
                        return tokenize(stream, state);
                    }
                }
                else if (state.lastToken == 'p') {
                    if (stream.eat(',')) {
                        state.lastToken = ',';
                        param = new tidl.IdlParam();
                        state.context.unshift(param);
                        state.tokenizers.unshift(tokenizeParam());
                        return null;
                    }
                }
                if (stream.eat(')') === ')') {
                    state.lastToken = ')';
                    state.tokenizers.shift();
                    return null;
                }

                stream.next();
                if (state.inError()) {
                    return "error" + state.ec;
                }
                else {
                    return "error error-mark m-2003";
                }
            };
        }

        function tokenizeIobjBody() {
            return function _tokenizeIobjBody(stream, state) {

                if (stream.eatSpace()) {
                    return null;
                }

                if (stream.match("//")) {
                    stream.skipToEnd();
                    return 'comment';
                }

                if (stream.match("/*")) {
                    state.tokenizers.unshift(tokenComment());
                    return tokenize(stream, state);
                }

                var obj = state.context[0];
                var parentScope = state.context[1];

                if (stream.peek() == '@') {
                    stream.next();
                    var attribute = new tidl.IdlAttr();
                    if ((matches = stream.match(ID, true)) !== null) {
                        attribute.Name = matches[0];
                        if (contains(['description', 'parameter', 'since','method','urlTemplate','bodyParam',
                            'revision', 'exception', 'return', 'value', 'seealso'], attribute.Name) === false) {
                            state.setWarn(1007);
                        }
                        state.context.unshift(attribute);
                        state.tokenizers.unshift(tokenizeAttribute());
                        return "attribute em" + state.ec;
                    }
                    else {
                        stream.skipToEnd();
                        state.ec = '';
                        return 'error error-mark m-2003';
                    }
                }
                else if (stream.peek() == '}') {
                    state.tokenizers.shift();
                    return 'bracket';
                }
                stream.skipToEnd();
                state.tokenizers.shift();
                return "error error-mark m-2003";
            };
        }

        function tokenizeIobj() {
            return function _tokenizeIobj(stream, state) {

                if (stream.eatSpace()) {
                    return null;
                }

                if (stream.match("//")) {
                    stream.skipToEnd();
                    return 'comment';
                }

                if (stream.match("/*")) {
                    state.tokenizers.unshift(tokenComment());
                    return tokenize(stream, state);
                }

                var obj = state.context[0];
                var parentScope = state.context[1];
                var matches;

                if (obj.Name === '') {
                    if ((matches = stream.match(ID)) !== null) {
                        state.lastToken = 'i';
                        obj.Name = matches[0];
                        if (obj.type == 'operation') {
                            return 'def strong';
                        }
                        else {
                            return 'variable-2 strong';
                        }
                    }
                }
                else if (state.lastToken == 'i' && stream.peek() == '(') {
                    state.tokenizers.unshift(tokenPList());
                    stream.next();
                    state.lastToken = '(';
                    return null;
                }
                else if (state.lastToken == ')') {
                    if ((matches = stream.match(ID, false)) !== null) {
                        if (matches == 'throws') {
                            if (obj.type == 'operation') {
                                state.lastToken = '';
                                state.context.unshift(obj.Exceptions);
                                state.tokenizers.unshift(tokenizeIDList());
                                stream.match(ID);
                                return 'keyword';
                            }
                        }
                        else if (matches == 'extends') {
                            if (obj.type == 'type') {
                                state.lastToken = '';
                                state.context.unshift(obj.BaseTypes);
                                state.tokenizers.unshift(tokenizeIDList());
                                stream.match(ID);
                                return 'keyword';
                            }
                        }
                    }
                    else if (stream.eat('{')) {
                        state.lastToken = '';
                        state.tokenizers.unshift(tokenizeIobjBody());
                        return 'bracket';
                    }
                }
                else if (stream.eat('}')) {
                    state.lastToken = '';
                    try {
                        parentScope[obj.type.toUpperCase()[0] + obj.type.substr(1) + 's'].push(obj);
                    }
                    catch (e) {
                    }
                    state.context.shift();
                    state.tokenizers.shift();
                    return 'bracket';
                }

                stream.skipToEnd();
                state.tokenizers.shift();
                return "error error-mark m-2003";
            };
        }

        function tokenizeInterfaceBody() {
            return function _tokenizeInterfaceBody(stream, state) {

                if (stream.eatSpace()) {
                    return null;
                }

                if (stream.match("//")) {
                    stream.skipToEnd();
                    return 'comment';
                }

                if (stream.match("/*")) {
                    state.tokenizers.unshift(tokenComment());
                    return tokenize(stream, state);
                }

                var intf = state.context[0];
                var parentScope = state.context[1];
                var matches;
                var ob;

                if (stream.peek() == '}') {
                    stream.next();
                    state.context.shift();
                    state.tokenizers.shift();
                    if (!state.inError()) {
                        try {
                            parentScope.Interfaces[intf.Name] = intf;
                        }
                        catch (e) {
                        }
                    }
                    return 'bracket';
                }

                if (stream.peek() == '@') {
                    stream.next();
                    var attribute = new tidl.IdlAttr();
                    if ((matches = stream.match(ID, true)) !== null) {
                        attribute.Name = matches[0];
                        if (contains(['description', 'owner', 'version',
                            'revision', 'author', 'reviewer', 'organisation',
                            'namespacePrefix', 'organisationDomainName'], attribute.Name) === false) {
                            state.setWarn(1003);
                        }
                        state.context.unshift(attribute);
                        state.tokenizers.unshift(tokenizeAttribute());
                        return "attribute em" + state.ec;
                    }
                    else {
                        stream.skipToEnd();
                        state.ec = '';
                        return 'error error-mark m-2003';
                    }
                }

                if ((matches = stream.match(ID, false)) !== null) {
                    if (contains(['type', 'event', 'exception', 'enumeration'], matches[0])) {
                        stream.match(ID);
                        ob = new tidl.IdlOps();
                        ob.type = matches[0];
                        ob.Return = new tidl.IdlType();
                        ob.Return.Name = matches[0];
                        state.context.unshift(ob);
                        state.tokenizers.unshift(tokenizeIobj());
                        return "keyword";
                    }
                    else {
                        var rc = '';
                        ob = new tidl.IdlOps();
                        ob.type = "operation";
                        if (matches[0] === 'async') {
                            stream.match(ID);
                            ob.IsAsync = true;
                            rc = 'keyword';
                        }
                        else {
                            ob.IsAsync = false;
                            //ob.Return.Name = matches[0];
                            //rc = 'variable-2';
                            //if (contains(builtintypes, matches[0])) {
                            //    rc = "builtin";
                            //}
                        }
                        state.context.unshift(ob);
                        state.context.unshift(ob.Return);
                        state.tokenizers.unshift(tokenizeIobj());
                        state.tokenizers.unshift(tokenizeType());
                        if (rc !== '') {
                            return rc;
                        }

                        return tokenize(stream, state);
                    }
                }

                stream.skipToEnd();
                state.context.shift();
                state.tokenizers.shift();
                if (!state.inError()) {
                    state.setError(2003);
                }
                return "error" + state.ec;
            };
        }

        function tokenizeInterface() {
            return function _tokenizeInterface(stream, state) {

                if (stream.eatSpace()) {
                    return null;
                }

                if (stream.match("//")) {
                    stream.skipToEnd();
                    return 'comment';
                }

                if (stream.match("/*")) {
                    state.tokenizers.unshift(tokenComment());
                    return tokenize(stream, state);
                }

                var intf = state.context[0];
                var parentScope = state.context[1];
                var sname = parentScope.Service;
                var matches;

                if (intf.Service === '') {
                    if ((matches = stream.match(ID)) !== null) {
                        if (intf.Name !== '') {
                            if (state.lastToken == 'k') {
                                intf.Service = matches[0];
                                state.ec = '';
                                if (sname !== '') {
                                    if (intf.Service.toLowerCase() != sname.toLowerCase()) {
                                        state.setError(2012);
                                        return 'error ' + state.ec;
                                    }
                                }
                                else if (intf.Service.toUpperCase()[0] != intf.Service[0]) {
                                    parentScope.Service = intf.Service;
                                    return "def info-mark m-3001";
                                }
                                else {
                                    parentScope.Service = intf.Service;
                                }
                                return 'def';
                            }
                            else if (matches[0] === 'exposes') {
                                state.lastToken = 'k';
                                state.ec = '';
                                return 'keyword';
                            }
                            else {
                                state.setError(2011);
                            }
                        }
                        else {
                            intf.Name = matches[0];
                            state.ec = '';
                            state.lastToken = 'd';
                            if (intf.Name.toUpperCase()[0] != intf.Name[0]) {
                                return "def info-mark m-3001";
                            }
                            return 'def';
                        }
                    }
                    else {
                        if (intf.Name !== '') {
                            if (stream.peek() == '{') {
                                if (sname !== '') {
                                    intf.Service = sname;
                                    stream.next();
                                    state.tokenizers.shift();
                                    state.tokenizers.unshift(tokenizeInterfaceBody());
                                    return 'bracket';
                                }
                                else if (state.lastToken == 'k') {
                                    state.setError(2013);
                                }
                                else
                                {
                                    state.setError(2011);
                                }
                            }
                            else if (state.lastToken == 'k') {
                                state.setError(2013);
                            }
                            else {
                                state.setError(2010);
                            }
                        }
                        else {
                            state.setError(2010);
                        }
                    }
                }

                if ((intf.Service !== '' || sname !== '') && stream.peek() == '{') {
                    if (intf.Service === '') {
                        intf.Service = sname;
                    }
                    stream.next();
                    state.tokenizers.shift();
                    state.tokenizers.unshift(tokenizeInterfaceBody());
                    return 'bracket';
                }

                stream.skipToEnd();
                state.context.shift();
                state.tokenizers.shift();
                if (!state.inError()) {
                    state.setError(2003);
                }
                return "error" + state.ec;
            };
        }

        function tokenizeServiceBody() {
            return function _tokenizeServiceBody(stream, state) {

                if (stream.eatSpace()) {
                    return null;
                }

                if (stream.match("//")) {
                    stream.skipToEnd();
                    return 'comment';
                }

                if (stream.match("/*")) {
                    state.tokenizers.unshift(tokenComment());
                    return tokenize(stream, state);
                }

                var model = state.context[0];
                var parentScope = state.context[1];
                var matches;

                if (stream.peek() == '}') {
                    stream.next();
                    state.context.shift();
                    state.tokenizers.shift();
                    return 'bracket';
                }

                if (stream.peek() == '@') {
                    stream.next();
                    var attribute = new tidl.IdlAttr();
                    if ((matches = stream.match(ID, true)) !== null) {
                        attribute.Name = matches[0];
                        if (contains(['description', 'owner', 'organisation',
                            'namespacePrefix', 'organisationDomainName'], attribute.Name) === false) {
                            state.setWarn(1006);
                        }
                        state.context.unshift(attribute);
                        state.tokenizers.unshift(tokenizeAttribute());
                        return "attribute em" + state.ec;
                    }
                    else {
                        stream.skipToEnd();
                        state.ec = '';
                        return 'error error-mark m-2003';
                    }
                }
                if ((matches = stream.match(/^interface\s/)) !== null) {
                    var intf = new tidl.IdlIntf();
                    state.ec = '';
                    state.context.unshift(intf);
                    state.tokenizers.unshift(tokenizeInterface());
                    return "keyword";
                }

                if ((matches = stream.match(ID, false)) !== null) {
                    if (contains(['type', 'event', 'exception', 'enumeration'], matches[0])) {
                        stream.match(ID);
                        var ob = new tidl.IdlOps();
                        ob.type = matches[0];
                        ob.Return = new tidl.IdlType();
                        ob.Return.Name = matches[0];
                        state.context.unshift(ob);
                        state.tokenizers.unshift(tokenizeIobj());
                        return "keyword";
                    }
                }

                stream.skipToEnd();
                state.context.shift();
                state.tokenizers.shift();
                if (!state.inError()) {
                    state.setError(2003);
                }
                return "error" + state.ec;
            };
        }

        function tokenizeService() {
            return function _tokenizeService(stream, state) {

                if (stream.eatSpace()) {
                    return null;
                }

                if (stream.match("//")) {
                    stream.skipToEnd();
                    return 'comment';
                }

                if (stream.match("/*")) {
                    state.tokenizers.unshift(tokenComment());
                    return tokenize(stream, state);
                }

                var model = state.context[0];
                var parentScope = state.context[1];
                var matches;

                if (model.Service === '') {
                    if ((matches = stream.match(ID)) !== null) {
                        model.Service = matches[0];
                        state.ec = '';
                        if (model.Service.toUpperCase()[0] != model.Service[0]) {
                            return "def info-mark m-3001";
                        }
                        return 'def';
                    }
                }

                if (model.Service !== '' && stream.peek() == '{') {
                    stream.next();
                    state.tokenizers.shift();
                    state.tokenizers.unshift(tokenizeServiceBody());
                    return 'bracket';
                }

                stream.skipToEnd();
                state.context.shift();
                state.tokenizers.shift();
                if (!state.inError()) {
                    state.setError(2003);
                }
                return "error" + state.ec;
            };
        }

        function tokenizeAttribute() {

            return function _tokenizeAttribute(stream, state) {

                if (stream.eatSpace()) {
                    return null;
                }

                if (stream.match("//")) {
                    stream.skipToEnd();
                    return 'comment';
                }

                if (stream.match("/*")) {
                    state.tokenizers.unshift(tokenComment());
                    return tokenize(stream, state);
                }

                var attribute = state.context[0];
                var parentScope = state.context[1];
                var ch = stream.peek();

                if (ch === ';') {
                    stream.next();
                    state.context.shift();
                    state.tokenizers.shift();

                    if (state.lastToken != 'v') {
                        state.lastToken = '';
                        state.ec = '';
                        return 'error error-mark m-2003';
                    }
                    state.lastToken = '';

                    try {
                        if (!state.inError()) {
                            parentScope.Attributes.push(attribute);
                        }
                    }
                    catch (e) {
                    }
                    state.ec = '';
                    return null;
                }

                var matches;
                if (attribute.Values.length === 0) {
                    if (contains(['parameter', 'exception', 'value'], attribute.Name)) {
                        if ((matches = stream.match(ID)) !== null) {
                            attribute.Values.push(matches[0]);
                            attribute.Type = 'Parameter';
                            state.lastToken = 'v';
                            return "variable " + state.ec;
                        }
                        else if (!state.inError()) {
                            state.setError(2004);
                        }
                    }
                    else if (contains(['tidl', 'version', 'since', 'revision'], attribute.Name)) {
                        if ((matches = stream.match(/\d+\.\d+.\d+(\-[0-9a-zA-Z]+(\.[0-9a-zA-Z]+)*)?(\+[0-9a-zA-Z]+(\.[0-9a-zA-Z]+)*)?/, true)) !== null) {
                            attribute.Values.push(matches[0]);
                            attribute.Type = 'Version';
                            state.lastToken = 'v';
                            return "number " + state.ec;
                        }
                        else if (!state.inError()) {
                            state.setError(2005);
                        }
                    }
                    else if (ch != '"' && ch != "'") {
                        if (!state.inError()) {
                            state.setError(2006);
                        }
                    } else {
                        state.lastToken = 'v';
                        attribute.Values.push('');
                        state.tokenizers.unshift(tokenString(stream.next(), stream.column()));
                        return tokenize(stream, state);
                    }
                }

                if (ch == ',') {
                    stream.next();
                    if (state.lastToken != 'v') {
                        state.setError(2003);
                        state.lastToken = ',';
                        return "error" + state.ec;
                    }
                    state.lastToken = ',';
                    return null;
                }

                if (ch == '"' || ch == "'") {
                    if (state.lastToken != ',') {
                        state.setError(2003);
                    }
                    if (attribute.Name == "tidl" && state.ec === '') {
                        state.setWarn(1002);
                    }
                    attribute.Values.push('');
                    state.tokenizers.unshift(tokenString(stream.next(), stream.column()));
                    return tokenize(stream, state);
                }


                stream.next();
                //state.tokenizers.shift();
                return "error error-mark m-2003";
            };
        }

        function defaultTokenizer(stream, state) {
            var matches;

            if (stream.eatSpace()) {
                return null;
            }

            if (stream.match('//')) {
                stream.skipToEnd();
                return 'comment';
            }

            if (stream.match('/*')) {
                state.tokenizers.unshift(tokenComment());
                return tokenize(stream, state);
            }

            var model = state.context[0];

            if (stream.eat('@')) {
                var attribute = new tidl.IdlAttr();
                state.ec = '';
                if ((matches = stream.match(ID, true)) !== null) {
                    attribute.Name = matches[0];
                    if (contains(['tidl'], attribute.Name) === false) {
                        state.setWarn(1001);
                    }
                    else {
                        try {
                            if (contains(model.Attributes, function (a) { return a.Name == 'tidl'; })) {
                                state.setWarn(1004);
                            }
                        }
                        catch (e) {
                        }
                    }
                    state.context.unshift(attribute);
                    state.tokenizers.unshift(tokenizeAttribute());
                    return "attribute em" + state.ec;
                }
                else {
                    stream.skipToEnd();
                    return 'error error-mark m-2001';
                }
            }
            if ((matches = stream.match(/^service\s/)) !== null) {
                var tidlAttr = contains(model.Attributes, function (a) { return a.Name == 'tidl'; });
                if (tidlAttr === false || tidlAttr.Values[0].charAt(0) != '2') {
                    stream.skipToEnd();
                    return 'error error-mark m-1005';
                }
                state.ec = '';
                state.context.unshift(model);
                state.tokenizers.unshift(tokenizeService());
                return "keyword";
            }
            if ((matches = stream.match(/^interface\s/)) !== null) {
                var intf = new tidl.IdlIntf();
                state.ec = '';
                state.context.unshift(intf);
                state.tokenizers.unshift(tokenizeInterface());
                return "keyword";
            }
            else {
                stream.next();
                return 'error error-mark m-2002';
            }
        }

        function tokenize(stream, state) {
            return (state.tokenizers[0] || defaultTokenizer)(stream, state);
        }

        return {
            token: function _token(stream, state) {
                if (state.context.length === 0) {
                    state.context.push(state.model);
                }

                if (stream.eol()) {
                    return null;
                }
                return tokenize(stream, state);
            },
            startState: function _startState() {
                return {
                    tokenizers: [],
                    context: [],
                    lastToken: '',
                    ec: '',
                    model: (config.model === undefined ? new tidl.IdlModel() : config.model),
                    inError: function () {
                        return (this.ec.indexOf('error-mark') !== -1);
                    },
                    setError: function (errNo) {
                        this.ec = ' error-mark m-' + errNo;
                    },
                    setWarn: function (warnNo) {
                        this.ec = ' warning-mark m-' + warnNo;
                    },
                    setInfo: function (infoNo) {
                        this.ec = ' info-mark m-' + infoNo;
                    }
                };
            },
            copyState: function _copyState(state) {
                if (state === true) return state;
                var nstate = {};
                var i;
                for (var n in state) {
                    var val = state[n];
                    if (val !== undefined) {
                        if (val instanceof Array) {
                            var newval = [];
                            for (i = 0; i < val.length; ++i) {
                                var v = val[i];
                                if (v.clone && (typeof v.clone == 'function')) {
                                    newval.push(v.clone());
                                }
                                else {
                                    newval.push(v);
                                }
                            }
                            val = newval;
                        }
                        else if (val.clone && (typeof val.clone == 'function')) {
                            val = val.clone();
                        }
                    }
                    nstate[n] = val;
                }
                return nstate;
            },
            electricChars: "}",
            blockCommentStart: "/*",
            blockCommentEnd: "*/",
            fold: "brace"
        };
    }

    tidl.parseWithAnnotations = function _parseWithAnnotations(idlText, annotationText) {
        var r1 = tidl.parse(idlText);
        var r2 = null;

        if (annotationText) {
            r2 = tidl.parse(annotationText);
        }

        if (r1 !== null && r1.model !== null) {
            if (r2 !== null && r2.model !== null) {
                r1.model.updateEndpoints(r2.model);
                r1.model.updateExceptionTypes(r2.model);
            } else {
                r1.model.updateEndpoints(null);
                r1.model.updateExceptionTypes(null);
            }
        }
        return [r1, r2];
    };

    tidl.parse = function _parse(idltext, tabsize) {
        var tokenizer = _createTokenizer({}, {});
        var state = tokenizer.startState();
        var msgs = [];

        if (idltext === null || idltext === undefined) {
            return null;
        }

        var lines = sutil.splitLines(idltext);

        lines.forEach(function (val, index, array) {
            var stream = new sutil.StringStream(val, tabsize || 4);
            var token = tokenizer.token;
            var style;
            while (!stream.eol()) {
                var colstart = stream.pos;
                style = token(stream, state);
                stream.start = stream.pos;
                var colend = stream.pos;
                if (style) {
                    var iserror = (style.indexOf('error-mark') != -1),
                    iswarning = (style.indexOf('warning-mark') != -1),
                    isinfo = (style.indexOf('info-mark') != -1);
                    if (iserror || iswarning || isinfo) {
                        var ci = style.indexOf('m-');
                        var code = style.substr(ci + 2);
                        msgs.push({
                            line: index + 1,
                            col: colstart,
                            charcount: colend - colstart,
                            code: code,
                            type: (iserror ? 'error' : (iswarning ? 'warning' : 'info'))
                        });
                    }
                }
            }
        });
        if (state.context.length>0) {
            if (state.context[0] !== state.model){
                msgs.push({
                                line: lines.length,
                                col: lines[lines.length-1].length-1,
                                charcount: 1,
                                code: '2003',
                                type: 'error'
                            });
            }
        }
        state.model.updateEndpoints(null);
        state.model.updateExceptionTypes(null);
        return { model: state.model, messages: msgs };
    };
