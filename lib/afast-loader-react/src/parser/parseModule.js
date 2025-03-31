const useEventName = require("../hooks/useEventName");
const parseControllers = require("./parseControllers");
const parseFields = require("./parseFields");
const parseImports = require("./parseImports");
const parseView = require("./parseView");

const parseModule = (afastObject, imports, code) => {
    const fields = [];
    const props = [];
    const fieldList = []
    parseFields(afastObject.fields, fields, fieldList);
    if (afastObject.imports) {
        parseImports(afastObject, afastObject.imports, imports);
    }
    if (afastObject.props) {
        Object.keys(afastObject.props).forEach((key) => {
            props.push(key);
        });
    }
    if (afastObject.events) {
        Object.keys(afastObject.events).forEach((key) => {
            props.push(useEventName(key));
        });
    }

    const innerCode = []
    const eventsList = {
        onMounted: []
    }
    if (afastObject.controllers) {
        const contextName = 'AFAST_CONTEXT'
        innerCode.push(`const ${contextName} = React.useRef(null)`)
        innerCode.push(`${contextName}.current = {${fieldList.join()}}`)
        parseControllers(afastObject, imports, innerCode, contextName, eventsList);
        innerCode.push(`React.useEffect(() => {
            ${eventsList.onMounted.join(";")}
        },[])`)
    }

    if (afastObject.view) {
        imports.add(`import React from 'react'`);
        code.push(
            `export default function({${props.join()}}){ ${[
                ...fields,
                ...innerCode,
                `return ${parseView(imports, afastObject.view, afastObject)}`,
            ].join(';')}}`
        );
    }
};

module.exports = parseModule;