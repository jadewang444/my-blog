import type { Plugin } from 'unified';
import type { Root } from 'mdast';
import { visit } from 'unist-util-visit';

// Debug plugin: logs paragraph AST nodes that contain the target snippet
const debugRemark: Plugin<[], Root> = () => {
  return (tree, file) => {
    const target = 'I was born in Wuchang District';
    visit(tree, 'paragraph', (node) => {
      const raw = (node as any).children?.map((c: any) => c.value || '').join('') || '';
      if (raw.includes(target)) {
        console.log('--- DEBUG: Found paragraph AST for', file?.path || '(unknown)');
        console.log(JSON.stringify(node, null, 2));
      }
    });
  };
};

export default debugRemark;
