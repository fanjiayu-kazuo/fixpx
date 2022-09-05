# fixpx
统一修复本地项目中的px值，也可以统一转换本地项目的px为rem，节约人工成本
## 注意事项：
在使用时候引入该文件需要和使用文件在同一个目录下下使用
使用参数详解：
```javascript
new fixPxUtil({
  entry:'路口路径必填项,类型为String',
  pxtopx:'px转换为px，只改变数值不改变单位，类型为Boolean,与pxtorem互斥',
  pxtorem:'px转换为rem，只改变数值不改变单位，类型为Boolean,与pxtopx互斥',
  baseNumber:'当前数值的除数,类型为Number',
  includeFileTypeList:'包含文件后缀的数组，例：[".vue",".js"],类型为字符串数组',
  excludeFile：'不包括的文件，可以是路径，例:['component'],type:Array'
})
````
在引入文件执行node + （定义的文件）即可
