import Create from './create';
import ManagePage from './manage';

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
    manage: {
        name: "Manage",
        path: "/manage",
        component: ManagePage,
    }
}

export default ExcessiveDelayConfig;
