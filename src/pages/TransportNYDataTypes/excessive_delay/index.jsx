import Create from './create';
import ManagePage from './manage';
import Table from '../npmrds_meta/table';

const ExcessiveDelayConfig = {
    // add_version: {
    //     name: "Add Version",
    //     path: "/add_version",
    //     component: Create,
    // },
    sourceCreate: {
        name: 'Create',
        component: Create
    },
    manage: {
        name: "Manage",
        path: "/manage",
        component: ManagePage,
    },
    table: {
        name: "Table",
        path: "/table",
        component: Table,
    },
}

export default ExcessiveDelayConfig;
