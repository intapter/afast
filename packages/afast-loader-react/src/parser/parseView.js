const parseObject = require("./parseObject.js");
const { HTML_ELE_TAGS } = require("../constant/html.js");
const { getViews } = require("../hooks/views.js");
const { DEFAULT_FOR_KEY_NAME, DEFAULT_FOR_ITEM_NAME } = require("../constant/command-for.js");
const parseViewImport = require("./parseViewImport.js");
const parseViewEvents = require("./parseViewEvents.js");
const parseValue = require("./parseValue.js");



const parseView = (imports, view, afastObject, innerCode, depth = 0) => {
    const viewsImportMemo = new Map()
    const views = getViews()
    if (!views)
        throw new Error(
            "Not allowed to use a component because you did not set the `views` property in the index file"
        );
    let tag;
    // Parse name of view
    if (HTML_ELE_TAGS.has(view.name)) {
        // This view is a normal HTML element
        tag = `'${view.name}'`;
    } else {
        // This view is a custom component
        tag = parseViewImport(views, imports, view.name, viewsImportMemo)
    }
    // Parse children of view
    const children = [];
    if (view.children) {
        view.children.forEach((child) => {
            children.push(parseView(imports, child, afastObject, innerCode, depth + 1));
        });
    }
    // Parse events of view
    const noParseKeys = ["ref"];
    if (view.events) {
        parseViewEvents(afastObject, view, noParseKeys, imports, innerCode);
    }


    if (!view.props) {
        view.props = {}
    }

    // Parse ref of view
    if (view.props.ref) delete view.props.ref
    if (view.ref) {
        view.props.ref = view.ref;
    }

    // Auto add className and style
    if (depth === 0) {
        imports.add(`import classNames from 'classnames'`)
        if (!view.props.className){
            view.props.className = '{{className}}'
        }else{
            view.props.className = `{{classNames(${parseValue(view.props.className, imports)}, className)}}`
        }
        if (!view.props.style) view.props.style = '{{style}}'
    }

    const generateElementCode = () => {
        return `React.createElement(${tag}, ${parseObject(
            view.props,
            noParseKeys
        )}, ${children && children.length > 0
            ? children.join()
            : view.text
                ? `${parseValue(view.text, imports)}`
                : null
            })`;
    };

    // Parse `for` of view
    const generateForNormal = () => {
        if (view.for && typeof view === "object") {
            if (!view.for.array)
                throw new Error(
                    "Field `array` is required when you set a for-command for this view"
                );
            // TODO check weather the field is exist
            return `${view.for.array}.map((${view.for.item || DEFAULT_FOR_ITEM_NAME
                },${view.for.key || DEFAULT_FOR_KEY_NAME}) => ${generateElementCode()})`;
        }
        // Or return a normal view
        else {
            return generateElementCode();
        }
    };

    // Parse `if` of view
    if (view.if) {
        return `${view.if} ? ${generateForNormal()} : null`;
    } else {
        return generateForNormal();
    }
};

module.exports = parseView