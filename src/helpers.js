    function endsWith(s, v) {
        if (s === undefined || v === undefined) return false;
        if (s === null || v === null) return false;
        if (s.length < v.length) return false;
        if (s.substr(s.length - v.length, v.length) === v) return true;
        return false;
    }