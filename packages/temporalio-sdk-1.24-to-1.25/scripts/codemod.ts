import type { Codemod, SgNode } from "codemod:ast-grep";
import type TS from "codemod:ast-grep/langs/typescript";

/**
 * Temporal sdk-typescript 1.24 → 1.25
 *
 * Nexus Workflow Updates require waitForStage: 'ACCEPTED'.
 * Only touches files that import from @temporalio/nexus.
 */
type Lang = TS;

function importsTemporalNexus(rootNode: SgNode<Lang>): boolean {
  return (
    rootNode.findAll({
      rule: {
        any: [
          { pattern: "import $A from '@temporalio/nexus'" },
          { pattern: 'import $A from "@temporalio/nexus"' },
          { pattern: "import { $$$I } from '@temporalio/nexus'" },
          { pattern: 'import { $$$I } from "@temporalio/nexus"' },
          { pattern: "import type { $$$I } from '@temporalio/nexus'" },
          { pattern: 'import type { $$$I } from "@temporalio/nexus"' },
          { pattern: "import $A from '@temporalio/nexus/$P'" },
          { pattern: 'import $A from "@temporalio/nexus/$P"' },
          { pattern: "import { $$$I } from '@temporalio/nexus/$P'" },
          { pattern: 'import { $$$I } from "@temporalio/nexus/$P"' },
        ],
      },
    }).length > 0
  );
}

function hasWaitForStage(opts: SgNode<Lang>): boolean {
  return /\bwaitForStage\b/.test(opts.text());
}

function withWaitForStage(optsText: string): string {
  const inner = optsText.trim().replace(/^\{\s*/, "").replace(/\s*\}$/, "").trim();
  if (!inner) return "{ waitForStage: 'ACCEPTED' }";
  return `{ waitForStage: 'ACCEPTED', ${inner} }`;
}

const codemod: Codemod<Lang> = (root) => {
  const rootNode = root.root();
  if (!importsTemporalNexus(rootNode)) return null;

  const edits: ReturnType<SgNode<Lang>["replace"]>[] = [];

  for (const node of rootNode.findAll({
    rule: { pattern: "$RECV.update($DEF)" },
  })) {
    const recv = node.getMatch("RECV")?.text();
    const def = node.getMatch("DEF")?.text();
    if (!recv || !def) continue;
    edits.push(
      node.replace(`${recv}.update(${def}, { waitForStage: 'ACCEPTED' })`),
    );
  }

  for (const node of rootNode.findAll({
    rule: { pattern: "$RECV.update($DEF, $OPTS)" },
  })) {
    const recv = node.getMatch("RECV")?.text();
    const def = node.getMatch("DEF")?.text();
    const opts = node.getMatch("OPTS");
    if (!recv || !def || !opts) continue;
    if (opts.kind() !== "object") continue;
    if (hasWaitForStage(opts)) continue;
    edits.push(
      node.replace(`${recv}.update(${def}, ${withWaitForStage(opts.text())})`),
    );
  }

  if (edits.length === 0) return null;
  return rootNode.commitEdits(edits);
};

export default codemod;
