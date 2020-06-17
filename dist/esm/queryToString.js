export default function queryToString(query) {
    const params = Object.keys(query).reduce((params, key) => {
        const val = query[key];
        if (typeof val === 'string') {
            params.set(key, val);
            return params;
        }
        const valCopy = val.slice();
        const first = valCopy.shift();
        if (first) {
            params.set(key, first);
            valCopy.forEach((val) => params.append(key, val));
        }
        return params;
    }, new URLSearchParams());
    return params.toString();
}
//# sourceMappingURL=queryToString.js.map