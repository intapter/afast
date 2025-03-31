const { createHash } = require("crypto");
const { HTML_ELE_TAGS } = require("./html.js");
const DEFAULT_ROOT_ID = "root";
const DEFAULT_FOR_ITEM_NAME = "item";
const DEFAULT_FOR_KEY_NAME = "key";
let views = null;
let id = 0;

const parseController = (controller, imports, innerCode, context, eventsList) => {
    const name = `__AFAST_CONTROLLER_IMPORT_${id}`;
    imports.add(`import ___AFAST_CONTROLLER_PROXY from '@/handler/index.js'`)
    imports.add(`import ${name} from '${controller}'`);
    const controllerName = `__AFAST_CONTROLLER_${id++}`
    innerCode.push(`const ${controllerName} = React.useMemo(() => new ${name}(___AFAST_CONTROLLER_PROXY(arguments[0],${context})),[arguments[0]])`)
    eventsList.onMounted.push(`if(${controllerName}.onMounted) ${controllerName}.onMounted()`);
    innerCode.push(`__AFAST_CONTROLLERS.push(${controllerName})`)
};

const parseControllers = (afastObject, imports, innerCode, context, eventsList) => {
    innerCode.push("const __AFAST_CONTROLLERS = []")
    imports.add('import __AFAST_CONTROLLER_HOOKS from \'@/handler/controller-hooks.js\'')
    innerCode.push(`const __AFAST_HOOKS_EMIT = __AFAST_CONTROLLER_HOOKS.bind(null, __AFAST_CONTROLLERS)`)
    if (typeof afastObject.controllers === "string")
        parseController(afastObject.controllers, imports, innerCode, context, eventsList);
    else if (Array.isArray(afastObject.controllers)) {
        afastObject.controllers.forEach((m) => {
            parseController(m, imports, innerCode, context, eventsList);
        });
    }
};

const setStateFnName = (stateName) => {
    return `set_${createHash('md5').update(stateName).digest('hex')}`
}

const parseValue = (value) => {
    if (typeof value === "string") return "`" + value.replace(/`/g, "\\`") + "`";
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

const renameEvent = (name) => {
    return `${name}`;
};

const parseObject = (props, noParseKeys) => {
    if (!props) return undefined;
    return (
        "{" +
        Object.keys(props)
            .map((key) => {
                const value =
                    typeof props[key] === "object"
                        ? parseObject(props[key])
                        : noParseKeys && noParseKeys.includes(key)
                            ? props[key] // Do not parse this field with function parseValue
                            : parseValue(props[key]);
                return `${key}: ${value}`;
            })
            .join(",") +
        "}"
    );
};

const parseField = (fields, code, fieldList) => {
    if (!fields) return;
    Object.keys(fields).forEach((key) => {
        const name = `${key}`;
        const field = fields[key];
        let value;
        switch (field.type) {
            case "string": {
                value = parseValue(field.value);
                break;
            }
            case "boolean":
            case "number": {
                value = field.value;
                break;
            }
            case "object": {
                value = parseObject(field.value);
                break;
            }
            case "array": {
                value = parseValue(field.value);
                break;
            }
            case "ref": {
                value = "React.useRef()";
                break;
            }
            default:
                "";
        }
        if (field.reactive && field.type !== "ref") {
            const setFnName = setStateFnName(name)
            fieldList.push(`${name}:{value:${name},setter:${setFnName}}`)
            code.push(`const [${name},${setFnName}] = React.useState(${value})`);
        }
        else {
            fieldList.push(`${name}:{value:${name}, setter: (v) => ${name} = v}`)
            code.push(`let ${name} = ${value}`);
        }
    });
};

const parseView = (imports, view, afastObject) => {
    let tag;
    // Parse name of view
    if (HTML_ELE_TAGS.has(view.name)) {
        // This view is a normal HTML element
        tag = `'${view.name}'`;
    } else {
        // This view is a custom component
        const moduleSrc = views[view.name];
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
        tag = `_afast_import_view_${view.name}`;
        imports.add(`import ${tag} from '${moduleSrc}'`);
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
                        }) => {${renameEvent(action.name)}(${valuesStr})}`;
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
                        view.props[key] = `($e) => ${setStateFnName(action.name)}(${valuesStr})`;
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
    if (afastObject.views) views = afastObject.views;
    // Create a root and render the views to it
    imports.add(`import React from'react'`);
    imports.add(`import ReactDOM from 'react-dom/client'`);
    code.push(
        `const root = ReactDOM.createRoot(document.getElementById('${afastObject.rootId || DEFAULT_ROOT_ID
        }'))`
    );
    code.push(`root.render(React.createElement(${__name}))`);
};

const parseImports = (afastObject, importsConfig, imports) => {
    if (!Array.isArray(importsConfig))
        throw new Error(
            "Config `imports` must be an Array, provided " + typeof importsConfig
        );
    importsConfig.forEach((impt) => {
        if (!impt.src) throw new Error("An import must provide a src");
        if (impt.modules && Array.isArray(impt.modules)) {
            const moduleList = [];
            const namedModuleList = [];
            impt.modules.forEach((module) => {
                if (module.name === "default" && module.alias) {
                    moduleList.push(module.alias);
                } else if (module.name) {
                    if (module.alias) {
                        namedModuleList.push(`${module.name} as ${module.alias}`);
                    } else {
                        namedModuleList.push(module.name);
                    }
                }
            });

            if (namedModuleList.length > 0)
                moduleList.push(`{${namedModuleList.join()}}`);
            imports.add(`import ${moduleList.join()} from '${impt.src}'`);
        } else {
            imports.add(`import '${impt.src}'`);
        }
    });
};

const parseModule = (afastObject, imports, code) => {
    const fields = [];
    const props = [];
    const fieldList = []
    parseField(afastObject.fields, fields, fieldList);
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
            props.push(renameEvent(key));
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

module.exports = function (source) {
    const imports = new Set();
    const code = [];
    let afastObject;
    try {
        afastObject = JSON.parse(source);
    } catch (err) {
        throw new Error("The file is not a valid afast file");
    }
    switch (afastObject.type) {
        case "index":
            parseIndex(afastObject, imports, code);
            break;
        case "module":
            parseModule(afastObject, imports, code);
            break;
        default:
            throw new Error("The file is not a valid afast file");
    }
    return [...imports, ...code].join(";");
};
