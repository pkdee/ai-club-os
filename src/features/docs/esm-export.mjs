// 빌드할 때 만든 값을 MDX 모듈의 `export const 이름 = 값` 으로 내보내는 ESM 노드와, JSX 속성 `이름={값}` 을 만든다.
// 값은 글, 수, 참거짓, null 과 그것을 담은 배열과 객체만 받는다. 객체의 키는 식별자로 쓸 수 있는 이름이어야 한다.
// rehype-toc.mjs, remark-markdown.mjs, remark-front-matter.mjs, remark-diagram.mjs 가 함께 쓴다. MDX 는 이 노드의 estree 를 그대로 코드로 바꾼다.

function toEstree(value) {
  if (Array.isArray(value)) {
    return { type: "ArrayExpression", elements: value.map(toEstree) }
  }
  if (value !== null && typeof value === "object") {
    return {
      type: "ObjectExpression",
      properties: Object.entries(value).map(([key, item]) => ({
        type: "Property",
        kind: "init",
        method: false,
        shorthand: false,
        computed: false,
        key: { type: "Identifier", name: key },
        value: toEstree(item),
      })),
    }
  }
  return { type: "Literal", value }
}

export function exportConst(name, value) {
  return {
    type: "mdxjsEsm",
    value: "",
    data: {
      estree: {
        type: "Program",
        sourceType: "module",
        body: [
          {
            type: "ExportNamedDeclaration",
            specifiers: [],
            source: null,
            attributes: [],
            declaration: {
              type: "VariableDeclaration",
              kind: "const",
              declarations: [
                {
                  type: "VariableDeclarator",
                  id: { type: "Identifier", name },
                  init: toEstree(value),
                },
              ],
            },
          },
        ],
      },
    },
  }
}

// MDX 의 JSX 요소에 붙이는 속성 `이름={값}`.
export function expressionAttribute(name, value) {
  return {
    type: "mdxJsxAttribute",
    name,
    value: {
      type: "mdxJsxAttributeValueExpression",
      value: "",
      data: {
        estree: {
          type: "Program",
          sourceType: "module",
          body: [{ type: "ExpressionStatement", expression: toEstree(value) }],
        },
      },
    },
  }
}
