/* eslint-disable @typescript-eslint/no-explicit-any */
import cytoscape, { EdgeSingular, NodeSingular } from 'cytoscape';
import cycxtmenu, { Command } from 'cytoscape-cxtmenu';
import edgehandles from 'cytoscape-edgehandles';
import chartStyles from './styles';
import { TFunction } from 'i18next';
import { DataSet, Edge, NodeItem, RelationDefineKey, Filter, GuideKind, TempGuideKind, DbDefine } from '../../_types/types';
import * as EventController from '../../_util/EventController';
import { getEdgeKey, getRelationKey } from '../../_util/utility';
import notionLogo from '../../assets/notion-logo.png';
import { Colors } from '@/app/_util/const';

cytoscape.use(cycxtmenu);
cytoscape.use(edgehandles);

type GuideControllerType = {
    setTempGuide: (kind: TempGuideKind, onCancel?: () => void) => void;
    clearTempGuide: () => void;
    // 指定のガイドは操作済みとして表示しなくする
    operatedGuide: (kind: GuideKind) => void;
}
// インスタンス初期舵パラメタ
type Param = {
    container: HTMLDivElement;
    t: TFunction;

    // ノード移動時のコールバック
    onNodeMove: (args: {
        datasetId: string;  // TODO: 親側で設定するように変更
        dbId: string;
        id: string;
        position: {x: number; y: number};
    }) => void;

    // 再レイアウト処理開始時のコールバック
    onRelayoutStart: () => void;
    // 再レイアウト処理終了時のコールバック
    onRelayoutEnd: () => void;

    // 新規ページ作成メニュークリック時のコールバック
    onCreatePageMenuClicked: (args: {
        target: DbDefine;
        position?: {x: number; y: number;}
    }) => void;

    // リレーション作成時のコールバック
    onRelationCreated: (args: Edge) => void;
    // リレーション削除時のコールバック
    onRelationRemoveed: (args: Edge) => void;

    // エラー時のコールバック
    onError: (msg: string) => void;

    guideController: GuideControllerType;
}
export default class Chart {
    cy: cytoscape.Core;
    cyEh: edgehandles.EdgeHandlesInstance;
    items: NodeItem[] = [];
    edges: Edge[] = [];
    coreMenu: cycxtmenu.MenuInstance | null = null;  // チャート盤面用のメニューインスタンス
    nodeMenues: cycxtmenu.MenuInstance [] = [];
    lastClickedPosition = {x:0, y:0};    // 最後にクリックした位置（ページ追加時の位置記憶）
    cyEhInfo = {
        sourceNode: undefined as NodeSingular | undefined,  // 開始していない場合は、undefined
        stopableFlag: false,    // cyEhがStop可能な状態かのフラグ
    }

    // 親からもらうもの
    _param: Param;
    // _t: TFunction;
    // _guideController: GuideControllerType;

    dataset: DataSet | null = null;

    eventH: number;

