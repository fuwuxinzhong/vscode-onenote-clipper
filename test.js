// 这是一个测试文件，用于测试OneNote Clipper扩展

function helloWorld() {
  console.log("Hello, OneNote!");
  return "Hello from VSCode";
}

// 选中这段代码测试发送功能
const message = "这是一个测试消息";
console.log(message);

// 可以测试发送整个文件
class TestClass {
  constructor(name) {
    this.name = name;
  }

  greet() {
    return `Hello, ${this.name}!`;
  }
}

const test = new TestClass("OneNote");
console.log(test.greet());