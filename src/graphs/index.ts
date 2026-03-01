import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { NODE_NAME } from "@type/enum/langGraph";

type StateOf<A> = A extends { State: infer S } ? S : never;
type UpdateOf<A> = A extends { Update: infer U } ? U : never;
type NodeActionFn<State, Update> = (state: State) => Update | Promise<Update>;

class GraphWrapper<A extends { State: object; Update: object }> {
  private graph: StateGraph<A>;

  constructor(annotation: A) {
    this.graph = new StateGraph(
      annotation as unknown as ReturnType<typeof Annotation.Root>
    );
  }

  addNode(name: NODE_NAME, action: NodeActionFn<StateOf<A>, UpdateOf<A>>): this {
    this.graph = this.graph.addNode(
      name,
      action as unknown as Parameters<typeof this.graph.addNode>[1]
    ) as unknown as StateGraph<A>;
    return this;
  }

  addEdge(source: typeof START | NODE_NAME, target: typeof END | NODE_NAME): this {
    this.graph = this.graph.addEdge(
      source as Parameters<typeof this.graph.addEdge>[0],
      target as Parameters<typeof this.graph.addEdge>[1]
    );
    return this;
  }

  addConditionalEdges(
    source: typeof START | NODE_NAME,
    condition: (state: StateOf<A>) => string,
    pathMap?: Record<NODE_NAME, typeof END | NODE_NAME>
  ): this {
    this.graph = this.graph.addConditionalEdges(
      source as Parameters<typeof this.graph.addConditionalEdges>[0],
      condition as unknown as Parameters<typeof this.graph.addConditionalEdges>[1],
      pathMap as Parameters<typeof this.graph.addConditionalEdges>[2]
    );
    return this;
  }

  compile() {
    return this.graph.compile();
  }
}

export { Annotation, END, GraphWrapper, START };

