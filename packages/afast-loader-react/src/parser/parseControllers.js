const useId = require('../hooks/useId.js')

const parseController = (controller, imports, innerCode, context, eventsList) => {
    const id = useId()
    const name = `__AFAST_CONTROLLER_IMPORT_${id}`;
    imports.add(`import ${name} from '${controller}'`);
    const controllerName = `__AFAST_CONTROLLER_${id}`
    innerCode.push(`const ${controllerName} = React.useMemo(() => new ${name}(__AFAST_CONTROLLER_PROXY(arguments[0],${context})),[])`)
    eventsList.onMounted.push(`if(${controllerName}.onMounted) ${controllerName}.onMounted()`);
    innerCode.push(`__AFAST_CONTROLLERS.push(${controllerName})`)
};

const parseControllers = (afastObject, imports, innerCode, context, eventsList) => {
    innerCode.push("const __AFAST_CONTROLLERS = []")
    imports.add('import {__AFAST_CONTROLLER_PROXY, __AFAST_CONTROLLER_HOOKS} from \'afast-boot\'')
    innerCode.push(`const __AFAST_HOOKS_EMIT = __AFAST_CONTROLLER_HOOKS.bind(null, __AFAST_CONTROLLERS)`)
    if (typeof afastObject.controllers === "string")
        parseController(afastObject.controllers, imports, innerCode, context, eventsList);
    else if (Array.isArray(afastObject.controllers)) {
        afastObject.controllers.forEach((m) => {
            parseController(m, imports, innerCode, context, eventsList);
        });
    }
};

module.exports = parseControllers;