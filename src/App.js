import React from "react";
import { useMachine } from "@xstate/react";
import "./styles.css";
import { treeMachine } from "./treeMachine";
import { TreeView } from "./TreeView";

export default function App() {
  const [current, send] = useMachine(treeMachine);

  console.log(current);

  return (
    <div>
      <TreeView
        nodes={current.context.nodes}
        onClick={node => send({ type: "FOCUS_NODE", node })}
        onToggle={node => send({ type: "TOGGLE_NODE", node })}
      />
    </div>
  );
}
