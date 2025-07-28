class Accessibility {
  constructor(getAXTree) {
    this._getAXTree = getAXTree;
  }
  async snapshot(options = {}) {
    const {
      interestingOnly = true,
      root = null
    } = options;
    const { tree, needle } = await this._getAXTree(root || void 0);
    if (!interestingOnly) {
      if (root)
        return needle && serializeTree(needle)[0];
      return serializeTree(tree)[0];
    }
    const interestingNodes = /* @__PURE__ */ new Set();
    collectInterestingNodes(interestingNodes, tree, false);
    if (root && (!needle || !interestingNodes.has(needle)))
      return null;
    return serializeTree(needle || tree, interestingNodes)[0];
  }
}
function collectInterestingNodes(collection, node, insideControl) {
  if (node.isInteresting(insideControl))
    collection.add(node);
  if (node.isLeafNode())
    return;
  insideControl = insideControl || node.isControl();
  for (const child of node.children())
    collectInterestingNodes(collection, child, insideControl);
}
function serializeTree(node, whitelistedNodes) {
  const children = [];
  for (const child of node.children())
    children.push(...serializeTree(child, whitelistedNodes));
  if (whitelistedNodes && !whitelistedNodes.has(node))
    return children;
  const serializedNode = node.serialize();
  if (children.length)
    serializedNode.children = children;
  return [serializedNode];
}

export { Accessibility };
