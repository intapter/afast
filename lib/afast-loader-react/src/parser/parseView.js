const useEventName = require("../hooks/useEventName.js");
const parseObject = require("./parseObject.js");
const parseValue = require("./parseValue.js");
const { HTML_ELE_TAGS } = require("../constant/html.js");
const useStateFnName = require("../hooks/useStateFnName.js");
const { getViews } = require("../hooks/views.js");
const { DEFAULT_FOR_KEY_NAME, DEFAULT_FOR_ITEM_NAME } = require("../constant/command-for.js");


const parseView = (imports, view, afastObject) => {
    const views = getViews()
    let tag;
    // Parse name of view
    if (HTML_ELE_TAGS.has(view.name)) {
        // This view is a normal HTML element
        tag = `'${view.name}'`; 
    } else {
        // This view is a custom component
        let importTag
        let moduleSrc
        const viewConfig = views[view.name];
        if(typeof viewConfig === 'string') {
            moduleSrc = viewConfig;
            tag = `_afast_import_view_${view.name}`;
            importTag = tag
        }else if(typeof viewConfig === 'object' && viewConfig.name && viewConfig.src){
            moduleSrc = viewConfig.src;
            tag = `_afast_import_view_${view.name}`;
            importTag = `{${viewConfig.name} as ${tag}}`
        }else{
            throw new Error(`Cannot resolve view \`${view.name}\`, check your config at index view`)
        }
        if (!views)
            throw new Error(
                "Not allowed to use a component because you did not set the `views` property in the index file"
            );
        if (!moduleSrc)
            throw new Error(
                "Cannot find a component named `" +
                view.name +
                "`, did you forget to add it to the `views` property in the index file?"
            );
        imports.add(`import ${importTag} from '${moduleSrc}'`);
    }
    // Parse children of view
    const children = [];
    if (view.children) {
        view.children.forEach((child) => {
            children.push(parseView(imports, child, afastObject));
        });
    }
    // Parse events of view
    const noParseKeys = ["ref"];
    if (view.events) {
        if (!view.props) view.props = {};
        Object.keys(view.events).forEach((key) => {
            noParseKeys.push(key);
            const action = view.events[key];
            const valuesStr = action.values
                ? action.values
                    .map((value) => {
                        if (value === "$e") return value;
                        return parseValue(value);
                    })
                    .join()
                : "";
            switch (action.type) {
                case "dispatch": {
                    if (!afastObject.events)
                        throw new Error(`View \`${afastObject.name}\` hasn't any actions`);
                    if (!afastObject.events[action.name])
                        throw new Error(
                            `View \`${afastObject.name}\` doesn't have a action named \`${action.name}\`, did you forget to register it?`
                        );
                    view.props[key] = `(${action.values && action.values.includes("$e") ? "$e" : ""
                        }) => {${useEventName(action.name)}(${valuesStr})}`;
                    break;
                }
                case "setField": {
                    const field = afastObject.fields[action.name];
                    if (!field)
                        throw new Error(
                            `View \`${afastObject.name}\` doesn't have an field named \`${action.name}\``
                        );
                    // TODO check weather the type of value is correct
                    if (field.reactive) {
                        view.props[key] = `($e) => ${useStateFnName(action.name)}(${valuesStr})`;
                    } else {
                        view.props[key] = `() => {${action.name} = ${parseValue(
                            action.value
                        )}}`;
                    }
                    break;
                }
                case "hook": {
                    if (!action.name) {
                        throw new Error(
                            `Event with hook need a name, check view \`${afastObject.name}\``
                        );
                    }
                    view.props[key] = `() => __AFAST_HOOKS_EMIT('${action.name}', ${valuesStr})`
                    break;
                }
            }
        });
    }

    // Parse ref of view
    if (view.props && view.props.ref) delete view.props.ref
    if (view.ref) {
        view.props.ref = view.ref;
    }

    const generateElementCode = () => {
        return `React.createElement(${tag}, ${parseObject(
            view.props,
            noParseKeys
        )}, ${children && children.length > 0
            ? children.join()
            : view.text
                ? `\`${view.text}\``
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