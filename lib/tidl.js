(function () {
"uses strict;";
var tidl={};
    function endsWith(s, v) {
        if (s === undefined || v === undefined) return false;
        if (s === null || v === null) return false;
        if (s.length < v.length) return false;
        if (s.substr(s.length - v.length, v.length) === v) return true;
        return false;
    }
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
    function fnFindInList(list, name) {
        for (i = 0; i < list.length; ++i) {
            if (list[i].Name == name) return list[i];
        }
        return null;
    }

    function fnFindInterface(interfaceList, name) {
        var intf = null;
        for (var infn in interfaceList) {
            intf = interfaceList[infn];
            if (intf.Name == name) return intf;
        }
        return null;
    }

    function fnGetAttribute(name, value0) {
        for (i = 0; i < this.Attributes.length; ++i) {
            var attr = this.Attributes[i];
            if (attr.Name == name) {
                if (value0 !== undefined) {
                    if (attr.Values[0] == value0)
                        return attr;
                } else
                    return attr;
            }
        }
        return null;
    }

    function fnGetDescription() {
        var attr = this.getAttribute('description');
        if (attr) {
            return attr.Values[0];
        }
        return null;
    }

    function fnGetVersion() {
        function Version() {
            this.Major='0';
            this.Minor='0';
            this.Build='0';
        }

        Version.prototype.toString=function(){
            return this.Major+'.'+this.Minor+'.'+this.Build;
        };

        var v=new Version();
        var attr = this.getAttribute('version');
        if (attr !== null) {
            var d = attr.Values[0].split('.');
            v.Major = d[0];
            v.Minor = d[1];
            v.Build = d[2]; 
        }
        return v;
    }

    function IdlAttr() {
        this.Name = '';
        this.Type = 'String';
        this.Values = [];
        this.toString=function() {
            var attr='@'+this.Name+' ';
            var i=0;
            if (this.Type!=='String' && this.Values.length>0){
                attr+=this.Values[0];
                i=1;
            }
            for(;i<this.Values.length;i++){
                if (i!==0) attr+=',';
                attr+=JSON.stringify(this.Values[i]);
            }
            attr+=';';
            return attr;
        };
        return this;
    }

    IdlAttr.prototype.clone = function _cloneAttribute() {
        var newattr = new IdlAttr();
        newattr.Name = this.Name;
        newattr.Type = this.Type;
        newattr.Values = this.Values.concat([]);
        return newattr;
    };

    IdlAttr.prototype.updateHeaderMappings = function (annoModelOperation) {
        var idlAttribute = this;
        var i;
        var attrib = null, headerMapping = null;
        if (annoModelOperation) {
            for (i = 0; i < annoModelOperation.Attributes.length; ++i) {
                attrib = annoModelOperation.Attributes[i];
                //Verify if there is a attribute of type parameter with the same name in the annotated model interface's operation    
                if (attrib.Type === 'Parameter' && attrib.Name === 'parameter' && attrib.Values[0] === idlAttribute.Values[0]) {
                    headerMapping = attrib.Values[1];
                    idlAttribute.Values.push('headerMapping:' + headerMapping);
                }
            }
        }
    };

    function IdlType() {
        this.Name = '';
        this.Types = [];
        this.toString=function() {
            var t = this.Name;
            if (this.Types.length>0) {
                t+='<';
                for(i=0;i<this.Types.length;++i){
                    if (i!==0) t+=',';
                    t+=this.Types[i].toString();
                }
                t+='>';
            }
            return t;
        };
        return this;
    }

    IdlType.prototype.clone = function _cloneType() {
        var newtype = new IdlType();
        newtype.Name = this.Name;
        for (var i = 0; i < this.Types.length; ++i) {
            var typ = this.Types[i];
            newtype.Types.push(typ.clone());
        }
        return newtype;
    };

    function IdlParam() {
        this.Name = '';
        this.Type = new IdlType();
        this.Modifiers = [];
        this.Mandatory = false;
        this.toString=function(){
            var p='';
            for(i=0;i<this.Modifiers.length;++i){
                p+=this.Modifiers[i]+' ';
            }
            if (this.Mandatory){
                p+='mandatory ';
            }
            p+=this.Type.toString()+' ';
            p+=this.Name;
            return p;
        };
        return this;
    }

    IdlParam.prototype.clone = function _cloneParam() {
        var newparam = new IdlParam();
        newparam.Name = this.Name;
        newparam.Type = this.Type.clone();
        newparam.Modifiers = this.Modifiers.concat([]);
        newparam.Mandatory = this.Mandatory;
        return newparam;
    };

    function IdlOps() {
        this.Name = '';
        this.Return = new IdlType();
        this.Parameters = {};
        this.Attributes = [];
        this.Exceptions = [];
        this.BaseTypes = [];
        this.IsAsync = false;
        this.type = '';
        this.toString=function(){
            var o='', i=0;
            if (this.IsAsync) o+='async ';
            if (this.type=='operation'){
                o+=this.Return.toString()+' ';
            }
            else{
                o+=this.type+' ';
            }

            o+=this.Name+'(';

            for (var pn in this.Parameters) {
                if (i!==0) o+=',';
                o+=this.Parameters[pn].toString();
                i++;
            }
            o+=')';
            if (this.Exceptions.length>0) {
                o+=' throws ';
                for(i=0;i<this.Exceptions.length;++i){
                    if (i!==0) o+=',';
                    o+=this.Exceptions[i];
                }
            }
            else if (this.BaseTypes.length>0) {
                o+=' extends ';
                for(i=0;i<this.BaseTypes.length;++i){
                    if (i!==0) o+=',';
                    o+=this.BaseTypes[i];
                }
            }
            o+='\n{\n';
            this.Attributes.forEach(function(attr){
                o+='\t'+attr.toString()+'\n';
            });
            o+='}';
            return o;
        };
        return this;
    }

    IdlOps.prototype.getAttribute = fnGetAttribute;

    IdlOps.prototype.getDescription = fnGetDescription;

    IdlOps.prototype.clone = function _cloneOps() {
        var i;
        var newops = new IdlOps();
        newops.Name = this.Name;
        newops.Return = this.Return.clone();
        for (var pn in this.Parameters) {
            var prm = this.Parameters[pn];
            newops.Parameters[prm.Name] = prm.clone();
        }
        for (i = 0; i < this.Attributes.length; ++i) {
            var attr = this.Attributes[i];
            newops.Attributes.push(attr.clone());
        }
        newops.Exceptions = this.Exceptions.concat([]);
        newops.BaseTypes = this.BaseTypes.concat([]);
        newops.IsAsync = this.IsAsync;
        newops.type = this.type;
        return newops;
    };

    function IdlIntf() {
        this.Name = '';
        this.Service = '';
        this.Attributes = [];
        this.Operations = [];
        this.Types = [];
        this.Enumerations = [];
        this.Exceptions = [];
        this.Events = [];

        this.getAttribute = fnGetAttribute;
        this.getDescription = fnGetDescription;
        this.Version = fnGetVersion;
        this.getOperation = function(name) {
            return fnFindInList(this.Operations, name);
        };
        this.getType = function(name) {
            return fnFindInList(this.Types, name);
        };
        this.getEnumeration = function(name) {
            return fnFindInList(this.Enumerations, name);
        };
        this.getEvent = function(name) {
            return fnFindInList(this.Events, name);
        };
        this.getException = function(name) {
            return fnFindInList(this.Exceptions, name);
        };
        this.toString = function(){
            var r='interface ';
            r+=this.Name;
            r+=' exposes '+this.Service;
            r+=' {\n';
            this.Attributes.forEach(function(attr){
                r+='\t'+attr.toString()+'\n';
            });
            this.Operations.forEach(function(op){
                r+='\t'+op.toString().replace(/\n/g,'\n\t')+'\n';
            });
            this.Types.forEach(function(op){
                r+='\t'+op.toString().replace(/\n/g,'\n\t')+'\n';
            });
            this.Enumerations.forEach(function(op){
                r+='\t'+op.toString().replace(/\n/g,'\n\t')+'\n';
            });
            this.Exceptions.forEach(function(op){
                r+='\t'+op.toString().replace(/\n/g,'\n\t')+'\n';
            });
            this.Events.forEach(function(op){
                r+='\t'+op.toString().replace(/\n/g,'\n\t')+'\n';
            });

            r+='}';
            return r;
        };
        return this;
    }

    IdlIntf.prototype.clone = function _cloneInterface() {
        var i;
        var newintf = new IdlIntf();
        newintf.Name = this.Name;
        newintf.Service = this.Service;
        for (i = 0; i < this.Attributes.length; ++i) {
            var attr = this.Attributes[i];
            newintf.Attributes.push(attr.clone());
        }
        for (i = 0; i < this.Operations.length; ++i) {
            var op = this.Operations[i];
            newintf.Operations.push(op.clone());
        }
        for (i = 0; i < this.Types.length; ++i) {
            var typ = this.Types[i];
            newintf.Types.push(typ.clone());
        }
        for (i = 0; i < this.Enumerations.length; ++i) {
            var enm = this.Enumerations[i];
            newintf.Enumerations.push(enm.clone());
        }
        for (i = 0; i < this.Exceptions.length; ++i) {
            var ex = this.Exceptions[i];
            newintf.Exceptions.push(ex.clone());
        }
        for (i = 0; i < this.Events.length; ++i) {
            var evt = this.Events[i];
            newintf.Events.push(evt.clone());
        }
        return newintf;
    };

    function IdlModel() {
        this.Service = '';
        this.Attributes = [];
        this.Types = [];
        this.Enumerations = [];
        this.Exceptions = [];
        this.Events = [];
        this.Interfaces = {};

        this.getAttribute = fnGetAttribute;
        this.getDescription = fnGetDescription;
        this.Version = fnGetVersion;

        this.getType = function(name) {
            return fnFindInList(this.Types, name);
        };
        this.getEnumeration = function(name) {
            return fnFindInList(this.Enumerations, name);
        };
        this.getEvent = function(name) {
            return fnFindInList(this.Events, name);
        };
        this.getException = function(name) {
            return fnFindInList(this.Exceptions, name);
        };
        this.getInterface = function (name) {
            return fnFindInterface(this.Interfaces, name);
	};

        this.toString=function(){
            var m='', end='', tabs='';
            var attr=this.getAttribute('tidl');

            if (attr!==null){
                if (attr.Values[0][0]!='1'){
                    m+=attr.toString()+'\n';
                    m+='service '+this.Service+' {\n';
                    end='}';
                    tabs='\t';
                }
                else{
                    m+=attr.toString()+'\n';
                }
            }

            this.Attributes.forEach(function(attr){
                if (attr.Name!=='tidl'){
                    m+=tabs+attr.toString()+'\n';
                }
            });

            this.Types.forEach(function(op){
                m+=tabs+op.toString().replace(/\n/g,'\n'+tabs)+'\n';
            });

            this.Enumerations.forEach(function(op){
                m+=tabs+op.toString().replace(/\n/g,'\n'+tabs)+'\n';
            });

            this.Exceptions.forEach(function(op){
                m+=tabs+op.toString().replace(/\n/g,'\n'+tabs)+'\n';
            });

            this.Events.forEach(function(op){
                m+=tabs+op.toString().replace(/\n/g,'\n'+tabs)+'\n';
            });

            for (var inf in this.Interfaces) {
                var intf = this.Interfaces[inf];
                m+=tabs+intf.toString().replace(/\n/g,'\n'+tabs)+'\n';
            }

            m+=end;

            return m;
        };
        return this;
    }

    IdlModel.prototype.clone = function _cloneModel() {
        var i;
        var newmodel = new IdlModel();
        newmodel.Service = this.Service;

        for (i = 0; i < this.Attributes.length; ++i) {
            var newattr = this.Attributes[i].clone();
            newmodel.Attributes.push(newattr);
        }
        for (i = 0; i < this.Types.length; ++i) {
            var typ = this.Types[i];
            newmodel.Types.push(typ.clone());
        }
        for (i = 0; i < this.Enumerations.length; ++i) {
            var enm = this.Enumerations[i];
            newmodel.Enumerations.push(enm.clone());
        }
        for (i = 0; i < this.Exceptions.length; ++i) {
            var ex = this.Exceptions[i];
            newmodel.Exceptions.push(ex.clone());
        }
        for (i = 0; i < this.Events.length; ++i) {
            var evt = this.Events[i];
            newmodel.Events.push(evt.clone());
        }
        for (var inf in this.Interfaces) {
            var newintf = this.Interfaces[inf].clone();
            newmodel.Interfaces[inf] = newintf;
        }
        return newmodel;
    };

    var HttpVerbsMapping = [
        ["calculate", "GET", "", ""],
        ["getFrom", "GET", "", ""],
        ["getby", "GET", "", ""],
        ["get", "GET", "", ""],
        ["searchby", "GET", "", "search"],
        ["search", "GET", "search", ""],
        ["history", "GET", "", "history"],
        ["retrieve", "POST", "", "retrieve"],
        ["deleteFrom", "DELETE", "", ""],
        ["delete", "DELETE", "", ""],
        ["update", "PUT", "", ""],
        ["revoke", "PUT", "", "revoke"],
        ["rename", "PUT", "", "rename"],
        ["extend", "PUT", "", "extend"],
        ["unlockAccountBy", "PUT", "unlockaccount", ""],
        ["validate", "GET", "validate", ""],
        ["createOrUpdate", "POST", "", ""],
        ["create", "POST", "", ""],
        ["open", "POST", "", ""],
        ["issue", "POST", "issue", ""],
        ["reserve", "POST", "", "reserve"],
        ["confirm", "POST", "", "confirm"],
        ["unreserve", "POST", "", "unreserve"],
        ["redeem", "POST", "", "redeem"],
        ["restore", "POST", "", "restore"],
        ["activate", "POST", "", "activate"],
        ["deactivate", "POST", "", "deactivate"],
        ["approve", "POST", "", "approve"],
        ["reject", "POST", "", "reject"],
        ["add", "POST", "", ""],
        ["propose", "POST", "", ""],
        ["adjust", "POST", "adjust", ""],
        ["move", "POST", "move", ""],
        ["render", "POST", "", "render"],
        ["register", "POST", "", ""],
        ["reject", "DELETE", "", ""],
        ["remove", "DELETE", "", ""],
        ["cancel", "DELETE", "", ""],
        ["close", "DELETE", "", ""]
    ];

    function formatRoute(route) {
        //Clean the route structure before returning it
        route = route.replace("//", "/");
        route = route[0] == "/" ? route.substr(1) : route;
        return endsWith(route, "/") ? route.substr(0, route.length - 1) : route;
    }

    var AnnotationAttribute_UrlRouteTemplate = "urlTemplate";
    var AnnotationAttribute_HttpMethod = "method";
    var AnnotationAttribute_BodyParameterName = "bodyParam";
    var AnnotationAttribute_HttpStatus = "statusCode";
    var AnnotationAttribute_ParameterHeaderMapping = "parameter";
    var FromBody_Suffix = "FromBody";

    function readOperationAttributeFromAnnontationFile(op, intfAnno, attributeQualifier, attributeName) {
        var value = '';
        if (intfAnno === null || intfAnno === undefined) return value;

        if (intfAnno.Operations !== null && intfAnno.Operations.length > 0) {
            var aop = null;
            for (var opi in intfAnno.Operations) {
                aop = intfAnno.Operations[opi];
                if (aop.Name == op.Name) {
                    break;
                }
                aop = null;
            }
            if (aop === null) {
                return value;
            }
            //Check if the current operation has an custom attribute value specified in the annontated file
            var urlAttrib = aop.getAttribute(AnnotationAttribute_UrlRouteTemplate);
            if ((attributeQualifier == AnnotationAttribute_UrlRouteTemplate) && urlAttrib !== null) {
                return urlAttrib.Values[0];
            }

            var methodAttrib = aop.getAttribute(AnnotationAttribute_HttpMethod);
            if ((attributeQualifier == AnnotationAttribute_HttpMethod) && methodAttrib !== null) {
                return methodAttrib.Values[0];
            }

            var bodyAttrib = aop.getAttribute(AnnotationAttribute_BodyParameterName);
            if ((attributeQualifier == AnnotationAttribute_BodyParameterName) && bodyAttrib !== null) {
                return bodyAttrib.Values[0];
            }

            var paramHeaderMappingAttrib = aop.getAttribute(AnnotationAttribute_ParameterHeaderMapping, attributeName);
            if ((attributeQualifier == AnnotationAttribute_ParameterHeaderMapping) && paramHeaderMappingAttrib !== null) {
                return paramHeaderMappingAttrib.Values[0];
            }
        }

        return value;
    }

    function getPostMethods(op, intfAnno) {
        //Check if method override exists in annotation file
        var method = readOperationAttributeFromAnnontationFile(op, intfAnno, AnnotationAttribute_HttpMethod);
        var bodyParam = readOperationAttributeFromAnnontationFile(op, intfAnno, AnnotationAttribute_BodyParameterName);

        var i = 0;
        var h = null;
        if (method === null || method === '') {
            for (i = 0; i < HttpVerbsMapping.length; ++i) {
                var o = HttpVerbsMapping[i];
                if (op.Name.toLowerCase().indexOf(o[0].toLowerCase()) === 0) {
                    h = o;
                    break;
                }
            }
            method = (h !== null) ? h[1] : "GET";
        }

        if (method == "GET" || method == "DELETE") {
            if (bodyParam && bodyParam !== '') {
                method = 'POST';
            }
            for (var p in op.Parameters) {
                if (endsWith(p, FromBody_Suffix)) {
                    method = "POST";
                }
            }
        }
        return method;
    }

    function getParam(p) {
        return (endsWith(p.Name, FromBody_Suffix) ? p.Name.substr(0, p.Name.length - 8) : p.Name);
    }

    function excludeParameterFromQuerystring(p, route, bodyParam, headerMapping) {
        //Parameters passed via HTTP method body are excluded from querystring
        if ((bodyParam === null || bodyParam === undefined || bodyParam === '') && endsWith(p.Name, FromBody_Suffix)) return true;
        if (!(bodyParam === null || bodyParam === undefined || bodyParam === '') && p.Name == bodyParam) return true;

        //If the parameter is mapped to a Http header in annotation file, then its excluded
        if (headerMapping !== null && headerMapping !== '') { return true; }

        if ((route === null || route === undefined || route === '')) {
            //Mandatory parameters except of type set or list, are excluded from querystring (since they are part of route)
            if (p.Mandatory && !((p.Type.Name.indexOf("set") === 0) || (p.Type.Name.indexOf("list") === 0))) {
                return true;
            }
        } else {
            //If the route is provided via annonation file, then route parameters are excluded from querystring
            if (route.indexOf('{' + p.Name + '}') > 0) {
                return true;
            }
        }

        return false;
    }

    function getBodyParam(op, intfAnno) {
        var route = readOperationAttributeFromAnnontationFile(op, intfAnno, AnnotationAttribute_UrlRouteTemplate);
        var bodyParam = readOperationAttributeFromAnnontationFile(op, intfAnno, AnnotationAttribute_BodyParameterName);

        if (!(bodyParam === null || bodyParam === undefined || bodyParam === '')) return bodyParam;

        for (var pn in op.Parameters) {
            var p = op.Parameters[pn];
            if ((bodyParam === null || bodyParam === undefined || bodyParam === '') && endsWith(p.Name, FromBody_Suffix)) return pn;
        }
        return '';
    }

    function getQueryString(op, intfAnno) {
        //Check if method override exists in annotation file
        var route = readOperationAttributeFromAnnontationFile(op, intfAnno, AnnotationAttribute_UrlRouteTemplate);
        var bodyParam = readOperationAttributeFromAnnontationFile(op, intfAnno, AnnotationAttribute_BodyParameterName);
        var parameterHeaderMapping = '';
        var isf = true;
        var sb = '';
        for (var pn in op.Parameters) {
            var p = op.Parameters[pn];
            parameterHeaderMapping = readOperationAttributeFromAnnontationFile(op, intfAnno, AnnotationAttribute_ParameterHeaderMapping, p.Name);
            if (excludeParameterFromQuerystring(p, route, bodyParam, parameterHeaderMapping)) continue;

            if (isf) {
                sb += "?";
                isf = false;
            } else {
                sb += "&";
            }
            sb += (getParam(p) + "={" + getParam(p) + "...}");
        }
        return sb;
    }


    function getHttpRoute(op, intf, intfAnno) {
        var route = readOperationAttributeFromAnnontationFile(op, intfAnno, AnnotationAttribute_UrlRouteTemplate);
        if (route && route !== '') {
            return formatRoute(route);
        }

        var i = 0;
        var h = null;
        for (i = 0; i < HttpVerbsMapping.length; ++i) {
            var o = HttpVerbsMapping[i];
            if (op.Name.toLowerCase().indexOf(o[0].toLowerCase()) === 0) {
                h = o;
                break;
            }
        }
        route = (h !== null) ? h[2] : "";
        var opn = op.Name;
        if (endsWith(op.Name, "Feed")) {
            route += "feed";
            opn = opn.substr(0, opn.length - 4);
        }
        if (endsWith(op.Name.toLowerCase(), intf.Name.toLowerCase())) {
            opn = opn.substr(0, opn.length - intf.Name.length);
        }
        var roppart = "";

        if (h !== null && (h[0].length != opn.length)) {
            roppart = "/" + opn.substr(h[0].length).toLowerCase();
        }

        var qp = "";
        var isf = true;
        var s = '';
        for (var pn in op.Parameters) {
            var p = op.Parameters[pn];
            if (p.Mandatory && !endsWith(p.Name, FromBody_Suffix) && (p.Type.Name != "set") && (p.Type.Name != "list")) {
                if (endsWith(roppart.toLowerCase(), "by" + p.Name.toLowerCase()) || endsWith(roppart.toLowerCase(), "to" + p.Name.toLowerCase())) {
                    s = "/{" + p.Name.toLowerCase() + "}" + roppart.substr(0, roppart.length - (p.Name.length + 2));
                    roppart = s;
                } else if (endsWith(roppart.toLowerCase(), "from" + p.Name.toLowerCase())) {
                    s = "/{" + p.Name.toLowerCase() + "}" + roppart.substr(0, roppart.length - (p.Name.length + 4));
                    roppart = s;
                } else if (endsWith(roppart.toLowerCase(), p.Name.toLowerCase())) {
                    roppart = "/{" + p.Name.toLowerCase() + "}";
                } else {
                    qp += "/{" + p.Name.toLowerCase() + "}";
                }
            }
        }
        route += roppart;
        if (h !== null && !(h[3] === null || h[3] === '')) {
            route += "/" + h[3];
        } else if (h !== null && (h[3] === null || h[3] === '') && h[1].toLowerCase() != getPostMethods(op, intfAnno).toLowerCase()) {
            route += "/" + h[0];
        } else if (h === null && endsWith(opn.toLowerCase(), intf.Name.toLowerCase())) {
            route += "/" + opn.toLowerCase().substr(0, opn.length - intf.Name.length);
        }

        route += qp;
        return formatRoute(route);
    }

    function getHttpErrorCodeForException(exceptionType, annoModel) {

        var httpErrorStatus = '500';
        var ex, e, errorStatusAttrib;
        if (annoModel === null || annoModel === undefined)
            return httpErrorStatus;

        //Try to match the exception in common exceptions from annotated model
        for (ex in annoModel.Exceptions) {
            e = annoModel.Exceptions[ex];
            if (e.Name === exceptionType.Name) {
                errorStatusAttrib = e.getAttribute(AnnotationAttribute_HttpStatus);
                if (errorStatusAttrib !== null && errorStatusAttrib !== undefined && errorStatusAttrib.Values.length > 0)
                    return errorStatusAttrib.Values[0].trim();
            }
        }

        //Try to match the exception in interface exceptions from annotated model
        for (var intfAnnoN in annoModel.Interfaces) {
            intfAnno = annoModel.Interfaces[intfAnnoN];
            //Check if the current exception has a custom http error code value specified in the annontated file
            for (ex in intfAnno.Exceptions) {
                e = intfAnno.Exceptions[ex];
                if (e.Name === exceptionType.Name) {
                    errorStatusAttrib = e.getAttribute(AnnotationAttribute_HttpStatus);
                    if (errorStatusAttrib !== null && errorStatusAttrib !== undefined && errorStatusAttrib.Values.length > 0)
                        return errorStatusAttrib.Values[0].trim();
                }
            }
        }

        return httpErrorStatus.trim();

    }

    IdlModel.prototype.updateEndpoints = function(annoModel) {
        var idlModel = this;
        var i;
        var majorVersion, restendpoint = null, intf = null, intfAnno = null, opAnno = null, op = null, attribute = null;
        for (var infn in idlModel.Interfaces) {
            intf = idlModel.Interfaces[infn];
            majorVersion = intf.Version().Major === 0 ? idlModel.Version().Major : intf.Version().Major;
            if (annoModel) {
                try {
                    intfAnno = annoModel.Interfaces[infn];
                } catch (e) {
                    intfAnno = null;
                }
            } else {
                intfAnno = null;
            }
            for (var opi in intf.Operations) {
                op = intf.Operations[opi];
                restendpoint = null;
                if (op.Name[0]==='_') continue;

                //Verify and extract the matching operation from the annotated model interface
                if (intfAnno) {
                    opAnno = intfAnno.getOperation(op.Name);
                }

                for (i = 0; i < op.Attributes.length; ++i) {
                    attribute = op.Attributes[i];
                    attribute.updateHeaderMappings(opAnno);
                    if (attribute.Name === 'restendpoint') {
                        restendpoint = attribute;
                    }
                }
                if (restendpoint === null) {
                    restendpoint = new IdlAttr();
                    restendpoint.Name = "restendpoint";
                    //,Type = IdlAttr.IdlAttrType.String

                    op.Attributes.push(restendpoint);
                } else {
                    restendpoint.Values = [];
                }

                restendpoint.Values.push(getPostMethods(op, intfAnno));
                restendpoint.Values.push("v" + majorVersion + "/" + intf.Name.toLowerCase() + "/" + getHttpRoute(op, intf, intfAnno));
                restendpoint.Values.push(getQueryString(op, intfAnno));
                restendpoint.Values.push(getBodyParam(op, intfAnno));

            }

            //add _status operation
            /**/
            if (intf.getOperation('_status')===null){
                op=new IdlOps();
                op.Name = "_status";
                
                op.Return = new IdlType();
                op.Return.Name = '_APIStatus';
                //op.Parameters = {};
                op.Attributes = [];
                restendpoint = new IdlAttr();
                restendpoint.Name = "restendpoint";
                restendpoint.Values.push('GET');
                restendpoint.Values.push("v" + majorVersion + "/" + intf.Name.toLowerCase() + "/_status/" );
                restendpoint.Values.push('');
                restendpoint.Values.push('');
                op.Attributes.push(restendpoint);
                //op.Exceptions = [];
                //op.BaseTypes = [];
                //op.IsAsync = false;
                op.type = 'operation';
                intf.Operations.push(op);
            }

            if (intf.getType('_APIStatus')===null){
                op = new IdlOps();
                op.Name = "_APIStatus";
                op.Return.Name='type';
                op.type = 'type';
                op.Parameters.status=new IdlType();
                op.Parameters.status.Name='status';
                op.Parameters.status.Type=new IdlType();
                op.Parameters.status.Type.Name='string';
                op.Parameters.status.Modifiers=['mandatory'];
                op.Parameters.status.Mandatory=true;
                op.Attributes = [];
                var pattr=new IdlAttr();
                pattr.Name='parameter';
                pattr.Type='parameter';
                pattr.Values=[].concat(['status','status of the API','ok']);
                op.Attributes.push(pattr);
                intf.Types.push(op);
            }

             if (intf.getOperation('_interface')===null){
                op=new IdlOps();
                op.Name = "_interface";
                
                op.Return = new IdlType();
                op.Return.Name = 'IdlIntf';
                //op.Parameters = {};
                op.Attributes = [];
                restendpoint = new IdlAttr();
                restendpoint.Name = "restendpoint";
                restendpoint.Values.push('GET');
                restendpoint.Values.push("v" + majorVersion + "/" + intf.Name.toLowerCase() + "/_interface/" );
                restendpoint.Values.push('');
                restendpoint.Values.push('');
                op.Attributes.push(restendpoint);
                //op.Exceptions = [];
                //op.BaseTypes = [];
                //op.IsAsync = false;
                op.type = 'operation';
                intf.Operations.push(op);
            }

        }
    };

    IdlModel.prototype.updateExceptionTypes = function(annoModel) {
        var idlModel = this;
        var i, exi, ex;


        //Update common exception types in model
        for (exi in idlModel.Exceptions) {
            ex = idlModel.Exceptions[exi];
            var restHttpStatusCommon = null;
            for (i = 0; i < ex.Attributes.length; ++i) {
                if (ex.Attributes[i].Name == 'resthttpstatus') {
                    restHttpStatusCommon = ex.Attributes[i];
                    break;
                }
            }
            if (restHttpStatusCommon === null) {
                restHttpStatusCommon = new IdlAttr();
                restHttpStatusCommon.Name = "resthttpstatus";
                //,Type = IdlAttr.IdlAttrType.String

                ex.Attributes.push(restHttpStatusCommon);
            } else {
                restHttpStatusCommon.Values = [];
            }
            restHttpStatusCommon.Values.push(getHttpErrorCodeForException(ex, annoModel));
        }

        //Update exception types in model interfaces
        for (var infn in idlModel.Interfaces) {
            var intf = idlModel.Interfaces[infn];

            for (exi in intf.Exceptions) {
                ex = intf.Exceptions[exi];
                var restHttpStatus = null;
                for (i = 0; i < ex.Attributes.length; ++i) {
                    if (ex.Attributes[i].Name == 'resthttpstatus') {
                        restHttpStatus = ex.Attributes[i];
                        break;
                    }
                }
                if (restHttpStatus === null) {
                    restHttpStatus = new IdlAttr();
                    restHttpStatus.Name = "resthttpstatus";
                    //,Type = IdlAttr.IdlAttrType.String

                    ex.Attributes.push(restHttpStatus);
                } else {
                    restHttpStatus.Values = [];
                }
                restHttpStatus.Values.push(getHttpErrorCodeForException(ex, annoModel));
            }
        }
    };


    tidl.IdlModel = IdlModel;
    tidl.IdlAttr = IdlAttr;
    tidl.IdlIntf = IdlIntf;
    tidl.IdlOps = IdlOps;
    tidl.IdlType = IdlType;
    tidl.IdlParam = IdlParam;

    tidl.Messages = {
        '1000': 'Unknown error',
        '1001': "Unsupported attribute: Expecting 'tidl' attribute.",
        '1002': "Unused value: Will be ignored.",
        '1003': "Unsupported attribute: Expecting one of 'description', 'owner', 'version', 'revision', 'author', 'reviewer', 'organisation', 'namespacePrefix', 'organisationDomainName'.",
        '1004': "Duplicate: Will be ignored.",
        '1005': "Unsupported in tidl 1.x.x files, please change the tidl version to 2.0.0;",
        '1006': "Unsupported attribute: Expecting one of 'description', 'owner', 'organisation', 'namespacePrefix', 'organisationDomainName'.",
        '1007': "Unsupported attribute: Expecting one of 'description', 'parameter', 'since','revision', 'exception', 'return','value','seealso'.",

        '2001': "Unexpected character: Expecting an attribute type like description, parameter etc,.",
        '2002': "Unexpected character: Expecting an attribute or a interface definition.",
        '2003': "Unexpected character: Bad syntax.",
        '2004': "Unexpected character: Expecting an ID as the first value for the attributes 'parameter', 'exception' or 'value'.",
        '2005': "Unexpected character: Expecting an n.n.n version as the first value for the attributes 'tidl', 'version', 'since' or 'revision'.",
        '2006': "Unexpected character: Expecting a string as the first value for the attribute.",
        '2007': "Duplicate: there can only be one instance per scope.",
        '2008': "Unrecognized reserved parameter: Only reserved parameter names can begin with underscore.",
        '2009': "",
        '2010': "Unexpected character: Expected a valid interface name.",
        '2011': "Unexpected character: Expected 'exposes' keyword.",
        '2012': "Mismatched Service. The Service Name in Service decleration and interface do not match.",
        '2013': "Unexpected character. Expecting a valid service name.",

        '3001': "Standards: Suggested to start with a capital letter."
    };

    function _createTokenizer(config, parserConfig) {
        var ID = /^[a-zA-Z_][a-zA-Z0-9_]*/;
        var builtintypes = ["boolean", "byte", "short", "int", "long", "float", "double", "decimal", "string", "datetime", "list", "set", "map"];
        var reservedParams = ["_region", "_language", "_business", "_channel", "_accept", "_userId", "_appKey"];
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
                }
                return token + state.ec;
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
                        param.Name = matches[0];
                        if (param.Name.charAt(0)==="_" && !contains(reservedParams, param.Name)) {
                            stream.next();
                            return "error error-mark m-2008";
                        }
                        stream.match(ID);
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
                            'revision', 'version', 'exception', 'return', 'value', 'seealso'], attribute.Name) === false) {
                            state.setWarn(1007);
                        }
                        if (contains(['description', 'since','method','urlTemplate','bodyParam',
                            'return', 'version'], attribute.Name)) {
                            try {
                                if (contains(obj.Attributes, function (a) { return a.Name == attribute.Name; })) {
                                    state.setError(2007);
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
                        if (contains(['description', 'version','organisation',
                            'namespacePrefix','organisationDomainName'], attribute.Name)) {
                            try {
                                if (contains(intf.Attributes, function (a) { return a.Name == attribute.Name; })) {
                                    state.setError(2007);
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
                        if (contains(['description', 'organisation','organisationDomainName',
                            'namespacePrefix'], attribute.Name)) {
                            try {
                                if (contains(model.Attributes, function (a) { return a.Name == attribute.Name; })) {
                                    state.setError(2007);
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
                        //if ((matches = stream.match(/\d+\.\d+.\d+(\-[0-9a-zA-Z]+(\.[0-9a-zA-Z]+)*)?(\+[0-9a-zA-Z]+(\.[0-9a-zA-Z]+)*)?/, true)) !== null) {
                        if ((matches = stream.match(/(\d+\.\d+\.\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?/, true)) !== null) {
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
                    if (contains(['tidl', 'description'], attribute.Name) && state.ec === '') {
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
var root = this, previous_tidl = root.tidl;
if (typeof module !== 'undefined' && module.exports) {
module.exports = tidl;
}
else {
root.tidl = tidl;
}

tidl.noConflict = function () {
root.tidl = previous_tidl;
return tidl;
};
})(this);