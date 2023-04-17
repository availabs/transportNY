import React from "react";
import { useFalcor } from "modules/avl-components/src";
import get from "lodash.get";

// Falcor Route:
//   `pm3.measureInfo.[{keys:measureIds}]['fullname', 'definition', 'equation', 'source']`,

const MeasureInfoBox = ({ layer, excludeFullNameInInfoBox = true }) => {
  const { falcor, falcorCache } = useFalcor();

  const measure = layer.getMeasure(layer.filters);
  React.useEffect(() => {
    if (measure === null) return;
    falcor.get([
      "pm3",
      "measureInfo",
      measure,
      ["fullname", "definition", "equation", "source"],
    ]);
  }, [falcor, measure]);

  const measureInfo = React.useMemo(() => {
    return get(falcorCache, ["pm3", "measureInfo", measure], {});
  }, [measure, falcorCache]);

  const H6 = {
    color: "#efefef",
    margin: "0.5rem 0 0.1rem 0",
  };
  const DD = {
    margin: 0,
  };

  const {
    fullname = "",
    definition = "",
    equation = null,
    peaks = null,
  } = measureInfo;

  return definition ? (
    <div style={{ padding: "0 7px 7px 7px" }}>
      <dl style={{ margin: 0 }}>
        {!excludeFullNameInInfoBox && <dt>Measure</dt>}
        {!excludeFullNameInInfoBox && <dd style={DD}>{fullname}</dd>}

        {definition && (
          <dt>
            <h6 style={H6}>Definition</h6>
          </dt>
        )}
        {definition && <dd style={DD}>{definition}</dd>}

        {equation && (
          <dt>
            <h6 style={H6}>Equation</h6>
          </dt>
        )}
        {equation && <dd style={DD}>{equation}</dd>}

        {peaks && <dt>Measure Defined Peaks or time periods</dt>}
        {peaks && <dd style={DD}>{peaks}</dd>}
      </dl>
    </div>
  ) : null;
};

export default MeasureInfoBox;
