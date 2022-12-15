export default request => {
  const {
    tmcArray,
    startDate,
    endDate,
    startTime,
    endTime,
    weekdays,
    resolution,
    dataColumn,
    dataType,
    state = 'ny'
  } = request;
console.log("?????",[
  tmcArray,
  startDate,
  endData,
  startTime,
  endTime,
  weekdays,
  resolution,
  dataColumn,
  dataType,
  state
].join("|"))
  return [
    tmcArray,
    startDate,
    endData,
    startTime,
    endTime,
    weekdays,
    resolution,
    dataColumn,
    dataType,
    state
  ].join("|")
  return `${ tmcArray.join(',') }|${ startDate }|${ endDate }|${ startTime }|${ endTime }|${ weekdays.join(',') }|${ resolution }|${ dataColumn }|${ dataType }|${ state }`;
}
