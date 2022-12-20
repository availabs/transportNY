export const hexColorToRgb =(hex, alpha = 1.0) => {
  const regex1 = /^[#](\w\w)(\w\w)(\w\w)$/,
    regex2 = /^[#](\w)(\w)(\w)$/;

  if (hex.length == 7) {
    const match = regex1.exec(hex);
    return `rgba(${ parseInt(match[1], 16) }, ${ parseInt(match[2], 16) }, ${ parseInt(match[3], 16) }, ${ alpha })`;
  } else {
    const match = regex2.exec(hex);
    return `rgba(${ parseInt(match[1] + match[1], 16) }, ${ parseInt(match[2] + match[2], 16) }, ${ parseInt(match[3] + match[3], 16) }, ${ alpha })`;
  }
};