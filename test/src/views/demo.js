module.exports = function(){
    console.log(this);
    console.log("Hello World!");
    this.setVariable('name', '你好')
}