import { EdgeProps, getSmoothStepPath, BaseEdge } from "reactflow";
import { ReactNode } from "react";

interface ButtonEdgeProps extends EdgeProps {
  children?: ReactNode;
}

export function ButtonEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  children,
  data,
}: ButtonEdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} />
      {children && (
        <foreignObject
          width={40}
          height={40}
          x={labelX - 20}
          y={labelY - 20}
          className="edgebutton-foreignobject"
          requiredExtensions="http://www.w3.org/1999/xhtml"
        >
          {children}
        </foreignObject>
      )}
    </>
  );
}
