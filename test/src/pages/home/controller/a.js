export default class {
  constructor(context) {
    this.context = context
  }

  onMounted(){
    console.log('A onMounted');
  }

  onDecrease(){
    this.context.fields.num --
  }
  onIncrease(){
    this.context.fields.num ++
  }
  onClickTest(name,id){
    console.log(name+"("+id+")")
  }
}