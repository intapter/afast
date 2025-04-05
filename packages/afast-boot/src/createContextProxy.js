export default function(props, fields){
    return {
        dispatch(name, ...args){
            if(props[name] && typeof props[name] === 'function'){
                props[name].call(props[name],...args)
            }
        },
        props: new Proxy({}, {
            get: (target, prop) => {
                return Reflect.get(props, prop)
            },
            set: (target, prop, value) => {
                throw new Error(`\`${prop}\` is a prop, you can't change it here`)
            }
        }),
        fields: new Proxy({},{
            get: (target, prop) => {
                const a = fields.current
                return a[prop].value
            },
            set:(target, prop, value) => {
                const a = fields.current
                if(a) a[prop].setter(value)
                return true
            }
        })
    }
}