const useStateFnName = require("../hooks/useStateFnName");
const parseObject = require("./parseObject");
const parseValue = require("./parseValue");

const parseFields = (fields, code, fieldList, imports) => {
    if (!fields) return;
    Object.keys(fields).forEach((key) => {
        const name = `${key}`;
        const field = fields[key];
        let value;
        switch (field.type) {
            case "string": {
                value = parseValue(field.value, imports);
                break;
            }
            case "boolean":
            case "number": {
                value = field.value;
                break;
            }
            case "object": {
                value = parseObject(field.value, imports);
                break;
            }
            case "array": {
                value = parseValue(field.value, imports);
                break;
            }
            case "ref": {
                value = "React.useRef()";
                break;
            }
            case "searchParams": {
                const setFnName = useStateFnName(name)
                imports.add(`import {useSearchParams as __AFAST_USE_REACT_SEARCH_PARAMS} from 'react-router-dom'`)
                code.push(`const [${name},${setFnName}] = __AFAST_USE_REACT_SEARCH_PARAMS()`)
                fieldList.push(`${name}:{value:${name},setter:${setFnName}}`)
                return
            }
            default:
                "";
        }
        if (field.reactive && field.type !== "ref") {
            const setFnName = useStateFnName(name)
            fieldList.push(`${name}:{value:${name},setter:${setFnName}}`)
            code.push(`const [${name},${setFnName}] = React.useState(${value})`);
        }
        else {
            fieldList.push(`${name}:{value:${name}, setter: (v) => ${name} = v}`)
            code.push(`let ${name} = ${value}`);
        }
    });
};

module.exports = parseFields;