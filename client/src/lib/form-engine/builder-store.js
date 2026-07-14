import { create } from "zustand";
import { nanoid } from "nanoid";

function findAndMutate(nodes, id, fn) {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].id === id) {
      fn(nodes[i], nodes, i);
      return true;
    }
    if (nodes[i].children && findAndMutate(nodes[i].children, id, fn)) return true;
  }
  return false;
}

function pinSubmitLast(components) {
  const idx = components.findIndex((c) => c.type === "submit");
  if (idx !== -1 && idx !== components.length - 1) {
    const [submit] = components.splice(idx, 1);
    components.push(submit);
  }
}

function cloneWithNewIds(node) {
  return {
    ...node,
    id: nanoid(10),
    internalName: `${node.type}_${nanoid(4)}`,
    children: node.children?.map(cloneWithNewIds),
  };
}

function emptySchema() {
  return {
    title: "Untitled Form",
    layout: "single",
    sections: [{ id: nanoid(10), title: "Section 1", components: [] }],
    conditionalRules: [],
  };
}

function snapshot(value) {
  return JSON.parse(JSON.stringify(value));
}

export const useBuilderStore = create((set, get) => ({
  schema: emptySchema(),
  selectedId: null,
  history: [],
  future: [],
  clipboard: null,
  activeSectionId: "",
  lastHistoryTimestamp: 0,

  setSchema: (schema) =>
    set({ schema, activeSectionId: schema.sections[0]?.id ?? "", history: [], future: [], selectedId: null }),

  select: (id) => set({ selectedId: id }),

  addComponent: (sectionId, node, parentId, index) =>
    set((state) => {
      const schema = snapshot(state.schema);
      const section = schema.sections.find((s) => s.id === sectionId);
      if (!section) return state;
      if (parentId) {
        findAndMutate(section.components, parentId, (parent) => {
          parent.children = parent.children ?? [];
          if (index !== undefined) parent.children.splice(index, 0, node);
          else parent.children.push(node);
        });
      } else if (index !== undefined) {
        section.components.splice(index, 0, node);
      } else {
        section.components.push(node);
      }
      pinSubmitLast(section.components);
      return { schema, history: [...state.history, state.schema], future: [], selectedId: node.id, lastHistoryTimestamp: Date.now() };
    }),

  updateComponent: (id, patch) =>
    set((state) => {
      const schema = snapshot(state.schema);
      let found = false;
      for (const section of schema.sections) {
        found = findAndMutate(section.components, id, (node, list, i) => {
          list[i] = { ...node, ...patch };
        });
        if (found) break;
      }
      const now = Date.now();
      const isRapidTyping = now - state.lastHistoryTimestamp < 1200;
      const nextHistory = isRapidTyping ? state.history : [...state.history, state.schema];

      return { schema, history: nextHistory, future: [], lastHistoryTimestamp: now };
    }),

  reorderComponent: (sectionId, nodeId, toIndex) =>
    set((state) => {
      const schema = snapshot(state.schema);
      const section = schema.sections.find((s) => s.id === sectionId);
      if (!section) return state;
      const from = section.components.findIndex((c) => c.id === nodeId);
      if (from === -1) return state;
      const [moved] = section.components.splice(from, 1);
      section.components.splice(Math.max(0, Math.min(section.components.length, toIndex)), 0, moved);
      pinSubmitLast(section.components);
      return { schema, history: [...state.history, state.schema], future: [] };
    }),

  setComponentWidth: (sectionId, nodeId, width) =>
    set((state) => {
      const schema = snapshot(state.schema);
      const section = schema.sections.find((s) => s.id === sectionId);
      if (!section) return state;
      findAndMutate(section.components, nodeId, (node) => {
        if (!node.display) node.display = { width: "full" };
        node.display.width = width;
      });
      return { schema, history: [...state.history, state.schema], future: [] };
    }),

  removeComponent: (id) =>
    set((state) => {
      const schema = snapshot(state.schema);
      const removeNested = (nodes) => {
        for (let i = 0; i < nodes.length; i++) {
          if (nodes[i].id === id) {
            nodes.splice(i, 1);
            return true;
          }
          if (nodes[i].children && removeNested(nodes[i].children)) return true;
        }
        return false;
      };
      for (const section of schema.sections) {
        if (removeNested(section.components)) break;
      }
      return { schema, history: [...state.history, state.schema], future: [], selectedId: null, lastHistoryTimestamp: Date.now() };
    }),

  duplicateComponent: (id) =>
    set((state) => {
      const schema = snapshot(state.schema);
      for (const section of schema.sections) {
        const idx = section.components.findIndex((c) => c.id === id);
        if (idx !== -1) {
          const clone = cloneWithNewIds(section.components[idx]);
          section.components.splice(idx + 1, 0, clone);
          pinSubmitLast(section.components);
          return { schema, history: [...state.history, state.schema], future: [], selectedId: clone.id, lastHistoryTimestamp: Date.now() };
        }
      }
      return state;
    }),

  copyComponent: (id) =>
    set((state) => {
      const search = (nodes) => {
        for (const n of nodes) {
          if (n.id === id) return n;
          if (n.children) {
            const r = search(n.children);
            if (r) return r;
          }
        }
        return null;
      };
      for (const section of state.schema.sections) {
        const found = search(section.components);
        if (found) return { clipboard: snapshot(found) };
      }
      return state;
    }),

  pasteComponent: (sectionId) =>
    set((state) => {
      if (!state.clipboard) return state;
      const schema = snapshot(state.schema);
      const section = schema.sections.find((s) => s.id === sectionId);
      if (!section) return state;
      const clone = cloneWithNewIds(state.clipboard);
      section.components.push(clone);
      pinSubmitLast(section.components);
      return { schema, history: [...state.history, state.schema], future: [], selectedId: clone.id, lastHistoryTimestamp: Date.now() };
    }),

  moveComponent: (activeId, overId, sectionId) =>
    set((state) => {
      const schema = snapshot(state.schema);
      const section = schema.sections.find((s) => s.id === sectionId);
      if (!section) return state;
      const fromIdx = section.components.findIndex((c) => c.id === activeId);
      const toIdx = overId ? section.components.findIndex((c) => c.id === overId) : section.components.length - 1;
      if (fromIdx === -1 || toIdx === -1) return state;
      const [item] = section.components.splice(fromIdx, 1);
      section.components.splice(toIdx, 0, item);
      pinSubmitLast(section.components);
      return { schema, history: [...state.history, state.schema], future: [], lastHistoryTimestamp: Date.now() };
    }),

  addSection: () =>
    set((state) => {
      const schema = snapshot(state.schema);
      const newSection = { id: nanoid(10), title: `Section ${schema.sections.length + 1}`, components: [] };
      schema.sections.push(newSection);
      return { schema, activeSectionId: newSection.id, history: [...state.history, state.schema], future: [], lastHistoryTimestamp: Date.now() };
    }),

  renameSection: (id, title) =>
    set((state) => {
      const schema = snapshot(state.schema);
      const section = schema.sections.find((s) => s.id === id);
      if (section) section.title = title;
      return { schema };
    }),

  removeSection: (id) =>
    set((state) => {
      if (state.schema.sections.length <= 1) return state;
      const schema = snapshot(state.schema);
      schema.sections = schema.sections.filter((s) => s.id !== id);
      return { schema, activeSectionId: schema.sections[0].id, history: [...state.history, state.schema], future: [], lastHistoryTimestamp: Date.now() };
    }),

  setActiveSectionId: (id) => set({ activeSectionId: id }),

  undo: () =>
    set((state) => {
      if (state.history.length === 0) return state;
      const prev = state.history[state.history.length - 1];
      return { schema: prev, history: state.history.slice(0, -1), future: [state.schema, ...state.future], lastHistoryTimestamp: 0 };
    }),

  redo: () =>
    set((state) => {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      return { schema: next, future: state.future.slice(1), history: [...state.history, state.schema], lastHistoryTimestamp: 0 };
    }),

  reset: () => set({ schema: emptySchema(), history: [], future: [], selectedId: null, lastHistoryTimestamp: 0 }),

  setConditionalRules: (rules) =>
    set((state) => {
      const schema = snapshot(state.schema);
      schema.conditionalRules = rules;
      return { schema, history: [...state.history, state.schema], future: [], lastHistoryTimestamp: Date.now() };
    }),
}));
