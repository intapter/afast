# Afast 使用教程

## 1. 安装及运行

### 1.1 快速安装

我们推荐使用`afast-app`来快速创建你的 Afast 应用。

```shell
npm i afast-app --global
```

安装完成后，在控制台中执行以下命令，稍等片刻，控制台会自动打开 afast 编辑器。

```shell
afast-app start
```

### 1.2 创建项目

进入编辑器项目列表页，点击右上角“创建项目”，填入项目名称等信息，等待模板下载完成，项目即可完成创建。

### 1.3 开始开发

创建成功后，进入项目，即可开始开发。

## 2. 高级使用

Afast 是一个可视化低代码前端框架，一般情况下，使用者无需关注代码层面发生了什么。但为了应对一些特殊情况或需求，我们仍然为使用者保留了底层编码的权限，以确保整体的灵活性。
什么人需要了解这些：

- Afast 框架贡献者
- 使用 Afast 开发高级组件库的开发者
- 对 Afast 底层原理有兴趣的开发者
- 面对项目配置问题不得不手动修复的开发者
- 需要对 Afast 项目进行高级配置以追求更高性能的开发者

### 2.1 afast-loader

afast-loader(https://npm.org/afast-loader)是afast的核心，它依赖于webpack/vite等支持loader的打包工具，在打包的过程中将AF文件转为JavaScript文件，以实现配置向代码的转化。

### 2.2 AF 文件

AF 文件是 Afast 用来存储视图的文件，采用 JSON 格式。下面来介绍其中的配置：

- type 文件类型（必填）
  - index 表示文件是是一个索引视图
  - module 表示该视图是一个模块视图
- title 视图标题
- views 索引视图特有配置，用于记录视图的位置，如以下配置表示 A、B 视图分别在@/views/A.af、@/views/B.af 目录下
  ```
  {
    ...,
    "views": {
      "A": "@/views/A.af",
      "B": "@/views/B.af"
    }
  }
  ```
- rootId 索引视图特有配置，表示应用要渲染到的 html 的根元素 id，默认值为 root
- routes 索引视图特有配置，用于声明当前页面的路由，示例：
  ```
  {
    ...,
    routes:{
      "index":{
        "path": "/",
        "src": "@/pages/index.af"
      }
    }
  }
  ```
- variables 模块视图特有配置，用于声明当前视图的变量，例如
  ```
  {
    ...,
    "fields": {
      "userName": {
        "type": "string",
        "reactive": true,
        "value": "小明"
      }
    }
  }
  ```
  - 其中 userName 是该变量的变量名
  - type 表示该变量为字符串类型，所有类型的选项有
    - string 字符串
    - number 数字
    - object 对象
    - array 数组
    - boolean 布尔值
  - value 表示该变量的初始值（可使用模板字符串变量）
  - reactive 为 true 表示该变量是一个响应式变量，当该变量的值发生改变时，其在视图上程序的效果也会发生改变
- script 模块视图特有配置，用于为当前视图创建一个脚本
- view 模块视图特有配置，用于声明当前视图的根元素，如：

  ```
  {
    ...,
    "view":{
      "name":"div",
      "props":{
        "style":{
          "color":"red"
        }
      },
      "children": [
        {
          "name":"A"
        },
        {
          "name":"B"
        },
        {
          "name":"a",
          "text": "我是文字"
        },
        {
          "name":"button",
          "text": "点我",
          "events":{
            "onClick":{
              "name":"num",
              "type":"setVariable",
              "value":1
            }
          }
        }
      ]
    }
  }
  ```

  - name —— 元素名，可以传 a、div、span 等**HTML 标签名**，也可以传入**视图名**（前提是你必须在索引视图的 views 配置中注册这个）。
  - props —— 元素的属性，常用的有 style（样式）、class（类名）、value（输入框的内容）等。
  - children —— 元素的子元素数组
  - events —— 元素的事件

    - 格式为
      ```
      "events":{
        "事件名":{
          ...
        }
      }
      ```
    - 当你希望在该事件做多个操作时，可以传入一个数组
      ```
      "events":{
        "事件名":[
          {
            ...
          },
          {
            ...
          }
        ]
      }
      ```
    - type 事件触发后执行操作的类型，目前支持以下三种

      - setVariable 更新变量，需要传入 name（变量名）和 value（值），如
        ```
        {
          "type":"setVariable",
          "name":"num",
          "value":1
        }
        ```
      - dispatch 派发事件，派发你在视图的 events 配置中注册的事件，需要传入 name（事件名）和 values（值数组，需要和事件的形参一致），如
        ```
        {
          "type":"diapatch",
          "name":"onClose",
          "values":[true]
        }
        ```
      - script 绑定 JavaScript 脚本，需要传入 src（脚本的路径），同时你需要在该脚本文件中默认（default）暴露一个**普通**方法，同时你可以通过 this 访问到当前视图的变量和相应的操作函数，如下

        ```javascript
        export default function () {
          console.log(this.num);
          this.num++;
        }
        ```
        ```
        {
          "type":"script",
          "src":"xxx.js"
        }
        ```
      
