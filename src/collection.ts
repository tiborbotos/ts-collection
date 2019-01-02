import { Option } from './option';
import { getNestedFieldValue, isArray, isDefined, Map, sortCompareFn } from './utils';

export class Collection<T> extends Array<T> {

  /**
   * Looks through each value in the list, returning the first one that passes a truth test.
   * Stops at the first match.
   * @param {Array} list
   * @param {Function} predicate predicate function
   * @param {Boolean|} [reverseArg] optional flag if you would like to find the last element of the list
   * @returns {Option} Option.None or Option.Some of the found value
   */
  static find<T>(list: Array<T>,
                 predicate: (p: T, ind: number) => boolean,
                 reverseArg?: boolean): Option<T> {
    if (!isArray(list) || (isArray(list) && list.length === 0)) {
      return Option.None;
    }
    let reverse = isDefined(reverseArg) ? reverseArg : false,
      i = reverse ? (list.length - 1) : 0,
      predicateResult;

    do {
      predicateResult = predicate(list[i], i);
      if (predicateResult === true) {
        return Option.Some(list[i]);
      } else if (predicateResult !== false && isDefined(predicateResult)) {
        return Option.Some(predicateResult);
      }
    } while ((reverse && i-- > 0) || (!reverse && i++ < list.length - 1));
    return Option.None;
  }

  /**
   * Looks through each value in the list, returning an array of all the values that pass a truth test (predicate).
   * @param {Array} list
   * @param {Function} predicate predicate function
   * @returns {Array}
   */
  static filter<T>(list: Array<T>,
                   predicate: (p: T) => boolean): Array<T> {
    if (!isArray(list) || (isArray(list) && list.length === 0)) {
      return [];
    }

    const res = [];
    let i = 0,
      predicateResult;

    do {
      predicateResult = predicate(list[i]);
      if (predicateResult === true) {
        res.push(list[i]);
      } else if (predicateResult !== false && isDefined(predicateResult)) {
        res.push(list[i]);
      }
    } while (++i < list.length);
    return res;
  }

  /**
   * Iterates trough an array and returns it without duplication;
   * @param {Array} list
   * @param {Function|string} uniqueBy factory function for returning the value of an item which is the unique by field
   * or the field name
   * @returns {Array}
   */
  static uniqueBy<T, K>(list: Array<T>,
                        uniqueBy: (inp: T) => K): Array<T> {
    const uniqueItemIds: Array<K> = [];
    const uniqueList: Array<T> = [];

    if (!isArray(list) || (isArray(list) && list.length === 0)) {
      return uniqueList;
    }

    let i = 0;
    do {
      const uniqueItem = uniqueBy(list[i]);

      if (uniqueItemIds.indexOf(uniqueItem) === -1) {
        uniqueItemIds.push(uniqueItem);
        uniqueList.push(list[i]);
      }
    } while (++i < list.length);

    return uniqueList;
  }

  static uniqueByField<T extends Map<T>>(list: Array<T>,
                                         uniqueByField: string): Array<T> {
    return Collection.uniqueBy(list, (item: T) => item[uniqueByField]);
  }

  /**
   * Looks through each value in the list, returning an array of all the items where the item's field is equal to value
   * @param list {Array} list
   * @param {String} field checked field in list item. It can be a fully specifed path in objects, like 'gene.mutant.id'
   * @param {String|Number|Boolean} value target value we are looking for
   * @returns {Array}
   */
  static filterByField<T>(list: Array<T>,
                          field: string,
                          value: any) {
    let fields = field.split('.');

    if (fields.length === 1) {
      return Collection.filter(list, (item: T) => (item as Map<any>)[field] === value);
    } else {
      return Collection.filter(list, (item) => getNestedFieldValue(item, fields, value));
    }
  }

  /**
   * Looks through each value in the list, and checking for every item's field checking if it's equal to
   * value
   * @param {Array} list
   * @param {String} field checked field in list item. It can be a fully specifed path in objects, like 'gene.mutant.id',
   * where fields could be additional arrays as well
   * @param {String|Number|Boolean} value target value we are looking for
   * @param {Boolean} [reverse] find the last element which matches the criteria
   * @returns {Option}
   */
  static findByField<T>(list: Array<T>,
                        field: string,
                        value: any,
                        reverse?: boolean) {
    let fields = field.split('.');

    if (fields.length === 1) {
      return Collection.find(list, (item) => {
        return item && item.hasOwnProperty(field) && (item as Map<any>)[field] === value;
      }, reverse);
    } else {
      return Collection.find(list, (item) => {
        return getNestedFieldValue(item, fields, value);
      }, reverse);
    }
  }

  /**
   * Returns the index of an object from a list by the field name and value
   * @param {Array} list
   * @param {String} key field name
   * @param {*} value field value
   * @param {Boolean} [reverse]
   * @returns {Option} the index of the item in the list
   */
  findIndexByFieldAndValue(list: Array<T>,
                           key: string,
                           value: any,
                           reverse?: boolean) {
    return Collection.findByField(list, key, value, reverse).match(
      (item: T) => Option.Some(list.indexOf(item)),
      () => Option.None
    );
  }

  /**
   * Returns the first element of a list wrapped in an option
   * @param {Array} list
   * @returns {Option}
   */
  static first<T>(list: Array<T> | null | undefined): Option<T> {
    if (isDefined(list) && (list as Array<T>).length > 0) {
      return Option.Some((list as Array<T>)[0]);
    }
    return Option.None;
  }

  /**
   * Returns the last element of a list wrapped in an option
   * @param {Array} list
   * @returns {Option}
   */
  last(list: Array<T> | null | undefined): Option<T> {
    if (isDefined(list) && (list as Array<T>).length > 0) {
      const listArr = list as Array<T>;
      return Option.Some(listArr[listArr.length - 1]);
    }
    return Option.None;
  }

  /**
   * Sorts an object list by a field
   * @param list {Array<Object>} the input list, which will be transformed, it should be a mutable list
   * @param sortByField {string} the name of the field
   * @param [ascendingDirection] {boolean} is the sort direction ascending (default is true)
   * @param [defaultField] {string} if the sortByField values are matching, that will be a fallback field, like an id
   */
  static sortByField<T>(list: Array<T>,
              sortByField: string,
              ascendingDirection: boolean,
              defaultField?: string) {
    let ord = (ascendingDirection === undefined || ascendingDirection === true) ? 1 : -1;
    list.sort((left, right) => {
      return sortCompareFn(left, right, sortByField, defaultField) * ord;
    });
    return list;
  }
}
