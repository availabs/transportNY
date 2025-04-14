
import React, { useState } from 'react';
import { Table } from '~/modules/avl-components/src'
import get from 'lodash/get'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'

import { DamaContext } from "~/pages/DataManager/store";

const ViewSelector = ({ views }) => {
    const { viewId, sourceId, page } = useParams()
    const [searchParams] = useSearchParams();
    const variable = searchParams.get("variable")
    const navigate = useNavigate()
    const { baseUrl } = React.useContext(DamaContext)

    const activeViewId = variable && !viewId ? variable : viewId;

    return (
        <div className="flex">
            <div className="py-3.5 px-2 text-sm text-gray-400">Version:</div>
            <div className="flex-1">
                <select
                    className="pl-3 pr-4 py-2.5 border border-blue-100 bg-blue-50 w-full bg-white mr-2 flex items-center justify-between text-sm"
                    value={activeViewId}
                    onChange={(e) => navigate(`${baseUrl}/source/${sourceId}/${page}/${e.target.value}`)}
                >
                    {views
                        ?.sort((a, b) => b.view_id - a.view_id)
                        .map((v, i) => (
                            <option key={i} className="ml-2  truncate" value={v.view_id}>
                                {v.version ? v.version : v.view_id}
                            </option>
                        ))}
                </select>
            </div>
        </div>
    );
};

const DefaultTableFilter = () => <div />;

const identityMap = (tableData, attributes) => {
    return {
        data: tableData,
        columns: attributes?.map((d) => ({
            Header: d,
            accessor: d,
        })),
    };
};

const TablePage = ({
    source,
    views,
    transform = identityMap,
    filterData = {},
    TableFilter = DefaultTableFilter,
    showViewSelector = true,
    fullWidth = false,
    striped = false
}) => {
    const { viewId } = useParams();
    const [filters, _setFilters] = useState(filterData);
    const setFilters = React.useCallback(filters => {
        _setFilters(prev => ({ ...prev, ...filters }));
    }, []);

    const { pgEnv, falcor, falcorCache, user } = React.useContext(DamaContext);

    const activeView = React.useMemo(() => {
        return get(
            views?.filter((d) => d.view_id === parseInt(viewId)),
            "[0]",
            views[0]
        );
    }, [views, viewId]);
    const activeViewId = React.useMemo(
        () => get(activeView, `view_id`, null),
        [activeView]
    );

    React.useEffect(() => {
        falcor
            .get(["dama", pgEnv, "viewsbyId", activeViewId, "data", "length"])
    }, [pgEnv, activeViewId]);

    const dataLength = React.useMemo(() => {
        return get(
            falcorCache,
            ["dama", pgEnv, "viewsbyId", activeViewId, "data", "length"],
            "No Length"
        );
    }, [pgEnv, activeViewId, falcorCache]);

    const attributes = React.useMemo(() => {
        let md = get(source, ["metadata", "columns"], get(source, "metadata", []));
        if (!Array.isArray(md)) {
            md = [];
        }

        return md
            .filter((d) => ["integer", "string", "number", "array"].includes(d.type))
            .map((d) => d.name);
    }, [source]);

    React.useEffect(() => {
        if (dataLength > 0) {
            let maxData = Math.min(dataLength, 10000);

            console.log("requested: ", [
                "dama",
                pgEnv,
                "viewsbyId",
                activeViewId,
                "databyIndex",
                Array.from(Array(maxData - 1).keys()),
                attributes,
            ]);

            falcor
                .chunk(
                    [
                        "dama",
                        pgEnv,
                        "viewsbyId",
                        activeViewId,
                        "databyIndex",
                        Array.from(Array(maxData - 1).keys()),
                        attributes,
                    ]
                );
        }
    }, [pgEnv, activeViewId, dataLength, attributes]);

    const tableData = React.useMemo(() => {
        let data = Object.values(
            get(
                falcorCache,
                ["dama", pgEnv, "viewsbyId", activeViewId, "databyIndex"],
                []
            )
        ).map((d) => get(falcorCache, d.value, {}));
        return data;
    }, [pgEnv, activeViewId, falcorCache, dataLength]);

    const { data, columns } = React.useMemo(
        () => transform(tableData, attributes, filters, [], source),
        [tableData, attributes, transform, filters, [], source]
    );

    const [sortBy, sortOrder] = React.useMemo(() => {
        const col = columns.filter(d => d.sortBy)?.[0]
        return [col?.accessor || '', col?.sortBy || 'asc']
    }, [columns])

    const [tableContainerStyle, tableContainerClassName] = React.useMemo(() => {
        const fullWidthStyle = { width: "96vw", position: "relative", left: "calc(-50vw + 50%)" };
        const fullWidthClass = "mt-2 mx-12";
        const defaultWidthStyle = {};
        const defaultWidthClass = "max-w-6xl";

        return fullWidth ? [fullWidthStyle, fullWidthClass] : [defaultWidthStyle, defaultWidthClass];
    }, [fullWidth])


    return (
        <div>
            <div className="flex">
                {showViewSelector ? <ViewSelector views={views} /> : ''}
            </div>
            <div className={tableContainerClassName} style={tableContainerStyle}>
            <Table
                    striped={striped}
                    data={data}
                    columns={columns}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    pageSize={50}
                />
            </div>
        </div>
    );
};

export default TablePage;
