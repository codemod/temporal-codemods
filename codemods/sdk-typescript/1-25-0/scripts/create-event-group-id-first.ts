import type { Codemod, SgNode } from "codemod:ast-grep";
import type TS from "codemod:ast-grep/langs/typescript";

/**
 * Temporal sdk-typescript 1.24 → 1.25
 *
 * createEventGroup(label, { id }) → createEventGroup(id, { label })
 * EventGroupMarker → EventGroup
 *
 * Single-argument createEventGroup('x') is left unchanged (string is now the id).
 */
type Lang = TS;

const codemod: Codemod<Lang> = (root) => {
  const rootNode = root.root();
  const edits: ReturnType<SgNode<Lang>["replace"]>[] = [];

  // Exact old shape with id option
  for (const node of rootNode.findAll({
    rule: { pattern: "createEventGroup($LABEL, { id: $ID })" },
  })) {
    const label = node.getMatch("LABEL")?.text();
    const id = node.getMatch("ID")?.text();
    if (!label || !id) continue;
    edits.push(node.replace(`createEventGroup(${id}, { label: ${label} })`));
  }

  // Also handle trailing commas / extra spacing via object metavariable fallback
  for (const node of rootNode.findAll({
    rule: {
      pattern: "createEventGroup($LABEL, $OPTS)",
      not: { pattern: "createEventGroup($LABEL, { id: $ID })" },
    },
  })) {
    const label = node.getMatch("LABEL");
    const opts = node.getMatch("OPTS");
    if (!label || !opts || opts.kind() !== "object") continue;
    if (opts.find({ rule: { pattern: "label: $L" } })) continue;
    const idPair = opts.find({ rule: { pattern: "id: $ID" } });
    const id = idPair?.getMatch("ID")?.text();
    if (!id) continue;
    edits.push(
      node.replace(`createEventGroup(${id}, { label: ${label.text()} })`),
    );
  }

  for (const node of rootNode.findAll({
    rule: {
      any: [
        { kind: "identifier", regex: "^EventGroupMarker$" },
        { kind: "type_identifier", regex: "^EventGroupMarker$" },
      ],
    },
  })) {
    edits.push(node.replace("EventGroup"));
  }

  if (edits.length === 0) return null;
  return rootNode.commitEdits(edits);
};

export default codemod;
