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

    IdlModel.prototype.updateEndpoints = function (annoModel) {
        var idlModel = this;
        var i;
        var restendpoint = null, intf = null, intfAnno = null, opAnno = null, op = null, attribute = null;

        for (var infn in idlModel.Interfaces) {
            intf = idlModel.Interfaces[infn];
            //Verify and extract the matching interface from the annotated model
            if (annoModel) {
                intfAnno = annoModel.getInterface(intf.Name);
            }

            for (var opi in intf.Operations) {
                op = intf.Operations[opi];
                restendpoint = null;

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

                var majorVersion = intf.Version().Major === "0" ? idlModel.Version().Major : intf.Version().Major;
                restendpoint.Values.push(getPostMethods(op, intfAnno));
                restendpoint.Values.push("v" + majorVersion + "/" + intf.Name.toLowerCase() + "/" + getHttpRoute(op, intf, intfAnno));
                restendpoint.Values.push(getQueryString(op, intfAnno));
                restendpoint.Values.push(getBodyParam(op, intfAnno));

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