    constructor(param: Param) {
        this._param = param;

        this.cy = cytoscape({
            container: param.container,
            style: chartStyles,
            wheelSensitivity: .1,
            maxZoom: 3,
        });

        // エッジハンドルの初期化
        this.cyEh = this.cy.edgehandles({
            canConnect: this.canConnect.bind(this),
            disableBrowserGestures: false,
        });
        this.cy.on('ehstart ', (event, sourceNode: NodeSingular) => {
            this.cyEhInfo = {
                sourceNode,
                stopableFlag: false,
            };
        });
        this.cy.on('ehcomplete', (event, sourceNode: NodeSingular, targetNode: NodeSingular, addedEdge: EdgeSingular) => {
            this.cyEhInfo.stopableFlag = true;
            this._createRelation(sourceNode, targetNode, addedEdge);
        });
        this.cy.on('ehstop ', (event, sourceNode: NodeSingular) => {
            // キャンセルボタン押下以外のキャンセルは受け付けない
            if (!this.cyEhInfo.stopableFlag) {
                this.cyEh.start(sourceNode);
                return;
            }
            this._param.guideController.clearTempGuide();
            this.cyEhInfo = {
                sourceNode: undefined,
                stopableFlag: false,
            };
        });

        // メニュー追加
        this.cy.cxtmenu({
            selector: 'edge',
            commands: [
                {
                    content: this._param.t('Remove_Relation'),
                    fillColor: 'rgba(150,10,10,0.5)',
                    select: async(element) => {
                        if (!element.isEdge()) {
                            console.warn('not edge', element);
                            return;
                        }
                        this._param.guideController.operatedGuide(GuideKind.EdgeClick);
                        this._removeRelation(element);
                    }
                }
            ]
        });

        // mouse cursor pointer
        const cursorChangeFunc = (event: cytoscape.EventObject, cursor: 'pointer' | 'default') => {
            const container = event.cy.container();
            if(container) {
                container.style.cursor = cursor;
            }
        }
        this.cy.on('mouseover', 'node', e => {
            cursorChangeFunc(e, 'pointer');
        });
        this.cy.on('mouseout', 'node', e => {
            cursorChangeFunc(e, 'default');
        });
        this.cy.on('mouseover', 'edge', e => {
            cursorChangeFunc(e, 'pointer');
        });
        this.cy.on('mouseout', 'edge', e => {
            cursorChangeFunc(e, 'default');
        });
        
        // マウス位置記憶
        this.cy.on('cxttapstart', (e) => {
            // ノード追加位置として記憶
            this.lastClickedPosition = e.position;
        });

        // 位置変更記録
        this.cy.on('position', (e) => {
            if(e.target.isNode()) {
                const target = e.target as NodeSingular;
                const dbId = target.data().dbId as string;
                if (!target.data('dbId')) {
                    // エッジハンドルで一時的に生成されるノードは無視
                    return;
                }
                // console.log('move', target.id(), target.position());
                this._param.onNodeMove({
                    datasetId: this.dataset?.id ?? '',
                    dbId: dbId,
                    id: target.id(),
                    position: target.position(),
                })
            }
        });

        // 選択ノードと繋がっているノードを強調表示
        this.cy.on('select', (e) => {
            console.log(e.target.id());
            if(e.target.isNode()) {
                if (this.cyEhInfo.sourceNode) {
                    // エッジハンドルモードの場合、手動で関係追加
                    const canConnect = this.canConnect(this.cyEhInfo.sourceNode, e.target);
                    if (!canConnect) {
                        return;
                    }
                    this.cyEhInfo.stopableFlag = true;
                    this._createRelation(this.cyEhInfo.sourceNode, e.target);
                    this.cyEh.stop();
        
                } else {
                    const allEles = this.cy.elements();
                    const target = e.target as NodeSingular;
                    const neighbors = target.neighborhood();
                    const others = allEles?.not(neighbors);
                    neighbors.addClass('neighbor');
                    others?.removeClass('neighbor');
                }
            }
        });
        this.cy.on('unselect', (e) => {
            console.log('unselect', e.target.id());
            this.cy.elements().removeClass('neighbor');
        });

        // 再レイアウト実行
        this.eventH = EventController.addEventListener(EventController.Event.ChartReLayout, () => {
            const options = {
                name: 'cose',
                animate: 'end',
                animationEasing: undefined,
                animationDuration: 500,
              
                fit: true,
                // Padding on fit
                padding: 30,
                // Randomize the initial positions of the nodes (true) or use existing positions (false)
                randomize: true,

                stop: () => {
                    console.log('layout stop');
                    this._param.onRelayoutEnd();
                    // this.operation.setLoadingAction(false);
                },
            };
            this._param.onRelayoutStart();
            // this.operation.setLoadingAction(true);
            this.cy.layout(options).run();
        });
    }

    destroy() {
        console.log('destroy chart');
        EventController.removeEventListener(this.eventH);
        this.cyEh.destroy();
        this.coreMenu?.destroy();
        this.cy.destroy();
    }

