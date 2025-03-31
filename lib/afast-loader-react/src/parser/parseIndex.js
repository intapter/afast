const { registerViews } = require("../hooks/views");

const parseIndex = (afastObject, imports, code) => {
    let router;
    if (afastObject.title) code.push(`document.title = '${afastObject.title}'`);
    if (afastObject.routes) {
        imports.add(`import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'`);
        const routes = Object.keys(afastObject.routes).map((routeName, i) => {
            const name = `_afast_import_${i}`;
            const routeObject = afastObject.routes[routeName];
            imports.add(`import ${name} from '${routeObject.src}'`);
            return `React.createElement(Route, {
                path: '${routeObject.path}',
                element: React.createElement(${name})
            })`
        });
        router = `React.createElement(Router, {}, React.createElement(Routes, {}, ${routes.join(',')}))`;
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