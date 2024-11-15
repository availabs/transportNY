import Create from './create';

const Table = ({ source }) => {
    return <div> Table View </div>
}

const FreightAtlashShapefileConfig = {
    table: {
        name: 'Table',
        path: '/table',
        component: Table
    },
    sourceCreate: {
        name: 'Create',
        component: Create
    }

}

export default FreightAtlashShapefileConfig
