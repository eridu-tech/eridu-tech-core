import { IdentifierNode, OperationNodeTransformer } from "kysely";

import type {
    AliasNode,
    CommonTableExpressionNameNode,
    KyselyPlugin,
    PluginTransformQueryArgs,
    PluginTransformResultArgs,
    QueryResult,
    RootOperationNode,
    TableNode,
    UnknownRow,
} from "kysely";

/**
 * @internal
 */
export type KyselyTableNameMap = Partial<Record<string, string>>;

/**
 * @internal
 */
class KyselyTableAliasCollector extends OperationNodeTransformer {
    readonly aliases = new Set<string>();

    protected override transformAlias(node: AliasNode): AliasNode {
        if (node.node.kind === "TableNode" && IdentifierNode.is(node.alias)) {
            this.aliases.add(node.alias.name);
        }
        return super.transformAlias(node);
    }

    protected override transformCommonTableExpressionName(
        node: CommonTableExpressionNameNode,
    ): CommonTableExpressionNameNode {
        this.aliases.add(node.table.table.identifier.name);
        return super.transformCommonTableExpressionName(node);
    }
}

/**
 * @internal
 */
class KyselyTableNameTransformer extends OperationNodeTransformer {
    constructor(
        private readonly tableNames: KyselyTableNameMap,
        private readonly aliases: ReadonlySet<string>,
    ) {
        super();
    }

    protected override transformTable(node: TableNode): TableNode {
        const currentTableName = node.table.identifier.name;
        if (this.aliases.has(currentTableName)) {
            return super.transformTable(node);
        }

        const resolvedTableName = this.tableNames[currentTableName];
        if (
            resolvedTableName === undefined ||
            resolvedTableName === currentTableName
        ) {
            return super.transformTable(node);
        }

        return super.transformTable({
            ...node,
            table: {
                ...node.table,
                identifier: {
                    ...node.table.identifier,
                    name: resolvedTableName,
                },
            },
        });
    }
}

/**
 * @internal
 */
export class WithKyselyTableName implements KyselyPlugin {
    constructor(private readonly tableNames: KyselyTableNameMap) {}

    transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
        const aliasCollector = new KyselyTableAliasCollector();
        aliasCollector.transformNode(args.node);
        const transformer = new KyselyTableNameTransformer(
            this.tableNames,
            aliasCollector.aliases,
        );
        return transformer.transformNode(args.node, args.queryId);
    }

    transformResult(
        args: PluginTransformResultArgs,
    ): Promise<QueryResult<UnknownRow>> {
        return Promise.resolve(args.result);
    }
}
