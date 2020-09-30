export default class Yield {
  constructor(type, target, args = []) {
    this.type = type;
    this.target = target;
    this.args = args;
  }
}
