import { DIAGRAM_FONT, type DiagramLayout } from "../diagram-layout.mjs"

// Docs 의 흐름도. 문서의 ```mermaid 코드 블록을 빌드할 때 remark-diagram.mjs 가 자리를 잡아 넘긴다.
// 회색 판 위에 상자는 Primary, 묶음은 Primary Subtle, 화살표는 흐린 아이콘 색으로 그린다. 색은 화면 모드를 따른다.
// 좁은 화면에서는 80% 까지 줄이고, 그보다 좁으면 판 안에서 옆으로 밀어 본다.
// 그림의 글은 화면 읽기 프로그램에 한 줄 설명(description)으로 읽힌다.
export function Diagram({ layout }: { layout: DiagramLayout }) {
  return (
    <figure className="mt-5 overflow-x-auto rounded-xl bg-muted first:mt-0">
      <svg
        role="img"
        aria-label={layout.description}
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        className="mx-auto block h-auto w-full"
        style={{ maxWidth: layout.width, minWidth: layout.width * 0.8 }}
      >
        {layout.groups.map((group, index) => (
          <g key={`group-${index}`}>
            <rect
              x={group.x}
              y={group.y}
              width={group.w}
              height={group.h}
              rx={12}
              className="fill-primary-subtle"
            />
            <text
              x={group.title.x}
              y={group.title.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={DIAGRAM_FONT.title}
              fontWeight={500}
              className="fill-foreground"
            >
              {group.title.text}
            </text>
          </g>
        ))}
        {layout.edges.map((edge, index) => (
          <g key={`edge-${index}`}>
            <path
              d={edge.d}
              fill="none"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="stroke-icon-subtle"
            />
            <polygon points={edge.head} className="fill-icon-subtle" />
            {edge.label && (
              <text
                x={edge.label.x}
                y={edge.label.y}
                textAnchor={edge.label.anchor}
                dominantBaseline="central"
                fontSize={DIAGRAM_FONT.label}
                className="fill-muted-foreground"
              >
                {edge.label.text}
              </text>
            )}
          </g>
        ))}
        {layout.nodes.map((node, index) => (
          <g key={`node-${index}`}>
            <rect
              x={node.x}
              y={node.y}
              width={node.w}
              height={node.h}
              rx={8}
              className="fill-primary"
            />
            {node.lines.map((line, lineIndex) => (
              <text
                key={lineIndex}
                x={line.x}
                y={line.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={DIAGRAM_FONT.node}
                fontWeight={500}
                className="fill-primary-foreground"
              >
                {line.text}
              </text>
            ))}
          </g>
        ))}
      </svg>
    </figure>
  )
}
