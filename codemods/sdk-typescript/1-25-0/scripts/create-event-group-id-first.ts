import type { Codemod, Edit, SgNode } from "codemod:ast-grep";
import type TS from "codemod:ast-grep/langs/typescript";
import { useMetricAtom } from "codemod:metrics";
import { getAllImports, listImports, updateImport } from "@jssg/utils/javascript/imports";
import { importBindingOf, renameReferences } from "@jssg/utils/javascript/bindings";

/**
 * Temporal sdk-typescript 1.24 → 1.25
 *
 * createEventGroup(label, { id }) → createEventGroup(id, { label })
 * EventGroupMarker → EventGroup
 *
 * Single-argument createEventGroup('x') is left unchanged (string is now the id).
 * Only rewrites symbols imported from @temporalio/workflow (or a subpath).
 */
type Lang = TS;

const eventGroupMetric = useMetricAtom("create-event-group-migration");

function isWorkflowSource(source: string): boolean {
  return (
    source === "@temporalio/workflow" || source.startsWith("@temporalio/workflow/")
  );
}

function workflowModuleSources(rootNode: SgNode<Lang, "program">): string[] {
  const sources = new Set<string>();
  for (const item of listImports(rootNode)) {
    if (isWorkflowSource(item.source)) sources.add(item.source);
  }
  return [...sources];
}

function isCreateEventGroupCallee(callee: SgNode<Lang>): "identifier" | "namespace" | null {
  if (callee.kind() === "identifier") {
    const binding = importBindingOf(callee);
    if (
      binding !== null &&
      binding.importedName === "createEventGroup" &&
      isWorkflowSource(binding.source)
    ) {
      return "identifier";
    }
    return null;
  }

  if (callee.kind() === "member_expression") {
    const object = callee.field("object");
    const property = callee.field("property");
    if (!object || !property || property.text() !== "createEventGroup") return null;
    if (object.kind() !== "identifier") return null;
    const binding = importBindingOf(object);
    if (
      binding !== null &&
      binding.importedName === "*" &&
      isWorkflowSource(binding.source)
    ) {
      return "namespace";
    }
  }

  return null;
}

function objectPairs(opts: SgNode<Lang>): Array<{ key: string; value: SgNode<Lang> }> {
  const pairs: Array<{ key: string; value: SgNode<Lang> }> = [];
  for (const child of opts.children()) {
    if (child.kind() !== "pair") continue;
    const keyNode = child.field("key");
    const valueNode = child.field("value");
    if (!keyNode || !valueNode) continue;
    pairs.push({ key: keyNode.text(), value: valueNode });
  }
  return pairs;
}

function rewriteLabeledCall(
  node: SgNode<Lang>,
  calleeText: string,
): ReturnType<SgNode<Lang>["replace"]> | null {
  const args = node.field("arguments");
  if (!args) return null;
  const argNodes = args.children().filter((child) => {
    const kind = child.kind();
    return kind !== "(" && kind !== ")" && kind !== ",";
  });
  if (argNodes.length !== 2) return null;

  const [labelArg, optsArg] = argNodes;
  if (!labelArg || !optsArg || optsArg.kind() !== "object") return null;

  const pairs = objectPairs(optsArg);
  if (pairs.some((pair) => pair.key === "label")) return null;
  const idPair = pairs.find((pair) => pair.key === "id");
  if (!idPair) return null;

  return node.replace(
    `${calleeText}(${idPair.value.text()}, { label: ${labelArg.text()} })`,
  );
}

const codemod: Codemod<Lang> = (root) => {
  const rootNode = root.root();
  const filename = root.filename();
  const edits: Edit[] = [];
  const sources = workflowModuleSources(rootNode);

  for (const call of rootNode.findAll({ rule: { kind: "call_expression" } })) {
    const callee = call.field("function");
    if (!callee) continue;
    const form = isCreateEventGroupCallee(callee);
    if (!form) continue;
    const rewritten = rewriteLabeledCall(call, callee.text());
    if (!rewritten) continue;
    edits.push(rewritten);
    eventGroupMetric.increment({ kind: "call-rewrite", callee: form });
  }

  for (const from of sources) {
    const markerImports = getAllImports(rootNode, {
      type: "named",
      name: "EventGroupMarker",
      from,
    });
    for (const marker of markerImports) {
      if (marker.isNamespace) continue;
      const before = edits.length;
      edits.push(...renameReferences(marker.node, "EventGroup", filename));
      const renamed = updateImport(rootNode, {
        type: "named",
        from,
        specifiers: [
          {
            name: "EventGroupMarker",
            to: "EventGroup",
            local: marker.alias,
          },
        ],
      });
      if (renamed) edits.push(...renamed);
      if (edits.length > before) {
        eventGroupMetric.increment({
          kind: "type-rename",
          importStyle: marker.isTypeOnly ? "type" : "value",
        });
      }
    }
  }

  if (edits.length === 0) return null;
  return rootNode.commitEdits(edits);
};

export default codemod;
