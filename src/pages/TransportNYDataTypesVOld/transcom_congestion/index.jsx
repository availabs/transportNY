import Create from './create';
import ManagePage from './manage';

const TranscomCongestionConfig = {
    sourceCreate: {
        name: 'Create',
        component: Create
    },
    manage: {
        name: "Manage",
        path: "/manage",
        component: ManagePage,
      },
}

export default TranscomCongestionConfig;