    setDataset(dataset: DataSet) {
        if (this.dataset?.id !== dataset.id) {
            this.cy.elements().remove();
        }

        this.dataset = dataset;
        this.items = Object.values(dataset.dataMap).reduce((acc, cur) => {
            return acc.concat(cur.items);
        }, [] as NodeItem[]);

        this.edges = dataset.edges.filter(edge => {
            // 両端がロード済みのものに絞る
            const fromExist = this.items.some(item => item.id === edge.from);
            if (!fromExist) {
                return false;
            }
            const toExist = this.items.some(item => item.id === edge.to);
            if (!toExist) {
                return false;
            }
            return true;
        });

        // メニュー再設定
        if (this.coreMenu) {
            this.coreMenu.destroy();
        }
        this.coreMenu = this.cy.cxtmenu({
            selector: 'core',
            fillColor: 'rgba(10,150,10,0.5)',
            commands: dataset.networkDefine.dbList.map(dbDef => {
                return {
                    content: this._param.t('Create_Page', {name: dbDef.name}),
                    select: () => {
                        // this.operation.operatedGuide(GuideKind.CoreClick);
                        // this.operation.showCreatePageDialog(dbDef, this.lastClickedPosition);
                        this._param.onCreatePageMenuClicked({
                            target: dbDef,
                            position: this.lastClickedPosition,
                        })
                    }
                };
            }),
        });

        // ノードメニュー
        this.nodeMenues.forEach(menu => menu.destroy());
        const commonNodeCommands = [
            {
                content: '<span>' + this._param.t('Open_Notion', '') + '</span><img src="' + notionLogo + '" width="40" alt="Notion Logo" />',
                select: (element) => {
                    // this.operation.operatedGuide(GuideKind.NodeClick);
                    this._param.guideController.operatedGuide(GuideKind.NodeClick);
                    this._openNotionPage(element.id());
                },
            }, {
                content: this._param.t('Create_Relation'),
                fillColor: 'rgba(10,10,150,0.5)',
                select: (element) => {
                    if (!element.isNode()) {
                        console.warn('not node: ', element);
                        return;
                    }

                    this._param.guideController.operatedGuide(GuideKind.NodeClick);
                    this._param.guideController.setTempGuide(TempGuideKind.CreateRelation, () => {
                        // cancel
                        this.cyEhInfo.stopableFlag = true;
                        this.cyEh.stop();
                    });
                    this.cyEh.start(element);
                }
            }
        ] as Command[];
        this.nodeMenues = this.dataset?.networkDefine.dbList.map(db => {
            const urlProp = db.properties.filter(p => p.type === 'url' && p.isUse);
            const commands = urlProp.reduce((acc, prop) => {
                return acc.concat({
                    content: prop.name,
                    fillColor: 'rgba(150, 10, 10, 0.5)',
                    select: (element) => {
                        const urlProp = element.data('urlProp');
                        const url = urlProp ? urlProp[prop.id] : undefined;
                        console.log('url', url);
                        if (url) {
                            window.open(url, '_blank');
                        } else {
                            this._param.onError(this._param.t('Warn_UrlNotExist'));
                            // this.confirm({
                            //     mode: DialogMode.OkOnly,
                            //     message: this.t('Warn_UrlNotExist'),
                            // });
                        }
                    },
                });
            }, commonNodeCommands);
            return  this.cy.cxtmenu({
                selector: 'node:grabbable[dbId = "' + db.id + '"]',
                activeFillColor: 'rgba(10,10,150,0.5)',
                commands,
            });
        });
    }

    _openNotionPage(id: string) {
        const hit = this.items.find(item => item.id === id);
        if (!hit) {
            console.warn('targetなし', id,);
            return;
        }
        window.open(hit.url, '_blank');
    }

    /**
     * ２つのノードを繋ぐエッジ情報を返す。
     * @returns 
     */
    _createEdgeFromNodeIds(node1: NodeSingular, node2: NodeSingular): Edge[] {
        const sourceId = node1.id();
        const sourceDb = node1.data('dbId');
        const targetId = node2.id();
        const targetDb = node2.data('dbId');

        const candidateRelations = this.dataset?.networkDefine.relationList.filter(relation => {
            if (relation.from.dbId === sourceDb && relation.to.dbId === targetDb) {
                return true;
            }
            if (relation.to.dbId === sourceDb && relation.from.dbId === targetDb) {
                return true;
            }
            return false;
        });

        if (candidateRelations === undefined || candidateRelations?.length === 0) {
            console.warn('該当リレーションなし');
            return [];
        }

        return candidateRelations.map(relDef => {
            // 向き判定
            let from;
            let to;
            if (relDef.from.dbId === sourceDb) {
                from = sourceId;
                to = targetId;
            } else {
                from = targetId;
                to = sourceId;
            }
            return {
                def: relDef as RelationDefineKey,
                from,
                to,
            } as Edge;
        });

    }
    
