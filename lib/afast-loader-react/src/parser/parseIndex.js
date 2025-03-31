const { registerViews } = require("../hooks/views");

const parseIndex = (afastObject, imports, code) => {
    let __name;
    if (afastObject.title) code.push(`document.title = '${afastObject.title}'`);
    if (afastObject.routes) {
        Object.keys(afastObject.routes).forEach((routeName, i) => {
            const name = `_afast_import_${i}`;
            const routeObject = afastObject.routes[routeName];
            imports.add(`import ${name} from '${routeObject.src}'`);
            __name = name;
        });
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
    code.push(`root.render(React.createElement(${__name}))`);
};

module.exports = parseIndex