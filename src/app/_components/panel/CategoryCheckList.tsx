import { currentDatasetAtom } from '@/app/_jotai/operation';
import useFilter, { CategoryFilterItem, filterAtom } from '@/app/_jotai/useFilter';
import { OptionItem } from '@/app/_types/types';
import { useAtom } from 'jotai';
import React, { useCallback, useMemo } from 'react';
import { Form } from 'react-bootstrap';
import PushToggle from '../common/PushToggle';

type CategoryItem = OptionItem & {
    checked: boolean;
}

type CategoryGroup = {
    dbName: string;
    dbId: string;
    propertyName: string;
    propertyId: string;
    items: CategoryItem[];
}

/**
 * フィルタ対象となるプロパティ項目を選択するパネル
 * @returns 
 */
export default function CategoryCheckList() {
    const [ currentDataset ] = useAtom(currentDatasetAtom);
    const [ filter ] = useAtom(filterAtom);

    const categoryGroup = useMemo((): CategoryGroup[] => {
        if (!currentDataset) {
            return [];
        }
        const networkDefine = currentDataset.networkDefine;
        const result = [] as CategoryGroup[];
        const isCateogoryFiltering = Object.values(filter.categories).some(val => !val);

        networkDefine.dbList.forEach(db => {
            db.properties.forEach(prop => {
                const options = (() => {
                    if (prop.type === 'multi_select') return prop.multi_select.options;
                    if (prop.type === 'select') return prop.select.options;
                    return [];
                })();
                const items = options.map(opt => {
                    const key = db.id + '-' + prop.id + '-' + opt.id;
                    let checked;
                    if(!isCateogoryFiltering) {
                        checked = false;
                    } else {
                        checked = filter.categories[key] !== undefined ? filter.categories[key] : true;
                    }

                    return Object.assign({}, opt, { checked });
                });
                if (items && items?.length > 0) {
                    result.push({
                        dbName: db.name,
                        dbId: db.id,
                        propertyName: prop.name,
                        propertyId: prop.id,
                        items,
                    });
                }
            })
        });
        return result;
    }, [currentDataset, filter]);

    const { setCategoryFilter } = useFilter();
    const onClick = useCallback((targetGroup: CategoryGroup, itemId: string) => {
        const categories = [] as CategoryFilterItem[];
        categoryGroup.forEach(group => {
            group.items.forEach(item => {
                const isTarget = (group.dbId === targetGroup.dbId && 
                                    group.propertyId === targetGroup.propertyId &&
                                    item.id === itemId);
                // 押下されたものでフィルタをかける
                const isShow = isTarget ? true : false;

                categories.push({
                    dbId: group.dbId,
                    propertyId: group.propertyId,
                    optionId: item.id,
                    isShow,
                });
            });
        });
        setCategoryFilter(categories);

    }, [categoryGroup, setCategoryFilter]);

    if (categoryGroup.length === 0) {
        return null;
    }
    return (
        <Form>
            {categoryGroup.map(group => {
                const groupId = group.dbId + '-' + group.propertyId;
                return (
                    <div key={groupId}>
                        <span>{group.dbName}-{group.propertyName}</span>
                        <div>
                            {group.items.map(item => {
                                const itemId = groupId + '-' + item.id;
                                return (
                                    <PushToggle key={itemId} color={item.color} value={item.checked} onChange={()=>onClick(group, item.id)}>
                                        {item.name}
                                    </PushToggle>
                                    // <Form.Check inline type="checkbox" 
                                    //     label={item.name} 
                                    //     id={itemId}
                                    //     checked={item.checked}
                                    //     onChange={(e)=>onChange(group, item.id, e)} key={itemId} />
                                )
                            })}
                        </div>
                    </div>
                )
            })}
        </Form>
    );
}
