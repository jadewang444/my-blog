import { visit } from 'unist-util-visit';
import type { Parent } from 'unist';
import type { Literal } from 'mdast';

export default function fixTextDirectives() {
  return (tree: Parent) => {
    visit(tree, 'textDirective', (node: any, index: number | null, parent: Parent | null) => {
      if (!parent || index === null) return;
  const name = typeof node.name === 'string' ? node.name : '';
  // Only convert numeric text directives that look like hours or minutes.
  // Accept hour range 0-23 or minute range 0-59 to be conservative and explicit.
  const timeLike = /^(?:[01]?\d|2[0-3]|[0-5]?\d)$/;
  if (!timeLike.test(name)) return;
      // Replace the textDirective node with a plain text node containing ":<name>".
      const textNode: Literal = {
        type: 'text',
        value: `:${name}`,
      };
      parent.children.splice(index, 1, textNode as any);
    });
  };
}
