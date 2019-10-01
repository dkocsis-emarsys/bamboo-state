const isObject = item => {
  return (item && typeof item === 'object' && !Array.isArray(item) && item !== null && !(item instanceof EventTarget));
}

const deepMerge = (target, source) => {
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!target[key] || !isObject(target[key])) {
          target[key] = source[key];
        }
        deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    });
  }

  return target;
}

export default deepMerge;