function axNodeFromProtocol(axNode) {
  const result = {
    ...axNode,
    value: axNode.valueNumber !== void 0 ? axNode.valueNumber : axNode.valueString,
    checked: axNode.checked === "checked" ? true : axNode.checked === "unchecked" ? false : axNode.checked,
    pressed: axNode.pressed === "pressed" ? true : axNode.pressed === "released" ? false : axNode.pressed,
    children: axNode.children ? axNode.children.map(axNodeFromProtocol) : void 0
  };
  delete result.valueNumber;
  delete result.valueString;
  return result;
}
class Accessibility {
  constructor(channel) {
    this._channel = channel;
  }
  async snapshot(options = {}) {
    const root = options.root ? options.root._elementChannel : void 0;
    const result = await this._channel.accessibilitySnapshot({ interestingOnly: options.interestingOnly, root });
    return result.rootAXNode ? axNodeFromProtocol(result.rootAXNode) : null;
  }
}

export { Accessibility };
