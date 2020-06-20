import { Machine, assign, send, spawn, actions, sendParent } from "xstate";
import Faker from "faker";

const rootNode = {
  focused: false,
  loading: false,
  open: false,
  id: "0",
  name: "Root"
};

export const treeMachine = Machine(
  {
    id: "tree",
    initial: "viewingTree",
    context: {
      nodes: [rootNode],
      focusedNode: rootNode,
      actorsMap: new Map()
    },
    states: {
      viewingTree: {
        on: {
          FOCUS_NODE: { actions: "focusNode" },
          TOGGLE_NODE: [
            {
              cond: "nodeIsOpen",
              actions: ["closeNode", "focusNode", "cleanupActor"]
            },
            {
              cond: "nodeIsClosed",
              actions: ["spawnNodeActor", "openNode", "focusNode"]
            }
          ],
          GOT_CHILDREN: { actions: "setChildren" }
        }
      }
    }
  },
  {
    guards: {
      nodeIsOpen: (context, event) => event.node.open,
      nodeIsClosed: (context, event) => !event.node.open
    },
    actions: {
      closeNode: assign((context, event) => {
        return {
          nodes: context.nodes
            // Remove child nodes
            .filter(n => !isDescendant(event.node.id, n.id))

            // Close parent node
            .map(n => {
              if (n.id === event.node.id) {
                return {
                  ...n,
                  open: false,
                  loading: false
                };
              }

              return n;
            })
        };
      }),
      openNode: assign((context, event) => {
        return {
          nodes: context.nodes.map(n => {
            if (n.id === event.node.id) {
              return {
                ...n,
                open: true,
                loading: true
              };
            }

            return n;
          })
        };
      }),
      focusNode: assign((context, event) => {
        const prevFocused = context.focusedNode;
        const nextFocused = event.node;

        return {
          focusedNode: nextFocused,
          nodes: context.nodes.map(n => {
            // Focus new one
            if (n.id === nextFocused.id) {
              return { ...n, focused: true };
            }

            // De-focus previous one
            if (n.id === prevFocused.id) {
              return { ...n, focused: false };
            }

            return n;
          })
        };
      }),
      spawnNodeActor: assign((context, event) => {
        const { node } = event;

        return {
          actorsMap: context.actorsMap.set(
            node.id,
            spawn(createNodeActor(node))
          )
        };
      }),
      setChildren: assign((context, event) => {
        const { parentNode, children } = event;

        return {
          nodes: context.nodes.flatMap(n => {
            if (n.id !== parentNode.id) {
              return n;
            }

            return [{ ...n, loading: false }, ...children];
          })
        };
      }),
      cleanupActor: assign((context, event) => {
        const { actorsMap } = context;

        const actor = actorsMap.get(event.node.id);

        if (actor) {
          actor.stop();
        }

        actorsMap.delete(event.node.id);

        return { actorsMap };
      })
    }
  }
);

const createNodeActor = parentNode => {
  return Machine(
    {
      id: `node-actor-${parentNode}`,
      initial: "fetchingChildren",
      states: {
        fetchingChildren: {
          invoke: {
            src: "fetchChildren",
            onDone: {
              target: "done",
              actions: send(
                (context, event) => ({
                  type: "GOT_CHILDREN",
                  children: event.data,
                  parentNode
                }),
                {
                  to: "tree"
                }
              )
            },
            onError: {
              target: "done",
              actions: send(
                (context, event) => ({
                  type: "CHILDREN_FAILED",
                  error: event.data,
                  parentNode
                }),
                {
                  to: "tree"
                }
              )
            }
          }
        },
        done: { type: "final" }
      }
    },
    {
      services: {
        fetchChildren: () =>
          new Promise(resolve => {
            setTimeout(() => {
              resolve(
                Array.from({
                  length: randomNumBetween(2, 5)
                }).map((_, index) => ({
                  focused: false,
                  loading: false,
                  open: false,
                  id: `${parentNode.id}.${index}`,
                  name: Faker.name.jobTitle()
                }))
              );
            }, 1000);
          })
      }
    }
  );
};

const randomNumBetween = (min, max) => Math.floor(Math.random() * max) + min;

const isDescendant = (parentId, childId) =>
  parentId !== childId && childId.includes(parentId);