    async _createRelation(sourceNode: NodeSingular, targetNode: NodeSingular, addedEdge?: EdgeSingular) {
        const candidateEdges = this._createEdgeFromNodeIds(sourceNode, targetNode);

        if (candidateEdges.length === 0) {
            console.warn('該当リレーションなし');
            return;
        }
        // TODO: 候補が複数ある場合は選択させる
        const edgeInfo = candidateEdges[0];

        // IDが仮付与されたもので変更できないので、ここでは一旦削除。redrawの中で再描画。
        if (addedEdge) {
            addedEdge.remove();
        }

        // リレーションを登録
        this._param.onRelationCreated(edgeInfo);
        // try {
        //     await this.dataHook.createRelation(edgeInfo);
        // } catch(e) {
        //     this.confirm({
        //         mode: DialogMode.OkOnly,
        //         message: this.t('Error_CreateRelation') + '\n' + e,
        //     });
        // }
    }

    async _removeRelation(edge: EdgeSingular) {
        try {
            const from = edge.source().id();
            const to = edge.target().id();
            const def = edge.data('def');
            this._param.onRelationRemoveed({
                def,
                from,
                to,
            })
            // await this.dataHook.removeRelation({
            //     def,
            //     from,
            //     to,
            // });
        } catch (e) {
            this._param.onError(this._param.t('Error_RemoveRelation') + '\n' + e);
            // this.confirm({
            //     mode: DialogMode.OkOnly,
            //     message: this.t('Error_RemoveRelation') + '\n' + e,
            // });
        }
    }

    redraw() {
        console.log('redraw');
        if (this.cy.destroyed() || !this.dataset) {
            return;
        }

        const isInit = this.cy.elements().length === 0;
        const nodeData = [] as cytoscape.ElementDefinition[];
        Object.entries(this.dataset.dataMap).forEach(([dbId, dbData]) => {
            const dbDef = this.dataset?.networkDefine.dbList.find(db => db.id === dbId);
            // 追加or更新
            dbData.items.forEach(item => {
                // 色決定
                let color = Colors.default;
                dbDef?.properties.some(prop => {
                    const value = item.filterPropertyValue[prop.id];
                    if (!value) {
                        return false;
                    }
                    const hitOption = prop.options?.find(opt => {
                        return value.indexOf(opt.id) !== -1;
                    });

                    if (hitOption) {
                        color = Colors[hitOption.color] as string;
                        return true;
                    } else {
                        return false;
                    }
                });
                nodeData.push({
                    group: 'nodes',
                    data: {
                        id: item.id,
                        dbId: dbId,
                        name: item.name,
                        color,
                        shape: dbDef?.nodeStyle ? dbDef.nodeStyle : 'ellipse',
                        image: item.imageBase64 ? item.imageBase64 : 'none',
                        urlProp: item.urlPropertyValue,
                    },
                    position: this.dataset?.positionMap[dbId] ? this.dataset?.positionMap[dbId][item.id] : undefined,
                } as cytoscape.ElementDefinition);
                
            });

            // 削除されたものは削除する
            const deletedNodes = this.cy.nodes().filter(node => {
                if (dbId !== node.data('dbId')) {
                    // 異なるDBの要素はチェックしない
                    return false;
                }
                const hit = dbData.items.find(item => item.id === node.id());
                return !hit;
            });
            deletedNodes?.remove();
        });

        // レイアウト対象
        let needLayoutNodes = this.cy.collection();
        nodeData.forEach(d => {
            if (!d.data.id) {
                return;
            }
            const node = this.cy.$id(d.data.id);
            if(node?.length === 0) {
                const target = this.cy.add(d);
                if (target && !d.position) {
                    needLayoutNodes = needLayoutNodes?.union(target);
                }
            } else {
                node?.data(d.data);
            }
        });

        // エッジ
        this.edges.forEach(edge => {
            const edgeDef = this.dataset?.networkDefine.relationList.find(rel => {
                return getRelationKey(rel) === getRelationKey(edge.def);
            });
            
            const newEdge = {
                group: 'edges',
                data: {
                    id: getEdgeKey(edge),
                    source: edge.from,
                    target: edge.to,
                    def: edge.def,
                    sourceArrow: edgeDef?.arrowStyle?.from ? edgeDef.arrowStyle.from : 'none',
                    targetArrow: edgeDef?.arrowStyle?.to ? edgeDef.arrowStyle.to : 'none',
                },
            } as cytoscape.EdgeDefinition;

            const existEdge = this.cy.$id(newEdge.data.id as string);
            if (existEdge?.length === 0) {
                this.cy.add(newEdge);
            } else {
                existEdge.data(newEdge.data);
            }
        });

        // 削除されたものは削除する
        const delEdges = this.cy.edges().filter(edge => {
            const exist = this.edges.some(newEdge => {
                return newEdge.from === edge.source().id()
                        && newEdge.to === edge.target().id();
            });
            return !exist;
        });
        delEdges?.remove();

        // 追加したものはレイアウト
        if (needLayoutNodes.length > 0) {
            needLayoutNodes?.layout({
                name: 'random', // 'random', //'cose',
                fit: false,
                padding: 100,
                animate: false,
                stop: () => {
                    this.cy.fit();
                }
            }).run();
        } else if (isInit) {
            this.cy.fit(undefined, 100);
        }
    }

