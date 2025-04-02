const parseLanguage = require('./parseLanguage')
const parseValue = (value, imports) => {
    
    imports.add(`import {useLanguage} from 'afast-boot'`)
    if (typeof value === "string") {
        if(/\{\{.*\}\}/.test(value)) return value.substring(2,value.length-2)
        if(/\[\[.*\]\]/.test(value))
            return parseLanguage(value.substring(2,value.length-2), imports);
        return "`" + value.replace(/`/g, "\\`") + "`";
    }
    if (Array.isArray(value))
        return `[${value
            .map((item) => {
                return parseValue(item, imports);
            })
            .join()}]`;
    if (value instanceof Object) {
        return `{${Object.keys(value)
            .map((key) => {
                return `${key}:${parseValue(value[key], imports)}`;
            })
            .join()}}`;
    }
    return value;
};

module.exports = parseValue;