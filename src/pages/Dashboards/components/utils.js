import React from "react"
import get from "lodash.get";
import { useFalcor } from "modules/avl-components/src"

export const useGeographies = () => {
  const { falcor, falcorCache } = useFalcor();
  const geo = get(falcorCache, ["geo", 36, "geoLevels", "value"], []);
  React.useEffect(() => {
    falcor.get(["geo", 36, "geoLevels"]);
  }, [falcor]);
  return React.useMemo(() => {
    return geo.sort((a, b) => {
      return +a.geoid - +b.geoid; 
    })
    .filter(geo => geo.geolevel === "REGION")
    .map(geo => {
      if (geo.geolevel === "REGION") {
        return { ...geo, geoid: `REGION-${ geo.geoid }` };
      }
      return geo;
    });
  }, [geo]);
}

export const useComponentDidMount = () => {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
    return () => {
      setMounted(false);
    };
  }, []);
  return mounted;
};