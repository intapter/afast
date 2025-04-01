const { registerViews } = require("../hooks/views");
const parseImports = require("./parseImports");

const parseIndex = (afastObject, imports, code) => {
    let router;
    
    if (afastObject.imports) {
        parseImports(afastObject, afastObject.imports, imports);
    }
    if (afastObject.languages && typeof afastObject.languages === 'object'){
        imports.add(`import { registerLanguage } from 'afast-boot'`);
        const langList = Object.keys(afastObject.languages);
        if(afastObject.currentLanguage){
            imports.add(`import __AFAST_GET_CURRENT_LANGUAGE from '${afastObject.currentLanguage}'`)
            code.push(`const __AFAST_CURRENT_LANGUAGE = __AFAST_GET_CURRENT_LANGUAGE()`)
        }else{
            code.push(`const __AFAST_CURRENT_LANGUAGE = '${langList[0]}'`)
        }
        langList.forEach((name) => {
            const language = afastObject.languages[name];
            code.push(`if('${name}' === __AFAST_CURRENT_LANGUAGE) await (import(/* webpackPrefetch: true */ '${language}').then((lang) => {registerLanguage(lang.default)}))`);
        })
    }
    if (afastObject.title) code.push(`document.title = '${afastObject.title}'`);
    if (afastObject.routes) {
        imports.add(`import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'`);
        const routes = Object.keys(afastObject.routes).map((routeName, i) => {
            const name = `_afast_import_${i}`;
            const routeObject = afastObject.routes[routeName];
            imports.add(`import ${name} from '${routeObject.src}'`);
            return `React.createElement(Route, {
                key: '${name}',
                path: '${routeObject.path}',
                element: React.createElement(${name})
            })`
        });
        router = `React.createElement(Router, {}, React.createElement(Routes, {}, [${routes.join(',')}]))`;
    } else {
        router = `React.createElement('div',{},'No routes found')`;
    }
    // Memo the views map, so we can use it in the parseView function
    if (afastObject.views) registerViews(afastObject.views);
    // Create a root and render the views to it
    imports.add(`import React from'react'`);
    imports.add(`import ReactDOM from 'react-dom/client'`);
    code.push(
        `const root = ReactDOM.createRoot(document.getElementById('${afastObject.rootId || DEFAULT_ROOT_ID
        }'))`
    );
    code.push(`root.render(${router})`);
};

module.exports = parseIndex