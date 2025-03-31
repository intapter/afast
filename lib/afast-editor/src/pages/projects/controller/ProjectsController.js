export default class{
    constructor(context){
        this.context = context;
    }
    onMounted(){
        this.context.fields.projects = [
            {
                id: 0,
                name: '项目1'
            },{
                id: 0,
                name: '项目2'
            }
        ]
    }
    onProjectClick(){
        console.log('onProjectClick');
    }
}