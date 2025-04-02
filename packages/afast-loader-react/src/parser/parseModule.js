const useEventName = require("../hooks/useEventName");
const parseControllers = require("./parseControllers");
const parseFields = require("./parseFields");
const parseImports = require("./parseImports");
const parseView = require("./parseView");

const parseModule = (afastObject, imports, code) => {

    if (!afastObject.view) throw new Error("Parse module view failed, a root `view` is required.")

    
    const fields = [];
    const props = [];
    const fieldList = []
    const innerCode = []
    const eventsList = {
        onMounted: []
    }

    parseFields(afastObject.fields, fields, fieldList, imports);
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
    if(!props.className){
        props.push("className")
    }
    if(!props.style){
        props.push("style")
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


    imports.add(`import React from 'react'`);
    const viewStr = parseView(imports, afastObject.view, afastObject, innerCode)
    code.push(
        `export default function({${props.join()}}){ ${[
            ...fields,
            ...innerCode,
            `return ${viewStr}`,
        ].join(';')}}`
    );

};

module.exports = parseModule;