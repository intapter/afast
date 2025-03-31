const parseValue = (value) => {
    if (typeof value === "string") {
        if(/\{\{.*\}\}/.test(value)) return value.substring(2,value.length-2)
        return "`" + value.replace(/`/g, "\\`") + "`";
    }
    if (Array.isArray(value))
        return `[${value
            .map((item) => {
                return parseValue(item);
            })
            .join()}]`;
    if (value instanceof Object) {
        return `{${Object.keys(value)
            .map((key) => {
                return `${key}:${parseValue(value[key])}`;
            })
            .join()}}`;
    }
    return value;
};

module.exports = parseValue;