import Create from './create';
import Manage from './manage';
import ManageCongestion from "./manage_congestion";

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
    congestion: {
        name: "Congestion",
        path: "/congestion",
        component: ManageCongestion
    }
}

export default TranscomCongestionConfig;
