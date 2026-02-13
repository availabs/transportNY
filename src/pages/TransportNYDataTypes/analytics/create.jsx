import React, { useEffect, useMemo, useContext, useState, Fragment } from 'react';
import { getExternalEnv } from "~/modules/dms/packages/dms/src/patterns/datasets/utils/datasources";
import { DatasetsContext } from '~/modules/dms/packages/dms/src/patterns/datasets/context.js';
import Publish from "./publish";


const Create = ({ source }) => {
    const [loading, setLoading] = useState(false);
    const { user, datasources } = useContext(DatasetsContext);
    const pgEnv = getExternalEnv(datasources);

    return (
        <div className="w-full p-5 m-5">
            {source?.name ? <Fragment>
                <Publish
                    pgEnv={pgEnv}
                    loading={loading}
                    user_id={user?.id}
                    type={source?.type}
                    name={source?.name}
                    setLoading={setLoading}
                    source_id={source?.source_id || null}
                />
            </Fragment>: null}
        </div>
    );
};

export default Create;