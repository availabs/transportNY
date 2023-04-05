import React from "react";

const getRect = (ref) => {
  const node = ref ? ref.current : ref;
  if (!node) return { width: 0, height: 0 };
  return node.getBoundingClientRect();
};

export const useSetSize = (ref, callback) => {
  const [size, setSize] = React.useState({ width: 0, height: 0, x: 0, y: 0 });

  const doSetSize = React.useCallback(() => {
    const rect = getRect(ref),
      { width, height, x, y } = rect;
    if (width !== size.width || height !== size.height) {
      if (typeof callback === "function") {
        callback({ width, height, x, y });
      }
      setSize({ width, height, x, y });
    }
  }, [ref, size, callback]);

  React.useEffect(() => {
    window.addEventListener("resize", doSetSize);
    return () => {
      window.removeEventListener("resize", doSetSize);
    };
  }, [doSetSize]);

  React.useEffect(() => {
    doSetSize();
  });

  return size;
};

export const useAsyncSafe = (func) => {
  const mounted = React.useRef(false);
  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  return React.useCallback(
    (...args) => {
      mounted.current && func(...args);
    },
    [func]
  );
};

export const rgb2rgba = (color, opacity) => {
  return "rgba(" + color.split("(")[1].split(")")[0] + "," + opacity + ")";
};
