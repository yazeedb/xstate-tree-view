import React from "react";

export const TreeView = ({ nodes, onClick, onToggle }) => {
  return (
    <ul className="tree-view">
      {nodes.map(n => {
        const depth = getNodeDepth(n.id);

        return (
          <li
            style={{
              marginLeft: `${depth * 30}px`,
              border: "2px solid black",
              cursor: "pointer",
              backgroundColor: n.focused ? "green" : "initial",
              display: "flex",
              listStyleType: "none",
              width: "250px",
              borderRadius: "3px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}
            key={n.id}
          >
            <span
              style={{
                padding: "10px"
              }}
              onClick={() => onToggle(n)}
            >
              {n.open ? "-" : "+"}
            </span>

            <span
              style={{
                width: "100%",
                height: "100%",
                padding: "10px"
              }}
              onClick={() => onClick(n)}
            >
              {n.loading ? "Loading..." : n.name}
            </span>
          </li>
        );
      })}
    </ul>
  );
};

const nodeSeparator = ".";
const getNodeDepth = nodeId => nodeId.split(nodeSeparator).length;
