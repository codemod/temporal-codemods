import type { Codemod, SgNode } from "codemod:ast-grep";
import type TS from "codemod:ast-grep/langs/typescript";
import { useMetricAtom } from "codemod:metrics";
import { listImports } from "@jssg/utils/javascript/imports";
import { getFileStyle } from "@jssg/utils/javascript/style";

/**
 * Temporal sdk-typescript 1.24 → 1.25
 *
 * Nexus Workflow Updates require waitForStage: 'ACCEPTED'.
 * Only touches files that import from @temporalio/nexus (or a subpath).
 */
type Lang = TS;

const nexusUpdateMetric = useMetricAtom("nexus-update-wait-for-stage");

function importsTemporalNexus(rootNode: SgNode<Lang, "program">): boolean {
  return listImports(rootNode).some(
    (item) =>
      item.source === "@temporalio/nexus" ||
      item.source.startsWith("@temporalio/nexus/"),
  );
}

function hasWaitForStage(opts: SgNode<Lang>): boolean {
  return (
    opts.find({
      rule: {
        any: [
          { kind: "property_identifier", regex: "^waitForStage$" },
          { kind: "identifier", regex: "^waitForStage$" },
        ],
      },
    }) !== null
  );
}

function withWaitForStage(optsText: string, quote: string): string {
  const inner = optsText.trim().replace(/^\{\s*/, "").replace(/\s*\}$/, "").trim();
  const value = `${quote}ACCEPTED${quote}`;
  if (!inner) return `{ waitForStage: ${value} }`;
  return `{ waitForStage: ${value}, ${inner} }`;
}

function callArgs(call: SgNode<Lang>): SgNode<Lang>[] {
  const args = call.field("arguments");
  if (!args) return [];
  return args.children().filter((child) => {
    const kind = child.kind();
    return kind !== "(" && kind !== ")" && kind !== ",";
  });
}

const codemod: Codemod<Lang> = (root) => {
  const rootNode = root.root();
  if (!importsTemporalNexus(rootNode)) return null;

  const style = getFileStyle(rootNode);
  const quote = style.quote || "'";
  const edits: ReturnType<SgNode<Lang>["replace"]>[] = [];

  for (const call of rootNode.findAll({ rule: { kind: "call_expression" } })) {
    const callee = call.field("function");
    if (!callee || callee.kind() !== "member_expression") continue;
    const property = callee.field("property");
    const object = callee.field("object");
    if (!property || !object || property.text() !== "update") continue;

    const args = callArgs(call);
    if (args.length === 1) {
      const def = args[0]!.text();
      edits.push(
        call.replace(
          `${object.text()}.update(${def}, { waitForStage: ${quote}ACCEPTED${quote} })`,
        ),
      );
      nexusUpdateMetric.increment({ shape: "no-options" });
      continue;
    }

    if (args.length !== 2) continue;
    const def = args[0]!;
    const opts = args[1]!;
    if (opts.kind() !== "object") continue;
    if (hasWaitForStage(opts)) continue;
    edits.push(
      call.replace(
        `${object.text()}.update(${def.text()}, ${withWaitForStage(opts.text(), quote)})`,
      ),
    );
    nexusUpdateMetric.increment({ shape: "existing-options" });
  }

  if (edits.length === 0) return null;
  return rootNode.commitEdits(edits);
};

export default codemod;
