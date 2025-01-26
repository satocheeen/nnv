/* eslint-disable @typescript-eslint/ban-ts-comment */
import React, { useEffect, useRef } from 'react';
import cytoscape, { EdgeSingular, NodeSingular } from 'cytoscape';
import { NetworkDefine } from '@/app/_types/types';
import styles from './SettingChart.module.scss';
import { getPropertyName, getRelationKey } from '@/app/_util/utility';

type SelectTarget = {
    type: 'db' | 'relation';
    id: string;
}
type Props = {
    define: NetworkDefine;
    onSelect?: (target: SelectTarget | undefined) => void;
}

export default function SettingChart(props: Props) {
    const myRef = useRef(null as HTMLDivElement | null);
    const cyRef = useRef(undefined as undefined | cytoscape.Core);

    // Cytoscape初期化
    useEffect(() => {
        if (myRef.current === null) {
            console.warn('CytoscapeRef要素が見つかりません');
            return;
        }

        cyRef.current = cytoscape({
            container: myRef.current,
            wheelSensitivity: .2,
            maxZoom: 2,
            style: [
                {
                    selector: 'node',
                    style: {
                        label: 'data(name)',
                        "text-valign" : "bottom",
                        "text-halign": "center",
                        "border-width": 2,
                        //@ts-ignore
                        shape: 'data(shape)',
                        'background-opacity': .5,
                        'border-color':'#555',
                    }
                },
                {
                    selector: 'node:selected',
                    style: {
                        'background-color':'#CED979',
                        'border-color':'#CED979',
                    }
                },
                {
                    selector: 'edge',
                    style: {
                        'source-label': 'data(sourceLabel)',
                        'source-text-offset': 11,
                        // @ts-ignore
                        "source-arrow-shape": "data(sourceArrow)",
                        'target-label': 'data(targetLabel)',
                        'target-text-offset': 11,
                        // @ts-ignore
                        "target-arrow-shape": "data(targetArrow)",
                        "curve-style": "bezier",
                        'font-size': 10,
                        width: 2,
                    },
                },
                {
                    selector: 'edge:selected',
                    style: {
                        'line-color':'#CED979',
                    }
                },
            ],
        });

        cyRef.current.on('select', e => {
            if (!props.onSelect) {
                return;
            }
            if (e.target.isNode()) {
                const target = e.target as NodeSingular;
                props.onSelect({
                    type: 'db', 
                    id: target.id()
                });
            } else if (e.target.isEdge()) {
                const target = e.target as EdgeSingular;
                props.onSelect({
                    type: 'relation', 
                    id: target.id()
                });
            }
        })

        cyRef.current.on('unselect', () => {
            if (cyRef.current?.$(':selected').length === 0 && props.onSelect) {
                props.onSelect(undefined);
            }
        })

        // mouse cursor pointer
        const cursorChangeFunc = (event: cytoscape.EventObject, cursor: 'pointer' | 'default') => {
            const container = event.cy.container();
            if(container) {
                container.style.cursor = cursor;
            }
        }
        cyRef.current.on('mouseover', 'node', e => {
            cursorChangeFunc(e, 'pointer');
        });
        cyRef.current.on('mouseout', 'node', e => {
            cursorChangeFunc(e, 'default');
        });
        cyRef.current.on('mouseover', 'edge', e => {
            cursorChangeFunc(e, 'pointer');
        });
        cyRef.current.on('mouseout', 'edge', e => {
            cursorChangeFunc(e, 'default');
        });

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (cyRef.current === undefined) {
            return;
        }

        const nodeData = props.define.dbList.map(db => {
            return {
                group: 'nodes',
                data: {
                    id: db.id,
                    name: db.name,
                    shape: db.nodeStyle ? db.nodeStyle : 'ellipse',
                }
            } as cytoscape.ElementDefinition;
        });

        nodeData.filter(db => {
            return cyRef.current?.$id(db.data.id as string).length !== 0;
        }).forEach(db => {
            const element = cyRef.current?.$id(db.data.id as string);
            element?.data(db.data);
        });

        const addNodeData = nodeData.filter(db => {
            // チャートに追加されていないもののみ追加
            return cyRef.current?.$id(db.data.id as string).length === 0;
        });
        cyRef.current.add(addNodeData);
        cyRef.current.forceRender();

        // なくなったノードは削除
        cyRef.current.nodes().forEach(node => {
            const exist = props.define.dbList.some(db => db.id === node.id());
            if (!exist) {
                node.remove();
            }
        })

        props.define.relationList.forEach(relation => {
            const fromLabel = getPropertyName(relation.from, props.define);
            const toLabel = getPropertyName(relation.to, props.define);
            const edge = {
                group: 'edges',
                data: {
                    id: getRelationKey(relation),
                    source: relation.from.dbId,
                    target: relation.to.dbId,
                    sourceLabel: fromLabel,
                    targetLabel: toLabel,
                    sourceArrow: relation.arrowStyle?.from  ? relation.arrowStyle.from : 'none',
                    targetArrow: relation.arrowStyle?.to  ? relation.arrowStyle.to : 'none',
                },
            } as cytoscape.ElementDefinition;
            const existEdge = cyRef.current?.$id(edge.data.id as string);
            if (existEdge === undefined || existEdge.length === 0) {
                cyRef.current?.add(edge);
            } else {
                // 更新
                existEdge.data(edge.data);
            }
        });

        // なくなったエッジは削除
        cyRef.current.edges().forEach(edge => {
            const exist = props.define.relationList.some(rel => getRelationKey(rel) === edge.id());
            if (!exist) {
                edge.remove();
            }
        })
        
        if (addNodeData.length > 0) {
            cyRef.current.layout({
                name: 'cose',
                fit: true,
                animate: false,
                stop: () => {
                }
            }).run();
        }

    }, [props.define]);

    return (
        <div className={styles.Container}>
            <div ref={myRef} className={styles.Chart} />
        </div>
    );
}