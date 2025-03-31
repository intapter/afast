export default (controllers, name, ...args) => {
    for (let i = 0; i < controllers.length; i++) {
        const controller = controllers[i];
        if (controller[name]) {
            controller[name].apply(controller, args)
        }
    }
}