    /**
     * 指定のフィルタでチャート内アイテムの表示非表示を切り替える
     * @param filter フィルタ情報
     */
    setFilter(filter: Filter) {
        // 1つでもfalseになっているものがあったら、フィルタ中と判断
        const isCateogoryFiltering = Object.values(filter.categories).some(val => !val);

        let showNodes = this.cy.collection();// [] as NodeSingular[];
        this.cy.nodes().forEach(node => {
            if (!this.dataset) {
                return;
            }
            const id = node.id();
            const dbId = node.data('dbId') as string;
            const items = Object.values(this.dataset.dataMap).reduce((acc, data) => {
                return acc.concat(data.items);
            }, [] as NodeItem[]);
            const item = items.find(item => item.id === id);
            if (!item) {
                return;
            }
            let isShow = true;
            const name = node.data('name') as string;
            if (filter.keywords.length > 0) {
                // キーワードに合致するかチェック
                const hasKeyword = filter.keywords.every(keyword => {
                    return name.indexOf(keyword) !== -1;
                });
                if (!hasKeyword) {
                    isShow = false;
                }
            }
            if (isShow && isCateogoryFiltering) {
                const categoryKeys = [] as string[];
                Object.entries(item.filterPropertyValue).forEach(([key, value]) => {
                    value.forEach(val => {
                        categoryKeys.push(dbId + '-' + key + '-' + val);
                    })
                });
                isShow = categoryKeys.length === 0 ? false
                                : categoryKeys.some(ck => filter.categories[ck]);
            }
            if (isShow) {
                node.removeClass('disabled');
            } else {
                node.addClass('disabled');
            }
            if (isShow) {
                node.selectify();
                node.grabify();
            } else {
                node.unselectify();
                node.ungrabify();
            }
            if (isShow) {
                showNodes = showNodes.add(node);
            }
        });
        // 表示対象を繋ぐエッジのみ濃くする
        this.cy.edges().forEach(edge => {
            const isShow = showNodes.contains(edge.source()) && showNodes.contains(edge.target());
            if (isShow) {
                edge.addClass('show');
                edge.selectify();
            } else {
                edge.unselectify();
                edge.removeClass('show');
            }
        });

        // フィルタが掛かった対象に対してfitさせたかったが、フィルタしながらの移動やリレーション作成時に
        // 毎回fitされるので、ひとまずコメントアウト
        // if (showNodes.length > 0 && showNodes.length !== this.cy.nodes().length) {
        //     this.cy.fit(showNodes, 10);
        // }
    }

    canConnect(sourceNode: NodeSingular, targetNode: NodeSingular) {
        if (!this.dataset) {
            return false;
        }
        const sourceDbId = sourceNode.data('dbId') as string;
        const targetDbId = targetNode.data('dbId') as string;
        return this.dataset.networkDefine.relationList.some(relation => {
            if (relation.from.dbId === sourceDbId && relation.to.dbId === targetDbId) {
                return true;
            }
            if (relation.to.dbId === sourceDbId && relation.from.dbId === targetDbId) {
                return true;
            }
            return false;
        });
    }
    
}
