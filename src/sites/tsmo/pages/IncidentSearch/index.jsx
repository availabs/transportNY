/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import IncidentsTable from './components/IncidentsTable';
import {
  useFalcor
} from "~/modules/avl-components/src"
import get from "lodash.get";
import Select from 'react-select'

const Home = () => {

  console.log("This we reached!!!");
  let defaultStartDate = new Date();
  defaultStartDate.setDate(defaultStartDate.getDate() - 3);
  let defaultEndDate = new Date();

  const defaultStartDay = defaultStartDate.getDate();
  const defaultStartMonth = defaultStartDate.getMonth() + 1;
  const defaultStartYear = defaultStartDate.getFullYear();

  const defaultEndDay = defaultEndDate.getDate();
  const defaultEndMonth = defaultEndDate.getMonth() + 1;
  const defaultEndYear = defaultEndDate.getFullYear();


  const initialStartDate = (`${defaultStartYear}-${defaultStartMonth < 10 ? '0' + defaultStartMonth : defaultStartMonth}-${defaultStartDay < 10 ? '0' + defaultStartDay : defaultStartDay}`);
  const initialEndDate = (`${defaultEndYear}-${defaultEndMonth < 10 ? '0' + defaultEndMonth : defaultEndMonth}-${defaultEndDay < 10 ? '0' + defaultEndDay : defaultEndDay}`);
  // This arrangement can be altered based on how we want the date's format to appear.
  const { falcor, falcorCache } = useFalcor();
  const [filters, setFilters] = useState({
    startDate: initialStartDate,
    endDate: initialEndDate
  });

  const localStorageData = localStorage.getItem('eventsFilters');
  const finalSelectedOption = JSON.parse(localStorageData?localStorageData:JSON.stringify({'selectedOptions': '',})).selectedOptions != '' ? JSON.parse(localStorage.getItem('eventsFilters')).selectedOptions : { "value": "New York", "label": "New York" };
  const [selectedOptions, setSelectedOptions] = useState(finalSelectedOption);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [selectedEventType, setSelectedEventType] = useState(null);
  const [selectedGeneralCategory, setSelectedGeneralCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [description, setDescription] = useState('');
  const [events, setEvents] = useState([[], null, null, null, null]);
  let eventIds = [];
  let selectedGeo;


  useEffect(() => {
    let getLocalStorageData = localStorage.getItem('eventsFilters');

    if(getLocalStorageData != null) {
      getLocalStorageData = JSON.parse(getLocalStorageData);

      if (getLocalStorageData != "" && getLocalStorageData !== null) {
        selectedGeo = getLocalStorageData.selectedGeo;
        setFilters(getLocalStorageData.filters);
        setSelectedEventType(getLocalStorageData.selectedEventType);
        setSelectedFacility(getLocalStorageData.selectedFacility);
        setSelectedGeneralCategory(getLocalStorageData.selectedGeneralCategory);
        setSelectedSubCategory(getLocalStorageData.selectedSubCategory);
        setDescription(getLocalStorageData.description);
        const selectedGeoOption = getLocalStorageData.selectedOptions;
        setSelectedOptions(selectedGeoOption);
      }
    }
  }, [localStorage]);


  useEffect(() => {
    async function fetchData() {
      await falcor.get(["geo", "36", "geoLevels"]);
      const request = [null, null, null, [null], null];
      await falcor.get(["transcom2", "generalCategories", JSON.stringify(request)]);
      await falcor.get(["transcom2", "eventType", JSON.stringify(request)]);
    }
    fetchData();
  }, [])


  const getEvents = async () => {
    const requestForGeo = selectedGeo?.geolevel + "-" + selectedGeo?.geoid;
    const request = [filters.startDate, filters.endDate, requestForGeo, ["incident"], null];

    const events = await falcor.get(["transcom2", "eventsbyGeom", JSON.stringify(request)]);
    eventIds = get(events, ["json", "transcom2", "eventsbyGeom", JSON.stringify(request)], []) || [];

    let descriptionData;
    if (description != "")
      descriptionData = await falcor.get(["transcom2", "getEventsByDescription", [description]]);
    
    const descriptionEventIds = (get(descriptionData, ["json", "transcom2", "getEventsByDescription", [description]])) || [];
    const eventsIds = (description != "" ? eventIds.filter(a => descriptionEventIds.includes(a)) : eventIds);

    const startDate = filters.startDate;
    const endDate = filters.endDate;
    setEvents([eventsIds, startDate, endDate, selectedFacility, selectedEventType, selectedGeneralCategory, selectedSubCategory]);

    const localStorageData = {
      selectedGeo: selectedGeo,
      selectedEventType: selectedEventType,
      selectedFacility: selectedFacility,
      selectedGeneralCategory: selectedGeneralCategory,
      selectedSubCategory: selectedSubCategory,
      description: description,
      filters: filters,
      selectedOptions: selectedOptions,
    };

    localStorage.setItem('eventsFilters', JSON.stringify(localStorageData));
  };


  const eventTypes = [...React.useMemo(() => {
    const request = [null, null, null, [null], null];
    return (get(falcorCache, ["transcom2", "eventType", JSON.stringify(request), "value"], null)) || [];
  }, [falcorCache])].map((eventType) => {
    return {
      "value": eventType,
      "label": eventType,
    }
  });


  const geographies = (React.useMemo(() => {
    return get(falcorCache, ["geo", "36", "geoLevels", "value"]);
  }, [falcorCache]) || []).sort((a, b) => {
    return (a?.geoname === b?.geoname ? 0 : a?.geoname > b?.geoname ? 1 : -1);
  });


  const geographySelect = geographies.map((geography, i) => {
    return {
      "value": geography.geoname,
      "label": geography.geoname,
    }
  });

  const selectedGeoIndex = geographies.findIndex(geo => geo.geoname === selectedOptions.value) || geographies.findIndex(geo => geo.geoname === selectedOptions.value);
  selectedGeo = geographies[selectedGeoIndex];

  useEffect(() => {
    async function fetchData(){
      const requestForGeo = selectedGeo?.geolevel + "-" + selectedGeo?.geoid;
      const request = [null, null, requestForGeo, ["incident"], null];

      if (requestForGeo)
        await falcor.get(["transcom2", "facilitiesbyGeom", JSON.stringify(request)]);
    }
    fetchData();
  }, [falcorCache, selectedGeo]);


  const facilities = React.useMemo(() => {
    const requestForGeo = selectedGeo?.geolevel + "-" + selectedGeo?.geoid;
    const request = [null, null, requestForGeo, ["incident"], null];
    return get(falcorCache, ["transcom2", "facilitiesbyGeom", JSON.stringify(request), 'value']) || [];
  }, [falcorCache, selectedGeo]).map((facility) => {
    return {
      "value": facility,
      "label": facility,
    }
  });


  const generalCategoriesList = React.useMemo(() => {
    const request = [null, null, null, [null], null];
    const temp = (get(falcorCache, ["transcom2", "generalCategories", JSON.stringify(request), 'value'])) || [];
    return temp;
  }, [falcorCache]);


  const generalCategories = generalCategoriesList.map((eventsGeneralCategory) => {
    return {
      "value": eventsGeneralCategory,
      "label": eventsGeneralCategory,
    }
  });


  useEffect(() => {
    async function fetchData(){
      const request = [null, null, null, [selectedGeneralCategory?.value || null], null];
      await falcor.get(["transcom2", "subCategoriesbyGenCategories", JSON.stringify(request)]);
    }
    fetchData();
  }, [selectedGeneralCategory]);


  const eventsSubCategoriesList = [...new Set(React.useMemo(() => {
    const request = [null, null, null, [selectedGeneralCategory?.value || null], null];
    let temp = null;
    if (selectedGeneralCategory)
      temp = (get(falcorCache, ["transcom2", "subCategoriesbyGenCategories", JSON.stringify(request), 'value'])) || [];
    return temp;
  }, [falcorCache, selectedGeneralCategory]) || [])];


  const eventsSubCategories = eventsSubCategoriesList.map((eventsSubCategory) => {
    return {
      "value": eventsSubCategory,
      "label": eventsSubCategory,
    }
  });

  const handleChange = (key, newValue) => {
    setFilters({ ...filters, [key]: newValue })
  }


  const [hoveredEvent, setHoveredEvent] = React.useState(null);


  return (
    <div className="container">
      <div className="flex m-0 left-0">
        <div className="bg-white w-60">
          <div className="h-full border-r" style={{ position: "relative", flex: 1, overflowY: "auto", overflowX: "hidden" }}>
            <div className="mt-5 text-xl mb-5 text-center">
              <span>Filter-Selection</span>
            </div>
            <hr className='ml-3 mr-3 mt-4 mb-4' />

            <div className="facility">
              <div className="ml-9 font-light tracking-wide text-gray-900">Geography</div>
              <div className="m-2 ml-5" style={{ maxWidth: "190px", minWidth: "190px" }}>
                <Select
                  options={geographySelect}
                  defaultValue={selectedOptions ? selectedOptions : { 'value': selectedOptions.value, 'label': selectedOptions.value }}
                  onChange={e => setSelectedOptions(e)}
                  name="geography"
                  style={{ maxWidth: "190px", minWidth: "190px" }}
                  className="p-2.5 font-light text-gray-900 border border-blue-400 bg-blue-100 rounded-lg p-2 focus:border-indigo-600"
                  classNamePrefix="select"
                />
              </div>
            </div>
            <hr className='ml-3 mr-3 mt-4 mb-4' />

            <div className="start-date">
              <div className="ml-9 font-light tracking-wide text-gray-900">Start Date</div>
              <input className="ml-11 mt-2 font-light tracking-wide text-gray-900 border border-blue-400 bg-blue-100 rounded-lg p-2"
                type="date" onChange={e => handleChange('endDate', e.target.value)} min={filters.startDate} value={filters.endDate}></input>
            </div>
            <hr className='ml-3 mr-3 mt-4 mb-4' />

            <div className="end-date">
              <div className="ml-9 font-light tracking-wide text-gray-900">End Date</div>
              <input className="ml-11 mt-2 font-light tracking-wide text-gray-900 border border-blue-400 bg-blue-100 rounded-lg p-2"
                type="date" onChange={e => handleChange('startDate', e.target.value)} max={filters.endDate} value={filters.startDate}></input>
            </div>
            <hr className='ml-3 mr-3 mt-4 mb-4' />

            <div className="facility">
              <div className="ml-9 font-light tracking-wide text-gray-900">Facility</div>
              <div className="m-2 ml-5" style={{ maxWidth: "190px", minWidth: "190px" }}>
                <Select
                  options={facilities}
                  value={selectedFacility}
                  onChange={e => setSelectedFacility(e)}
                  classNamePrefix="select"
                  isClearable
                  style={{ maxWidth: "190px", minWidth: "190px" }}
                  name="facility"
                  className="p-2.5 font-light text-gray-900 border border-blue-400 bg-blue-100 rounded-lg p-2 focus:border-indigo-600"
                />
              </div>
            </div>
            <hr className='ml-3 mr-3 mt-4 mb-4' />

            <div className="general-category">
              <div className="ml-9 font-light tracking-wide text-gray-900">General Category</div>
              <div className="m-2 ml-5" style={{ maxWidth: "190px", minWidth: "190px" }}>
                <Select
                  options={generalCategories}
                  value={selectedGeneralCategory}
                  onChange={e => setSelectedGeneralCategory(e)}
                  classNamePrefix="select"
                  isClearable
                  style={{ maxWidth: "190px", minWidth: "190px" }}
                  name="general_category"
                  className="p-2.5 font-light text-gray-900 border border-blue-400 bg-blue-100 rounded-lg p-2 focus:border-indigo-600"
                />
              </div>
            </div>
            <hr className='ml-3 mr-3 mt-4 mb-4' />

            <div className="sub-general-category">
              <div className="ml-9 font-light tracking-wide text-gray-900">Sub Detail Category</div>
              <div className="m-2 ml-5" style={{ maxWidth: "190px", minWidth: "190px" }}>
                <Select
                  options={eventsSubCategories}
                  value={selectedSubCategory}
                  onChange={e => setSelectedSubCategory(e)}
                  classNamePrefix="select"
                  isClearable
                  style={{ maxWidth: "190px", minWidth: "190px" }}
                  name="sub_category"
                  className="p-2.5 font-light text-gray-900 border border-blue-400 bg-blue-100 rounded-lg p-2 focus:border-indigo-600"
                />
              </div>
            </div>
            <hr className='ml-3 mr-3 mt-4 mb-4' />

            <div className="event-type">
              <div className="ml-9 font-light tracking-wide text-gray-900">Event Type</div>
              <div className="m-2 ml-5" style={{ maxWidth: "190px", minWidth: "190px" }}>
                <Select
                  options={eventTypes}
                  value={selectedEventType}
                  onChange={e => setSelectedEventType(e)}
                  classNamePrefix="select"
                  isClearable
                  style={{ maxWidth: "190px", minWidth: "190px" }}
                  name="event_types"
                  className="p-2.5 font-light text-gray-900 border border-blue-400 bg-blue-100 rounded-lg p-2 focus:border-indigo-600"
                />
              </div>
            </div>
            <hr className='ml-3 mr-3 mt-4 mb-4' />

            <div className="description">
              <div className="ml-9 font-light tracking-wide text-gray-900">Description </div>
              <div className="m-2 ml-5">
                <input type="text"
                  onChange={e => setDescription(e.target.value)}
                  value={description}
                  style={{ maxWidth: "190px", minWidth: "190px" }}
                  className=" p-2.5 font-light text-gray-900 overflow-hidden border border-blue-400 bg-blue-100 rounded-lg p-2 focus:border-indigo-600"></input>
              </div>
            </div>
            <hr className='ml-3 mr-3 mt-4 mb-4' />

            <div className="submit content-center text-center mx-auto">
              <button className="rounded-xl p-3 bg-blue-500 text-white m-5"
                onClick={getEvents}>Submit</button>
            </div>
          </div>

        </div>
        <div className="">
          <div className="mt-5 ml-11 text-xl mb-5">
            <span>Results</span>
          </div>
          <div className="ml-9 text-center align-middle content-center">
            <IncidentsTable
              events={events}
              setHoveredEvent={setHoveredEvent}
            />
          </div>
        </div>
      </div>
    </div>
  )
}


const config = {
  name: 'Home',
  title: 'Incident Search',
  icon: 'fa-duotone fa-search',
  path: "/incidents/search",
  exact: true,
  auth: false,
  mainNav: true,
  sideNav: {
    color: 'dark',
    size: 'micro'
  },
  component: Home
}

export default config;
