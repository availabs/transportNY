export const SourceAttributes = {
  "id": "id",
  "name": "name",
  "update_interval": "update_interval",
  "category": "category",
  "categories": "categories",
  "description": "description",
  "statistics": "statistics",
  "metadata": "metadata",
}

export const ViewAttributes = {
  "id": "id",
  "source_id": "source_id",
  "data_type": "data_type",
  "interval_version": "interval_version",
  "geography_version": "geography_version",
  "version": "version",
  "source_url": "source_url",
  "publisher": "publisher",
  "data_table": "data_table",
  "download_url": "download_url",
  "tiles_url": "tiles_url",
  "start_date": "start_date",
  "end_date": "end_date",
  "last_updated": "last_updated",
  "statistics": "statistics",
}

export const getAttributes = (data) => {
  return Object.entries(data)
    .reduce((out,attr) => {
      const [k,v] = attr
      typeof v.value !== 'undefined' ? 
        out[k] = v.value : 
        out[k] = v
      return out 
    },{})
}