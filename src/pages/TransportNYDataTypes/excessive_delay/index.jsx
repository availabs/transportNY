import MapPage from "~/pages/DataManager/DataTypes/gis_dataset/pages/Map";
import Create from './create';
import Table from '../npmrds_meta/table';

const ExcessiveDelayConfig = {
    add_version: {
        name: "Add Version",
        path: "/add_version",
        component: Create,
    },
    sourceCreate: {
        name: 'Create',
        component: Create
    },
    // map: {
    //     name: "Map",
    //     path: "/map",
    //     component: MapPage,
    // },
    // table: {
    //     name: "Table",
    //     path: "/table",
    //     component: Table,
    // },
}

export default ExcessiveDelayConfig;
