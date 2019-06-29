export default class damageUtils {
  /***
     * Returns expected damage multiplier based on whether
     * the action is guaranteed to crit or not. 
     * 
     * if sureCrit
     *   return 1 * crit multi
     * else
     *   return crit chance * crit multi + (1 - crit chance)
     */
  static getExpectedCritDamageMultiplier(doll, action) {
    const critMulti = 1 + (doll.battle.critdmg / 100);
    if ('sureCrit' in action) {
      return critMulti;
    } else {
      const critChance = (doll.battle.crit / 100);
      return critChance * critMulti + (1 - critChance);
    }
  }
}