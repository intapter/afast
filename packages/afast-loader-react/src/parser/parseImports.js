const parseImports = (afastObject, importsConfig, imports) => {
    if (!Array.isArray(importsConfig))
        throw new Error(
            "Config `imports` must be an Array, provided " + typeof importsConfig
        );
    importsConfig.forEach((importConfig) => {
        if (!importConfig.src) throw new Error("An import must provide a src");
        if (importConfig.modules && Array.isArray(importConfig.modules)) {
            const moduleList = [];
            const namedModuleList = [];
            importConfig.modules.forEach((module) => {
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
            imports.add(`import ${moduleList.join()} from '${importConfig.src}'`);
        } else {
            imports.add(`import '${importConfig.src}'`);
        }
    });
};

module.exports = parseImports;