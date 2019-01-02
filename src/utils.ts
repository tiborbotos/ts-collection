type stringOrNumber = string | number;

export interface Map<V> {
  [key: string]: V;
}

export function isArray(arr: any): boolean {
  return arr && typeof arr === 'object' && typeof arr.length === 'number';
}

export function isUndefined(value: any): boolean {
  return value === undefined;
}

export function isDefined(value: any): boolean {
  return !isUndefined(value);
}

export function isFunction(value: any): boolean {
  return typeof value === 'function';
}

export function isString(value: any): boolean {
  return typeof value === 'string';
}

/**
 * Returns the value of an object path
 * @param item {Object} Object with optional objects in it
 * @param fields {Array<String>} path of the required fields
 * @param value
 * @returns {*} Value of the field path (could be undefined)
 */
export function getNestedFieldValue(item: any,
                                    fields: Array<string>,
                                    value?: any): any {
  if (item !== undefined && item !== null) {
    if (fields.length > 1) {
      let innerObject: Array<any> | never = item[fields[0]];
      if (isArray(innerObject)) {
        let ind = 0;
        do {
          let result = getNestedFieldValue(innerObject[ind], fields.slice(1), value);
          if (result) {
            return result;
          }
          ind++;
        } while (ind < innerObject.length);
        return undefined;
      } else {
        return getNestedFieldValue(innerObject, fields.slice(1), value);
      }
    } else {
      return (item[fields[0]]) === value ? item : undefined;
    }
  } else {
    return undefined;
  }
}

export function isMapFalsyOrMapsValueFalsy<T>(model: Map<T>,
                                              field: string) {
  return !model || !model[field];
}

export function sortCompareFn(left: Map<any>,
                              right: Map<any>,
                              sortByField: string,
                              defaultField?: string): number {
  if (isMapFalsyOrMapsValueFalsy(left, sortByField) && isMapFalsyOrMapsValueFalsy(right, sortByField)) {
    return 0;
  } else if (isMapFalsyOrMapsValueFalsy(right, sortByField)) {
    return left[sortByField] ? 1 : 0;
  } else if (isMapFalsyOrMapsValueFalsy(left, sortByField)) {
    return right[sortByField] ? -1 : 0;
  } else if (left[sortByField] === right[sortByField]) {
    if (defaultField) {
      return sortCompareFn(left, right, defaultField);
    } else {
      return 0;
    }
  }
  return (left[sortByField] > right[sortByField]) ? 1 : -1;
}

//
// obj[key] has an issue?
//
// export function getFieldValueByObjectPath(obj: any,
//                                           fields: Array<string>) {
//   if (obj[fields[0]] && fields[1]) {
//     const key = fields.splice(0, 1);
//     return getFieldValueByObjectPath(obj[key], fields);
//   } else if (isUndefined(fields[1])) {
//     return obj[fields[0]];
//   } else {
//     return undefined;
//   }
// }
