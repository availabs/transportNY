import Create from './create';
import Manage from './manage';

const TranscomCongestionConfig = {
    sourceCreate: {
        name: 'Create',
        component: Create
    },
    manage: {
        name: "Manage",
        path: "/manage",
        component: Manage,
    },
}

export default TranscomCongestionConfig;
