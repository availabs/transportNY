export const REGIONS = [
    {
        "region": "REGION|1",
        "name": "Region 1 - Capital District"
    },
    {
        "region": "REGION|2",
        "name": "Region 2 - Mohawk Valley"
    },
    {
        "region": "REGION|3",
        "name": "Region 3 - Central New York"
    },
    {
        "region": "REGION|4",
        "name": "Region 4 - Genesee Valley"
    },
    {
        "region": "REGION|5",
        "name": "Region 5 - Western New York"
    },
    {
        "region": "REGION|6",
        "name": "Region 6 - Southern Tier/Central New York"
    },
    {
        "region": "REGION|7",
        "name": "Region 7 - North Country"
    },
    {
        "region": "REGION|8",
        "name": "Region 8 - Hudson Valley"
    },
    {
        "region": "REGION|9",
        "name": "Region 9 - Southern Tier"
    },
    {
        "region": "REGION|10",
        "name": "Region 10 - Long Island"
    },
    {
        "region": "REGION|11",
        "name": "Region 11 - New York City "
    }
]

export const F_SYSTEMS = [1, 2, 3, 4, 5, 6, 7];



export const F_SYSTEM_MAP = {
  'All': [1, 2, 3, 4, 5, 6, 7],
  'Interstates ': [1],
  'Limited Access' : [2],
  'Arterials and Local': [3, 4, 5, 6, 7]
}
const calcMonths = () => {
  var date = new Date()
  let dates = []
  while(date > new Date(2015,12,31)) {

    dates.push({
        value: `${ date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2,'0')}`,
        name: date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    })
    date.setMonth(date.getMonth() - 1);
  }
  return dates
}

export const MONTHS = calcMonths()