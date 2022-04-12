export const REGIONS = [
    {
        "region": "REGION|1",
        "name": "Capital District"
    },
    {
        "region": "REGION|2",
        "name": "Mohawk Valley"
    },
    {
        "region": "REGION|3",
        "name": "Central New York"
    },
    {
        "region": "REGION|4",
        "name": "Genesee Valley"
    },
    {
        "region": "REGION|5",
        "name": "Western New York"
    },
    {
        "region": "REGION|6",
        "name": "Southern Tier/Central New York"
    },
    {
        "region": "REGION|7",
        "name": "North Country"
    },
    {
        "region": "REGION|8",
        "name": "Hudson Valley"
    },
    {
        "region": "REGION|9",
        "name": "Southern Tier"
    },
    {
        "region": "REGION|10",
        "name": "Long Island"
    },
    {
        "region": "REGION|11",
        "name": "New York City "
    }
]

export const F_SYSTEMS = [1, 2, 3, 4, 5, 6, 7];

const calcMonths = () => {
  var date = new Date()
  let dates = []
  while(date > new Date(2015,12,31)) {
    dates.push(`${ date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2,'0')}`)
    date.setMonth(date.getMonth() - 1);
  }
  return dates
}

export const MONTHS = calcMonths()